import type { RenderContext } from '../../types.js';
import { yellow, green, label } from '../colors.js';
import { t } from '../../i18n/index.js';
import { registerCell } from '../cell-registry.js';

registerCell({
  id: 'todos',
  render(ctx: RenderContext): string | null {
    const display = ctx.config?.display;
    if (display?.showTodos === false) return null;
    const { todos } = ctx.transcript;
    if (!todos || todos.length === 0) return null;
    const colors = ctx.config?.colors;
    const inProgress = todos.find(t => t.status === 'in_progress');
    const completed = todos.filter(t => t.status === 'completed').length;
    const total = todos.length;
    if (!inProgress) {
      if (completed === total && total > 0) {
        return `${green('✓')} ${t('status.allTodosComplete')} ${label(`(${completed}/${total})`, colors)}`;
      }
      return null;
    }
    const content = inProgress.content.length > 50 ? inProgress.content.slice(0, 47) + '...' : inProgress.content;
    return `${yellow('▸')} ${content} ${label(`(${completed}/${total})`, colors)}`;
  },
});
