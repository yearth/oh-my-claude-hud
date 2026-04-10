import { label } from '../colors.js';
import { registerCell } from '../cell-registry.js';
function fmt(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(0)}k`;
    return n.toString();
}
registerCell({
    id: 'session-tokens',
    render(ctx) {
        const display = ctx.config?.display;
        if (display?.showSessionTokens === false)
            return null;
        const tokens = ctx.transcript.sessionTokens;
        if (!tokens)
            return null;
        const total = tokens.inputTokens + tokens.outputTokens + tokens.cacheCreationTokens + tokens.cacheReadTokens;
        if (total === 0)
            return null;
        const colors = ctx.config?.colors;
        const parts = [`in: ${fmt(tokens.inputTokens)}`, `out: ${fmt(tokens.outputTokens)}`];
        if (tokens.cacheCreationTokens > 0 || tokens.cacheReadTokens > 0) {
            parts.push(`cache: ${fmt(tokens.cacheCreationTokens + tokens.cacheReadTokens)}`);
        }
        return label(`Tokens ${fmt(total)} (${parts.join(', ')})`, colors);
    },
});
//# sourceMappingURL=session-tokens.js.map