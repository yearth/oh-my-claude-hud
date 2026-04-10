# Claude HUD Enhanced

A fork of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) with a restructured render engine and git worktree support.

[![License](https://img.shields.io/github/license/yearth/claude-hud-enhanced?v=2)](LICENSE)

> **Looking for the original?** → [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)

---

## What's Different from the Original

### 1. Structured Layout Engine (Layout → Row → Cell)

The render engine has been rewritten from a set of monolithic line renderers into a composable three-layer pipeline:

```
Layout (ordered list of RowIds)
  └─ Row (a named group of CellIds)
       └─ Cell (a single renderable unit)
```

**Default layout** (6 rows):

| Row | Cells |
|-----|-------|
| `session` | model, duration, cost, context |
| `location` | directory, git, **worktree** |
| `memory` | memory |
| `environment` | environment |
| `activity` | tools, agents, todos |
| `tokens` | session-tokens, custom, usage |

You can reorder or remove rows via the `layout` field in config:

```json
{
  "layout": ["session", "location", "activity", "tokens"]
}
```

### 2. Git Worktree Display

When you're working inside a git worktree, the `location` row now shows which worktree you're in:

```
~/projects/my-repo  git:(main*)   my-repo:(feature-branch)
```

- The worktree cell shows `repoName:(worktreeName)`
- The main worktree displays as `base`
- Hidden automatically when not in a worktree
- Controlled by `gitStatus.showWorktree` (default: `true`)

---

## Install

> **Note:** This fork is not published to the Claude Code plugin marketplace. Install manually by cloning the repo and pointing your `statusLine` config at the local build.

**Step 1: Clone**

```bash
git clone https://github.com/yearth/claude-hud-enhanced ~/path/to/claude-hud-enhanced
cd ~/path/to/claude-hud-enhanced
npm ci && npm run build
```

**Step 2: Create a wrapper script**

```bash
#!/bin/sh
# ~/.claude/claude-hud-wrapper.sh
exec node /absolute/path/to/claude-hud-enhanced/dist/index.js "$@"
```

```bash
chmod +x ~/.claude/claude-hud-wrapper.sh
```

**Step 3: Point Claude Code at the wrapper**

Edit `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "command": "/Users/you/.claude/claude-hud-wrapper.sh"
  }
}
```

**Step 4: Reload**

```
/reload-plugins
```

---

## Configuration

Same as the original, with the following additions:

### New: `layout`

Replaces `elementOrder` / `lineLayout`. An ordered list of row IDs to render:

```json
{
  "layout": ["session", "memory", "location", "environment", "activity", "tokens"]
}
```

Remove a row ID to hide it entirely.

### New: `gitStatus.showWorktree`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gitStatus.showWorktree` | boolean | `true` | Show the worktree cell when inside a git worktree |

### All Other Options

All original options are still supported. See the [original README](https://github.com/jarrodwatts/claude-hud#configuration) for the full reference.

---

## Requirements

- Claude Code v1.0.80+
- Node.js 18+ or Bun
- A [Nerd Font](https://www.nerdfonts.com/) for the worktree icon

---

## Development

```bash
git clone https://github.com/yearth/claude-hud-enhanced
cd claude-hud-enhanced
npm ci && npm run build
npm test
```

---

## Credits

Built on top of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) — MIT licensed. Original work and plugin infrastructure by [@jarrodwatts](https://github.com/jarrodwatts).

## License

MIT — see [LICENSE](LICENSE)
