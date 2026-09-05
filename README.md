<p align="center">
  <img src="docs/assets/tinymanager-hero.svg" alt="TinyManager — ابزارهای کوچک، مدیریت بهتر" width="100%" />
</p>

<p align="center">
  <strong>یک فضای کاری مدیریتی سبک، ماژولار، Local-first و دو‌زبانه برای مدیران</strong>
</p>

<p align="center">
  <a href="README.md">🇮🇷 فارسی</a> · <a href="README.en.md">🇬🇧 English</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-First-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=0B1220" />
  <img alt="RTL LTR" src="https://img.shields.io/badge/RTL%20%2F%20LTR-Native-0F766E" />
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-Yes-7C3AED" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-111827" />
</p>

# TinyManager

**TinyManager** یک نرم‌افزار مدیریتی بزرگ و شلوغ نیست. هدف آن ساخت یک **هسته ساده و منسجم برای مدیر** است که فقط ماژول‌های موردنیاز خود را فعال می‌کند و هر ماژول یک مسئله مشخص مدیریتی را حل می‌کند.

> **اصل محصول:** TinyManager همراه مدیر بزرگ می‌شود؛ نه اینکه از روز اول او را با امکانات شلوغ کند.

## وضعیت فعلی

این Repository در مرحله **Foundation / v0.1.0-alpha** است. در این فاز، هسته مشترک پروژه ساخته می‌شود: زبان، جهت صفحه، طراحی، قرارداد ماژول‌ها، Storage، تاریخ، Backup و Dashboard. پس از تثبیت این قرارداد، ماژول‌های مستقل `tiny-*` به آن متصل می‌شوند.

## چرا TinyManager؟

مدیر معمولاً برای کارهای ساده به ابزارهای سنگین نیاز ندارد. TinyManager باید خیلی سریع نشان دهد:

- امروز چه چیزی نیازمند توجه است؟
- منتظر پاسخ چه کسی هستم؟
- چه کاری را به چه کسی سپرده‌ام؟
- چه موعدی نزدیک است؟
- کدام ریسک مهم است؟
- چه تصمیمی باید گرفته شود؟
- وضعیت پروژه‌ها چگونه است؟

## ماژول‌های برنامه‌ریزی‌شده

| ماژول | Repository | کاربرد |
|---|---|---|
| Decision Matrix | `tiny-decision-matrix` | مقایسه و امتیازدهی گزینه‌ها با معیارهای وزن‌دار |
| Meeting Cost | `tiny-meeting-cost` | محاسبه هزینه واقعی جلسه |
| RACI | `tiny-raci` | تعیین Responsible / Accountable / Consulted / Informed |
| Risk | `tiny-risk` | ثبت ریسک و Heatmap احتمال × اثر |
| Waiting For | `tiny-waiting` | پیگیری مواردی که منتظر پاسخ دیگران هستند |
| Delegation | `tiny-delegation` | پیگیری کارهای تفویض‌شده |
| Deadline | `tiny-deadline` | رادار موعدهای نزدیک و عقب‌افتاده |
| Weekly Review | `tiny-weekly-review` | مرور ساختاریافته هفتگی مدیر |
| Project Health | `tiny-project-health` | سنجش سریع سلامت پروژه |

## دو زبان از هسته، نه به‌عنوان افزونه

فارسی زبان اول TinyManager است و انگلیسی زبان دوم.

### فارسی

- رابط کامل RTL
- Sidebar سمت راست
- تاریخ شمسی با **Webtanan Jalali Date Engine**
- قابلیت نمایش ارقام فارسی
- متن، جدول، Drawer، Navigation و کنترل‌های جهت‌دار سازگار با RTL

### English

- رابط کامل LTR
- Sidebar سمت چپ
- Gregorian date
- English interface and Latin digits

تغییر زبان فقط متن را ترجمه نمی‌کند؛ **جهت کل رابط نیز Mirror می‌شود**.

## Technology Stack

