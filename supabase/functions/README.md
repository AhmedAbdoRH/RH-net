# Supabase Edge Functions - Subscription Automation

هذا المشروع يحتوي على Edge Functions لأتمتة إدارة اشتراكات Pro.

## Edge Functions

### 1. check-subscriptions
**الوظيفة:** التحقق اليومي من الاشتراكات المنتهية وإرسال الإيميلات تلقائياً

**الجدولة:** يعمل يومياً في منتصف الليل (UTC)

**المنطق:**
- عند انتهاء 30 يوم (فترة الاشتراك) → إرسال إيميل تنبيه
- عند انتهاء 40 يوم (فترة السماح) → إرسال إيميل إيقاف + تحديث الخطة إلى basic

### 2. send-warning-email
**الوظيفة:** إرسال إيميل تنبيه بتجديد الاشتراك

**يستدعى بواسطة:** check-subscriptions

### 3. send-cancellation-email
**الوظيفة:** إرسال إيميل إيقاف الاشتراك

**يستدعى بواسطة:** check-subscriptions

## كيفية النشر

### الخطوة 1: تسجيل الدخول في Supabase CLI
```bash
supabase login
```

### الخطوة 2: ربط المشروع بـ Supabase
```bash
supabase link --project-ref ikelmblsikapgbxbpebz
```

### الخطوة 3: نشر Edge Functions
```bash
# نشر جميع الـ Edge Functions
supabase functions deploy

# أو نشر دالة محددة
supabase functions deploy check-subscriptions
supabase functions deploy send-warning-email
supabase functions deploy send-cancellation-email
```

### الخطوة 4: إعداد Environment Variables
في لوحة تحكم Supabase، أضف المتغيرات التالية في Edge Functions:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=<your-from-email>
RESEND_FROM_NAME=<your-from-name>
RESEND_REPLY_TO=<your-reply-to-email>
```

### الخطوة 5: تفعيل Cron Job
بعد نشر Edge Functions، سيتم تفعيل cron job تلقائياً بناءً على ملف `cron.toml`.

يمكنك التحقق من cron jobs في:
- لوحة تحكم Supabase → Edge Functions → Cron Jobs

## الاختبار

### اختبار Edge Function محلياً
```bash
supabase functions serve check-subscriptions
```

### اختبار Edge Function بعد النشر
```bash
# اختبار check-subscriptions
curl -X POST https://ikelmblsikapgbxbpebz.supabase.co/functions/v1/check-subscriptions \
  -H "Authorization: Bearer <your-service-role-key>"

# اختبار send-warning-email
curl -X POST https://ikelmblsikapgbxbpebz.supabase.co/functions/v1/send-warning-email \
  -H "Authorization: Bearer <your-service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>", "storeName": "<store-name>"}'

# اختبار send-cancellation-email
curl -X POST https://ikelmblsikapgbxbpebz.supabase.co/functions/v1/send-cancellation-email \
  -H "Authorization: Bearer <your-service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>", "storeName": "<store-name>"}'
```

## مراقبة السجلات

```bash
# عرض سجلات Edge Function
supabase functions logs check-subscriptions
supabase functions logs send-warning-email
supabase functions logs send-cancellation-email
```

أو من لوحة تحكم Supabase:
- Edge Functions → اختر الـ Function → Logs

## ملاحظات مهمة

1. **أخطاء TypeScript المحلية:** الأخطاء التي تظهر في IDE (مثل Cannot find module 'jsr:@supabase/supabase-js@2' و Cannot find name 'Deno') طبيعية لأن Deno و JSR modules غير متوفرة في بيئة التطوير المحلية. هذه الأخطاء لن تظهر عند النشر على Supabase.

2. **Environment Variables:** تأكد من إضافة جميع المتغيرات المطلوبة في لوحة تحكم Supabase قبل النشر.

3. **Cron Job:** يتم تفعيل cron job تلقائياً عند نشر Edge Functions التي تحتوي على ملف `cron.toml`.

4. **تتبع الإيميلات:** يتم تتبع إرسال الإيميلات باستخدام الأعمدة `warning_sent_at` و `cancelled_sent_at` في جدول `catalogs` لتجنب إرسال الإيميلات المكررة.
