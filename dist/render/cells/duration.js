import { label } from '../colors.js';
import { registerCell } from '../cell-registry.js';
registerCell({
    id: 'duration',
    render(ctx) {
        const display = ctx.config?.display;
        if (display?.showDuration === false)
            return null;
        if (!ctx.sessionDuration)
            return null;
        return label(`⏱️  ${ctx.sessionDuration}`, ctx.config?.colors);
    },
});
//# sourceMappingURL=duration.js.map