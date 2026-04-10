import type { RenderContext } from '../../types.js';
import { custom as customColor } from '../colors.js';
import { registerCell } from '../cell-registry.js';

registerCell({
  id: 'custom',
  render(ctx: RenderContext): string | null {
    const customLine = ctx.config?.display?.customLine;
    if (!customLine) return null;
    return customColor(customLine, ctx.config?.colors);
  },
});
