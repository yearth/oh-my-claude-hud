import { yellow, green, cyan, label } from '../colors.js';
import { registerCell } from '../cell-registry.js';
function truncatePath(path, maxLen = 20) {
    const normalized = path.replace(/\\/g, '/');
    if (normalized.length <= maxLen)
        return normalized;
    const parts = normalized.split('/');
    const filename = parts.pop() || normalized;
    if (filename.length >= maxLen)
        return filename.slice(0, maxLen - 3) + '...';
    return '.../' + filename;
}
registerCell({
    id: 'tools',
    render(ctx) {
        const display = ctx.config?.display;
        if (display?.showTools === false)
            return null;
        const { tools } = ctx.transcript;
        if (tools.length === 0)
            return null;
        const colors = ctx.config?.colors;
        const parts = [];
        const runningTools = tools.filter(t => t.status === 'running');
        const completedTools = tools.filter(t => t.status === 'completed' || t.status === 'error');
        for (const tool of runningTools.slice(-2)) {
            const target = tool.target ? truncatePath(tool.target) : '';
            parts.push(`${yellow('◐')} ${cyan(tool.name)}${target ? label(`: ${target}`, colors) : ''}`);
        }
        const toolCounts = new Map();
        for (const tool of completedTools) {
            toolCounts.set(tool.name, (toolCounts.get(tool.name) ?? 0) + 1);
        }
        for (const [name, count] of Array.from(toolCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)) {
            parts.push(`${green('✓')} ${name} ${label(`×${count}`, colors)}`);
        }
        return parts.length === 0 ? null : parts.join(' | ');
    },
});
//# sourceMappingURL=tools.js.map