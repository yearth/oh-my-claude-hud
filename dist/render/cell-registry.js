export const VALID_CELL_IDS = new Set([
    'model', 'duration', 'cost', 'context',
    'directory', 'git', 'worktree',
    'memory', 'environment',
    'tools', 'agents', 'todos',
    'session-tokens', 'custom', 'usage',
]);
export const CELL_REGISTRY = new Map();
export function registerCell(cell) {
    CELL_REGISTRY.set(cell.id, cell);
}
//# sourceMappingURL=cell-registry.js.map