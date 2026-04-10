# Structured Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor claude-hud's render pipeline from ad-hoc string-returning functions to a two-layer structured model (cells → rows → layout), and implement the target layout: `[model | duration | cost | context]` on row 1, `[directory | git | worktree]` on row 3.

**Architecture:** Extract each display unit into a `Cell` object under `src/render/cells/`. Cells group into `Row`s defined in `src/render/row.ts`. A `Layout` (ordered `RowId[]`) in `src/render/layout.ts` replaces the current `elementOrder`. The render engine in `src/render/index.ts` iterates layout → rows → cells, joining cells with ` │ ` and rows with newlines. Old `lines/` and top-level line files are deleted after migration.

**Tech Stack:** TypeScript, Node.js built-in test runner, existing ANSI color helpers in `src/render/colors.ts`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/render/cell.ts` | Create | `Cell` interface + `CellId` union type |
| `src/render/cells/model.ts` | Create | model cell |
| `src/render/cells/duration.ts` | Create | duration cell |
| `src/render/cells/cost.ts` | Create | cost cell (from `lines/cost.ts`) |
| `src/render/cells/context.ts` | Create | context bar + % cell (from `lines/identity.ts`) |
| `src/render/cells/directory.ts` | Create | project path cell (from `render/lines/project.ts`) |
| `src/render/cells/git.ts` | Create | git branch + dirty + ahead/behind cell (from `render/lines/project.ts`) |
| `src/render/cells/worktree.ts` | Create | worktree cell (from `render/lines/project.ts`) |
| `src/render/cells/memory.ts` | Create | memory cell (from `lines/memory.ts`) |
| `src/render/cells/environment.ts` | Create | environment cell (from `lines/environment.ts`) |
| `src/render/cells/tools.ts` | Create | tools cell (from `render/tools-line.ts`) |
| `src/render/cells/agents.ts` | Create | agents cell (from `render/agents-line.ts`) |
| `src/render/cells/todos.ts` | Create | todos cell (from `render/todos-line.ts`) |
| `src/render/cells/session-tokens.ts` | Create | session tokens cell (from `lines/session-tokens.ts`) |
| `src/render/cells/custom.ts` | Create | custom line cell (from `render/lines/project.ts`) |
| `src/render/cells/usage.ts` | Create | usage/quota cell (from `lines/usage.ts`) |
| `src/render/row.ts` | Create | `Row` interface + `RowId` type + `DEFAULT_ROWS` map |
| `src/render/layout.ts` | Create | `Layout` type + `DEFAULT_LAYOUT` |
| `src/render/index.ts` | Modify | Rewrite render engine to use layout→row→cell pipeline |
| `src/config.ts` | Modify | Replace `elementOrder: HudElement[]` with `layout: RowId[]`; remove `lineLayout` |
| `src/config-reader.ts` | Modify | Read/validate `layout`; remove `elementOrder`/`lineLayout` |
| `src/render/lines/` | Delete | All files (after migration) |
| `src/render/tools-line.ts` | Delete | (after migration) |
| `src/render/agents-line.ts` | Delete | (after migration) |
| `src/render/todos-line.ts` | Delete | (after migration) |
| `src/render/session-line.ts` | Delete | (after migration) |
| `tests/render.test.js` | Modify | Update all tests to use new cell/row/layout API |
| `tests/config.test.js` | Modify | Update config tests for `layout` field |

---

## Task 1: Cell infrastructure + all cells

**Files:**
- Create: `src/render/cell.ts`
- Create: `src/render/cells/model.ts`
- Create: `src/render/cells/duration.ts`
- Create: `src/render/cells/cost.ts`
- Create: `src/render/cells/context.ts`
- Create: `src/render/cells/directory.ts`
- Create: `src/render/cells/git.ts`
- Create: `src/render/cells/worktree.ts`
- Create: `src/render/cells/memory.ts`
- Create: `src/render/cells/environment.ts`
- Create: `src/render/cells/tools.ts`
- Create: `src/render/cells/agents.ts`
- Create: `src/render/cells/todos.ts`
- Create: `src/render/cells/session-tokens.ts`
- Create: `src/render/cells/custom.ts`
- Create: `src/render/cells/usage.ts`

- [ ] **Step 1: Write failing tests for Cell interface in `tests/render.test.js`**

Add at the top of `tests/render.test.js` (after existing imports):
```js
import { renderCell } from '../dist/render/cell.js';
```

Add these tests after existing tests:
```js
// Cell infrastructure tests
test('renderCell returns null for unknown cell id', () => {
  const ctx = makeCtx();
  const result = renderCell('unknown-cell-id', ctx);
  assert.equal(result, null);
});

test('renderCell model returns model string when showModel is true', () => {
  const ctx = makeCtx();
  ctx.stdin.model = { display_name: 'claude-opus-4-6' };
  ctx.config.display.showModel = true;
  const result = renderCell('model', ctx);
  assert.ok(result !== null);
  assert.ok(stripAnsi(result).includes('claude-opus-4-6'), `Expected model name in: ${result}`);
});

test('renderCell model returns null when showModel is false', () => {
  const ctx = makeCtx();
  ctx.config.display.showModel = false;
  const result = renderCell('model', ctx);
  assert.equal(result, null);
});

