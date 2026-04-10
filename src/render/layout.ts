import type { RowId } from './row.js';

export type Layout = RowId[];

export const DEFAULT_LAYOUT: Layout = [
  'session',
  'memory',
  'location',
  'environment',
  'activity',
  'tokens',
];
