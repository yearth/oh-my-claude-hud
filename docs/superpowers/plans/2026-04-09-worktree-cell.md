# Worktree Cell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a worktree cell to the git status line in claude-hud, showing `󰙅 repo-name:(worktree-name)` after the branch name.

**Architecture:** Add `getWorktreeInfo()` to `src/git.ts`, thread `worktreeInfo` through `RenderContext`, add `showWorktree` config flag, render the cell in `project.ts` after the branch segment.

**Tech Stack:** TypeScript, Node.js built-in `child_process`, Node.js built-in `test` runner

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/git.ts` | Modify | Add `WorktreeInfo` interface + `getWorktreeInfo()` |
| `src/types.ts` | Modify | Add `worktreeInfo: WorktreeInfo \| null` to `RenderContext` |
| `src/config.ts` | Modify | Add `showWorktree: boolean` to `gitStatus` config + default `true` |
| `src/config-reader.ts` | Modify | Read and validate `showWorktree` |
| `src/index.ts` | Modify | Call `getWorktreeInfo()`, pass into `RenderContext` |
| `src/render/lines/project.ts` | Modify | Render worktree cell in git segment |
| `tests/git.test.js` | Modify | Tests for `getWorktreeInfo()` |
| `tests/render.test.js` | Modify | Tests for worktree cell rendering |

---

## Task 1: Add `WorktreeInfo` type and `getWorktreeInfo()` to `src/git.ts`

**Files:**
- Modify: `src/git.ts`

- [ ] **Step 1: Write the failing test in `tests/git.test.js`**

Add these tests at the end of `tests/git.test.js` (after the existing `getGitStatus` tests):

```js
import { getWorktreeInfo } from '../dist/git.js';

// getWorktreeInfo tests
test('getWorktreeInfo returns null when cwd is undefined', async () => {
  const result = await getWorktreeInfo(undefined);
  assert.equal(result, null);
});

test('getWorktreeInfo returns null for non-git directory', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'claude-hud-nogit-'));
  try {
    const result = await getWorktreeInfo(dir);
    assert.equal(result, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('getWorktreeInfo returns base for main worktree', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'claude-hud-wt-'));
  try {
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir, stdio: 'ignore' });

    const result = await getWorktreeInfo(dir);
    assert.ok(result !== null);
    assert.equal(result.repoName, path.basename(dir));
    assert.equal(result.worktreeName, 'base');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('getWorktreeInfo returns directory name for sub-worktree', async () => {
  const mainDir = await mkdtemp(path.join(tmpdir(), 'claude-hud-main-'));
  const wtDir = path.join(tmpdir(), 'claude-hud-wt-feature');
  try {
    execFileSync('git', ['init'], { cwd: mainDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: mainDir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainDir, stdio: 'ignore' });
    execFileSync('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: mainDir, stdio: 'ignore' });
    execFileSync('git', ['worktree', 'add', wtDir, '-b', 'feature-x'], { cwd: mainDir, stdio: 'ignore' });

    const result = await getWorktreeInfo(wtDir);
    assert.ok(result !== null);
    assert.equal(result.repoName, path.basename(mainDir));
    assert.equal(result.worktreeName, path.basename(wtDir));
  } finally {
    await rm(mainDir, { recursive: true, force: true });
    await rm(wtDir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Build and run tests to confirm they fail**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/git.test.js 2>&1 | tail -10
```

Expected: build succeeds (no `getWorktreeInfo` yet so import fails), tests fail with `SyntaxError` or `not a function`.

- [ ] **Step 3: Add `WorktreeInfo` interface and `getWorktreeInfo()` to `src/git.ts`**

Add after the `GitStatus` interface (around line 31):

```typescript
export interface WorktreeInfo {
  repoName: string;
  worktreeName: string;
}
```

Add as a new export function at the end of `src/git.ts`:

```typescript
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

    // Resolve cwd to real path for comparison
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

    const isMain = currentEntry.path === mainEntry.path;
    const worktreeName = isMain ? 'base' : path.basename(currentEntry.path);

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
```

Also add `realpathSync` to the existing Node.js import at the top of `src/git.ts`. The current import is:

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
```

Change to:

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpathSync } from 'node:fs';
import path from 'node:path';
```

- [ ] **Step 4: Build and run tests to confirm they pass**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/git.test.js 2>&1 | tail -15
```

Expected: all git tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git checkout -b feat/worktree-cell
git add src/git.ts tests/git.test.js
git commit -m "feat: add WorktreeInfo type and getWorktreeInfo() to git.ts"
```

---

## Task 2: Thread `worktreeInfo` through types, config, and index

**Files:**
- Modify: `src/types.ts`
- Modify: `src/config.ts`
- Modify: `src/config-reader.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Add `worktreeInfo` to `RenderContext` in `src/types.ts`**

Add the import at the top of `src/types.ts`:

```typescript
import type { GitStatus, WorktreeInfo } from './git.js';
```

(Replace the existing `import type { GitStatus } from './git.js';` line.)

Add `worktreeInfo` field to the `RenderContext` interface, after `gitStatus`:

```typescript
  gitStatus: GitStatus | null;
  worktreeInfo: WorktreeInfo | null;
```

- [ ] **Step 2: Add `showWorktree` to config in `src/config.ts`**

In the `HudConfig` interface, add `showWorktree` to the `gitStatus` block:

```typescript
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
    showWorktree: boolean;
    pushWarningThreshold: number;
    pushCriticalThreshold: number;
  };
```

In `DEFAULT_CONFIG`, add `showWorktree: true` to the `gitStatus` block:

```typescript
  gitStatus: {
    enabled: true,
    showDirty: true,
    showAheadBehind: false,
    showFileStats: false,
    showWorktree: true,
    pushWarningThreshold: 0,
    pushCriticalThreshold: 0,
  },
```

- [ ] **Step 3: Read `showWorktree` in `src/config-reader.ts`**

Find the `gitStatus` block in the `mergeConfig` function. It currently ends with `pushCriticalThreshold`. Add `showWorktree` after `pushCriticalThreshold`:

```typescript
    showWorktree: typeof migrated.gitStatus?.showWorktree === 'boolean'
      ? migrated.gitStatus.showWorktree
      : DEFAULT_CONFIG.gitStatus.showWorktree,
```

- [ ] **Step 4: Call `getWorktreeInfo()` in `src/index.ts`**

Add the import at the top of `src/index.ts`:

```typescript
import { getWorktreeInfo } from "./git.js";
```

Update `MainDeps` type to include `getWorktreeInfo`:

```typescript
export type MainDeps = {
  // ... existing fields ...
  getWorktreeInfo: typeof getWorktreeInfo;
};
```

Update the `deps` object in `main()` to include `getWorktreeInfo`:

```typescript
  const deps: MainDeps = {
    // ... existing fields ...
    getWorktreeInfo,
    ...overrides,
  };
```

After the `gitStatus` assignment in `main()`, add:

```typescript
    const worktreeInfo = config.gitStatus.enabled && config.gitStatus.showWorktree
      ? await deps.getWorktreeInfo(stdin.cwd)
      : null;
```

Add `worktreeInfo` to the `ctx` object:

```typescript
    const ctx: RenderContext = {
      // ... existing fields ...
      gitStatus,
      worktreeInfo,
      // ... rest of fields ...
    };
```

- [ ] **Step 5: Build to verify no type errors**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/types.ts src/config.ts src/config-reader.ts src/index.ts
git commit -m "feat: thread worktreeInfo through RenderContext and config"
```

---

## Task 3: Render the worktree cell in `project.ts`

**Files:**
- Modify: `src/render/lines/project.ts`
- Modify: `tests/render.test.js`

- [ ] **Step 1: Write failing render tests in `tests/render.test.js`**

Find an existing worktree-adjacent test (around line 509 where `ctx.gitStatus` is set). Add new tests after the existing git branch tests:

```js
test('renders worktree cell when worktreeInfo is set', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.worktreeInfo = { repoName: 'my-project', worktreeName: 'base' };
  ctx.config.gitStatus.showWorktree = true;
  const output = stripAnsi(renderProjectLine(ctx));
  assert.ok(output.includes('my-project:(base)'), `Expected 'my-project:(base)' in: ${output}`);
});

test('renders sub-worktree name', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'feature-auth', isDirty: false, ahead: 0, behind: 0 };
  ctx.worktreeInfo = { repoName: 'my-project', worktreeName: 'feature-auth' };
  ctx.config.gitStatus.showWorktree = true;
  const output = stripAnsi(renderProjectLine(ctx));
  assert.ok(output.includes('my-project:(feature-auth)'), `Expected 'my-project:(feature-auth)' in: ${output}`);
});

test('does not render worktree cell when showWorktree is false', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.worktreeInfo = { repoName: 'my-project', worktreeName: 'base' };
  ctx.config.gitStatus.showWorktree = false;
  const output = stripAnsi(renderProjectLine(ctx));
  assert.ok(!output.includes('my-project:(base)'), `Expected no worktree cell in: ${output}`);
});