test('renderCell directory returns project path', () => {
  const ctx = makeCtx();
  ctx.stdin.cwd = '/Users/test/my-project';
  ctx.config.display.showProject = true;
  const result = renderCell('directory', ctx);
  assert.ok(result !== null);
  assert.ok(stripAnsi(result).includes('my-project'), `Expected dir in: ${result}`);
});

test('renderCell git returns null when gitStatus is null', () => {
  const ctx = makeCtx();
  ctx.gitStatus = null;
  const result = renderCell('git', ctx);
  assert.equal(result, null);
});

test('renderCell git returns branch string', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.config.gitStatus.enabled = true;
  const result = renderCell('git', ctx);
  assert.ok(result !== null);
  assert.ok(stripAnsi(result).includes('main'), `Expected branch in: ${result}`);
});

test('renderCell worktree returns null when worktreeInfo is null', () => {
  const ctx = makeCtx();
  ctx.worktreeInfo = null;
  const result = renderCell('worktree', ctx);
  assert.equal(result, null);
});

test('renderCell worktree returns worktree cell string', () => {
  const ctx = makeCtx();
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.worktreeInfo = { repoName: 'my-project', worktreeName: 'base' };
  ctx.config.gitStatus.enabled = true;
  ctx.config.gitStatus.showWorktree = true;
  const result = renderCell('worktree', ctx);
  assert.ok(result !== null);
  assert.ok(stripAnsi(result).includes('my-project:(base)'), `Expected worktree in: ${result}`);
});
```

- [ ] **Step 2: Build and confirm tests fail**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/render.test.js 2>&1 | grep -E "fail|SyntaxError|not a function" | head -5
```

Expected: build fails or tests fail with import error.

- [ ] **Step 3: Create `src/render/cell.ts`**

```typescript
import type { RenderContext } from '../types.js';

export type CellId =
  | 'model'
  | 'duration'
  | 'cost'
  | 'context'
  | 'directory'
  | 'git'
  | 'worktree'
  | 'memory'
  | 'environment'
  | 'tools'
  | 'agents'
  | 'todos'
  | 'session-tokens'
  | 'custom'
  | 'usage';

export interface Cell {
  id: CellId;
  render(ctx: RenderContext): string | null;
}

// Populated by registerCell calls from each cell module
const CELL_REGISTRY = new Map<CellId, Cell>();

export function registerCell(cell: Cell): void {
  CELL_REGISTRY.set(cell.id, cell);
}

export function renderCell(id: string, ctx: RenderContext): string | null {
  const cell = CELL_REGISTRY.get(id as CellId);
  if (!cell) return null;
  return cell.render(ctx);
}

// Import all cells to trigger registration
import './cells/model.js';
import './cells/duration.js';
import './cells/cost.js';
import './cells/context.js';
import './cells/directory.js';
import './cells/git.js';
import './cells/worktree.js';
import './cells/memory.js';
import './cells/environment.js';
import './cells/tools.js';
import './cells/agents.js';
import './cells/todos.js';
import './cells/session-tokens.js';
import './cells/custom.js';
import './cells/usage.js';
```

- [ ] **Step 4: Create `src/render/cells/model.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { getModelName, formatModelName, getProviderLabel } from '../../stdin.js';
import { model as modelColor } from '../colors.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'model',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showModel === false) return null;
    const modelName = formatModelName(
      getModelName(ctx.stdin),
      display?.modelFormat,
      display?.modelOverride,
    );
    const providerLabel = getProviderLabel(ctx.stdin);
    const modelDisplay = providerLabel ? `${modelName} | ${providerLabel}` : modelName;
    return modelColor(`[${modelDisplay}]`, ctx.config?.colors);
  },
});
```

- [ ] **Step 5: Create `src/render/cells/duration.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { label } from '../colors.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'duration',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showDuration === false) return null;
    if (!ctx.sessionDuration) return null;
    return label(`⏱️  ${ctx.sessionDuration}`, ctx.config?.colors);
  },
});
```

- [ ] **Step 6: Create `src/render/cells/cost.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { resolveSessionCost, formatUsd } from '../../cost.js';
import { label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'cost',
  render(ctx: RenderContext): string | null {
    if (ctx.config?.display?.showCost !== true) return null;
    const cost = resolveSessionCost(ctx.stdin, ctx.transcript.sessionTokens);
    if (!cost) return null;
    const labelKey = cost.source === 'native' ? 'label.cost' : 'label.estimatedCost';
    return label(`${t(labelKey)} ${formatUsd(cost.totalUsd)}`, ctx.config?.colors);
  },
});
```

- [ ] **Step 7: Create `src/render/cells/context.ts`**

Copy the logic from `src/render/lines/identity.ts`'s `renderIdentityLine`, wrapping it in a `registerCell` call:

