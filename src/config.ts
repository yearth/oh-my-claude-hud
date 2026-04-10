import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getHudPluginDir } from './claude-config-dir.js';
import type { Language } from './i18n/types.js';
import type { RowId } from './render/row.js';
import type { CellId } from './render/cell-registry.js';
import { VALID_CELL_IDS } from './render/cell-registry.js';
import { DEFAULT_LAYOUT } from './render/layout.js';
import { DEFAULT_ROWS } from './render/row.js';

export type AutocompactBufferMode = 'enabled' | 'disabled';
export type ContextValueMode = 'percent' | 'tokens' | 'remaining' | 'both';

/**
 * Controls how the model name is displayed in the HUD badge.
 *
 *   full:    Show the raw display name as-is (e.g. "Opus 4.6 (1M context)")
 *   compact: Strip redundant context-window suffix (e.g. "Opus 4.6")
 *   short:   Strip context suffix AND "Claude " prefix (e.g. "Opus 4.6")
 */
export type ModelFormatMode = 'full' | 'compact' | 'short';
export type HudColorName =
  | 'dim'
  | 'red'
  | 'green'
  | 'yellow'
  | 'magenta'
  | 'cyan'
  | 'brightBlue'
  | 'brightMagenta';

/** A color value: named preset, 256-color index (0-255), or hex string (#rrggbb). */
export type HudColorValue = HudColorName | number | string;

export interface HudColorOverrides {
  context: HudColorValue;
  usage: HudColorValue;
  warning: HudColorValue;
  usageWarning: HudColorValue;
  critical: HudColorValue;
  model: HudColorValue;
  project: HudColorValue;
  git: HudColorValue;
  gitBranch: HudColorValue;
  label: HudColorValue;
  custom: HudColorValue;
}

export interface HudConfig {
  language: Language;
  showSeparators: boolean;
  pathLevels: 1 | 2 | 3;
  layout: RowId[];
  rows: Record<RowId, CellId[]>;
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
    showWorktree: boolean;
    pushWarningThreshold: number;
    pushCriticalThreshold: number;
  };
  display: {
    showModel: boolean;
    showProject: boolean;
    showContextBar: boolean;
    contextValue: ContextValueMode;
    showConfigCounts: boolean;
    showCost: boolean;
    showDuration: boolean;
    showSpeed: boolean;
    showTokenBreakdown: boolean;
    showUsage: boolean;
    usageBarEnabled: boolean;
    showTools: boolean;
    showAgents: boolean;
    showTodos: boolean;
    showSessionName: boolean;
    showClaudeCodeVersion: boolean;
    showMemoryUsage: boolean;
    showSessionTokens: boolean;
    showOutputStyle: boolean;
    autocompactBuffer: AutocompactBufferMode;
    usageThreshold: number;
    sevenDayThreshold: number;
    environmentThreshold: number;
    modelFormat: ModelFormatMode;
    modelOverride: string;
    customLine: string;
  };
  colors: HudColorOverrides;
}

function defaultRows(): Record<RowId, CellId[]> {
  const result = {} as Record<RowId, CellId[]>;
  for (const [id, row] of DEFAULT_ROWS) {
    result[id] = [...row.cells];
  }
  return result;
}

export const DEFAULT_CONFIG: HudConfig = {
  language: 'en',
  showSeparators: false,
  pathLevels: 1,
  layout: [...DEFAULT_LAYOUT],
  rows: defaultRows(),
  gitStatus: {
    enabled: true,
    showDirty: true,
    showAheadBehind: false,
    showFileStats: false,
    showWorktree: true,
    pushWarningThreshold: 0,
    pushCriticalThreshold: 0,
  },
  display: {
    showModel: true,
    showProject: true,
    showContextBar: true,
    contextValue: 'percent',
    showConfigCounts: false,
    showCost: false,
    showDuration: false,
    showSpeed: false,
    showTokenBreakdown: true,
    showUsage: true,
    usageBarEnabled: true,
    showTools: false,
    showAgents: false,
    showTodos: false,
    showSessionName: false,
    showClaudeCodeVersion: false,
    showMemoryUsage: false,
    showSessionTokens: false,
    showOutputStyle: false,
    autocompactBuffer: 'enabled',
    usageThreshold: 0,
    sevenDayThreshold: 80,
    environmentThreshold: 0,
    modelFormat: 'full',
    modelOverride: '',
    customLine: '',
  },
  colors: {
    context: 'green',
    usage: 'brightBlue',
    warning: 'yellow',
    usageWarning: 'brightMagenta',
    critical: 'red',
    model: 'cyan',
    project: 'yellow',
    git: 'magenta',
    gitBranch: 'cyan',
    label: 'dim',
    custom: 208,
  },
};

export function getConfigPath(): string {
  const homeDir = os.homedir();
  return path.join(getHudPluginDir(homeDir), 'config.json');
}

function validatePathLevels(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function validateAutocompactBuffer(value: unknown): value is AutocompactBufferMode {
  return value === 'enabled' || value === 'disabled';
}

function validateContextValue(value: unknown): value is ContextValueMode {
  return value === 'percent' || value === 'tokens' || value === 'remaining' || value === 'both';
}

function validateLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'zh';
}

