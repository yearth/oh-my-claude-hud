# Worktree Cell — Design Spec

**Date:** 2026-04-09  
**Status:** Draft

## Goal

Add a worktree cell to the existing git status line in claude-hud, so users can see at a glance which worktree they are currently in without querying Claude or running `git worktree list` manually.

## Display Format

The cell is appended to the existing git segment on the project line:

```
git:(main*) 󰙅 cc-playground:(base)          ← main worktree
git:(feature-auth*) 󰙅 cc-playground:(feature-auth)  ← sub-worktree
```

- `󰙅` — Nerd Font icon (U+F0425, "source branch") to visually separate from git branch
- `cc-playground` — the repository root directory name (last segment of the bare repo or main worktree path)
- `base` — literal string shown when `cwd` is the main worktree
- `feature-auth` — the directory name of the current worktree when it is a sub-worktree

The cell only renders when `gitStatus.enabled` is true (reuses existing gate).

## How to Detect the Current Worktree

Run `git worktree list --porcelain` from `cwd`. Parse the output to:

1. Find the **main worktree** — the first entry, or the one with no `worktree` attribute (bare repos use `bare`).
2. Find the **current worktree** — the entry whose path matches `cwd` (resolved to real path).
3. Derive the **repo name** from the main worktree path's last segment.
4. Derive the **worktree name**:
   - If current == main → `"base"`
   - Otherwise → last path segment of the current worktree path

Example `git worktree list --porcelain` output:
```
worktree /Users/yearthmain/myproject
HEAD abc123
branch refs/heads/main

worktree /Users/yearthmain/myproject-feature-auth
HEAD def456
branch refs/heads/feature-auth
```

## Data Model

Add a new interface to `src/git.ts`:

```typescript
export interface WorktreeInfo {
  repoName: string;      // e.g. "cc-playground"
  worktreeName: string;  // e.g. "base" | "feature-auth"
}
```

Add a new export function:

```typescript
export async function getWorktreeInfo(cwd?: string): Promise<WorktreeInfo | null>
```

Add `worktreeInfo: WorktreeInfo | null` to `RenderContext` in `src/types.ts`.

## Config

Add `showWorktree: boolean` (default `true`) to the `gitStatus` block in `src/config.ts`:

```json
{
  "gitStatus": {
    "showWorktree": true
  }
}
```

Only renders when both `gitStatus.enabled` and `gitStatus.showWorktree` are true.

## Rendering

In `src/render/lines/project.ts`, after building `linkedBranch`, append the worktree cell to `gitInner`:

```
[linkedBranch, worktreeCell, ...aheadBehind]
```

Format: `{icon} {repoName}:({worktreeName})`  
Color: same `gitColor` as the surrounding `git:(` `)` brackets.

## Files Changed

| File | Change |
|------|--------|
| `src/git.ts` | Add `WorktreeInfo` interface + `getWorktreeInfo()` function |
| `src/types.ts` | Add `worktreeInfo: WorktreeInfo \| null` to `RenderContext` |
| `src/config.ts` | Add `showWorktree: boolean` to `gitStatus` config + default |
| `src/config-reader.ts` | Read and validate `showWorktree` |
| `src/index.ts` | Call `getWorktreeInfo()` and pass result into `RenderContext` |
| `src/render/lines/project.ts` | Render worktree cell in git segment |

## Out of Scope

- Listing all worktrees (full list view)
- Toggle/expand interaction
- Worktree path display
- ahead/behind per worktree