```typescript
import type { RenderContext } from '../../types.js';
import { getContextPercent, getBufferedPercent, getTotalTokens } from '../../stdin.js';
import { coloredBar, label, getContextColor, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

const DEBUG = process.env.DEBUG?.includes('claude-hud') || process.env.DEBUG === '*';

registerCell({
  id: 'context',
  render(ctx: RenderContext): string | null {
    const rawPercent = getContextPercent(ctx.stdin);
    const bufferedPercent = getBufferedPercent(ctx.stdin);
    const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
    const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;
    const colors = ctx.config?.colors;

    if (DEBUG && autocompactMode === 'disabled') {
      console.error(`[claude-hud:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
    }

    const display = ctx.config?.display;
    const contextValueMode = display?.contextValue ?? 'percent';
    const contextValue = formatContextValue(ctx, percent, contextValueMode);
    const contextValueDisplay = `${getContextColor(percent, colors)}${contextValue}${RESET}`;

    let line = display?.showContextBar !== false
      ? `${label(t('label.context'), colors)} ${coloredBar(percent, getAdaptiveBarWidth(), colors)} ${contextValueDisplay}`
      : `${label(t('label.context'), colors)} ${contextValueDisplay}`;

    if (display?.showTokenBreakdown !== false && percent >= 85) {
      const usage = ctx.stdin.context_window?.current_usage;
      if (usage) {
        const input = formatTokens(usage.input_tokens ?? 0);
        const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0));
        line += label(` (${t('format.in')}: ${input}, ${t('format.cache')}: ${cache})`, colors);
      }
    }

    return line;
  },
});

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

function formatContextValue(ctx: RenderContext, percent: number, mode: 'percent' | 'tokens' | 'remaining' | 'both'): string {
  const totalTokens = getTotalTokens(ctx.stdin);
  const size = ctx.stdin.context_window?.context_window_size ?? 0;
  if (mode === 'tokens') return size > 0 ? `${formatTokens(totalTokens)}/${formatTokens(size)}` : formatTokens(totalTokens);
  if (mode === 'both') return size > 0 ? `${percent}% (${formatTokens(totalTokens)}/${formatTokens(size)})` : `${percent}%`;
  if (mode === 'remaining') return `${Math.max(0, 100 - percent)}%`;
  return `${percent}%`;
}
```

- [ ] **Step 8: Create `src/render/cells/directory.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { project as projectColor } from '../colors.js';
import { registerCell } from '../cell.js';

function hyperlink(uri: string, text: string): string {
  const esc = '\x1b';
  const st = '\\';
  return `${esc}]8;;${uri}${esc}${st}${text}${esc}]8;;${esc}${st}`;
}

registerCell({
  id: 'directory',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showProject === false) return null;
    if (!ctx.stdin.cwd) return null;
    const segments = ctx.stdin.cwd.split(/[/\\]/).filter(Boolean);
    const pathLevels = ctx.config?.pathLevels ?? 1;
    const projectPath = segments.length > 0 ? segments.slice(-pathLevels).join('/') : '/';
    const colored = projectColor(projectPath, ctx.config?.colors);
    return hyperlink(`file://${ctx.stdin.cwd}`, colored);
  },
});
```

- [ ] **Step 9: Create `src/render/cells/git.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { git as gitColor, gitBranch as gitBranchColor, green, red } from '../colors.js';
import { registerCell } from '../cell.js';

function hyperlink(uri: string, text: string): string {
  const esc = '\x1b';
  const st = '\\';
  return `${esc}]8;;${uri}${esc}${st}${text}${esc}]8;;${esc}${st}`;
}