test('does not render worktree cell when worktreeInfo is null', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.worktreeInfo = null;
  ctx.config.gitStatus.showWorktree = true;
  const output = stripAnsi(renderProjectLine(ctx));
  assert.ok(!output.includes(':('), `Expected no worktree cell in: ${output}`);
});
```

Note: check how `makeCtx` is defined at the top of `render.test.js` and add `worktreeInfo: null` to its default ctx object. Also add `showWorktree: false` to the default `config.gitStatus` in `makeCtx` so existing tests are unaffected.

- [ ] **Step 2: Build and run render tests to confirm they fail**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/render.test.js 2>&1 | grep -E "fail|pass|Error" | tail -15
```

Expected: new tests fail, existing tests still pass.

- [ ] **Step 3: Update `makeCtx` default in `tests/render.test.js`**

Find the `makeCtx` function (or the base `ctx` object, around line 40). Add:
- `worktreeInfo: null` to the ctx object
- `showWorktree: false` to `config.gitStatus`

This ensures all existing tests are unaffected by the new field.

- [ ] **Step 4: Implement worktree cell rendering in `src/render/lines/project.ts`**

In `renderProjectLine`, find the git segment block. After `const gitInner: string[] = [linkedBranch];`, add the worktree cell:

```typescript
    const showWorktree = gitConfig?.showWorktree ?? true;
    if (showWorktree && ctx.worktreeInfo) {
      const { repoName, worktreeName } = ctx.worktreeInfo;
      const worktreeCell = gitColor(`\uF0425 ${repoName}:(${worktreeName})`, colors);
      gitInner.push(worktreeCell);
    }
```

The icon `\uF0425` is the Nerd Font "source branch" icon (󰙅).

- [ ] **Step 5: Build and run all tests**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/render/lines/project.ts tests/render.test.js
git commit -m "feat: render worktree cell in git status line"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Run the full test suite**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm test 2>&1 | tail -20
```

Expected: all tests pass, no failures.

- [ ] **Step 2: Smoke test with stdin**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
echo '{"model":{"display_name":"Opus"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000},"transcript_path":"/tmp/test.jsonl","cwd":"'$(pwd)'"}' | node dist/index.js
```

Expected: output includes `󰙅 claude-hud:(base)` in the git line (since this repo has no worktrees, it should show `base`).

- [ ] **Step 3: Push branch to fork**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git push -u origin feat/worktree-cell
```
