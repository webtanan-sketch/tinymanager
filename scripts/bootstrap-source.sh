#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-$HOME/TinyManagerWorkspace}"
CORE="$WORKSPACE/tinymanager"

command -v git >/dev/null 2>&1 || { echo 'Git is required.' >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo 'Node.js LTS is required.' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'npm is required.' >&2; exit 1; }

mkdir -p "$WORKSPACE"

if [[ ! -d "$CORE/.git" ]]; then
  if [[ -d "$CORE" && -n "$(ls -A "$CORE" 2>/dev/null || true)" ]]; then
    echo "$CORE exists but is not a Git repository." >&2
    exit 1
  fi
  git clone https://github.com/webtanan-sketch/tinymanager.git "$CORE"
else
  if [[ -n "$(git -C "$CORE" status --porcelain)" ]]; then
    echo 'TinyManager Core has local changes. Commit or stash them before automatic update.' >&2
    exit 1
  fi
  git -C "$CORE" checkout main
  git -C "$CORE" pull --ff-only origin main
fi

cd "$CORE"
node scripts/verify-repositories.mjs
node scripts/sync-repositories.mjs "--workspace=$WORKSPACE" --install-core

echo
echo "TinyManager source workspace is ready: $WORKSPACE"
echo "Run: cd '$CORE' && npm run dev"