registerCell({
  id: 'git',
  render(ctx: RenderContext): string | null {
    const gitConfig = ctx.config?.gitStatus;
    if (!(gitConfig?.enabled ?? true)) return null;
    if (!ctx.gitStatus) return null;

    const colors = ctx.config?.colors;
    const branchText = ctx.gitStatus.branch + ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty ? '*' : '');
    const coloredBranch = gitBranchColor(branchText, colors);
    const linkedBranch = ctx.gitStatus.branchUrl ? hyperlink(ctx.gitStatus.branchUrl, coloredBranch) : coloredBranch;
    const inner: string[] = [linkedBranch];

    if (gitConfig?.showAheadBehind) {
      if (ctx.gitStatus.ahead > 0) inner.push(gitBranchColor(`↑${ctx.gitStatus.ahead}`, colors));
      if (ctx.gitStatus.behind > 0) inner.push(gitBranchColor(`↓${ctx.gitStatus.behind}`, colors));
    }

    if (gitConfig?.showFileStats && ctx.gitStatus.lineDiff) {
      const { added, deleted } = ctx.gitStatus.lineDiff;
      const diffParts: string[] = [];
      if (added > 0) diffParts.push(green(`+${added}`));
      if (deleted > 0) diffParts.push(red(`-${deleted}`));
      if (diffParts.length > 0) inner.push(`[${diffParts.join(' ')}]`);
    }

    return `${gitColor('git:(', colors)}${inner.join(' ')}${gitColor(')', colors)}`;
  },
});
```

- [ ] **Step 10: Create `src/render/cells/worktree.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { gitBranch as gitBranchColor } from '../colors.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'worktree',
  render(ctx: RenderContext): string | null {
    const gitConfig = ctx.config?.gitStatus;
    if (!(gitConfig?.enabled ?? true)) return null;
    if (!(gitConfig?.showWorktree ?? true)) return null;
    if (!ctx.worktreeInfo) return null;
    const { repoName, worktreeName } = ctx.worktreeInfo;
    // \uF0425 = nf-md-source_branch (Nerd Font Material Design Icons)
    return gitBranchColor(`\uF0425 ${repoName}:(${worktreeName})`, ctx.config?.colors);
  },
});
```

- [ ] **Step 11: Create `src/render/cells/memory.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { formatBytes } from '../../memory.js';
import { label, getQuotaColor, quotaBar, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'memory',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showMemoryUsage !== true) return null;
    if (!ctx.memoryUsage) return null;
    const memoryLabel = label(t('label.approxRam'), colors);
    const percentColor = getQuotaColor(ctx.memoryUsage.usedPercent, colors);
    const percent = `${percentColor}${ctx.memoryUsage.usedPercent}%${RESET}`;
    const bar = quotaBar(ctx.memoryUsage.usedPercent, getAdaptiveBarWidth(), colors);
    return `${memoryLabel} ${bar} ${formatBytes(ctx.memoryUsage.usedBytes)} / ${formatBytes(ctx.memoryUsage.totalBytes)} (${percent})`;
  },
});
```

- [ ] **Step 12: Create `src/render/cells/environment.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'environment',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    const totalCounts = ctx.claudeMdCount + ctx.rulesCount + ctx.mcpCount + ctx.hooksCount;
    const threshold = display?.environmentThreshold ?? 0;
    const showCounts = display?.showConfigCounts !== false;
    const showOutputStyle = display?.showOutputStyle === true;
    const parts: string[] = [];

    if (showCounts && totalCounts >= threshold && totalCounts > 0) {
      if (ctx.claudeMdCount > 0) parts.push(`${ctx.claudeMdCount} CLAUDE.md`);
      if (ctx.rulesCount > 0) parts.push(`${ctx.rulesCount} ${t('label.rules')}`);
      if (ctx.mcpCount > 0) parts.push(`${ctx.mcpCount} MCPs`);
      if (ctx.hooksCount > 0) parts.push(`${ctx.hooksCount} ${t('label.hooks')}`);
    }

    if (showOutputStyle && ctx.outputStyle) parts.push(`style: ${ctx.outputStyle}`);
    if (parts.length === 0) return null;
    return label(parts.join(' | '), ctx.config?.colors);
  },
});
```

- [ ] **Step 13: Create `src/render/cells/tools.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { yellow, green, cyan, label } from '../colors.js';
import { registerCell } from '../cell.js';

function truncatePath(path: string, maxLen = 20): string {
  const normalized = path.replace(/\\/g, '/');
  if (normalized.length <= maxLen) return normalized;
  const parts = normalized.split('/');
  const filename = parts.pop() || normalized;
  if (filename.length >= maxLen) return filename.slice(0, maxLen - 3) + '...';
  return '.../' + filename;
}

registerCell({
  id: 'tools',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showTools === false) return null;
    const { tools } = ctx.transcript;
    if (tools.length === 0) return null;
    const colors = ctx.config?.colors;
    const parts: string[] = [];

    const runningTools = tools.filter(t => t.status === 'running');
    const completedTools = tools.filter(t => t.status === 'completed' || t.status === 'error');

    for (const tool of runningTools.slice(-2)) {
      const target = tool.target ? truncatePath(tool.target) : '';
      parts.push(`${yellow('◐')} ${cyan(tool.name)}${target ? label(`: ${target}`, colors) : ''}`);
    }

    const toolCounts = new Map<string, number>();
    for (const tool of completedTools) {
      toolCounts.set(tool.name, (toolCounts.get(tool.name) ?? 0) + 1);
    }

    for (const [name, count] of Array.from(toolCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)) {
      parts.push(`${green('✓')} ${name} ${label(`×${count}`, colors)}`);
    }

    return parts.length === 0 ? null : parts.join(' | ');
  },
});
```

- [ ] **Step 14: Create `src/render/cells/agents.ts`**

```typescript
import type { RenderContext, AgentEntry } from '../../types.js';
import { yellow, green, magenta, label } from '../colors.js';
import { registerCell } from '../cell.js';

const MAX_RECENT_COMPLETED = 2;
const MAX_AGENTS_SHOWN = 3;

