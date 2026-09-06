<p align="center">
  <img src="docs/assets/tinymanager-hero.svg" alt="TinyManager — Small tools. Better management." width="100%" />
</p>

<p align="center">
  <strong>A lightweight, modular, local-first bilingual manager workspace with the Tiny Language Engine</strong>
</p>

<p align="center">
  <a href="README.md">🇮🇷 فارسی</a> · <a href="README.en.md">🇬🇧 English</a>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-First-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=0B1220" />
  <img alt="RTL LTR" src="https://img.shields.io/badge/RTL%20%2F%20LTR-Native-0F766E" />
  <img alt="Local First" src="https://img.shields.io/badge/Local--first-Yes-7C3AED" />
  <img alt="Offline Language Engine" src="https://img.shields.io/badge/Tiny%20Language%20Engine-Offline-D97706" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-111827" />
</p>

# TinyManager

**TinyManager** is not another oversized ERP or project-management suite. It is a focused **manager workspace with a small shared core and installable modules**. Managers activate only the tools they need and can use short commands instead of hunting through menus and long forms.

> **Product principle:** TinyManager should grow with the manager, not overwhelm the manager.

## Current status — v0.1.0-alpha.2

The executable Core now includes:

- bilingual Persian/English App Shell;
- native RTL/LTR mirroring;
- Light / Dark / System themes;
- Module Registry and Module Manager;
- IndexedDB-backed shared Storage API;
- full Core + module Backup / Restore;
- Shared Projects and Shared People with aliases and ambiguity detection;
- Webtanan Jalali Date Engine for Persian dates;
- Tiny AI powered by the **Tiny Language Engine (TLE)** with no external LLM dependency;
- controlled commands for management modules;
- confirmed runtime vocabulary teaching;
- a Vocabulary Manager for custom aliases;
- a Suggestion Center based on confirmed Training History;
- executable routes for every current Alpha module.

### Executable modules

| Module | Status | Purpose |
|---|---|---|
| `tiny-decision-matrix` | Alpha | Rank options using weighted criteria |
| `tiny-meeting-cost` | Alpha | Calculate meeting cost and person-hours |
| `tiny-waiting` | Alpha | Track work waiting on another person |
| `tiny-delegation` | Alpha | Track delegated work and follow-ups |
| `tiny-deadline` | Alpha | Capture deadlines and natural date phrases |
| `tiny-risk` | Alpha | Track probability × impact risks |
| `tiny-raci` | Alpha | Capture Responsible / Accountable ownership |
| `tiny-weekly-review` | Alpha | Build a review from module signals |
| `tiny-project-health` | Alpha | Calculate an explainable health score from live signals |

All nine modules run **standalone** and are also integrated into TinyManager through their own packages. Their domain logic is not copied into Core.

## Tiny AI without a general-purpose LLM

TinyManager does not embed a general-purpose model such as ChatGPT for its core command flow. Its local engine is the **Tiny Language Engine — TLE**.

TLE recognizes only defined bilingual concepts, aliases and patterns. Free values such as project names, people, amounts and notes are extracted into slots.

Example:

```text
Create project Factory Line 3 with budget 500000 USD
```

Controlled concepts:

```text
project → entity.project
budget → field.budget
create → action.create
```

Free values:

```text
Factory Line 3
500000 USD
```

Alpha.2 extends this controlled command flow to the modules. Examples include:

```text
Delegate contract follow-up to Ali
Create deadline Send contract for tomorrow
Add risk supply delay probability 4 impact 5
Weekly review
Project health
```

Mutating actions require preview and confirmation before execution. Read-only reports such as Weekly Review and Project Health only inspect local module data.

### Missing information

Tiny AI does not open a long form when required information is missing. It asks only for the next required value and keeps the current draft in context.

### Unknown phrase → supervised local learning

Unknown phrases are not silently guessed. The manager can map a phrase to one of the controlled TLE concepts, then confirm it.

Aliases are stored under:

```text
core.language.aliases.v1
```

Confirmed learning context is stored under:

```text
core.language.training.v1
```

Both remain local, can be managed from the **Language & Learning Center**, and are included in TinyManager backup/restore.

See [`docs/TINY_LANGUAGE_ENGINE.md`](docs/TINY_LANGUAGE_ENGINE.md).

## Why TinyManager?

Managers need quick answers to questions such as:

- What needs my attention today?
- Who am I waiting on?
- What have I delegated, and to whom?
- Which deadlines are approaching or overdue?
- Which risks matter most?
- Which decision needs to be made?
- How healthy is the current work?

