# Claude HUD Enhanced

A fork of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) with a restructured render engine and git worktree support.

## Knowledge Base

- [Architecture](knowledge/architecture.md) — data flow, render pipeline, file structure
- [Configuration](knowledge/configuration.md) — all config options with examples
- [Development](knowledge/development.md) — build commands, testing, adding cells

## Quick Reference

**Build:** `npm run build`  
**Test:** `npm test`  
**Config file:** `~/.claude/plugins/claude-hud/config.json`

## Key Differences from Upstream

1. **Layout → Row → Cell pipeline** — render engine rewritten as a composable three-layer system; `elementOrder`/`lineLayout` replaced by `layout: RowId[]` and `rows: Record<RowId, CellId[]>`
2. **Git worktree display** — `worktree` cell shows `repoName:(worktreeName)` when inside a git worktree; controlled by `gitStatus.showWorktree`
