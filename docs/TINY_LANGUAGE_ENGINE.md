# Tiny Language Engine (TLE)

TinyManager intentionally does **not** require a general-purpose LLM for its core command experience.

TLE is a small, deterministic, bilingual language engine designed for managers who should not have to learn which screen or form to open.

## Product goal

A manager writes a short Persian or English command. TinyManager recognizes only concepts and patterns that are explicitly defined, extracts free-form values into slots, asks for missing required values one at a time, previews mutations, and writes only after confirmation.

```text
Manager sentence
      ↓
Known vocabulary + patterns
      ↓
Intent / action
      ↓
Extracted slots
      ↓
Missing required slot?
  yes → ask one question
  no  → preview if mutating
      ↓
Confirmation
      ↓
Execute domain action
```

If a control phrase is unknown, the flow changes to learning instead of guessing:

```text
Unknown phrase
      ↓
Inline learning card
      ↓
Phrase is prefilled
      ↓
Manager selects a known system concept
      ↓
Optional deterministic suggestions are shown
      ↓
Preview
      ↓
Confirmation
      ↓
Save alias
      ↓
Future commands understand the phrase
```

## Why this is not a general LLM

TLE does not generate arbitrary answers and does not guess an unknown business intent.

It has:

- a finite bilingual concept dictionary;
- explicit intent patterns;
- deterministic slot extraction;
- runtime custom aliases;
- inline supervised learning;
- no model download;
- no API key;
- no internet requirement;
- no hidden prompt behavior.

This makes core commands fast, local-first, auditable and predictable.

## Controlled words vs free values

Control vocabulary is limited. Entity values are not.

Example:

```text
پروژه خط تولید شماره ۳ با بودجه ۵۰۰ میلیون ایجاد کن
```

Controlled concepts:

- `پروژه` → `entity.project`
- `بودجه` → `field.budget`
- `ایجاد` → `action.create`

Free slots:

- `خط تولید شماره ۳` → project name
- `۵۰۰ میلیون` → budget amount

A project name, person name, note or amount does not need to exist in the vocabulary.

## Built-in bilingual concepts

The first vocabulary covers concepts such as:

- project / پروژه
- create / ایجاد
- budget / بودجه
- meeting / جلسه
- cost / هزینه
- waiting / منتظر
- module / ماژول
- enable / فعال
- disable / غیرفعال
- open / باز کردن
- confirm / تأیید
- cancel / لغو
- module identities such as Risk, Waiting For, Delegation and Deadline

The canonical definitions live in:

```text
src/ai/language-engine.ts
```

## Inline supervised learning

When a sentence does not match an existing command, Tiny AI no longer ends with a generic error. It opens a small learning step in the same command surface.

Example:

```text
پروژه انبار با بودجه ۲۰۰ میلیون راه بینداز
```

If `راه بینداز` is unknown, Tiny AI can return:

```text
عبارت «راه بینداز» را نمی‌شناسم.
این عبارت مربوط به کدام بخش TinyManager است؟
```

The learning card contains:

1. the detected phrase, already filled in and editable;
2. a list of concepts currently available in TinyManager;
3. optional deterministic concept suggestions based on the known context;
4. continue / cancel actions.

The manager remains the teacher. A suggestion never becomes training data until the manager selects a concept and confirms the mutation.

## Runtime vocabulary teaching

Managers can also explicitly extend the engine from the same command bar.

Persian example:

```text
برای «ایجاد» واژه «راه بینداز» را اضافه کن
```

English example:

```text
add word "launch" for "create"
```

The new alias is treated as a mutation:

1. TLE resolves the target concept.
2. TinyManager shows a preview.
3. Nothing is written before confirmation.
4. The alias is saved locally after confirmation.
5. Future commands immediately use the alias.

Custom aliases are stored under:

```text
core.language.aliases.v1
```

Therefore they are automatically included in TinyManager backup/restore.

## Suggestion layer

Suggestions are deliberately separate from recognition.

Current level:

- TLE may suggest concepts from explicit context.
- Example: project + budget + unknown trailing action can suggest `action.create`.
- The manager must still choose and confirm.

Future levels can become richer without turning the engine into a general-purpose LLM:

### Level 1 — contextual language suggestions

Suggest the most likely concept for an unknown phrase using recognized concepts in the same sentence.

### Level 2 — learned organization vocabulary

Rank suggestions using aliases previously confirmed by the manager or organization.

### Level 3 — management suggestions

A separate local rule/suggestion layer may inspect structured TinyManager data and propose useful next actions, for example:

- a delegated task has no deadline;
- a Waiting For item has been untouched for too long;
- a project has several high risks and an approaching deadline;
- a weekly review is due;
- a meeting appears expensive relative to its duration and participant count.

These are suggestions, not automatic mutations. A manager always decides whether to act.

## Language scoping

Aliases are language-specific.

A Persian alias is not automatically treated as English and vice versa. This keeps the vocabulary small and prevents accidental cross-language matches.

## Persian normalization

TLE normalizes common Arabic/Persian character differences before matching, including:

```text
ي → ی
ك → ک
```

It also ignores presentation-direction markers and normalizes whitespace/punctuation.

## Safety rules

1. Unknown phrases do not create guessed intents.
2. Unknown phrases can enter supervised inline learning.
3. A suggestion is never saved automatically.
4. A read-only calculation may return immediately.
5. A data mutation requires preview + confirmation.
6. Only one missing required field is requested at a time.
7. Custom vocabulary is persisted only after confirmation.
8. Domain logic remains inside the responsible Core service or module package; TLE only routes and extracts.

## Examples

### Known command

```text
پروژه نمایشگاه با بودجه ۳۰۰ میلیون ایجاد کن
```

→ `core.project.create`

### Missing field

```text
پروژه نمایشگاه ایجاد کن
```

→ asks only for budget.

### Read-only command

```text
جلسه ۸ نفره ۹۰ دقیقه با هزینه ساعتی ۵۰۰ هزار تومان چقدر هزینه دارد؟
```

→ `tiny-meeting-cost.calculate` and returns the result immediately.

### Unknown control wording

```text
پروژه نمایشگاه با بودجه ۳۰۰ میلیون راه بینداز
```

If `راه بینداز` has not been defined, no create intent is guessed. Tiny AI opens the inline learning card and can suggest `ایجاد` from the known project + budget context.

### Teach and reuse

After the manager selects `ایجاد`, reviews the preview and confirms, the phrase becomes an alias of `action.create` and can immediately participate in future commands.

## Future extensions

The same architecture can support:

- a compact Vocabulary Manager in Settings;
- alias removal and disabling;
- organization-specific vocabulary packs;
- per-module vocabulary contributions;
- suggestion ranking from confirmed training history;
- date phrases backed by Webtanan Jalali Date Engine;
- Shared People aliases and nicknames;
- import/export of vocabulary packs;
- proactive management suggestions generated from structured local data.

The recognition engine should remain deterministic even as the vocabulary and suggestion layers grow.
