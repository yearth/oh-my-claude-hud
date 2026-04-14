import { readFileSync } from 'node:fs';
import type { RenderContext } from '../../types.js';
import { registerCell } from '../cell-registry.js';

function getAgentName(): string | null {
  // CLAUDE_PID is set by the wrapper to the claude process PID,
  // which is what agent-register.sh writes identity-<pid> for.
  const pid = process.env.CLAUDE_PID ?? String(process.ppid);
  if (!pid) return null;
  try {
    const name = readFileSync(`${process.env.HOME}/.agent/identity-${pid}`, 'utf8').trim();
    return name || null;
  } catch {
    return null;
  }
}

registerCell({
  id: 'agent-identity',
  render(_ctx: RenderContext): string | null {
    const name = getAgentName();
    if (!name) return null;
    return `ʕ•ᴥ•ʔ ${name}`;
  },
});
