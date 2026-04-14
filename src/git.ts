import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpathSync } from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface LineDiff {
  added: number;
  deleted: number;
}

export interface TrackedFile {
  basename: string;
  fullPath: string;
  type: 'modified' | 'added' | 'deleted';
  lineDiff?: LineDiff;
}

export interface FileStats {
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
  trackedFiles: TrackedFile[];
}

export interface WorktreeInfo {
  repoName: string;
  worktreeName: string;
}

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  fileStats?: FileStats;
  lineDiff?: LineDiff;
  branchUrl?: string;
}

export async function getGitBranch(cwd?: string): Promise<string | null> {
  if (!cwd) return null;

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd, timeout: 1000, encoding: 'utf8' }
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getGitStatus(cwd?: string): Promise<GitStatus | null> {
  if (!cwd) return null;

  try {
    // Get branch name
    const { stdout: branchOut } = await execFileAsync(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd, timeout: 1000, encoding: 'utf8' }
    );
    const branch = branchOut.trim();
    if (!branch) return null;

    // Check for dirty state and parse file stats
    let isDirty = false;
    let fileStats: FileStats | undefined;
    let lineDiff: LineDiff | undefined;
    try {
      const { stdout: statusOut } = await execFileAsync(
        'git',
        ['--no-optional-locks', 'status', '--porcelain'],
        { cwd, timeout: 1000, encoding: 'utf8' }
      );
      const trimmed = statusOut.trim();
      isDirty = trimmed.length > 0;
      if (isDirty) {
        fileStats = parseFileStats(trimmed);
      }
    } catch {
      // Ignore errors, assume clean
    }

    // Get per-file and total line diffs
    if (isDirty) {
      try {
        const { stdout: numstatOut } = await execFileAsync(
          'git',
          ['diff', '--numstat', 'HEAD'],
          { cwd, timeout: 2000, encoding: 'utf8' }
        );
        const { totalDiff, perFileDiff } = parseNumstat(numstatOut);
        lineDiff = totalDiff;
        if (fileStats) {
          applyLineDiffsToFiles(fileStats.trackedFiles, perFileDiff);
        }
      } catch {
        // Ignore errors
      }
    }

    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    try {
      const { stdout: revOut } = await execFileAsync(
        'git',
        ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
        { cwd, timeout: 1000, encoding: 'utf8' }
      );
      const parts = revOut.trim().split(/\s+/);
      if (parts.length === 2) {
        behind = parseInt(parts[0], 10) || 0;
        ahead = parseInt(parts[1], 10) || 0;
      }
    } catch {
      // No upstream or error, keep 0/0
    }

    // Build GitHub branch URL from remote
    let branchUrl: string | undefined;
    try {
      const { stdout: remoteOut } = await execFileAsync(
        'git',
        ['remote', 'get-url', 'origin'],
        { cwd, timeout: 1000, encoding: 'utf8' }
      );
      const remote = remoteOut.trim();
      const httpsBase = remote
        .replace(/^git@([^:]+):/, 'https://$1/')
        .replace(/\.git$/, '');
      if (httpsBase.startsWith('https://')) {
        branchUrl = `${httpsBase}/tree/${branch}`;
      }
    } catch {
      // No remote or not GitHub
    }

    return { branch, isDirty, ahead, behind, fileStats, lineDiff, branchUrl };
  } catch {
    return null;
  }
}

/**
 * Parse git status --porcelain output and count file stats (Starship-compatible format)
 * Status codes: M=modified, A=added, D=deleted, ??=untracked
 */
function parseFileStats(porcelainOutput: string): FileStats {
  const stats: FileStats = { modified: 0, added: 0, deleted: 0, untracked: 0, trackedFiles: [] };
  const lines = porcelainOutput.split('\n').filter(Boolean);

  for (const line of lines) {
    if (line.length < 2) continue;

    const index = line[0];    // staged status
    const worktree = line[1]; // unstaged status

    if (line.startsWith('??')) {
      stats.untracked++;
    } else if (index === 'A') {
      stats.added++;
      const fullPath = line.slice(2).trimStart();
      stats.trackedFiles.push({ basename: fullPath.split('/').pop() ?? fullPath, fullPath, type: 'added' });
    } else if (index === 'D' || worktree === 'D') {
      stats.deleted++;
      const fullPath = line.slice(2).trimStart();
      stats.trackedFiles.push({ basename: fullPath.split('/').pop() ?? fullPath, fullPath, type: 'deleted' });
    } else if (index === 'M' || worktree === 'M' || index === 'R' || index === 'C') {
      // M=modified, R=renamed (counts as modified), C=copied (counts as modified)
      stats.modified++;
      // For renames, git porcelain shows "old -> new"; take the destination path
      const fullPath = line.slice(2).trimStart().split(' -> ').pop() ?? line.slice(2).trimStart();
      stats.trackedFiles.push({ basename: fullPath.split('/').pop() ?? fullPath, fullPath, type: 'modified' });
    }
  }

  return stats;
}

/**
 * Parse `git diff --numstat HEAD` output.
 * Returns total line diff and a map of fullPath -> LineDiff.
 */
function parseNumstat(numstatOutput: string): { totalDiff: LineDiff; perFileDiff: Map<string, LineDiff> } {
  const totalDiff: LineDiff = { added: 0, deleted: 0 };
  const perFileDiff = new Map<string, LineDiff>();

  for (const line of numstatOutput.trim().split('\n').filter(Boolean)) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const added = parseInt(parts[0], 10);
    const deleted = parseInt(parts[1], 10);
    const filePath = parts[2];
    if (Number.isNaN(added) || Number.isNaN(deleted)) continue; // binary file
    totalDiff.added += added;
    totalDiff.deleted += deleted;
    perFileDiff.set(filePath, { added, deleted });
  }

  return { totalDiff, perFileDiff };
}

function applyLineDiffsToFiles(files: TrackedFile[], perFileDiff: Map<string, LineDiff>): void {
  for (const file of files) {
    const diff = perFileDiff.get(file.fullPath);
    if (diff) {
      file.lineDiff = diff;
    }
  }
}

export async function getWorktreeInfo(cwd?: string): Promise<WorktreeInfo | null> {
  if (!cwd) return null;

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['worktree', 'list', '--porcelain'],
      { cwd, timeout: 2000, encoding: 'utf8' }
    );

    const entries = parseWorktreeList(stdout);
    if (entries.length === 0) return null;

    const mainEntry = entries[0];
    const repoName = path.basename(mainEntry.path);

    let resolvedCwd: string;
    try {
      resolvedCwd = realpathSync(cwd);
    } catch {
      resolvedCwd = cwd;
    }

    const currentEntry = entries.find(e => {
      try {
        return realpathSync(e.path) === resolvedCwd;
      } catch {
        return e.path === resolvedCwd;
      }
    });

    if (!currentEntry) return null;

    if (currentEntry === mainEntry) return null;

    const worktreeName = path.basename(currentEntry.path);
    return { repoName, worktreeName };
  } catch {
    return null;
  }
}

interface WorktreeEntry {
  path: string;
}

function parseWorktreeList(output: string): WorktreeEntry[] {
  const entries: WorktreeEntry[] = [];
  let currentPath: string | null = null;

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (currentPath !== null) {
        entries.push({ path: currentPath });
      }
      currentPath = line.slice('worktree '.length).trim();
    }
  }

  if (currentPath !== null) {
    entries.push({ path: currentPath });
  }

  return entries;
}
