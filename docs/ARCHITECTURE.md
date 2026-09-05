# TinyManager Architecture

> نسخه سند: 0.1 — Foundation

این سند مرزهای معماری TinyManager را مشخص می‌کند تا هسته و Repositoryهای `tiny-*` مستقل توسعه پیدا کنند اما در نهایت یک محصول منسجم بسازند.

---

## 1. هدف معماری

TinyManager باید هم‌زمان چهار ویژگی داشته باشد:

1. **Core کوچک و پایدار**
2. **Moduleهای مستقل و قابل انتشار در GitHub**
3. **Local-first بودن نسخه پایه**
4. **پشتیبانی درجه‌یک از فارسی/RTL و انگلیسی/LTR**

هسته نباید منطق تخصصی Risk، RACI، Delegation یا سایر ابزارها را در خود نگه دارد. هسته فقط سرویس‌های مشترک و قرارداد اتصال را فراهم می‌کند.

---

## 2. لایه‌ها

```text
┌──────────────────────────────────────────────┐
│               TinyManager App               │
│ App Shell · Dashboard · Settings · Search   │
├──────────────────────────────────────────────┤
│                Core Services                 │
│ i18n · Date · Storage · Backup · Modules    │
├──────────────────────────────────────────────┤
│               Module Contract                │
│ Manifest · Lifecycle · Capabilities          │
├──────────────────────────────────────────────┤
│                  Modules                     │
│ Risk · RACI · Waiting · Delegation · ...    │
├──────────────────────────────────────────────┤
│              Persistence Layer               │
│ IndexedDB → future REST / Cloud adapters     │
└──────────────────────────────────────────────┘
```

---

## 3. Core Responsibilities

Core مسئول این موارد است:

- App Shell
- Dashboard composition
- زبان و ترجمه
- RTL / LTR
- Theme
- Module Registry
- Shared Storage API
- Date API
- Backup / Restore
- Shared entities در نسخه‌های بعدی
- Global Search در نسخه‌های بعدی
- Notification Center در نسخه‌های بعدی

Core **نباید** مستقیم Business Logic ماژول‌ها را پیاده‌سازی کند.

---

## 4. Module Responsibilities

هر ماژول مسئول Domain خودش است.

مثال برای `tiny-risk`:

- Risk entity
- probability / impact scoring
- Heatmap
- filters
- Risk-specific export
- module widget

ماژول نباید:

- زبان کل برنامه را تغییر دهد
- Theme مستقل اجباری تعریف کند
- مستقیماً به IndexedDB یا Supabase وابسته شود
- Shared People / Project را duplicate کند

---

## 5. Data Ownership

کلیدهای Storage باید namespace داشته باشند.

```text
core.*
shared.*
module.tiny-risk.*
module.tiny-raci.*
module.tiny-delegation.*
```

نمونه:

```text
core.modules.enabled
module.tiny-risk.records
shared.projects
```

این سیاست برای Backup، Migration و حذف یک ماژول ضروری است.

---

## 6. Date Strategy

تاریخ ذخیره‌شده باید استاندارد و مستقل از زبان UI باشد.

```json
{
  "dueAt": "2026-09-10T10:30:00.000Z"
}
```

لایه نمایش:

```text
fa → Jalali / Persian digits
 en → Gregorian / Latin digits
```

برای تبدیل شمسی از **Webtanan Jalali Date Engine** استفاده می‌شود.

نسخه Foundation فعلی به Commit زیر Pin شده است:

```text
5fc682ca3c7ed97923b152650516feaaa40b6a50
```

ماژول‌ها نباید مستقیم به جزئیات این Engine وابسته شوند؛ استفاده باید از `TinyDateService` انجام شود.

---

## 7. Locale & Direction

```text
fa → rtl
 en → ltr
```

تغییر Locale باید هم‌زمان موارد زیر را تغییر دهد:

- `document.documentElement.lang`
- `document.documentElement.dir`
- Copy
- Date rendering
- Sidebar position
- directional icons
- text alignment where needed

RTL یک Theme جدا نیست؛ بخشی از معماری UI است.

---

## 8. Storage Strategy

نسخه پایه:

```text
Module
  ↓
TinyManagerStorage
  ↓
IndexedDB
```

Fallback سبک به LocalStorage فقط برای محیط‌هایی است که IndexedDB در دسترس نیست.

نسخه‌های آینده می‌توانند Adapterهای زیر را اضافه کنند:

```text
REST
Supabase
SQLite / Desktop
Self-hosted API
```

Business Logic ماژول نباید با تغییر Adapter بازنویسی شود.

---

## 9. Backup Strategy

Backup یک Envelope نسخه‌دار دارد:

```json
{
  "schema": "tinymanager-backup",
  "schemaVersion": 1,
  "appVersion": "0.1.0-alpha.1",
  "createdAt": "...",
  "data": {}
}
```

قواعد:

- Restore باید schema را validate کند.
- Migration بین schema versionها باید explicit باشد.
- Module data با namespace ذخیره شود.
- هیچ Secret یا credential نباید در Backup خام قرار بگیرد.

---

## 10. Module Lifecycle

Foundation contract:

```ts
interface TinyManagerModuleDefinition {
  manifest: TinyManagerModuleManifest;
  initialize(context: TinyManagerModuleContext): void | Promise<void>;
  dispose?(): void | Promise<void>;
}
```

چرخه پیشنهادی:

```text
discovered
  ↓
registered
  ↓
enabled
  ↓
initialized
  ↓
running
  ↓
disposed
```

---

## 11. Standalone + Integrated

هر Repo ماژول دو خروجی دارد:

```text
Standalone App
Module Library
```

Domain logic مشترک است:

```text
src/domain/*
```

Standalone و TinyManager wrapper هر دو باید از همین Domain استفاده کنند؛ duplication مجاز نیست.

---

## 12. Dependency Direction

قانون اصلی:

```text
App → Core → Contracts
Module → Contracts
Core ✕ Module internals
Module ✕ Core internals
```

ماژول فقط باید API عمومی Core/SDK را بشناسد.

---

## 13. Versioning

TinyManager و هر Module نسخه مستقل دارند.

```text
Core:   0.1.0-alpha.1
Risk:   0.1.0-alpha.1
RACI:   0.1.0-alpha.1
```

در Manifest باید حداقل در آینده این compatibility قابل تعریف باشد:

```text
requiresCore: >=0.1 <1
```

---

## 14. Security Baseline

- No secrets in browser source.
- No direct browser-to-MySQL connection.
- Validate imported backup data.
- Escape/render user text safely.
- Module packages may not execute arbitrary remote code by default.
- Remote module loading, if added later, requires integrity and trust policy.

---

## 15. Foundation Definition of Done

هسته Foundation زمانی بسته می‌شود که:

- [x] React + TypeScript + Vite scaffold
- [x] RTL/LTR switching
- [x] FA/EN switching
- [x] Theme switching
- [x] Module registry
- [x] IndexedDB storage abstraction
- [x] Date service
- [x] Backup envelope
- [x] Initial manager dashboard
- [ ] Reference module integrated
- [ ] CI green
- [ ] Core smoke tests
