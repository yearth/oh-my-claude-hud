import type { RenderContext, AgentEntry } from '../../types.js';
import { yellow, green, magenta, label } from '../colors.js';
import { registerCell } from '../cell-registry.js';

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
