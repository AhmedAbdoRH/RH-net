# Accessibility & Performance Checklist

## إمكانية الوصول (Accessibility)

### ✅ التباين (Contrast)
- [x] نص أساسي: تباين ≥ 14:1 (WCAG AAA)
- [x] نص ثانوي: تباين ≥ 4.5:1 (WCAG AA)
- [x] عناصر تفاعلية: تباين ≥ 3:1
- [x] حدود focus واضحة: 2px solid

**الاختبار:**
```javascript
// استخدم أداة مثل:
// https://webaim.org/resources/contrastchecker/
// أو Chrome DevTools Lighthouse
```

### ✅ إدارة Focus
- [x] Focus ring واضح على جميع العناصر التفاعلية
- [x] Focus trap في Modals/Dialogs
- [x] Skip links للتنقل السريع
- [x] Logical tab order

**الاختبار:**
```bash
# اضغط Tab للتنقل عبر الصفحة
# تأكد من:
# 1. ترتيب منطقي
# 2. focus ring واضح
# 3. لا توجد عناصر محاصرة
```

### ✅ ARIA Labels
- [x] جميع الأزرار لها labels واضحة
- [x] Icons لها aria-label
- [x] Live regions للتحديثات الديناميكية
- [x] Role attributes صحيحة

**مثال:**
```html
<button aria-label="إغلاق النافذة">
  <svg aria-hidden="true">...</svg>
</button>

<div role="alert" aria-live="polite">
  تم الحفظ بنجاح
</div>
```

### ✅ Keyboard Navigation
- [x] جميع الوظائف متاحة عبر لوحة المفاتيح
- [x] Escape لإغلاق Modals
- [x] Enter/Space لتفعيل الأزرار
- [x] Arrow keys للتنقل في القوائم

**الاختبار:**
```bash
# افصل الماوس واستخدم لوحة المفاتيح فقط
# تأكد من إمكانية الوصول لجميع الوظائف
```

### ✅ Motion & Animation
- [x] احترام `prefers-reduced-motion`
- [x] إيقاف الرسوم المتحركة عند الطلب
- [x] بدائل ثابتة للمحتوى المتحرك

**التنفيذ:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ✅ Screen Readers
- [x] Semantic HTML (header, nav, main, footer)
- [x] Headings hierarchy (h1 → h6)
- [x] Alt text للصور
- [x] Form labels واضحة

**الاختبار:**
```bash
# استخدم NVDA (Windows) أو VoiceOver (Mac)
# تأكد من قراءة المحتوى بشكل منطقي
```

### ✅ Color Independence
- [x] لا تعتمد على اللون فقط للمعلومات
- [x] استخدام icons/patterns مع الألوان
- [x] نصوص واضحة للحالات

**مثال:**
```html
<!-- ❌ سيء -->
<span style="color: red;">خطأ</span>

<!-- ✅ جيد -->
<span class="error">
  <svg aria-hidden="true">⚠️</svg>
  خطأ: الحقل مطلوب
</span>
```

---

## الأداء (Performance)

### ✅ أهداف الأداء

| المقياس | الهدف | الحالي |
|---------|--------|--------|
| First Contentful Paint | < 1.5s | ✅ |
| Time to Interactive | < 3s | ✅ |
| Canvas FPS | 60fps | ✅ |
| Memory Usage | < 50MB | ✅ |
| Bundle Size | < 200KB | ✅ |

### ✅ Canvas Optimization

#### 1. Object Pooling
```javascript
// إعادة استخدام الكائنات بدلاً من إنشاء جديدة
const particlePool = [];

function getParticle() {
  return particlePool.pop() || createNewParticle();
}

function releaseParticle(particle) {
  particlePool.push(particle);
}
```

#### 2. RequestAnimationFrame
```javascript
// استخدام RAF مع throttling
let lastFrameTime = 0;
const frameInterval = 1000 / 60; // 60 FPS

function animate(currentTime) {
  const elapsed = currentTime - lastFrameTime;
  
  if (elapsed < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  
  lastFrameTime = currentTime - (elapsed % frameInterval);
  
  // رسم الإطار
  draw();
  
  requestAnimationFrame(animate);
}
```

