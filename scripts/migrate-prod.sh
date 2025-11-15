#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/infra/wrangler.prod.template.toml"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Unable to find $TEMPLATE" >&2
  exit 1
fi

: "${D1_DATABASE:?Set D1_DATABASE to the production D1 database name (as shown in Cloudflare Dashboard)}"

APPLY_SEED=true
RESET_SCHEMA=false
for arg in "$@"; do
  case "$arg" in
    --skip-seed)
      APPLY_SEED=false
      shift
      ;;
    --with-seed)
      APPLY_SEED=true
      shift
      ;;
    --reset)
      RESET_SCHEMA=true
      shift
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

WRANGLER_BIN="${WRANGLER_BIN:-wrangler}"

render_template() {
  local output="$1"
  node - "$TEMPLATE" "$output" <<'EOF'
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
}

TEMP_CONFIG="$(mktemp /tmp/gmgncard.wrangler.prod.XXXXXX)"
trap 'rm -f "$TEMP_CONFIG"' EXIT

render_template "$TEMP_CONFIG"

MIGRATIONS=(
  "packages/db/migrations/0001_init.sql"
  "packages/db/migrations/0002_auth.sql"
  "packages/db/migrations/0003_qr_access.sql"
  "packages/db/migrations/0004_profile_extended.sql"
  "packages/db/migrations/0005_featured_users.sql"
  "packages/db/migrations/0006_profile_positions.sql"
)

run_sql() {
  local file="$1"
  local sql
  sql="$(
    SQL_FILE="$ROOT_DIR/$file" node <<'EOF'
const fs = require('fs');
const path = process.env.SQL_FILE;
if (!path) {
  console.error('SQL_FILE env variable is missing');
  process.exit(1);
}
const content = fs.readFileSync(path, 'utf8');
const cleaned = content
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .trim();
process.stdout.write(cleaned);
EOF
  )"
  if [[ -z "$sql" ]]; then
    echo "Skipping empty SQL for $file"
    return
  fi
  "$WRANGLER_BIN" d1 execute "$D1_DATABASE" \
    --config "$TEMP_CONFIG" \
    --remote \
    --command "$sql"
}

reset_schema() {
  local drop_sql=$'PRAGMA foreign_keys = OFF;\n'
  drop_sql+=$'DROP TABLE IF EXISTS visits;\n'
  drop_sql+=$'DROP TABLE IF EXISTS reports;\n'
  drop_sql+=$'DROP TABLE IF EXISTS links;\n'
  drop_sql+=$'DROP TABLE IF EXISTS buttons;\n'
  drop_sql+=$'DROP TABLE IF EXISTS pages;\n'
  drop_sql+=$'DROP TABLE IF EXISTS social_accounts;\n'
  drop_sql+=$'DROP TABLE IF EXISTS user_profiles;\n'
  drop_sql+=$'DROP TABLE IF EXISTS link_types;\n'
  drop_sql+=$'DROP TABLE IF EXISTS users;\n'
  drop_sql+=$'DROP TABLE IF EXISTS settings;\n'
  "$WRANGLER_BIN" d1 execute "$D1_DATABASE" \
    --config "$TEMP_CONFIG" \
    --remote \
    --command "$drop_sql"
}

if $RESET_SCHEMA; then
  echo ">>> Resetting production schema (dropping existing tables)"
  reset_schema
fi

for migration in "${MIGRATIONS[@]}"; do
  echo ">>> Applying $migration"
  run_sql "$migration"
done

if $APPLY_SEED; then
  echo ">>> Applying seed packages/db/seed/dev_seed.sql"
  run_sql "packages/db/seed/dev_seed.sql"
else
  echo "Skipping seed data."
fi

echo "All production migrations applied successfully."
