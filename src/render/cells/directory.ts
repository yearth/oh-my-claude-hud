import type { RenderContext } from '../../types.js';
import { project as projectColor } from '../colors.js';
import { registerCell } from '../cell-registry.js';

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
