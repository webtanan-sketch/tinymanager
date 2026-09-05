<p align="center">
  <img src="docs/assets/tinymanager-hero.svg" alt="TinyManager — Small tools. Better management." width="100%" />
</p>

<p align="center">
  <strong>A lightweight, modular, local-first bilingual workspace for managers</strong>
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

**TinyManager** is not another oversized project-management suite. It is a focused **manager workspace with a small core and installable modules**, where each module solves one specific management problem.

> **Product principle:** TinyManager should grow with the manager, not overwhelm the manager.

## Current status

This repository is currently at **Foundation / v0.1.0-alpha**. The first milestone establishes the shared core: language and direction, design system, module contract, storage, date service, backup and dashboard primitives. Independent `tiny-*` repositories will plug into this contract after it stabilizes.

## Planned modules

| Module | Repository | Purpose |
|---|---|---|
| Decision Matrix | `tiny-decision-matrix` | Compare options with weighted criteria |
| Meeting Cost | `tiny-meeting-cost` | Calculate the real cost of a meeting |
| RACI | `tiny-raci` | Map Responsible / Accountable / Consulted / Informed |
| Risk | `tiny-risk` | Track risks and probability × impact heatmaps |
| Waiting For | `tiny-waiting` | Track items waiting on other people |
| Delegation | `tiny-delegation` | Follow delegated work |
| Deadline | `tiny-deadline` | See upcoming and overdue deadlines |
| Weekly Review | `tiny-weekly-review` | Run a structured manager weekly review |
| Project Health | `tiny-project-health` | Produce a quick project health signal |

## Bilingual at the core

Persian is a first-class language, not a translation layer added at the end.

### Persian mode

- Full RTL layout
- Sidebar on the right
- Jalali dates powered by **Webtanan Jalali Date Engine**
- Optional Persian digits
- Direction-aware navigation, tables, drawers and controls

### English mode

- Full LTR layout
- Sidebar on the left
- Gregorian dates
- English UI and Latin digits

Changing language mirrors the interface direction as well as translating the copy.

## Technology stack

- **TypeScript**
- **React**
- **Vite**
- **Tailwind CSS + CSS Variables**
- **Lucide Icons**
- **IndexedDB**
- **Webtanan Jalali Date Engine**
- **Vitest**

## Architecture

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

Every module must support two modes:

1. **Standalone** — usable as an independent micro app.
2. **TinyManager Module** — installable inside the TinyManager shell without rewriting domain logic.

See [`docs/MODULE_SPEC.md`](docs/MODULE_SPEC.md).

## Date strategy

TinyManager uses the independent **Webtanan Jalali Date Engine** repository for Persian calendar support. Stored data uses ISO/Gregorian timestamps; presentation is converted to Jalali or Gregorian based on the active locale. This keeps sorting, backup, sync and future APIs predictable.

## Local-first and privacy

The base edition works without an account or server.

- Primary data stays on the user's device.
- Modules never talk directly to a specific database implementation.
- Storage is provided through the TinyManager core API.
- Future adapters can target REST, Supabase or a self-hosted backend.

## Development

```bash
git clone https://github.com/webtanan-sketch/tinymanager.git
cd tinymanager
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run test
npm run build
```

## Design principles

1. One problem, one module.
2. First-class Persian and RTL.
3. Simplicity before feature count.
4. Local-first by default.
5. No module-to-database coupling.
6. One shared design system across repositories.
7. Keyboard and accessibility from the beginning.
8. Every module remains useful outside the core.

## Documentation

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`MODULE_SPEC.md`](docs/MODULE_SPEC.md)
- [`DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

## License

MIT © 2026 Webtanan
