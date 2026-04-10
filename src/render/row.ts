import type { RenderContext } from '../types.js';
import type { CellId } from './cell.js';
import { renderCell } from './cell.js';

export type RowId =
  | 'session'
  | 'location'
  | 'memory'
  | 'environment'
  | 'activity'
  | 'tokens';

export interface Row {
  id: RowId;
  cells: CellId[];
}

export const DEFAULT_ROWS: Map<RowId, Row> = new Map([
  ['session',     { id: 'session',     cells: ['model', 'duration', 'cost', 'context'] }],
  ['location',    { id: 'location',    cells: ['directory', 'git', 'worktree'] }],
  ['memory',      { id: 'memory',      cells: ['memory'] }],
  ['environment', { id: 'environment', cells: ['environment'] }],
  ['activity',    { id: 'activity',    cells: ['tools', 'agents', 'todos'] }],
  ['tokens',      { id: 'tokens',      cells: ['session-tokens', 'custom', 'usage'] }],
]);

export function renderRow(row: Row, ctx: RenderContext): string | null {
  const parts = row.cells
    .map(id => renderCell(id, ctx))
    .filter((s): s is string => s !== null);
  return parts.length === 0 ? null : parts.join(' │ ');
}
