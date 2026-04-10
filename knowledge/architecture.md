# Architecture

## Data Flow

```
Claude Code → stdin JSON → parse → render → stdout → Claude Code displays
           ↘ transcript_path → parse JSONL → tools/agents/todos
```

The statusline is invoked every ~300ms by Claude Code. Each invocation:
1. Receives JSON via stdin (model, context, tokens)
2. Parses the transcript JSONL file for tools, agents, and todos
3. Renders multi-line output to stdout

## Data Sources

**From stdin JSON** (native, accurate):
- `model.display_name` — current model
- `context_window.current_usage` — token counts
- `context_window.context_window_size` — max context
- `transcript_path` — path to session transcript
- `rate_limits.*` — subscriber usage (5h / 7d)
- `cost.total_cost_usd` — session cost (when available)

**From transcript JSONL** (`transcript.ts`):
- `tool_use` blocks → tool name, input, start time
- `tool_result` blocks → completion, duration
- Running tools = `tool_use` without matching `tool_result`
- `TodoWrite` calls → todo list
- `Task` calls → agent info

**From config files** (`config-reader.ts`):
- MCP count from `~/.claude/settings.json`
- Hooks count from `~/.claude/settings.json`
- CLAUDE.md / rules count

## Render Pipeline

```
Layout (RowId[])
  └─ Row (id + CellId[])
       └─ Cell (render fn → string | null)
```

`render/index.ts` iterates the layout, resolves each row's cell list (from config `rows` or `DEFAULT_ROWS`), calls each cell's render function, joins non-null results with ` │ `, then wraps to terminal width.

## File Structure

```
src/
├── index.ts              # Entry point
├── stdin.ts              # Parse Claude's JSON input
├── transcript.ts         # Parse transcript JSONL
├── config-reader.ts      # Read MCP/rules/hooks counts
├── config.ts             # Load and validate user config
├── git.ts                # Git status + worktree detection
├── types.ts              # Shared TypeScript interfaces
├── cost.ts               # Session cost resolution
├── memory.ts             # System RAM usage
├── speed-tracker.ts      # Output token speed
├── i18n/                 # Label translations (en, zh)
└── render/
    ├── index.ts          # Main render coordinator
    ├── layout.ts         # DEFAULT_LAYOUT (RowId[])
    ├── row.ts            # DEFAULT_ROWS, renderRow()
    ├── cell.ts           # renderCell(), side-effect imports
    ├── cell-registry.ts  # CellId type, CELL_REGISTRY, VALID_CELL_IDS
    ├── colors.ts         # ANSI color helpers
    └── cells/            # 16 individual cell implementations
        ├── model.ts
        ├── duration.ts
        ├── cost.ts
        ├── context.ts
        ├── directory.ts
        ├── git.ts
        ├── worktree.ts   # git worktree display (fork addition)
        ├── memory.ts
        ├── environment.ts
        ├── tools.ts
        ├── agents.ts
        ├── todos.ts
        ├── session-tokens.ts
        ├── custom.ts
        └── usage.ts
```
