#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TEMPLATE="infra/wrangler.prod.template.toml"
if [[ ! -f "$TEMPLATE" ]]; then
  echo "$TEMPLATE not found." >&2
  exit 1
fi

TEMP_CONFIG="$(mktemp "$ROOT_DIR/apps/worker/wrangler-prod-XXXXXX.toml")"
trap 'rm -f "$TEMP_CONFIG"' EXIT
if command -v envsubst >/dev/null 2>&1; then
  envsubst < "$TEMPLATE" > "$TEMP_CONFIG"
else
  node - "$TEMPLATE" "$TEMP_CONFIG" <<'EOF'
const fs = require('fs');
const templatePath = process.argv[2];
const outputPath = process.argv[3];
let text = fs.readFileSync(templatePath, 'utf8');
text = text.replace(/\$\{([A-Z0-9_]+)\}/g, (match, name) => {
  if (!(name in process.env)) {
    console.error(`Missing environment variable ${name}`);
    process.exit(1);
  }
  return process.env[name];
});
fs.writeFileSync(outputPath, text);
EOF
fi

echo "Building packages..."
pnpm build

echo "Deploying worker with generated prod config ..."
pnpm --filter @gmgncard/worker exec wrangler deploy --config "$TEMP_CONFIG" "$@"
