# Installing TinyManager

TinyManager has three official installation/run paths.

## 1. Recommended for Windows — Setup.exe

Download the latest file from **GitHub Releases**:

```text
TinyManager-Setup-vX.Y.Z.exe
```

Run Setup. Installation is per-user and does not require Administrator privileges, Node.js, or Python.

Setup:

- installs the prebuilt PWA files;
- creates Desktop and Start Menu shortcuts;
- serves TinyManager on localhost so IndexedDB and the Service Worker work normally;
- upgrades future versions in-place using the same AppId;
- does not delete the browser IndexedDB data when application files are upgraded.

> During Alpha releases, export a Backup from Settings before upgrading.

## 2. Portable Windows

Download and extract:

```text
TinyManager-Windows-Portable-vX.Y.Z.zip
```

Then run:

```text
Start-TinyManager.cmd
```

Node.js and Python are not required.

## 3. Source workspace for developers

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\TinyManager-Source-Installer-vX.Y.Z.ps1
```

macOS/Linux:

```bash
bash TinyManager-Source-Installer-vX.Y.Z.sh
```

The Source Installer reads the canonical `config/repositories.json` registry and discovers:

- TinyManager Core;
- all 9 official TinyManager modules;
- Webtanan Jalali Date Engine.

Each repository is synchronized to its pinned revision. If an existing local repository has uncommitted changes, the installer stops instead of overwriting them.

On Windows, if Git or Node.js LTS are missing and `winget` is available, the Source Installer attempts to install them automatically.

## Download integrity

Every Release also publishes:

```text
SHA256SUMS.txt
```

Use it to verify downloaded release assets.
