# Development

## Commands

```bash
npm ci                  # Install dependencies
npm run build           # Compile TypeScript → dist/
npm run dev             # Watch mode
npm test                # Build + run all tests
npm run test:coverage   # Build + run tests with c8 coverage report
```

## Testing

Uses Node.js built-in `node --test`. Test files are in `tests/` and run against compiled `dist/`.

```bash
node --test tests/config.test.js   # Run a single test file
```

## Manual Smoke Test

```bash
echo '{"model":{"display_name":"claude-opus-4-6"},"context_window":{"current_usage":{"input_tokens":45000},"context_window_size":200000},"transcript_path":"/tmp/test.jsonl","cwd":"'$(pwd)'"}' | node dist/index.js
```

## Adding a New Cell

1. Create `src/render/cells/<name>.ts` — call `registerCell({ id, render })`
2. Add the new `CellId` to the union type in `src/render/cell-registry.ts`
3. Add it to `VALID_CELL_IDS` in the same file
4. Import it in `src/render/cell.ts`
5. Add it to the appropriate row in `DEFAULT_ROWS` (`src/render/row.ts`), or leave it for users to place via `rows` config

## Context Thresholds

| Usage | Color |
|-------|-------|
| < 70% | Green |
| 70–85% | Yellow |
| > 85% | Red + token breakdown |

## Local Setup (wrapper-based install)

The statusline command is configured in `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "command": "/path/to/claude-hud-wrapper.sh"
  }
}
```

The wrapper script sets `COLUMNS` and calls `node dist/index.js` directly from the repo.
