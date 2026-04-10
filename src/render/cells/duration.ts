import type { RenderContext } from '../../types.js';
import { label } from '../colors.js';
import { registerCell } from '../cell-registry.js';

registerCell({
  id: 'duration',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showDuration === false) return null;
    if (!ctx.sessionDuration) return null;
    return label(`⏱️  ${ctx.sessionDuration}`, ctx.config?.colors);
  },
});
