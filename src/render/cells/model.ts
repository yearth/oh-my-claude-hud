import type { RenderContext } from '../../types.js';
import { getModelName, formatModelName, getProviderLabel } from '../../stdin.js';
import { model as modelColor } from '../colors.js';
import { registerCell } from '../cell-registry.js';

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