function formatElapsed(agent: AgentEntry): string {
  const now = Date.now();
  const start = agent.startTime.getTime();
  const end = agent.endTime?.getTime() ?? now;
  const ms = Math.max(0, end - start);
  if (ms < 1000) return '<1s';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatAgent(agent: AgentEntry, colors?: RenderContext['config']['colors']): string {
  const icon = agent.status === 'running' ? yellow('◐') : green('✓');
  const type = magenta(agent.type);
  const model = agent.model ? label(`[${agent.model}]`, colors) : '';
  const desc = agent.description ? label(`: ${agent.description.slice(0, 40)}${agent.description.length > 40 ? '...' : ''}`, colors) : '';
  return `${icon} ${type}${model ? ` ${model}` : ''}${desc} ${label(`(${formatElapsed(agent)})`, colors)}`;
}

registerCell({
  id: 'agents',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showAgents === false) return null;
    const { agents } = ctx.transcript;
    const running = agents.filter(a => a.status === 'running');
    const recentDone = agents.filter(a => a.status === 'completed').slice(-MAX_RECENT_COMPLETED);
    const seen = new Set<string>();
    const toShow = [...running, ...recentDone].filter(a => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    }).slice(-MAX_AGENTS_SHOWN);
    if (toShow.length === 0) return null;
    return toShow.map(a => formatAgent(a, ctx.config?.colors)).join('\n');
  },
});
```

- [ ] **Step 15: Create `src/render/cells/todos.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { yellow, green, label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'todos',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showTodos === false) return null;
    const { todos } = ctx.transcript;
    if (!todos || todos.length === 0) return null;
    const colors = ctx.config?.colors;
    const inProgress = todos.find(t => t.status === 'in_progress');
    const completed = todos.filter(t => t.status === 'completed').length;
    const total = todos.length;
    if (!inProgress) {
      if (completed === total && total > 0) {
        return `${green('✓')} ${t('status.allTodosComplete')} ${label(`(${completed}/${total})`, colors)}`;
      }
      return null;
    }
    const content = inProgress.content.length > 50 ? inProgress.content.slice(0, 47) + '...' : inProgress.content;
    return `${yellow('▸')} ${content} ${label(`(${completed}/${total})`, colors)}`;
  },
});
```

- [ ] **Step 16: Create `src/render/cells/session-tokens.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { label } from '../colors.js';
import { registerCell } from '../cell.js';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

registerCell({
  id: 'session-tokens',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showSessionTokens === false) return null;
    const tokens = ctx.transcript.sessionTokens;
    if (!tokens) return null;
    const total = tokens.inputTokens + tokens.outputTokens + tokens.cacheCreationTokens + tokens.cacheReadTokens;
    if (total === 0) return null;
    const colors = ctx.config?.colors;
    const parts = [`in: ${fmt(tokens.inputTokens)}`, `out: ${fmt(tokens.outputTokens)}`];
    if (tokens.cacheCreationTokens > 0 || tokens.cacheReadTokens > 0) {
      parts.push(`cache: ${fmt(tokens.cacheCreationTokens + tokens.cacheReadTokens)}`);
    }
    return label(`Tokens ${fmt(total)} (${parts.join(', ')})`, colors);
  },
});
```

- [ ] **Step 17: Create `src/render/cells/custom.ts`**

```typescript
import type { RenderContext } from '../../types.js';
import { custom as customColor } from '../colors.js';
import { registerCell } from '../cell.js';

registerCell({
  id: 'custom',
  render(ctx: RenderContext): string | null {
    const customLine = ctx.config?.display?.customLine;
    if (!customLine) return null;
    return customColor(customLine, ctx.config?.colors);
  },
});
```

- [ ] **Step 18: Create `src/render/cells/usage.ts`**

Copy `renderUsageLine` logic from `src/render/lines/usage.ts`, wrapping in `registerCell`:

```typescript
import type { RenderContext } from '../../types.js';
import { isLimitReached } from '../../types.js';
import { getProviderLabel } from '../../stdin.js';
import { critical, label, getQuotaColor, quotaBar, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell.js';

function formatPercent(percent: number | null, colors?: RenderContext['config']['colors']): string {
  if (percent === null) return label('--', colors);
  return `${getQuotaColor(percent, colors)}${percent}%${RESET}`;
}

function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return '';
  const diffMs = resetAt.getTime() - Date.now();
  if (diffMs <= 0) return '';
  const diffMins = Math.ceil(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatWindowPart({ windowLabel, percent, resetAt, colors, usageBarEnabled, barWidth, forceLabel = false }: {
  windowLabel: string; percent: number | null; resetAt: Date | null;
  colors?: RenderContext['config']['colors']; usageBarEnabled: boolean; barWidth: number; forceLabel?: boolean;
}): string {
  const usageDisplay = formatPercent(percent, colors);
  const reset = formatResetTime(resetAt);
  const styledLabel = label(windowLabel, colors);
  if (usageBarEnabled) {
    const body = reset
      ? `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay} (${t('format.resetsIn')} ${reset})`
      : `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay}`;
    return forceLabel ? `${styledLabel} ${body}` : body;
  }
  return reset ? `${styledLabel} ${usageDisplay} (${t('format.resetsIn')} ${reset})` : `${styledLabel} ${usageDisplay}`;
}

registerCell({
  id: 'usage',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false) return null;
    if (!ctx.usageData) return null;
    if (getProviderLabel(ctx.stdin)) return null;

    const usageLabel = label(t('label.usage'), colors);
    const barWidth = getAdaptiveBarWidth();

    if (isLimitReached(ctx.usageData)) {
      const resetTime = ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt)
        : formatResetTime(ctx.usageData.sevenDayResetAt);
      return `${usageLabel} ${critical(`⚠ ${t('status.limitReached')}${resetTime ? ` (${t('format.resets')} ${resetTime})` : ''}`, colors)}`;
    }

    const threshold = display?.usageThreshold ?? 0;
    const fiveHour = ctx.usageData.fiveHour;
    const sevenDay = ctx.usageData.sevenDay;
    const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);
    if (effectiveUsage < threshold) return null;

    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const sevenDayThreshold = display?.sevenDayThreshold ?? 80;

    if (fiveHour === null && sevenDay !== null) {
      return `${usageLabel} ${formatWindowPart({ windowLabel: t('label.weekly'), percent: sevenDay, resetAt: ctx.usageData.sevenDayResetAt, colors, usageBarEnabled, barWidth, forceLabel: true })}`;
    }

    const fiveHourPart = formatWindowPart({ windowLabel: '5h', percent: fiveHour, resetAt: ctx.usageData.fiveHourResetAt, colors, usageBarEnabled, barWidth });

    if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
      const sevenDayPart = formatWindowPart({ windowLabel: t('label.weekly'), percent: sevenDay, resetAt: ctx.usageData.sevenDayResetAt, colors, usageBarEnabled, barWidth, forceLabel: true });
      return `${usageLabel} ${fiveHourPart} | ${sevenDayPart}`;
    }

    return `${usageLabel} ${fiveHourPart}`;
  },
});
```

- [ ] **Step 19: Build and run cell tests**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -10
node --test tests/render.test.js 2>&1 | grep -E "renderCell|✓|✗" | head -20
```

