#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/yearth/oh-my-claude-hud.git"
INSTALL_DIR="$HOME/.claude/oh-my-claude-hud"
WRAPPER="$HOME/.claude/claude-hud-wrapper.sh"
SETTINGS="$HOME/.claude/settings.json"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
bold()    { echo -e "${BOLD}$*${RESET}"; }

# ── Detect Node ──────────────────────────────────────────────────────────────
detect_node() {
  # 1. Volta
  if command -v volta &>/dev/null; then
    local p
    p=$(volta which node 2>/dev/null) && echo "$p" && return
  fi

  # 2. nvm
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "$HOME/.nvm/nvm.sh" --no-use 2>/dev/null
    local p
    p=$(nvm which current 2>/dev/null) && [[ -x "$p" ]] && echo "$p" && return
  fi

  # 3. PATH
  if command -v node &>/dev/null; then
    command -v node && return
  fi

  return 1
}

# ── Check deps ───────────────────────────────────────────────────────────────
check_deps() {
  local missing=()
  command -v git &>/dev/null  || missing+=("git")
  command -v npm &>/dev/null  || missing+=("npm")
  if [[ ${#missing[@]} -gt 0 ]]; then
    error "Missing required tools: ${missing[*]}"
    exit 1
  fi

  NODE_BIN=$(detect_node || true)
  if [[ -z "$NODE_BIN" ]]; then
    error "Node.js not found. Install it via https://nodejs.org or your version manager."
    exit 1
  fi
  success "Node: $NODE_BIN ($("$NODE_BIN" --version))"
}

# ── Clone or update ──────────────────────────────────────────────────────────
install_repo() {
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    warn "Already installed at $INSTALL_DIR"
    echo -n "  Update to latest version? [y/N] "
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      info "Updating..."
      git -C "$INSTALL_DIR" pull --ff-only
    else
      info "Skipping update."
    fi
  else
    info "Cloning into $INSTALL_DIR ..."
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  fi
}

# ── Build ────────────────────────────────────────────────────────────────────
build_repo() {
  info "Installing dependencies and building..."
  npm --prefix "$INSTALL_DIR" ci --silent
  npm --prefix "$INSTALL_DIR" run build --silent
  success "Build complete."
}

# ── Write wrapper ────────────────────────────────────────────────────────────
write_wrapper() {
  cat > "$WRAPPER" << EOF
#!/usr/bin/env bash
NODE="${NODE_BIN}"
HUD_SCRIPT="${INSTALL_DIR}/dist/index.js"
COLUMNS=\$(tput cols 2>/dev/null || echo 200)
export COLUMNS
export CLAUDE_PID=\$PPID
"\$NODE" "\$HUD_SCRIPT"
EOF
  chmod +x "$WRAPPER"
  success "Wrapper written: $WRAPPER"
}

# ── Patch settings.json ──────────────────────────────────────────────────────
patch_settings() {
  if [[ ! -f "$SETTINGS" ]]; then
    echo '{}' > "$SETTINGS"
  fi

  # Check if already configured
  if grep -q "claude-hud-wrapper" "$SETTINGS" 2>/dev/null; then
    success "settings.json already points to wrapper — no change needed."
    return
  fi

  if command -v jq &>/dev/null; then
    local tmp
    tmp=$(mktemp)
    jq --arg cmd "$WRAPPER" '. + {statusLine: {command: $cmd, type: "command"}}' "$SETTINGS" > "$tmp"
    mv "$tmp" "$SETTINGS"
    success "settings.json updated."
  else
    warn "jq not found — please add the following to $SETTINGS manually:"
    echo ""
    echo '  "statusLine": {'
    echo "    \"command\": \"$WRAPPER\","
    echo '    "type": "command"'
    echo '  }'
    echo ""
  fi
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  echo ""
  bold "  Oh My Claude HUD — Installer"
  echo ""

  check_deps
  install_repo
  build_repo
  write_wrapper
  patch_settings

  echo ""
  success "Installation complete!"
  echo ""
  info "Reload Claude Code to activate:"
  echo "    /reload-plugins"
  echo ""
}

main "$@"
