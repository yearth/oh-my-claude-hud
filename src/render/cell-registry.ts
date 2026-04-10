import type { RenderContext } from '../types.js';

export type CellId =
  | 'model'
  | 'duration'
  | 'cost'
  | 'context'
  | 'directory'
  | 'git'
  | 'worktree'
  | 'memory'
  | 'environment'
  | 'tools'
  | 'agents'
  | 'todos'
  | 'session-tokens'
  | 'custom'
  | 'usage';

export interface Cell {
  id: CellId;
  render(ctx: RenderContext): string | null;
}

export const CELL_REGISTRY = new Map<CellId, Cell>();

export function registerCell(cell: Cell): void {
  CELL_REGISTRY.set(cell.id, cell);
}
