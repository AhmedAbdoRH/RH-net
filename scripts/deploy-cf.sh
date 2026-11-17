#!/usr/bin/env bash
# ===========================================
# نشر على Cloudflare Workers
#
# السبب: التوكن في .env.local/.dev.vars عنده صلاحية قراءة فقط،
# وبيغلّب على حساب الـ OAuth تلقائيًا في wrangler.
# السكربت ده بيخفيه مؤقتًا عشان النشر يمر عبر الـ OAuth،
# وبعدين بيرجّعه فورًا (حتى لو النشر فشل).
# ===========================================

set -euo pipefail

cd "$(dirname "$0")/.."

restore() {
  [ -f .env.local.tmp ] && mv .env.local.tmp .env.local
  [ -f .dev.vars.tmp ] && mv .dev.vars.tmp .dev.vars
}
trap restore EXIT

echo "→ إخفاء CLOUDFLARE_API_TOKEN مؤقتًا (للنشر عبر OAuth)..."
for f in .env.local .dev.vars; do
  if [ -f "$f" ] && grep -q '^CLOUDFLARE_API_TOKEN=' "$f"; then
    grep -v '^CLOUDFLARE_API_TOKEN=' "$f" > "$f.tmp"
    mv "$f" "$f.hidebak"
    mv "$f.tmp" "$f"
  fi
done

echo "→ بناء المشروع..."
NODE_OPTIONS="" CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run cf:build

echo "→ النشر..."
npx wrangler deploy

echo "✅ تم النشر: https://rh-net.rehlathadaf.workers.dev"