function validateModelFormat(value: unknown): value is ModelFormatMode {
  return value === 'full' || value === 'compact' || value === 'short';
}

function validateColorName(value: unknown): value is HudColorName {
  return value === 'dim'
    || value === 'red'
    || value === 'green'
    || value === 'yellow'
    || value === 'magenta'
    || value === 'cyan'
    || value === 'brightBlue'
    || value === 'brightMagenta';
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function validateColorValue(value: unknown): value is HudColorValue {
  if (validateColorName(value)) return true;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255) return true;
  if (typeof value === 'string' && HEX_COLOR_PATTERN.test(value)) return true;
  return false;
}

const VALID_ROW_IDS = new Set<RowId>(DEFAULT_ROWS.keys());

function validateThreshold(value: unknown, max = 100): number {
  if (typeof value !== 'number') return 0;
  return Math.max(0, Math.min(max, value));
}

function validateCountThreshold(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

export function mergeConfig(userConfig: Partial<HudConfig>): HudConfig {
  const language = validateLanguage(userConfig.language)
    ? userConfig.language
    : DEFAULT_CONFIG.language;

  const showSeparators = typeof userConfig.showSeparators === 'boolean'
    ? userConfig.showSeparators
    : DEFAULT_CONFIG.showSeparators;

  const pathLevels = validatePathLevels(userConfig.pathLevels)
    ? userConfig.pathLevels
    : DEFAULT_CONFIG.pathLevels;

  const rawLayout: RowId[] = Array.isArray(userConfig.layout)
    ? (userConfig.layout as string[]).filter((id): id is RowId => VALID_ROW_IDS.has(id as RowId))
    : [...DEFAULT_LAYOUT];

  const layout = rawLayout.length > 0 ? rawLayout : [...DEFAULT_LAYOUT];

  const gitStatus = {
    enabled: typeof userConfig.gitStatus?.enabled === 'boolean'
      ? userConfig.gitStatus.enabled
      : DEFAULT_CONFIG.gitStatus.enabled,
    showDirty: typeof userConfig.gitStatus?.showDirty === 'boolean'
      ? userConfig.gitStatus.showDirty
      : DEFAULT_CONFIG.gitStatus.showDirty,
    showAheadBehind: typeof userConfig.gitStatus?.showAheadBehind === 'boolean'
      ? userConfig.gitStatus.showAheadBehind
      : DEFAULT_CONFIG.gitStatus.showAheadBehind,
    showFileStats: typeof userConfig.gitStatus?.showFileStats === 'boolean'
      ? userConfig.gitStatus.showFileStats
      : DEFAULT_CONFIG.gitStatus.showFileStats,
    pushWarningThreshold: validateCountThreshold(userConfig.gitStatus?.pushWarningThreshold),
    pushCriticalThreshold: validateCountThreshold(userConfig.gitStatus?.pushCriticalThreshold),
    showWorktree: typeof userConfig.gitStatus?.showWorktree === 'boolean'
      ? userConfig.gitStatus.showWorktree
      : DEFAULT_CONFIG.gitStatus.showWorktree,
  };

  const display = {
    showModel: typeof userConfig.display?.showModel === 'boolean'
      ? userConfig.display.showModel
      : DEFAULT_CONFIG.display.showModel,
    showProject: typeof userConfig.display?.showProject === 'boolean'
      ? userConfig.display.showProject
      : DEFAULT_CONFIG.display.showProject,
    showContextBar: typeof userConfig.display?.showContextBar === 'boolean'
      ? userConfig.display.showContextBar
      : DEFAULT_CONFIG.display.showContextBar,
    contextValue: validateContextValue(userConfig.display?.contextValue)
      ? userConfig.display.contextValue
      : DEFAULT_CONFIG.display.contextValue,
    showConfigCounts: typeof userConfig.display?.showConfigCounts === 'boolean'
      ? userConfig.display.showConfigCounts
      : DEFAULT_CONFIG.display.showConfigCounts,
    showCost: typeof userConfig.display?.showCost === 'boolean'
      ? userConfig.display.showCost
      : DEFAULT_CONFIG.display.showCost,
    showDuration: typeof userConfig.display?.showDuration === 'boolean'
      ? userConfig.display.showDuration
      : DEFAULT_CONFIG.display.showDuration,
    showSpeed: typeof userConfig.display?.showSpeed === 'boolean'
      ? userConfig.display.showSpeed
      : DEFAULT_CONFIG.display.showSpeed,
    showTokenBreakdown: typeof userConfig.display?.showTokenBreakdown === 'boolean'
      ? userConfig.display.showTokenBreakdown
      : DEFAULT_CONFIG.display.showTokenBreakdown,
    showUsage: typeof userConfig.display?.showUsage === 'boolean'
      ? userConfig.display.showUsage
      : DEFAULT_CONFIG.display.showUsage,
    usageBarEnabled: typeof userConfig.display?.usageBarEnabled === 'boolean'
      ? userConfig.display.usageBarEnabled
      : DEFAULT_CONFIG.display.usageBarEnabled,
    showTools: typeof userConfig.display?.showTools === 'boolean'
      ? userConfig.display.showTools
      : DEFAULT_CONFIG.display.showTools,
    showAgents: typeof userConfig.display?.showAgents === 'boolean'
      ? userConfig.display.showAgents
      : DEFAULT_CONFIG.display.showAgents,
    showTodos: typeof userConfig.display?.showTodos === 'boolean'
      ? userConfig.display.showTodos
      : DEFAULT_CONFIG.display.showTodos,
    showSessionName: typeof userConfig.display?.showSessionName === 'boolean'
      ? userConfig.display.showSessionName
      : DEFAULT_CONFIG.display.showSessionName,
    showClaudeCodeVersion: typeof userConfig.display?.showClaudeCodeVersion === 'boolean'
      ? userConfig.display.showClaudeCodeVersion
      : DEFAULT_CONFIG.display.showClaudeCodeVersion,
    showMemoryUsage: typeof userConfig.display?.showMemoryUsage === 'boolean'
      ? userConfig.display.showMemoryUsage
      : DEFAULT_CONFIG.display.showMemoryUsage,
    showSessionTokens: typeof userConfig.display?.showSessionTokens === 'boolean'
      ? userConfig.display.showSessionTokens
      : DEFAULT_CONFIG.display.showSessionTokens,
    showOutputStyle: typeof userConfig.display?.showOutputStyle === 'boolean'
      ? userConfig.display.showOutputStyle
      : DEFAULT_CONFIG.display.showOutputStyle,
    autocompactBuffer: validateAutocompactBuffer(userConfig.display?.autocompactBuffer)
      ? userConfig.display.autocompactBuffer
      : DEFAULT_CONFIG.display.autocompactBuffer,
    usageThreshold: validateThreshold(userConfig.display?.usageThreshold, 100),
    sevenDayThreshold: validateThreshold(userConfig.display?.sevenDayThreshold, 100),
    environmentThreshold: validateThreshold(userConfig.display?.environmentThreshold, 100),
    modelFormat: validateModelFormat(userConfig.display?.modelFormat)
      ? userConfig.display.modelFormat
      : DEFAULT_CONFIG.display.modelFormat,
    modelOverride: typeof userConfig.display?.modelOverride === 'string'
      ? userConfig.display.modelOverride.slice(0, 80)
      : DEFAULT_CONFIG.display.modelOverride,
    customLine: typeof userConfig.display?.customLine === 'string'
      ? userConfig.display.customLine.slice(0, 80)
      : DEFAULT_CONFIG.display.customLine,
  };

  const colors = {
    context: validateColorValue(userConfig.colors?.context)
      ? userConfig.colors.context
      : DEFAULT_CONFIG.colors.context,
    usage: validateColorValue(userConfig.colors?.usage)
      ? userConfig.colors.usage
      : DEFAULT_CONFIG.colors.usage,
    warning: validateColorValue(userConfig.colors?.warning)
      ? userConfig.colors.warning
      : DEFAULT_CONFIG.colors.warning,
    usageWarning: validateColorValue(userConfig.colors?.usageWarning)
      ? userConfig.colors.usageWarning
      : DEFAULT_CONFIG.colors.usageWarning,
    critical: validateColorValue(userConfig.colors?.critical)
      ? userConfig.colors.critical
      : DEFAULT_CONFIG.colors.critical,
    model: validateColorValue(userConfig.colors?.model)
      ? userConfig.colors.model
      : DEFAULT_CONFIG.colors.model,
    project: validateColorValue(userConfig.colors?.project)
      ? userConfig.colors.project
      : DEFAULT_CONFIG.colors.project,
    git: validateColorValue(userConfig.colors?.git)
      ? userConfig.colors.git
      : DEFAULT_CONFIG.colors.git,
    gitBranch: validateColorValue(userConfig.colors?.gitBranch)
      ? userConfig.colors.gitBranch
      : DEFAULT_CONFIG.colors.gitBranch,
    label: validateColorValue(userConfig.colors?.label)
      ? userConfig.colors.label
      : DEFAULT_CONFIG.colors.label,
    custom: validateColorValue(userConfig.colors?.custom)
      ? userConfig.colors.custom
      : DEFAULT_CONFIG.colors.custom,
  };

  const rows = defaultRows();
  if (userConfig.rows) {
    for (const rowId of VALID_ROW_IDS) {
      const userCells = userConfig.rows[rowId];
      if (Array.isArray(userCells)) {
        rows[rowId] = userCells.filter((id): id is CellId => VALID_CELL_IDS.has(id as CellId));
      }
    }
  }

  return { language, showSeparators, pathLevels, layout, rows, gitStatus, display, colors };
}

export async function loadConfig(): Promise<HudConfig> {
  const configPath = getConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return mergeConfig({});
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content) as Partial<HudConfig>;
    return mergeConfig(userConfig);
  } catch {
    return mergeConfig({});
  }
}
