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

## Why this is not a general LLM

TLE does not generate arbitrary answers and does not guess an unknown business intent.

It has:

- a finite bilingual concept dictionary;
- explicit intent patterns;
- deterministic slot extraction;
- runtime custom aliases;
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

## Runtime vocabulary teaching

Managers can extend the engine from the same command bar instead of opening a configuration wizard.

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
2. A read-only calculation may return immediately.
3. A data mutation requires preview + confirmation.
4. Only one missing required field is requested at a time.
5. Custom vocabulary is persisted only after confirmation.
6. Domain logic remains inside the responsible Core service or module package; TLE only routes and extracts.

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
پروژه نمایشگاه را راه بینداز
```

If `راه بینداز` has not been defined as an alias of `action.create`, no create intent is guessed.

### Teach and reuse

```text
برای «ایجاد» واژه «راه بینداز» را اضافه کن
```

After confirmation, the same wording can participate in project-create commands.

## Future extensions

The same architecture can support:

- a compact Vocabulary Manager in Settings;
- alias removal and disabling;
- organization-specific vocabulary packs;
- per-module vocabulary contributions;
- date phrases backed by Webtanan Jalali Date Engine;
- Shared People aliases and nicknames;
- import/export of vocabulary packs.

The engine should remain deterministic even as its vocabulary grows.
