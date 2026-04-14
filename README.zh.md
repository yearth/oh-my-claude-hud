# Oh My Claude HUD

[jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) 的 fork，重构了渲染引擎，新增 git worktree 显示和 agent 身份识别。

> 完整功能文档请参考[原版 README](https://github.com/jarrodwatts/claude-hud#readme)。

---

## 与原版的区别

### 1. 灵活的布局引擎（Layout → Row → Cell）

原版的 HUD 布局是固定的。本 fork 将渲染引擎重写为三层可组合的 pipeline：

```
Layout（有序的 RowId 列表）
  └─ Row（一组 CellId 的命名分组）
       └─ Cell（单个可渲染单元）
```

这让你可以做到原版不支持的事情——比如把某个 cell 移到另一行、调整行的顺序、或通过配置完全隐藏某一行：

```json
{
  "layout": ["session", "activity", "location"],
  "rows": {
    "session": ["agent-identity", "model", "duration", "context"]
  }
}
```

**默认布局：**

| Row | 默认 cells |
|-----|------------|
| `session` | agent-identity、model、duration、context |
| `memory` | memory |
| `environment` | environment |
| `activity` | tools、agents、todos |
| `tokens` | session-tokens、custom、usage |
| `location` | directory、git、worktree |

从 `layout` 中删除某个 row ID 即可隐藏该行。通过 `rows.<id>` 可以重排或替换某行内的 cell。

### 2. Agent 身份 Cell

同时运行多个 Claude Code session 时，`agent-identity` cell 会显示当前 session 注册的 agent 代号：

```
ʕ•ᴥ•ʔ bright-fox │ Opus 4.6 │ 22m │ Context 8%
```

从 `~/.agent/identity-<pid>` 读取。文件不存在时自动隐藏。

### 3. Git Worktree 显示

在 git worktree 中工作时，`location` 行会显示当前所在的 worktree：

```
~/projects/my-repo  git:(main)   my-repo:(feature-branch)
```

在主 worktree 中自动隐藏。通过 `gitStatus.showWorktree` 控制（默认：`true`）。

---

## 安装

**第一步：Clone 并构建**

```bash
git clone https://github.com/yearth/oh-my-claude-hud ~/path/to/oh-my-claude-hud
cd ~/path/to/oh-my-claude-hud
npm ci && npm run build
```

**第二步：创建 wrapper 脚本**

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

> `CLAUDE_PID=$PPID` 是 agent-identity cell 正常工作的必要条件。

**第三步：配置 Claude Code 使用 wrapper**

编辑 `~/.claude/settings.json`：

```json
{
  "statusLine": {
    "command": "/Users/you/.claude/claude-hud-wrapper.sh"
  }
}
```

**第四步：重载插件**

```
/reload-plugins
```

---

## 环境要求

- Claude Code v1.0.80+
- Node.js 18+
- 安装了 [Nerd Font](https://www.nerdfonts.com/) 的终端（用于显示 worktree 图标）

---

## 致谢

基于 [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) 构建，MIT 协议。

## License

MIT — 详见 [LICENSE](LICENSE)