TinyManager separates these concerns into small modules while keeping shared data and user experience inside one Core.

## Modules

| Module | Repository | Purpose |
|---|---|---|
| Decision Matrix | `tiny-decision-matrix` | Compare options using weighted criteria |
| Meeting Cost | `tiny-meeting-cost` | Calculate the real cost of a meeting |
| RACI | `tiny-raci` | Map Responsible / Accountable / Consulted / Informed |
| Risk | `tiny-risk` | Track probability × impact risks |
| Waiting For | `tiny-waiting` | Track items waiting on other people |
| Delegation | `tiny-delegation` | Follow delegated work |
| Deadline | `tiny-deadline` | See upcoming and overdue deadlines |
| Weekly Review | `tiny-weekly-review` | Generate a review from module signals |
| Project Health | `tiny-project-health` | Produce a fast explainable health score |

Each module has two modes:

1. **Standalone** — usable as an independent micro app.
2. **TinyManager Module** — integrated inside TinyManager using the same domain package.

## Shared People

People-related modules use the Core Shared People entity instead of creating separate address books.

- Persian and English names are normalized.
- Each person can have aliases.
- Unique matches resolve directly.
- Ambiguous matches ask for a fuller name rather than guessing.
- Waiting and Delegation store `personId` alongside a readable display name.

## Weekly Review and Project Health

These modules deliberately avoid long manager forms.

**Weekly Review** reads Delegation, Deadline, Risk and Waiting signals and builds a deterministic review.

**Project Health** converts those signals into a 0–100 score with explainable reasons. Both are local and deterministic.

## Bilingual at the core

Persian is the first language and English is the second. Localization is architectural, not a late translation layer.

### Persian mode

- Full RTL interface
- Sidebar on the right
- Jalali dates powered by Webtanan Jalali Date Engine
- Direction-aware controls and navigation

### English mode

- Full LTR interface
- Sidebar on the left
- Gregorian date presentation
- English labels and Latin digits

Switching locale mirrors the entire interface direction as well as translating copy.

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
├── Tiny AI / TLE
│   ├── Controlled vocabulary
│   ├── Core interpreter
│   ├── Module interpreters
│   ├── Action resolver
│   ├── Slot extraction
│   ├── Inline learning
│   ├── Vocabulary Manager
│   └── Suggestion Center
├── i18n + RTL/LTR
├── Module Registry
├── Storage API
├── Date API
├── Theme
├── Backup / Restore
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

See [`docs/MODULE_SPEC.md`](docs/MODULE_SPEC.md).

## Local-first and privacy

The base edition works without an account or server.

- Primary data stays on the user's device.
- TLE requires no internet connection, API key or external model.
- Modules use the Core Storage API rather than talking directly to a database.
- Backups include Core data, module data, Shared People and learned vocabulary.
- A future Cloud Sync adapter can be added without rewriting module domain logic.

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
2. Minimize manager input.
3. Ask one question at a time.
4. Prefer progressive disclosure over configuration walls.
5. First-class Persian and RTL.
6. Local-first by default.
7. No mutation without preview and confirmation.
8. One shared design system across repositories.
9. Every module remains useful outside the Core.
10. Suggestions may become smarter while execution remains controlled.

## Documentation

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`MODULE_SPEC.md`](docs/MODULE_SPEC.md)
- [`DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- [`UX_PRINCIPLES.md`](docs/UX_PRINCIPLES.md)
- [`TINY_LANGUAGE_ENGINE.md`](docs/TINY_LANGUAGE_ENGINE.md)

## Roadmap

- [x] TypeScript + React + Vite foundation
- [x] Bilingual RTL/LTR App Shell
- [x] Module Registry and Module Manager
- [x] IndexedDB Storage API
- [x] Jalali date service
- [x] Backup / Restore
- [x] Offline Tiny Language Engine
- [x] Runtime vocabulary teaching
- [x] Vocabulary Manager + Suggestion Center
- [x] Shared People integration for Waiting and Delegation
- [x] Decision Matrix module
- [x] Meeting Cost module
- [x] Waiting For module
- [x] Delegation module
- [x] Deadline module + natural date phrases
- [x] Risk module
- [x] RACI module
- [x] Weekly Review auto-aggregation
- [x] Project Health scoring
- [x] Executable Core routes for all nine modules
- [ ] Data-rich dashboard widgets
- [ ] Complete PWA Offline Mode
- [ ] First public Alpha release

## License

MIT © 2026 Webtanan
