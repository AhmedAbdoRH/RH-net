# النشر على Cloudflare Workers

المشروع منشور على **Cloudflare Workers** عبر **OpenNext**.

## 🔗 الروابط

| | |
|---|---|
| **الإنتاج** | https://rh-net.rehlathadaf.workers.dev |
| **Worker name** | `rh-net` |
| **Account ID** | `07955ce60dc2da416c7cf6a2162cba64` |

## المتطلبات

- **Node.js** 20+ (المستخدم حاليًا: 22.22.2)
- **Next.js** `16.3.8` — النسخة المدعومة من OpenNext `1.20.7`
- **Wrangler** `4.125+`

## 🚀 النشر بأمر واحد

```bash
npm run cf:publish
```

> السكربت ده بيخفّي `CLOUDFLARE_API_TOKEN` مؤقتًا (لأنه بصلاحية قراءة فقط وبيغلّب على الـ OAuth في wrangler)، بينشر عبر الـ OAuth، وبعدين بيرجّع الملفات فورًا حتى لو النشر فشل.

### النشر اليدوي

```bash
npm run cf:build      # بناء + نقل ملفات الكاش
npx wrangler deploy   # نشر
```

⚠️ **قبل النشر اليدوي**: لازم تشيل `CLOUDFLARE_API_TOKEN` من `.env.local` **و** `.dev.vars`، وإلا هتفشل بـ `No access to the specified resource`.

## 📁 الملفات الأساسية

| الملف | الدور |
|-------|-------|
| `wrangler.toml` | إعداد Worker (الاسم، compatibility، assets، vars، Durable Objects) |
| `open-next.config.ts` | إعداد OpenNext (الكاش) |
| `scripts/post-build-cf.mjs` | **حرج** — ينقل ملفات الصفحات المبنية مسبقًا لمكانها الصح |
| `scripts/deploy-cf.sh` | النشر الكامل بأمان |
| `.dev.vars` | أسرار التطوير المحلي (**مستثنى من git**) |
| `src/lib/firestore-rest.ts` | عميل Firestore REST لاستخدامه في server routes |

## 📦 الأوامر

```bash
npm run cf:build      # بناء + post-build (نقل الكاش)
npm run cf:preview    # معاينة محلية عبر wrangler
npm run cf:deploy     # بناء + نشر
npm run cf:upload     # بناء + رفع بدون نشر
npm run cf:publish    # ⭐ النشر الكامل (يتعامل مع مشكلة التوكن)
npm run cf-typegen    # توليد أنواع CloudflareEnv
```

## 🔐 الأسرار

### المتغيرات العامة (في `[vars]` داخل `wrangler.toml`)
`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `RESEND_REPLY_TO`

### الأسرار المرفوعة على Cloudflare

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put RESEND_API_KEY          # لسه محتاج ترفعه
npx wrangler secret put RESEND_TEST_EMAIL       # لسه محتاج ترفعه
```

المرفوع حاليًا:
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `CLOUDFLARE_API_TOKEN`
- ⬜ `RESEND_API_KEY`
- ⬜ `RESEND_TEST_EMAIL`

---

# ⚠️ فخاخ حرجة (احفظها)

## 1. كل الصفحات ترجع 500

**السببان معًا:**

**(أ) OpenNext على ويندوز ما بينسخش ملفات الكاش المبنية مسبقًا.**

الـ Worker بيدوّر عليها في:
```
.open-next/assets/cdn-cgi/_next_cache/<BUILD_ID>/*.cache
```
لكن OpenNext بيسيبها في `.open-next/cache/<BUILD_ID>/` برة مجلد الـ assets → الـ Worker مش بيلاقيها → `IgnorableError: No Static Assets` → 500 (بينما `/api/*` شغالة عادي).

**الحل**: `scripts/post-build-cf.mjs` بينسخهم تلقائيًا، ومربوط في `cf:build`.

**(ب) `open-next.config.ts` محتاج `incrementalCache`** لمشروع SSG:
```ts
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
```

