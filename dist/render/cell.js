import { CELL_REGISTRY } from './cell-registry.js';
export { registerCell } from './cell-registry.js';
export function renderCell(id, ctx) {
    const cell = CELL_REGISTRY.get(id);
    if (!cell)
        return null;
    return cell.render(ctx);
}
// Import all cells to trigger registration
import './cells/agent-identity.js';
import './cells/model.js';
import './cells/duration.js';
import './cells/cost.js';
import './cells/context.js';
import './cells/directory.js';
import './cells/git.js';
import './cells/worktree.js';
import './cells/memory.js';
import './cells/environment.js';
import './cells/tools.js';
import './cells/agents.js';
import './cells/todos.js';
import './cells/session-tokens.js';
import './cells/custom.js';
import './cells/usage.js';
//# sourceMappingURL=cell.js.map