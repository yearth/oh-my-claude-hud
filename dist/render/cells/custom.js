import { custom as customColor } from '../colors.js';
import { registerCell } from '../cell-registry.js';
registerCell({
    id: 'custom',
    render(ctx) {
        const customLine = ctx.config?.display?.customLine;
        if (!customLine)
            return null;
        return customColor(customLine, ctx.config?.colors);
    },
});
//# sourceMappingURL=custom.js.map