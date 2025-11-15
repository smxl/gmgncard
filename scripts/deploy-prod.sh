#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f infra/wrangler.prod.toml ]]; then
  echo "infra/wrangler.prod.toml not found." >&2
  exit 1
fi

echo "Building packages..."
pnpm build

echo "Deploying worker with wrangler.prod.toml ..."
pnpm --filter @gmgncard/worker exec wrangler deploy --config infra/wrangler.prod.toml "$@"
