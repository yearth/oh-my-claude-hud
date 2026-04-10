import type { RenderContext } from '../../types.js';
import { git as gitColor, gitBranch as gitBranchColor, green, red } from '../colors.js';
import { registerCell } from '../cell-registry.js';

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
