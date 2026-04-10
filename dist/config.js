import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getHudPluginDir } from './claude-config-dir.js';
import { DEFAULT_LAYOUT } from './render/layout.js';
export const DEFAULT_CONFIG = {
    language: 'en',
    showSeparators: false,
    pathLevels: 1,
    layout: [...DEFAULT_LAYOUT],
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
export function getConfigPath() {
    const homeDir = os.homedir();
    return path.join(getHudPluginDir(homeDir), 'config.json');
}
function validatePathLevels(value) {
    return value === 1 || value === 2 || value === 3;
}
function validateAutocompactBuffer(value) {
    return value === 'enabled' || value === 'disabled';
}
function validateContextValue(value) {
    return value === 'percent' || value === 'tokens' || value === 'remaining' || value === 'both';
}
function validateLanguage(value) {
    return value === 'en' || value === 'zh';
}
function validateModelFormat(value) {
    return value === 'full' || value === 'compact' || value === 'short';
}
function validateColorName(value) {
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
function validateColorValue(value) {
    if (validateColorName(value))
        return true;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255)
        return true;
    if (typeof value === 'string' && HEX_COLOR_PATTERN.test(value))
        return true;
    return false;
}
const VALID_ROW_IDS = new Set(['session', 'location', 'memory', 'environment', 'activity', 'tokens']);
function validateThreshold(value, max = 100) {
    if (typeof value !== 'number')
        return 0;
    return Math.max(0, Math.min(max, value));
}
function validateCountThreshold(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.floor(value));
}
export function mergeConfig(userConfig) {
    const language = validateLanguage(userConfig.language)
        ? userConfig.language
        : DEFAULT_CONFIG.language;
    const showSeparators = typeof userConfig.showSeparators === 'boolean'
        ? userConfig.showSeparators
        : DEFAULT_CONFIG.showSeparators;
    const pathLevels = validatePathLevels(userConfig.pathLevels)
        ? userConfig.pathLevels
        : DEFAULT_CONFIG.pathLevels;
    const rawLayout = Array.isArray(userConfig.layout)
        ? userConfig.layout.filter((id) => VALID_ROW_IDS.has(id))
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
    return { language, showSeparators, pathLevels, layout, gitStatus, display, colors };
}
export async function loadConfig() {
    const configPath = getConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            return mergeConfig({});
        }
        const content = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        return mergeConfig(userConfig);
    }
    catch {
        return mergeConfig({});
    }
}
//# sourceMappingURL=config.js.map