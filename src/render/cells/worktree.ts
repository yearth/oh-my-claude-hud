import type { RenderContext } from '../../types.js';
import { gitBranch as gitBranchColor } from '../colors.js';
import { registerCell } from '../cell-registry.js';

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
