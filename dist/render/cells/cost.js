import { resolveSessionCost, formatUsd } from '../../cost.js';
import { label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell-registry.js';
registerCell({
    id: 'cost',
    render(ctx) {
        if (ctx.config?.display?.showCost !== true)
            return null;
        const cost = resolveSessionCost(ctx.stdin, ctx.transcript.sessionTokens);
        if (!cost)
            return null;
        const labelKey = cost.source === 'native' ? 'label.cost' : 'label.estimatedCost';
        return label(`${t(labelKey)} ${formatUsd(cost.totalUsd)}`, ctx.config?.colors);
    },
});
//# sourceMappingURL=cost.js.map