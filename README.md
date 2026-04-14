# Oh My Claude HUD

A fork of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) with a restructured render engine and git worktree support.

> For full feature documentation, see the [original README](https://github.com/jarrodwatts/claude-hud#readme).

---

## What's Different

### 1. Flexible Layout Engine (Layout → Row → Cell)

The original HUD has a fixed set of lines. This fork rewrites the render engine into a three-layer composable pipeline:

```
Layout (ordered list of RowIds)
  └─ Row (a named group of CellIds)
       └─ Cell (a single renderable unit)
```

This lets you do things the original doesn't support — like moving individual cells between rows, reordering rows, or hiding specific rows entirely via config:

```json
{
  "layout": ["session", "activity", "location"],
  "rows": {
    "session": ["agent-identity", "model", "duration", "context"]
  }
}
```

**Default layout:**

| Row | Default cells |
|-----|---------------|
| `session` | agent-identity, model, duration, context |
| `memory` | memory |
| `environment` | environment |
| `activity` | tools, agents, todos |
| `tokens` | session-tokens, custom, usage |
| `location` | directory, git, worktree |

Remove a row from `layout` to hide it. Override `rows.<id>` to reorder or swap cells within a row.

### 2. Agent Identity Cell

When you have multiple Claude Code sessions running, the `agent-identity` cell shows which agent this session is registered as:

```
ʕ•ᴥ•ʔ bright-fox │ Opus 4.6 │ 22m │ Context 8%
```

Reads from `~/.agent/identity-<pid>`. Hidden automatically if the file doesn't exist.

### 3. Git Worktree Display

When inside a git worktree, the `location` row shows which worktree you're in:

```
~/projects/my-repo  git:(main)   my-repo:(feature-branch)
```

Hidden automatically in the main worktree. Controlled by `gitStatus.showWorktree` (default: `true`).

---

## Install

**Step 1: Clone and build**

```bash
git clone https://github.com/yearth/oh-my-claude-hud ~/path/to/oh-my-claude-hud
cd ~/path/to/oh-my-claude-hud
npm ci && npm run build
```

**Step 2: Create a wrapper script**

```bash
cat > ~/.claude/claude-hud-wrapper.sh << 'EOF'
#!/bin/bash
NODE=/path/to/node
HUD_SCRIPT=/path/to/oh-my-claude-hud/dist/index.js
COLUMNS=$(tput cols 2>/dev/null || echo 200)
export COLUMNS
export CLAUDE_PID=$PPID
"$NODE" "$HUD_SCRIPT"
EOF
chmod +x ~/.claude/claude-hud-wrapper.sh
```

> `CLAUDE_PID=$PPID` is required for the agent-identity cell to work correctly.

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

## Requirements

- Claude Code v1.0.80+
- Node.js 18+
- A [Nerd Font](https://www.nerdfonts.com/) for the worktree icon

---

## Credits

Built on top of [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) — MIT licensed.

## License

MIT — see [LICENSE](LICENSE)
