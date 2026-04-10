# Structured Layout — Design Spec

**Date:** 2026-04-09
**Status:** Draft

## Goal

Refactor claude-hud's render pipeline from "functions that return strings" to a two-layer structured model: **cells** (atomic display units) and **rows** (ordered groups of cells). A layout layer assembles rows from cells, replacing the current ad-hoc `elementOrder` + `renderProjectLine` approach.

This enables layout changes without touching render logic, and makes the codebase easier to maintain as a fork.

## Motivation

Currently `renderProjectLine` mixes model, directory, git branch, worktree, duration, and cost into a single function returning one long string. When the string exceeds terminal width, `wrapLineToWidth` splits it arbitrarily. The desired layout (model + duration + cost + context on one line; directory + git + worktree on another) cannot be expressed through config — it requires source changes.

## Target Layout (Method C)

```
[claude-opus-4-6] │ ⏱ 3h 4m │ Cost $27.74 │ Context ▓░░ 14%
Approx RAM ▓░ 10 GB / 24 GB (42%)
pc-apply │ git:(feature/css/wjl*) │ 󰙅 pc-apply:(base)
2 CLAUDE.md | 14 rules | 4 MCPs | 7 hooks
✓ Bash ×9 | ✓ Edit ×8 | ✓ Read ×2
✓ All todos complete (1/1)
```

## Architecture

### Layer 1 — Cells

A **cell** is the smallest display unit. Each cell knows how to render itself to a colored ANSI string.

```typescript
// src/render/cell.ts
export interface Cell {
  id: CellId;
  render(ctx: RenderContext): string | null;
}
```

Cell IDs (exhaustive):
```typescript
export type CellId =
  | 'model'       // [claude-opus-4-6]
  | 'duration'    // ⏱ 3h 4m
  | 'cost'        // Cost $27.74
  | 'context'     // Context ▓░░ 14%  (was renderIdentityLine)
  | 'directory'   // pc-apply  (project path)
  | 'git'         // git:(main*)
  | 'worktree'    // 󰙅 repo:(base)
  | 'memory'      // Approx RAM ...
  | 'environment' // 2 CLAUDE.md | 14 rules ...
  | 'tools'       // ✓ Bash ×9 ...
  | 'agents'      // agent lines
  | 'todos'       // ✓ All todos complete
  | 'session-tokens' // Tokens 22.3M ...
  | 'custom'      // customLine
```

Each cell is implemented in its own file under `src/render/cells/`. The cell's `render()` method returns `null` when the cell has nothing to show (e.g. cost is disabled, no git repo).

### Layer 2 — Rows

A **row** is an ordered list of cell IDs. The layout engine renders each cell, filters nulls, and joins non-null results with ` │ `.

```typescript
// src/render/row.ts
export interface Row {
  id: RowId;
  cells: CellId[];
}

export type RowId =
  | 'session'    // model, duration, cost, context
  | 'location'   // directory, git, worktree
  | 'memory'     // memory
  | 'environment'// environment
  | 'activity'   // tools, agents, todos
  | 'tokens'     // session-tokens
```

### Layer 3 — Layout

The layout is an ordered list of row IDs. It replaces `elementOrder`.

```typescript
// src/render/layout.ts
export type Layout = RowId[];

export const DEFAULT_LAYOUT: Layout = [
  'session',
  'memory',
  'location',
  'environment',
  'activity',
  'tokens',
];
```

The layout engine in `src/render/index.ts` iterates rows, renders each, filters empty rows, and prints them. Terminal-width truncation applies per row (same as current `truncateToWidth` logic).

## File Structure

```
src/render/
  cell.ts           — Cell interface + CellId type + cell registry
  row.ts            — Row interface + RowId type + DEFAULT_ROWS map
  layout.ts         — Layout type + DEFAULT_LAYOUT
  cells/
    model.ts        — model cell
    duration.ts     — duration cell
    cost.ts         — cost cell (extracted from project.ts)
    context.ts      — context cell (was identity.ts)
    directory.ts    — directory cell (extracted from project.ts)
    git.ts          — git branch + dirty + ahead/behind cell
    worktree.ts     — worktree cell (extracted from project.ts)
    memory.ts       — memory cell (was memory.ts line)
    environment.ts  — environment cell (was environment.ts line)
    tools.ts        — tools cell (was tools-line.ts)
    agents.ts       — agents cell (was agents-line.ts)
    todos.ts        — todos cell (was todos-line.ts)
    session-tokens.ts — session tokens cell
    custom.ts       — custom line cell
  index.ts          — layout engine (replaces current render logic)
  colors.ts         — unchanged
  lines/            — DELETED after migration (existing line renderers)
```

## Config Changes

Replace `elementOrder: HudElement[]` with `layout: RowId[]` in `HudConfig`.

Each row's cell composition is fixed in `DEFAULT_ROWS` (not user-configurable in this iteration — YAGNI). Users can reorder rows via `layout` config.

```json
{
  "layout": ["session", "memory", "location", "environment", "activity"]
}
```

## Migration Strategy

1. Implement cell layer (`src/render/cells/`) — each cell extracted from existing line renderers
2. Implement row layer (`src/render/row.ts`) + layout layer (`src/render/layout.ts`)
3. Rewrite `src/render/index.ts` to use the new pipeline
4. Delete `src/render/lines/` (old line renderers)
5. Update config (`src/config.ts`, `src/config-reader.ts`) to replace `elementOrder` with `layout`
6. Update tests

## Backward Compatibility

- `elementOrder` config key is **removed** (breaking change — this is a fork)
- `lineLayout: 'compact' | 'expanded'` is **removed** — the new layout system replaces it
- All existing display flags (`showModel`, `showDuration`, etc.) are **preserved**

## Out of Scope

- User-configurable cell composition per row (which cells go in which row)
- Dynamic row creation
- Progress bar style configuration
- Any changes to git/worktree data fetching logic
