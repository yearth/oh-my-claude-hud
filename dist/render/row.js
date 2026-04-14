import { renderCell } from './cell.js';
export const DEFAULT_ROWS = new Map([
    ['session', { id: 'session', cells: ['agent-identity', 'model', 'duration', 'context'] }],
    ['location', { id: 'location', cells: ['directory', 'git', 'worktree'] }],
    ['memory', { id: 'memory', cells: ['memory'] }],
    ['environment', { id: 'environment', cells: ['environment'] }],
    ['activity', { id: 'activity', cells: ['tools', 'agents', 'todos'] }],
    ['tokens', { id: 'tokens', cells: ['session-tokens', 'custom', 'usage'] }],
]);
export function renderRow(row, ctx) {
    const parts = row.cells
        .map(id => renderCell(id, ctx))
        .filter((s) => s !== null);
    return parts.length === 0 ? null : parts.join(' │ ');
}
//# sourceMappingURL=row.js.map