import type { RenderContext } from '../types.js';
export type CellId = 'agent-identity' | 'model' | 'duration' | 'cost' | 'context' | 'directory' | 'git' | 'worktree' | 'memory' | 'environment' | 'tools' | 'agents' | 'todos' | 'session-tokens' | 'custom' | 'usage';
export interface Cell {
    id: CellId;
    render(ctx: RenderContext): string | null;
}
export declare const VALID_CELL_IDS: Set<CellId>;
export declare const CELL_REGISTRY: Map<CellId, Cell>;
export declare function registerCell(cell: Cell): void;
//# sourceMappingURL=cell-registry.d.ts.map