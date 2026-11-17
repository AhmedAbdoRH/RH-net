import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * إعداد OpenNext لـ Cloudflare Workers
 *
 * الموقع معظمه صفحات مبنية مسبقًا (SSG) بدون ISR/revalidation، فالوصفة
 * الرسمية هي الكاش للقراءة فقط المبني على Workers Static Assets.
 * راجع: https://opennext.js.org/cloudflare/caching
 *
 * ملاحظة: `enableCacheInterception` يُحسّن زمن البداية الباردة للصفحات
 * المبنية مسبقًا. لا يعمل مع PPR (وهو غير مستخدم هنا).
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
