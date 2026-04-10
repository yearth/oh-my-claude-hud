import type { RenderContext } from '../types.js';
import type { CellId } from './cell.js';
export type RowId = 'session' | 'location' | 'memory' | 'environment' | 'activity' | 'tokens';
export interface Row {
    id: RowId;
    cells: CellId[];
}
export declare const DEFAULT_ROWS: Map<RowId, Row>;
export declare function renderRow(row: Row, ctx: RenderContext): string | null;
//# sourceMappingURL=row.d.ts.map