Expected: all new cell tests pass, no existing tests broken.

- [ ] **Step 20: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/render/cell.ts src/render/cells/ tests/render.test.js
git commit -m "feat: add cell infrastructure and 16 cell implementations"
```

---

## Task 2: Row layer + Layout layer

**Files:**
- Create: `src/render/row.ts`
- Create: `src/render/layout.ts`

- [ ] **Step 1: Write failing tests**

Add to `tests/render.test.js`:
```js
import { renderRow, DEFAULT_ROWS } from '../dist/render/row.js';
import { DEFAULT_LAYOUT } from '../dist/render/layout.js';

test('DEFAULT_ROWS has session row with model, duration, cost, context', () => {
  const row = DEFAULT_ROWS.get('session');
  assert.ok(row, 'session row should exist');
  assert.ok(row.cells.includes('model'), 'session should include model');
  assert.ok(row.cells.includes('duration'), 'session should include duration');
  assert.ok(row.cells.includes('cost'), 'session should include cost');
  assert.ok(row.cells.includes('context'), 'session should include context');
});

test('DEFAULT_ROWS has location row with directory, git, worktree', () => {
  const row = DEFAULT_ROWS.get('location');
  assert.ok(row, 'location row should exist');
  assert.ok(row.cells.includes('directory'), 'location should include directory');
  assert.ok(row.cells.includes('git'), 'location should include git');
  assert.ok(row.cells.includes('worktree'), 'location should include worktree');
});

test('DEFAULT_LAYOUT contains session before location', () => {
  const sessionIdx = DEFAULT_LAYOUT.indexOf('session');
  const locationIdx = DEFAULT_LAYOUT.indexOf('location');
  assert.ok(sessionIdx !== -1, 'layout should include session');
  assert.ok(locationIdx !== -1, 'layout should include location');
  assert.ok(sessionIdx < locationIdx, 'session should come before location');
});

test('renderRow filters null cells and joins with │', () => {
  const ctx = makeCtx();
  ctx.stdin.model = { display_name: 'claude-opus-4-6' };
  ctx.config.display.showModel = true;
  ctx.config.display.showDuration = false;
  ctx.config.display.showCost = false;
  // context cell always renders, model renders, others suppressed
  const result = renderRow({ id: 'session', cells: ['model', 'duration'] }, ctx);
  // duration is null (showDuration false), model is non-null
  assert.ok(result !== null);
  assert.ok(stripAnsi(result).includes('claude-opus-4-6'));
  assert.ok(!stripAnsi(result).includes('│'), 'single cell should not have separator');
});
```

- [ ] **Step 2: Build and confirm tests fail**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/render.test.js 2>&1 | grep -E "renderRow|DEFAULT_ROWS|DEFAULT_LAYOUT|fail" | head -10
```

Expected: tests fail with import error.

- [ ] **Step 3: Create `src/render/row.ts`**

```typescript
import type { RenderContext } from '../types.js';
import type { CellId } from './cell.js';
import { renderCell } from './cell.js';

export type RowId =
  | 'session'
  | 'location'
  | 'memory'
  | 'environment'
  | 'activity'
  | 'tokens';

export interface Row {
  id: RowId;
  cells: CellId[];
}

export const DEFAULT_ROWS: Map<RowId, Row> = new Map([
  ['session',     { id: 'session',     cells: ['model', 'duration', 'cost', 'context'] }],
  ['location',    { id: 'location',    cells: ['directory', 'git', 'worktree'] }],
  ['memory',      { id: 'memory',      cells: ['memory'] }],
  ['environment', { id: 'environment', cells: ['environment'] }],
  ['activity',    { id: 'activity',    cells: ['tools', 'agents', 'todos'] }],
  ['tokens',      { id: 'tokens',      cells: ['session-tokens', 'custom', 'usage'] }],
]);

export function renderRow(row: Row, ctx: RenderContext): string | null {
  const parts = row.cells
    .map(id => renderCell(id, ctx))
    .filter((s): s is string => s !== null);
  return parts.length === 0 ? null : parts.join(' │ ');
}
```

- [ ] **Step 4: Create `src/render/layout.ts`**

```typescript
import type { RowId } from './row.js';

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

- [ ] **Step 5: Build and run tests**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/render.test.js 2>&1 | grep -E "DEFAULT_ROWS|DEFAULT_LAYOUT|renderRow|✓|✗" | head -15
```