- **TypeScript** — زبان اصلی
- **React** — رابط کاربری
- **Vite** — Build و Development
- **Tailwind CSS + CSS Variables** — Design System
- **Lucide Icons** — خانواده آیکن مشترک
- **IndexedDB** — ذخیره Local-first
- **Webtanan Jalali Date Engine** — موتور رسمی تاریخ فارسی
- **Vitest** — تست هسته و ماژول‌ها

## معماری

```text
TinyManager Core
│
├── App Shell
├── Dashboard
├── i18n + RTL/LTR
├── Module Registry
├── Storage API
├── Date API
├── Theme
├── Backup / Restore
├── Search
└── Shared Entities
     │
     ├── People
     ├── Projects
     ├── Teams
     └── Tags

Modules
├── Decision Matrix
├── Meeting Cost
├── RACI
├── Risk
├── Waiting For
├── Delegation
├── Deadline
├── Weekly Review
└── Project Health
```

هر ماژول باید بتواند **دو حالت** داشته باشد:

1. **Standalone** — به‌تنهایی اجرا شود.
2. **TinyManager Module** — بدون بازنویسی داخل TinyManager نصب و اجرا شود.

جزئیات قرارداد در [`docs/MODULE_SPEC.md`](docs/MODULE_SPEC.md) قرار دارد.

## تاریخ فارسی

TinyManager از Repository مستقل **Webtanan Jalali Date Engine** استفاده می‌کند. تاریخ‌ها در داده‌ها به شکل استاندارد ISO/Gregorian نگهداری می‌شوند و فقط در لایه نمایش، بر اساس زبان کاربر به شمسی یا میلادی تبدیل می‌شوند.

این تصمیم باعث می‌شود Sort، Backup، API، Sync و مهاجرت‌های آینده قابل اعتماد باقی بمانند.

## Local-first و حریم خصوصی

نسخه پایه بدون حساب کاربری و بدون Server کار می‌کند.

- داده اصلی روی دستگاه کاربر نگهداری می‌شود.
- ماژول‌ها به دیتابیس خاصی قفل نمی‌شوند.
- Storage از طریق API هسته در اختیار ماژول قرار می‌گیرد.
- در آینده می‌توان Adapter برای REST، Supabase یا Self-hosted Server اضافه کرد.

## راه‌اندازی توسعه

```bash
git clone https://github.com/webtanan-sketch/tinymanager.git
cd tinymanager
npm install
npm run dev
```

بررسی کیفیت:

```bash
npm run typecheck
npm run test
npm run build
```

## اصول طراحی

1. **یک مسئله، یک ماژول**
2. **فارسی و RTL درجه‌یک**
3. **سادگی قبل از تعداد قابلیت‌ها**
4. **Local-first به‌صورت پیش‌فرض**
5. **بدون وابستگی مستقیم ماژول به دیتابیس**
6. **Design System مشترک برای همه Repositoryها**
7. **Keyboard و Accessibility از ابتدا**
8. **هر ماژول مستقل و قابل استفاده خارج از Core**

## اسناد توسعه

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — معماری هسته
- [`MODULE_SPEC.md`](docs/MODULE_SPEC.md) — قرارداد ماژول‌ها
- [`DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — سیستم طراحی و آیکن‌ها

## Roadmap اولیه

- [x] تعریف Stack اصلی
- [x] تعریف معماری Core + Module
- [ ] App Shell دو‌زبانه RTL/LTR
- [ ] Module Registry
- [ ] Storage API روی IndexedDB
- [ ] Date Service با Webtanan Jalali Date Engine
- [ ] Backup / Restore
- [ ] Reference Module: Decision Matrix
- [ ] Dashboard Widgets
- [ ] PWA Offline Mode
- [ ] انتشار اولین نسخه Alpha

## مشارکت

TinyManager برای توسعه ماژول‌های مستقل طراحی شده است. پس از تثبیت SDK، توسعه‌دهندگان می‌توانند ماژول‌هایی بسازند که با قرارداد مشترک داخل Core نصب شوند.

## License

MIT © 2026 Webtanan
