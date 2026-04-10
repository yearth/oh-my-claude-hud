# Oh My Claude HUD

[jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) 的 fork 版本，重构了渲染引擎，并新增了 git worktree 显示支持。

[![License](https://img.shields.io/github/license/yearth/oh-my-claude-hud?v=2)](LICENSE)

> **查看原版** → [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)

---

## 与原版的区别

### 1. 结构化布局引擎（Layout → Row → Cell）

渲染引擎从原来的多个 monolithic line renderer 重写为三层可组合的 pipeline：

```
Layout（有序的 RowId 列表）
  └─ Row（一组 CellId 的命名分组）
       └─ Cell（单个可渲染单元）
```

**默认布局**（6 行）：

| Row | Cells |
|-----|-------|
| `session` | model、duration、cost、context |
| `location` | directory、git、**worktree** |
| `memory` | memory |
| `environment` | environment |
| `activity` | tools、agents、todos |
| `tokens` | session-tokens、custom、usage |

通过配置中的 `layout` 字段可以自由调整顺序或删减行：

```json
{
  "layout": ["session", "location", "activity", "tokens"]
}
```

### 2. Git Worktree 显示

在 git worktree 中工作时，`location` 行会显示当前所在的 worktree：

```
~/projects/my-repo  git:(main*)   my-repo:(feature-branch)
```

- worktree cell 显示格式为 `repoName:(worktreeName)`
- 主 worktree 显示为 `base`
- 不在 worktree 中时自动隐藏
- 通过 `gitStatus.showWorktree` 控制（默认：`true`）

---

## 安装

> **注意：** 本 fork 未发布到 Claude Code 插件市场，需要手动 clone 后本地使用。

**第一步：Clone 仓库**

```bash
git clone https://github.com/yearth/oh-my-claude-hud ~/path/to/oh-my-claude-hud
cd ~/path/to/oh-my-claude-hud
npm ci && npm run build
```

**第二步：创建 wrapper 脚本**

```bash
#!/bin/sh
# ~/.claude/claude-hud-wrapper.sh
exec node /absolute/path/to/oh-my-claude-hud/dist/index.js "$@"
```

```bash
chmod +x ~/.claude/claude-hud-wrapper.sh
```

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

## 配置

与原版相同，新增以下配置项：

### 新增：`layout`

替代原版的 `elementOrder` / `lineLayout`，为有序的 row ID 列表：

```json
{
  "layout": ["session", "memory", "location", "environment", "activity", "tokens"]
}
```

从列表中删除某个 row ID 即可隐藏该行。

### 新增：`gitStatus.showWorktree`

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `gitStatus.showWorktree` | boolean | `true` | 在 git worktree 中时显示 worktree cell |

### 其他配置项

所有原版配置项均保持兼容，完整参考见[原版 README](https://github.com/jarrodwatts/claude-hud#configuration)。

---

## 环境要求

- Claude Code v1.0.80+
- Node.js 18+ 或 Bun
- 安装了 [Nerd Font](https://www.nerdfonts.com/) 的终端（用于显示 worktree 图标）

---

## 开发

```bash
git clone https://github.com/yearth/oh-my-claude-hud
cd oh-my-claude-hud
npm ci && npm run build
npm test
```

---

## 致谢

基于 [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) 构建，MIT 协议。原版插件基础设施由 [@jarrodwatts](https://github.com/jarrodwatts) 开发。

## License

MIT — 详见 [LICENSE](LICENSE)