Expected: all new row/layout tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/render/row.ts src/render/layout.ts tests/render.test.js
git commit -m "feat: add Row and Layout layers"
```

---

## Task 3: Rewrite render engine in `src/render/index.ts`

**Files:**
- Modify: `src/render/index.ts`

The new engine keeps all the terminal-width utility functions (`truncateToWidth`, `wrapLineToWidth`, `visualLength`, etc.) unchanged. Only the `renderExpanded`, `renderCompact`, and `render` functions are replaced.

- [ ] **Step 1: Write integration test**

Add to `tests/render.test.js`:
```js
import { render } from '../dist/render/index.js';

test('render outputs session row before location row', () => {
  const ctx = makeCtx();
  ctx.stdin.model = { display_name: 'claude-opus-4-6' };
  ctx.config.display.showModel = true;
  ctx.config.display.showDuration = false;
  ctx.config.display.showCost = false;
  ctx.stdin.cwd = '/Users/test/my-project';
  ctx.config.display.showProject = true;
  ctx.gitStatus = { branch: 'main', isDirty: false, ahead: 0, behind: 0 };
  ctx.config.gitStatus.enabled = true;

  const lines = [];
  const origLog = console.log;
  console.log = (line) => lines.push(line);
  render(ctx);
  console.log = origLog;

  const stripped = lines.map(l => stripAnsi(l));
  const sessionIdx = stripped.findIndex(l => l.includes('claude-opus-4-6'));
  const locationIdx = stripped.findIndex(l => l.includes('my-project'));
  assert.ok(sessionIdx !== -1, 'session row not found');
  assert.ok(locationIdx !== -1, 'location row not found');
  assert.ok(sessionIdx < locationIdx, `session (${sessionIdx}) should come before location (${locationIdx})`);
});
```

- [ ] **Step 2: Build and confirm test fails**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/render.test.js 2>&1 | grep "session row" | head -5
```

Expected: test fails (current engine puts location before context).

- [ ] **Step 3: Replace `renderExpanded`, `renderCompact`, `render` in `src/render/index.ts`**

Keep all utility functions (`getTerminalWidth`, `visualLength`, `truncateToWidth`, `wrapLineToWidth`, etc.) unchanged. Replace only the functions below.

Find and replace `function renderCompact`, `function renderExpanded`, `function render` with:

```typescript
import { DEFAULT_ROWS, renderRow } from './row.js';
import { DEFAULT_LAYOUT } from './layout.js';
import type { RowId } from './row.js';

// Add this import at the top of the file alongside existing imports

function renderLayout(ctx: RenderContext, layoutOverride?: RowId[]): string[] {
  const layout = layoutOverride ?? DEFAULT_LAYOUT;
  const terminalWidth = getTerminalWidth();
  const lines: string[] = [];

  for (const rowId of layout) {
    const row = DEFAULT_ROWS.get(rowId);
    if (!row) continue;
    const rendered = renderRow(row, ctx);
    if (!rendered) continue;

    // Rows that contain multi-line content (agents) already embed \n
    const physicalLines = rendered.split('\n');
    for (const line of physicalLines) {
      const wrapped = wrapLineToWidth(line, terminalWidth);
      lines.push(...wrapped);
    }
  }

  return lines;
}

export function render(ctx: RenderContext): void {
  const lines = renderLayout(ctx);
  for (const line of lines) {
    console.log(`${RESET}${line}`);
  }
}
```

Also remove the old imports for `renderSessionLine`, `renderToolsLine`, `renderAgentsLine`, `renderTodosLine`, `renderIdentityLine`, `renderProjectLine`, `renderGitFilesLine`, `renderEnvironmentLine`, `renderUsageLine`, `renderMemoryLine`, `renderSessionTokensLine` from the top of `index.ts` — they are no longer needed.

Add the new imports at the top:
```typescript
import { DEFAULT_ROWS, renderRow } from './row.js';
import { DEFAULT_LAYOUT } from './layout.js';
import type { RowId } from './row.js';
```

- [ ] **Step 4: Build and run all tests**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -10
node --test 2>&1 | tail -15
```

Expected: all tests pass including the new integration test.

- [ ] **Step 5: Smoke test**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
echo '{"model":{"display_name":"claude-opus-4-6"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000},"transcript_path":"/tmp/test.jsonl","cwd":"'$(pwd)'"}' | node dist/index.js
```

Expected output (first two non-dim lines):
```
[claude-opus-4-6] │ Context ▓░░ 22%
claude-hud │ git:(feat/worktree-cell) │ 󰙅 claude-hud:(base)
```

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/render/index.ts tests/render.test.js
git commit -m "feat: rewrite render engine with layout→row→cell pipeline"
```

---

## Task 4: Config migration (`elementOrder` → `layout`)

**Files:**
- Modify: `src/config.ts`
- Modify: `src/config-reader.ts`
- Modify: `tests/config.test.js`

- [ ] **Step 1: Write failing config tests**

Add to `tests/config.test.js`:
```js
import { DEFAULT_LAYOUT } from '../dist/render/layout.js';

