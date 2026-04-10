# Configuration

Config file: `~/.claude/plugins/claude-hud/config.json`

All fields are optional. Unspecified fields fall back to defaults.

## Layout

### `layout` — which rows to show and in what order

```json
{ "layout": ["session", "location", "memory", "environment", "activity", "tokens"] }
```

Available row IDs: `session`, `location`, `memory`, `environment`, `activity`, `tokens`

### `rows` — cell order within each row

```json
{
  "rows": {
    "session": ["cost", "model", "context"],
    "location": ["git", "directory"]
  }
}
```

Omit a row to keep its default cells. Remove a cell ID to hide it. Empty array hides all cells in that row.

Default cell assignments:

| Row | Default cells |
|-----|---------------|
| `session` | `model`, `duration`, `cost`, `context` |
| `location` | `directory`, `git`, `worktree` |
| `memory` | `memory` |
| `environment` | `environment` |
| `activity` | `tools`, `agents`, `todos` |
| `tokens` | `session-tokens`, `custom`, `usage` |

## Git

```json
{
  "gitStatus": {
    "enabled": true,
    "showDirty": true,
    "showAheadBehind": false,
    "showFileStats": false,
    "showWorktree": true,
    "pushWarningThreshold": 0,
    "pushCriticalThreshold": 0
  }
}
```

`showWorktree` is a fork addition — shows `repoName:(worktreeName)` when inside a git worktree.

## Display Toggles

```json
{
  "display": {
    "showModel": true,
    "showContextBar": true,
    "contextValue": "percent",
    "showCost": false,
    "showDuration": false,
    "showUsage": true,
    "showTools": false,
    "showAgents": false,
    "showTodos": false,
    "showMemoryUsage": false,
    "showSessionTokens": false,
    "showConfigCounts": false,
    "showClaudeCodeVersion": false,
    "modelFormat": "full",
    "pathLevels": 1
  }
}
```

`contextValue` options: `percent` | `tokens` | `remaining` | `both`

`modelFormat` options: `full` | `compact` | `short`

## Colors

```json
{
  "colors": {
    "model": "#cba6f7",
    "project": "#89dceb",
    "git": "#f38ba8",
    "gitBranch": "#a6e3a1",
    "context": "#a6e3a1",
    "usage": "#89b4fa",
    "warning": "#fab387",
    "critical": "#f38ba8",
    "label": "#6c7086"
  }
}
```

Color values: named (`dim`, `red`, `green`, `yellow`, `magenta`, `cyan`, `brightBlue`, `brightMagenta`), 256-color index (`0-255`), or hex (`#rrggbb`).
