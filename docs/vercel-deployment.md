# إعداد النشر على Vercel

هذا المشروع مهيأ للنشر على Vercel كتطبيق Next.js كامل باستخدام App Router وRoute Handlers. يعتمد البناء على الأمر `npm run build`، وتستخدم Vercel تلقائيًا مخرجات Next.js للتعامل مع الصفحات الثابتة والصفحات الديناميكية وواجهات API.

## إعداد المشروع

من لوحة Vercel اختر **New Project** ثم اربط مستودع `AhmedAbdoRH/RH-net`، وحدد الفرع `main`. سيتم اكتشاف Next.js تلقائيًا، كما يثبت ملف `vercel.json` أمر التثبيت `npm ci` وأمر البناء `npm run build`.

## متغيرات البيئة

يجب إضافة المتغيرات التالية من صفحة إعدادات المشروع في Vercel، مع وضع القيم الحقيقية هناك فقط وعدم رفعها إلى GitHub. استخدم بيئات **Production** و**Preview** حسب الحاجة.

| المتغير | الاستخدام | نوعه |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | عنوان Supabase المتاح للواجهة | عام للمتصفح |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح Supabase العام | عام للمتصفح |
| `SUPABASE_URL` | اتصال Supabase من الخادم | سري |
| `SUPABASE_SERVICE_ROLE_KEY` | عمليات Supabase الموثوقة من الخادم | سري جدًا |
| `CLOUDFLARE_ACCOUNT_ID` | قراءة بيانات استخدام Cloudflare من الخادم | سري |
| `CLOUDFLARE_API_TOKEN` | رمز Cloudflare لواجهة الاستخدام | سري جدًا |
| `RESEND_API_KEY` | إرسال البريد من Route Handler | سري جدًا |
| `RESEND_FROM_EMAIL` | عنوان المرسل | إعداد خادمي |
| `RESEND_FROM_NAME` | اسم المرسل | إعداد خادمي |
| `RESEND_REPLY_TO` | عنوان الرد الاختياري | إعداد خادمي |
| `RESEND_TEST_EMAIL` | بريد الاختبار الاختياري | إعداد خادمي |

إعداد Firebase المستخدم في صفحات الفاتورة موجود في ملف إعداد عميل عام داخل المشروع، بينما لا ينبغي نقل أي مفاتيح خادمية إضافية إلى الواجهة أو إلى ملفات Git المتتبعة.

## ملاحظات التحقق

بعد أول نشر، اختبر المسارات `/` و`/fattura` و`/rh` و`/rh/sys.html` و`/rh/oc.html` و`/rh/trns.html` و`/backup`. إذا ظهرت أخطاء في لوحات الاستخدام أو البريد، راجع متغيرات البيئة الخاصة بالخادم وسجلات Functions في Vercel.