test('default config has layout field matching DEFAULT_LAYOUT', async () => {
  const { mergeConfig } = await import('../dist/config.js');
  const config = mergeConfig({});
  assert.deepEqual(config.layout, DEFAULT_LAYOUT);
});

test('mergeConfig accepts custom layout', async () => {
  const { mergeConfig } = await import('../dist/config.js');
  const config = mergeConfig({ layout: ['session', 'location'] });
  assert.deepEqual(config.layout, ['session', 'location']);
});

test('mergeConfig falls back to DEFAULT_LAYOUT for invalid layout entries', async () => {
  const { mergeConfig } = await import('../dist/config.js');
  const config = mergeConfig({ layout: ['session', 'invalid-row-id', 'location'] });
  // invalid entries are filtered out
  assert.deepEqual(config.layout, ['session', 'location']);
});
```

- [ ] **Step 2: Build and confirm tests fail**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -5
node --test tests/config.test.js 2>&1 | grep -E "layout|fail" | head -10
```

- [ ] **Step 3: Update `src/config.ts`**

In `HudConfig` interface, replace:
```typescript
  elementOrder: HudElement[];
```
with:
```typescript
  layout: RowId[];
```

Add the import at the top:
```typescript
import type { RowId } from './render/row.js';
```

Remove the `HudElement` type and `DEFAULT_ELEMENT_ORDER` export (they are no longer used).

In `DEFAULT_CONFIG`, replace:
```typescript
  elementOrder: [...DEFAULT_ELEMENT_ORDER],
```
with:
```typescript
  layout: [...DEFAULT_LAYOUT],
```

Add the import:
```typescript
import { DEFAULT_LAYOUT } from './render/layout.js';
```

Also remove `lineLayout: 'compact' | 'expanded'` from the interface and its default value `lineLayout: 'expanded'` from `DEFAULT_CONFIG`.

- [ ] **Step 4: Update `src/config-reader.ts`**

In `mergeConfig`, replace the `elementOrder` parsing block with:
```typescript
  const VALID_ROW_IDS = new Set(['session', 'location', 'memory', 'environment', 'activity', 'tokens']);

  const layout: RowId[] = Array.isArray(migrated.layout)
    ? (migrated.layout as string[]).filter(id => VALID_ROW_IDS.has(id)) as RowId[]
    : [...DEFAULT_LAYOUT];

  const finalLayout = layout.length > 0 ? layout : [...DEFAULT_LAYOUT];
```

Remove the `lineLayout` parsing block and return it from `mergeConfig`.

Update the return statement to include `layout` instead of `elementOrder` and remove `lineLayout`.

- [ ] **Step 5: Build and run all tests**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1 | tail -10
node --test 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add src/config.ts src/config-reader.ts tests/config.test.js
git commit -m "feat: replace elementOrder/lineLayout with layout: RowId[]"
```

---

## Task 5: Delete old line files + full test cleanup

**Files:**
- Delete: `src/render/lines/` (all files)
- Delete: `src/render/tools-line.ts`
- Delete: `src/render/agents-line.ts`
- Delete: `src/render/todos-line.ts`
- Delete: `src/render/session-line.ts`
- Modify: `tests/render.test.js` (remove tests for deleted functions)

- [ ] **Step 1: Delete old render files**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
rm -rf src/render/lines/
rm src/render/tools-line.ts src/render/agents-line.ts src/render/todos-line.ts src/render/session-line.ts
```

- [ ] **Step 2: Build to confirm no broken imports**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm run build 2>&1
```

Expected: build succeeds. If there are import errors, find and remove the stale imports.

- [ ] **Step 3: Remove stale test imports and tests in `tests/render.test.js`**

Remove any imports referencing:
- `../dist/render/lines/project.js`
- `../dist/render/lines/identity.js`
- `../dist/render/lines/usage.js`
- `../dist/render/lines/memory.js`
- `../dist/render/lines/environment.js`
- `../dist/render/lines/cost.js`
- `../dist/render/lines/session-tokens.js`
- `../dist/render/tools-line.js`
- `../dist/render/agents-line.js`
- `../dist/render/todos-line.js`
- `../dist/render/session-line.js`

Remove tests that call `renderProjectLine`, `renderIdentityLine`, `renderUsageLine`, `renderMemoryLine`, `renderEnvironmentLine`, `renderToolsLine`, `renderAgentsLine`, `renderTodosLine`, `renderSessionLine` directly — these are now covered by cell tests.

Keep all tests that call `renderCell`, `renderRow`, `render`, and the git/worktree tests.

- [ ] **Step 4: Run full test suite**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
npm test 2>&1 | tail -20
```

Expected: all tests pass, 0 failures.

- [ ] **Step 5: Final smoke test**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
COLUMNS=200 echo '{"model":{"display_name":"claude-opus-4-6"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000},"transcript_path":"/tmp/test.jsonl","cwd":"'$(pwd)'"}' | node dist/index.js
```

Expected: first line contains model, second line contains directory + git + worktree.

- [ ] **Step 6: Commit**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git add -A
git commit -m "refactor: delete old line renderers, complete structured layout migration"
```

- [ ] **Step 7: Push**

```bash
cd /Users/yearthmain/Learnspace/repo/claude-hud
git push origin feat/worktree-cell
```
