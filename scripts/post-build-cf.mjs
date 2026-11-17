#!/usr/bin/env node
/**
 * post-build-cf.mjs
 *
 * OpenNext على ويندوز ما بينسخش ملفات الكاش المبنية مسبقًا (prerendered pages)
 * من `.open-next/cache/<BUILD_ID>/` إلى المكان اللي الـ Worker بيدوّر فيه:
 *   `.open-next/assets/cdn-cgi/_next_cache/<BUILD_ID>/`
 *
 * بدونه الـ Worker بيرجّع 500 على كل الصفحات المبنية مسبقًا.
 *
 * يُشغَّل تلقائيًا بعد `opennextjs-cloudflare build`.
 */

import { existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OPEN_NEXT = join(ROOT, '.open-next');
const CACHE_DIR = join(OPEN_NEXT, 'cache');
const CACHE_ASSETS_DIR = join(OPEN_NEXT, 'assets', 'cdn-cgi', '_next_cache');

function fail(msg) {
  console.error(`\n❌ post-build: ${msg}\n`);
  process.exit(1);
}

if (!existsSync(CACHE_DIR)) {
  console.log('ℹ️  post-build: لا يوجد مجلد cache — لا شيء لنقله.');
  process.exit(0);
}

const buildIds = readdirSync(CACHE_DIR).filter((name) => {
  try {
    return statSync(join(CACHE_DIR, name)).isDirectory();
  } catch {
    return false;
  }
});

if (buildIds.length === 0) {
  console.log('ℹ️  post-build: مجلد cache فاضي — لا شيء لنقله.');
  process.exit(0);
}

// نتوقع BUILD_ID واحد؛ لو أكتر ننقل كل واحد
mkdirSync(CACHE_ASSETS_DIR, { recursive: true });

let moved = 0;
for (const buildId of buildIds) {
  const from = join(CACHE_DIR, buildId);
  const to = join(CACHE_ASSETS_DIR, buildId);
  cpSync(from, to, { recursive: true });
  moved += readdirSync(to).length;
  console.log(`✅ post-build: نُقل ${buildId} → assets/cdn-cgi/_next_cache/`);
}

console.log(`✅ post-build: اكتمل نقل ملفات الكاش (${moved} ملف).`);