#### 3. Pause on Hidden
```javascript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
  } else {
    animationId = requestAnimationFrame(animate);
  }
});
```

#### 4. DPR Clamping
```javascript
// تحديد DPR لتحسين الأداء
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = width * dpr;
canvas.height = height * dpr;
ctx.scale(dpr, dpr);
```

### ✅ CSS Optimization

#### 1. CSS Containment
```css
.card {
  contain: layout style paint;
}
```

#### 2. Will-Change
```css
/* استخدم فقط على العناصر التي ستتحرك */
.button:hover {
  will-change: transform;
}

.button:not(:hover) {
  will-change: auto;
}
```

#### 3. Transform & Opacity
```css
/* استخدم transform/opacity للرسوم المتحركة */
/* ✅ جيد - GPU accelerated */
.element {
  transform: translateY(-2px);
  opacity: 0.8;
}

/* ❌ سيء - يسبب reflow */
.element {
  top: -2px;
  visibility: hidden;
}
```

### ✅ JavaScript Optimization

#### 1. Debounce/Throttle
```javascript
// Throttle للأحداث المتكررة
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

window.addEventListener('resize', throttle(handleResize, 100));
```

#### 2. Intersection Observer
```javascript
// تحميل كسول للعناصر
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadComponent(entry.target);
      observer.unobserve(entry.target);
    }
  });
});
```

#### 3. Code Splitting
```javascript
// تقسيم الكود للتحميل عند الحاجة
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### ✅ قياس الأداء

#### Chrome DevTools
```javascript
// Performance API
const perfData = performance.getEntriesByType('navigation')[0];
console.log('FCP:', perfData.responseStart);
console.log('TTI:', perfData.domInteractive);

// Memory usage
if (performance.memory) {
  console.log('Used:', performance.memory.usedJSHeapSize / 1048576, 'MB');
}
```

#### Lighthouse
```bash
# تشغيل Lighthouse
npx lighthouse https://your-site.com --view

# أو من Chrome DevTools:
# F12 → Lighthouse → Generate Report
```

### ✅ Bundle Size

```bash
# تحليل حجم Bundle
npm run build
npx webpack-bundle-analyzer

# الأهداف:
# - Main bundle: < 150KB gzipped
# - Vendor bundle: < 100KB gzipped
# - CSS: < 20KB gzipped
```

---

## اختبارات سريعة

### Accessibility Quick Test
```bash
1. Tab navigation - هل يمكن الوصول لكل شيء؟
2. Screen reader - هل المحتوى منطقي؟
3. Zoom to 200% - هل النص قابل للقراءة؟
4. Keyboard only - هل جميع الوظائف تعمل؟
5. Color blindness - هل المعلومات واضحة؟
```

### Performance Quick Test
```bash
1. Lighthouse score > 90
2. FPS counter في DevTools
3. Network throttling (Fast 3G)
4. CPU throttling (4x slowdown)
5. Memory profiler - لا تسريبات
```

---

## أدوات مفيدة

### Accessibility
- [WAVE](https://wave.webaim.org/) - تحليل الوصول
- [axe DevTools](https://www.deque.com/axe/devtools/) - اختبار تلقائي
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - تقرير شامل
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Performance
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [WebPageTest](https://www.webpagetest.org/)
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Performance Observer](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)

---

## Checklist النهائي

### قبل الإطلاق
- [ ] جميع اختبارات Accessibility تمر
- [ ] Lighthouse score > 90
- [ ] لا تسريبات في الذاكرة
- [ ] يعمل على جميع المتصفحات الرئيسية
- [ ] يعمل على الأجهزة المحمولة
- [ ] يدعم Keyboard navigation
- [ ] يدعم Screen readers
- [ ] يحترم prefers-reduced-motion
- [ ] Bundle size ضمن الحدود
- [ ] FPS ثابت على 60

### المراجعة الدورية
- [ ] اختبار Accessibility شهرياً
- [ ] مراجعة Performance ربع سنوياً
- [ ] تحديث التبعيات بانتظام
- [ ] مراقبة تقارير المستخدمين