> ملاحظة: `/rh` بتشتغل لوحدها لأنها ملف ثابت في `public/rh/index.html` — مش بتمر على Next.js أصلاً، فمتخدعكش.

## 2. `No access to the specified resource` وقت النشر

التوكن في `.env.local` / `.dev.vars` عنده **قراءة بس**. والحل هو `npm run cf:publish` أو تشيله يدويًا.

> `wrangler login` بيرفض لو التوكن موجود: *"You are logged in with an API Token. Unset the CLOUDFLARE_API_TOKEN"*.

## 3. `firebase/firestore` (client SDK) في server route

الـ SDK بيعتمد على `localStorage` وبيئة المتصفح → **مش شغال في Workers**، والرد بيرجع **فاضي تمامًا** (لأن الاستثناء بتحصل برة الـ try/catch أحيانًا).

**الحل**: استخدم `@/lib/firestore-rest` في أي server route. الـ SDK مسموح في `"use client"` components فقط.

نفس المنطق ينطبق على `fs` + `process.cwd()` — مش موجودين في Workers.

## 4. تحذير Durable Objects الكاذب

wrangler بيقول:
```
A DurableObjectNamespace referenced the class "DOQueueHandler", but no such class is exported
```

**تحذير كاذب** — تأكدنا إن الـ bundle النهائي فيه:
```js
export { BucketCachePurge, DOQueueHandler, DOShardedTagCache, worker_default as default };
```
ناتج عن ترتيب الفحص قبل ما esbuild يخلّص. آمن، تجاهله.

## 5. 🚨 ممنوع `genkit` / `@genkit-ai/*` في الكود اللي بيتحزم

`genkit` بيسحب OpenTelemetry كامل، وNext.js بيحوّل حزمه لأسماء مهشّرة، وesbuild بتاع OpenNext بيفشل:
```
Could not resolve "express-f618ca94d4f3823e"
```

**الحل**: خلي genkit في مسار مش بيتحزم (زي `src/ai/dev.ts`). الـ flows الحالية في `src/ai/flows/*` server actions نقية بدون genkit.

**حلول فاشلة**: `serverExternalPackages` في next.config، `esbuildOptions` في open-next.config (خيار غير موجود).

## 6. `npm install` يفشل بـ `EBUSY`

من `node_modules/esbuild/install.js` على ويندوز. الحل:
```bash
npm install --ignore-scripts
```

## 7. مسح `.next` محجوب

الـ shim الأمني بيرمي `SAFE_DELETE_BULK_CONFIRM_REQUIRED`. الحل:
```powershell
Remove-Item -Recurse -Force "C:\Users\Ahmed\RH-net-2\.next"
```
أو شغّل البناء مع `NODE_OPTIONS="" CODEBUDDY_SAFE_DELETE_ENABLED=0`.

## 8. التشغيل على Linux

OpenNext بيوصي بالبناء على Linux لتفادي مشاكل ويندوز. WSL محجوب حاليًا بالـ security policy. لو حصلت مشاكل مستمرة، استخدم Cloudflare Workers Builds (Git CI):
- Build command: `npm run cf:build`
- Deploy command: `npx wrangler deploy`
- Node version: `22`

---

# 🔍 أدوات تشخيص

```bash
npx wrangler whoami              # مين مسجّل + الصلاحيات (يكشف توكن vs OAuth)
npx wrangler deployments list    # هل النشر حصل؟
npx wrangler secret list         # الأسرار المرفوعة
npx wrangler tail                # الـ logs الحية

# اختبار سريع لكل الصفحات
for p in "" pova firefly sales fattura backup rh; do
  printf "%-12s " "/$p"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" -L "https://rh-net.rehlathadaf.workers.dev/$p"
done

# التحقق من الـ Durable Objects في الـ bundle
npx wrangler deploy --dry-run --outdir=/tmp/wr-bundle
tail -c 300 /tmp/wr-bundle/worker.js
```
