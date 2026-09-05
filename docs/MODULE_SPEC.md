# TinyManager Module Specification

> Foundation specification — v0.1

این سند قرارداد مشترک Repositoryهای `tiny-*` را تعریف می‌کند.

---

## 1. هدف

هر ماژول TinyManager باید:

- یک مسئله مدیریتی مشخص را حل کند.
- به‌صورت Standalone اجرا شود.
- بدون بازنویسی Domain Logic داخل TinyManager قابل استفاده باشد.
- فارسی/RTL و انگلیسی/LTR را پشتیبانی کند.
- از Design System مشترک پیروی کند.
- داده را فقط از طریق Storage abstraction ذخیره کند.

---

## 2. ساختار Repository پیشنهادی

```text
tiny-example/
│
├── src/
│   ├── domain/
│   ├── module/
│   ├── standalone/
│   ├── components/
│   └── index.ts
│
├── locales/
│   ├── fa.json
│   └── en.json
│
├── docs/
│   └── assets/
│
├── module.manifest.ts
├── README.md
├── README.en.md
├── package.json
└── LICENSE
```

---

## 3. Manifest

نمونه:

```ts
export const moduleManifest = {
  id: 'tiny-risk',
  version: '0.1.0-alpha.1',
  name: {
    fa: 'مدیریت ریسک',
    en: 'Risk Manager',
  },
  description: {
    fa: 'ثبت و پایش ریسک‌های مدیریتی',
    en: 'Track and assess management risks',
  },
  icon: 'TriangleAlert',
  route: '/modules/risk',
  repository: 'https://github.com/webtanan-sketch/tiny-risk',
  category: 'insight',
  maturity: 'alpha',
  capabilities: {
    dashboardWidget: true,
    globalSearch: false,
    exportData: true,
    sharedPeople: true,
    sharedProjects: true,
    notifications: true,
  },
};
```

### ID rules

- lowercase
- kebab-case
- Repository name و Module ID یکسان
- Prefix فعلی: `tiny-`

معتبر:

```text
tiny-risk
tiny-delegation
tiny-project-health
```

نامعتبر:

```text
RiskModule
tiny_risk
risk-tool-final
```

---

## 4. Module Definition

```ts
interface TinyManagerModuleDefinition {
  manifest: TinyManagerModuleManifest;
  initialize(context: TinyManagerModuleContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
}
```

ماژول باید entry عمومی شفاف داشته باشد:

```ts
export { moduleManifest } from './module.manifest';
export { createTinyManagerModule } from './src/module/createTinyManagerModule';
```

---

## 5. Context

Core سرویس‌های مشترک را به ماژول می‌دهد:

```ts
interface TinyManagerModuleContext {
  locale: 'fa' | 'en';
  direction: 'rtl' | 'ltr';
  storage: TinyManagerStorage;
  date: TinyDateService;
}
```

در نسخه‌های بعد Context می‌تواند شامل این موارد شود:

```text
people
projects
notifications
search
commands
telemetry (opt-in)
```

---

## 6. Storage Namespace

هر ماژول فقط داخل namespace خودش داده می‌نویسد.

```text
module.<module-id>.*
```

نمونه:

```text
module.tiny-risk.records
module.tiny-risk.preferences
module.tiny-risk.filters
```

ماژول نباید روی کلید `core.*` بنویسد.

---

## 7. Locale

تمام رشته‌های UI باید کلید ترجمه داشته باشند یا از BilingualText استاندارد استفاده کنند.

حداقل زبان‌ها:

```text
fa
 en
```

فارسی:

```text
lang=fa
dir=rtl
```

انگلیسی:

```text
lang=en
dir=ltr
```

ماژول نباید فرض کند Sidebar در سمت خاصی است.

---

## 8. Dates

قواعد:

- Data layer: ISO/Gregorian timestamp
- Presentation layer: TinyDateService
- Persian mode: Jalali
- English mode: Gregorian

ممنوع:

```ts
// در Business Logic ممنوع
const due = '1405/06/19';
```

مطلوب:

```ts
const dueAt = '2026-09-10T10:30:00.000Z';
context.date.format(dueAt, context.locale);
```

---

## 9. Icons

خانواده آیکن رسمی Foundation:

**Lucide**

قواعد:

- آیکن تزئینی بی‌هدف استفاده نشود.
- یک Concept ثابت برای هر ماژول حفظ شود.
- directional icon در RTL باید Mirror شود.
- آیکن به‌تنهایی جایگزین Label حیاتی نشود.

Module icons اولیه:

| Module | Icon |
|---|---|
| Decision Matrix | `Scale` |
| Meeting Cost | `Clock3` |
| RACI | `Network` |
| Risk | `TriangleAlert` |
| Waiting For | `Hourglass` |
| Delegation | `Send` |
| Deadline | `CalendarClock` |
| Weekly Review | `ClipboardCheck` |
| Project Health | `Activity` |

---

## 10. Dashboard Widget

اگر `dashboardWidget: true` باشد، Module در نسخه‌های بعد می‌تواند Widget ارائه کند.

Widget باید:

- خلاصه باشد.
- action-first باشد.
- کل صفحه Module را داخل Dashboard تکرار نکند.
- حداکثر چند KPI یا Alert کلیدی نشان دهد.

مثال Risk:

```text
Risks
12 active
3 critical
```

---

## 11. Standalone Mode

Standalone باید برای کاربری که TinyManager Core را نصب نکرده نیز مفید باشد.

حداقل:

- App shell کوچک مستقل
- FA/EN
- RTL/LTR
- local persistence
- Import/Export در صورت وجود داده
- link to TinyManager ecosystem

اما Domain Logic Standalone و Integrated باید مشترک باشد.

---

## 12. Export

اگر `exportData: true` باشد، Module باید حداقل یکی از فرمت‌های مناسب Domain را ارائه کند:

```text
JSON
CSV
Markdown
PNG / PDF only when meaningful
```

Export باید deterministic و قابل استفاده خارج از TinyManager باشد.

---

## 13. Accessibility Baseline

- Keyboard reachable actions
- visible focus
- semantic buttons/links
- labels for icon-only buttons
- reduced-motion support
- sufficient contrast
- no color-only status meaning

---

## 14. Quality Gate

هر Module قبل از Stable باید:

- TypeScript strict pass
- build pass
- domain unit tests
- RTL visual check
- LTR visual check
- backup/export smoke test
- README.fa + README.en
- no broken repository links

---

## 15. Version Compatibility — Future

در نسخه بعدی Manifest این فیلد اضافه می‌شود:

```ts
requiresCore: '>=0.1 <1'
```

تا Core قبل از فعال‌سازی Module ناسازگار هشدار دهد.
