# نصب TinyManager

TinyManager سه روش رسمی نصب/اجرا دارد.

## 1. روش پیشنهادی برای Windows — Setup.exe

از صفحه **GitHub Releases** آخرین فایل زیر را دانلود کنید:

```text
TinyManager-Setup-vX.Y.Z.exe
```

فایل Setup را اجرا کنید. نصب برای همان کاربر Windows انجام می‌شود و به دسترسی Administrator، Node.js یا Python نیاز ندارد.

Setup:

- فایل‌های PWA آماده را نصب می‌کند.
- Shortcut دسکتاپ و Start Menu می‌سازد.
- TinyManager را روی localhost اجرا می‌کند تا IndexedDB و Service Worker به شکل استاندارد کار کنند.
- نسخه‌های بعدی با همان AppId روی نصب قبلی ارتقا پیدا می‌کنند.
- داده‌های اصلی TinyManager در IndexedDB مرورگر قرار دارند و با به‌روزرسانی فایل‌های برنامه حذف نمی‌شوند.

> قبل از ارتقای نسخه‌های Alpha، از بخش Settings یک Backup بگیرید.

## 2. Portable Windows

فایل زیر را دانلود و Extract کنید:

```text
TinyManager-Windows-Portable-vX.Y.Z.zip
```

سپس اجرا کنید:

```text
Start-TinyManager.cmd
```

این نسخه نیز به Node.js یا Python نیاز ندارد.

## 3. نصب سورس برای توسعه‌دهندگان

نسخه Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\TinyManager-Source-Installer-vX.Y.Z.ps1
```

نسخه macOS/Linux:

```bash
bash TinyManager-Source-Installer-vX.Y.Z.sh
```

Source Installer از فایل مرکزی `config/repositories.json` استفاده می‌کند و این موارد را می‌شناسد:

- TinyManager Core
- تمام ۹ ماژول رسمی TinyManager
- Webtanan Jalali Date Engine

برای هر مخزن، Revision پین‌شده بررسی و همان نسخه Sync می‌شود. اگر مخزن محلی تغییر Commit‌نشده داشته باشد، Installer به‌جای پاک کردن تغییرات متوقف می‌شود.

در Windows اگر Git یا Node.js LTS نصب نباشند و `winget` در دسترس باشد، Source Installer تلاش می‌کند آن‌ها را به‌صورت خودکار نصب کند.

## کنترل سلامت فایل‌ها

هر Release فایل زیر را نیز دارد:

```text
SHA256SUMS.txt
```

می‌توانید SHA256 فایل دانلودشده را با آن مقایسه کنید.
