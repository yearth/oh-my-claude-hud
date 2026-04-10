import type { RenderContext } from '../../types.js';
import { isLimitReached } from '../../types.js';
import { getProviderLabel } from '../../stdin.js';
import { critical, label, getQuotaColor, quotaBar, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell-registry.js';

function formatPercent(percent: number | null, colors?: RenderContext['config']['colors']): string {
  if (percent === null) return label('--', colors);
  return `${getQuotaColor(percent, colors)}${percent}%${RESET}`;
}

function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return '';
  const diffMs = resetAt.getTime() - Date.now();
  if (diffMs <= 0) return '';
  const diffMins = Math.ceil(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatWindowPart({ windowLabel, percent, resetAt, colors, usageBarEnabled, barWidth, forceLabel = false }: {
  windowLabel: string; percent: number | null; resetAt: Date | null;
  colors?: RenderContext['config']['colors']; usageBarEnabled: boolean; barWidth: number; forceLabel?: boolean;
}): string {
  const usageDisplay = formatPercent(percent, colors);
  const reset = formatResetTime(resetAt);
  const styledLabel = label(windowLabel, colors);
  if (usageBarEnabled) {
    const body = reset
      ? `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay} (${t('format.resetsIn')} ${reset})`
      : `${quotaBar(percent ?? 0, barWidth, colors)} ${usageDisplay}`;
    return forceLabel ? `${styledLabel} ${body}` : body;
  }
  return reset ? `${styledLabel} ${usageDisplay} (${t('format.resetsIn')} ${reset})` : `${styledLabel} ${usageDisplay}`;
}

registerCell({
  id: 'usage',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    const colors = ctx.config?.colors;
    if (display?.showUsage === false) return null;
    if (!ctx.usageData) return null;
    if (getProviderLabel(ctx.stdin)) return null;

    const usageLabel = label(t('label.usage'), colors);
    const barWidth = getAdaptiveBarWidth();

    if (isLimitReached(ctx.usageData)) {
      const resetTime = ctx.usageData.fiveHour === 100
        ? formatResetTime(ctx.usageData.fiveHourResetAt)
        : formatResetTime(ctx.usageData.sevenDayResetAt);
      return `${usageLabel} ${critical(`⚠ ${t('status.limitReached')}${resetTime ? ` (${t('format.resets')} ${resetTime})` : ''}`, colors)}`;
    }

    const threshold = display?.usageThreshold ?? 0;
    const fiveHour = ctx.usageData.fiveHour;
    const sevenDay = ctx.usageData.sevenDay;
    const effectiveUsage = Math.max(fiveHour ?? 0, sevenDay ?? 0);
    if (effectiveUsage < threshold) return null;

    const usageBarEnabled = display?.usageBarEnabled ?? true;
    const sevenDayThreshold = display?.sevenDayThreshold ?? 80;

    if (fiveHour === null && sevenDay !== null) {
      return `${usageLabel} ${formatWindowPart({ windowLabel: t('label.weekly'), percent: sevenDay, resetAt: ctx.usageData.sevenDayResetAt, colors, usageBarEnabled, barWidth, forceLabel: true })}`;
    }

    const fiveHourPart = formatWindowPart({ windowLabel: '5h', percent: fiveHour, resetAt: ctx.usageData.fiveHourResetAt, colors, usageBarEnabled, barWidth });

    if (sevenDay !== null && sevenDay >= sevenDayThreshold) {
      const sevenDayPart = formatWindowPart({ windowLabel: t('label.weekly'), percent: sevenDay, resetAt: ctx.usageData.sevenDayResetAt, colors, usageBarEnabled, barWidth, forceLabel: true });
      return `${usageLabel} ${fiveHourPart} | ${sevenDayPart}`;
    }

    return `${usageLabel} ${fiveHourPart}`;
  },
});
