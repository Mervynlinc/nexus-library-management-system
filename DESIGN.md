# DESIGN.md — Nexus Visual Design System

This describes the visual language for the Nexus frontend, extracted from two reference screenshots (login screen, admin dashboard). Your coding model cannot see images, so this document is the source of truth — implement to these specs exactly rather than defaulting to generic component-library styling.

Reference the two screenshots on request if you (the human) need to sanity-check a build; the coding agent should treat this file as the full spec.

---

## 1. Color palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#F5F6FA` | App background (behind cards), sidebar area background |
| `--color-surface` | `#FFFFFF` | Cards, panels, sidebar, top bar, inputs |
| `--color-border` | `#E7E9F0` | Hairline borders between cards, table rows, dividers |
| `--color-primary` | `#2D8FE0` | Primary buttons, active nav item, links, focus rings, chart primary series |
| `--color-primary-hover` | `#2478C4` | Primary button/link hover state |
| `--color-primary-tint` | `#EAF3FC` | Active sidebar item background, light chip backgrounds |
| `--color-text-primary` | `#1E2433` | Headings, primary body text |
| `--color-text-secondary` | `#8A93A6` | Labels, helper text, muted metadata (dates, counts) |
| `--color-success` | `#3BB273` | "Returned" status, positive states |
| `--color-success-tint` | `#E7F8EF` | Success badge background |
| `--color-danger` | `#E5484D` | "Due"/"Overdue" status, destructive actions |
| `--color-danger-tint` | `#FCEBEC` | Danger badge background |
| `--color-warning` | `#F5A623` | Reserved/pending stat accent |
| `--color-accent-purple` | `#8B7FE8` | "Total Books" stat card accent |
| `--color-accent-green` | `#3BB273` | "Total Members" stat card accent |

**Rule:** the pastel stat-card accents (purple, green, blue, orange) are used only as small icon backgrounds / top borders on the 5 summary cards — never as large fill areas. Everything else in the UI stays in the blue/neutral palette. Don't introduce additional accent hues beyond this table without flagging it.

## 2. Typography

- **Typeface:** `Inter` (Google Fonts / self-hosted), fallback `-apple-system, "Segoe UI", sans-serif`. It's a clean geometric-humanist sans that matches the rounded icons and numeric-heavy dashboard in the reference — don't substitute a serif or a display face.
- Use one family for everything; differentiate hierarchy with weight and size only, not a second typeface.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title (e.g. "Library Management System") | 20px | 600 | `--color-text-primary` |
| Section/card title (e.g. "Library Uses") | 15px | 600 | `--color-text-primary` |
| Stat number (e.g. "142") | 22px | 700 | tabular numerals if available |
| Stat label (e.g. "Total Books") | 13px | 500 | `--color-text-secondary` |
| Body / table text | 14px | 400 | `--color-text-primary` |
| Secondary/meta text (dates, IDs) | 12–13px | 400 | `--color-text-secondary` |
| Nav item | 14px | 500 | 500 when active, 400 when inactive |
| Button label | 14px | 600 | |

No all-caps labels anywhere. No letter-spacing tricks. Sentence case for everything, including nav items and buttons.

## 3. Layout

**Login screen**
- Centered card on the `--color-bg` background, generous margin around it, subtle shadow (`0 20px 40px rgba(20, 24, 40, 0.08)`), `border-radius: 20px`.
- Two-column split inside the card: left ~55% is a full-bleed image panel (rounded corners matching the card), right ~45% is the form, padded generously (48px+).
- Form column is left-aligned, not centered — label above input, full-width inputs, full-width primary button.
- Small brand mark (icon + "Library System" wordmark) above the "Login to your account" heading.
- Social login buttons (Facebook/Google) side by side above a divider that reads "or continue with email" — divider is a thin rule with centered text, not a heavy box.

```
┌─────────────────────────────────────────────┐
│  ┌───────────────┐   [brand icon] Nexus      │
│  │               │   Login to your account   │
│  │   image        │   Welcome back copy       │
│  │   panel        │   [Facebook] [Google]     │
│  │               │   —— or continue with ——   │
│  │               │   Email  [___________]     │
│  │               │   Password [________] 👁   │
│  │               │   ☑ Remember   Forgot pw?  │
│  └───────────────┘   [   Login (primary)   ]  │
│                       New here? Create account│
└─────────────────────────────────────────────┘
```

**Dashboard**
- Fixed left sidebar (~240px), `--color-surface` background, full height. Logo/wordmark top, nav list below, a promo card pinned near the bottom ("Try for Free" style — keep this as a generic upsell/help card, not literal ad copy).
- Active nav item: `--color-primary-tint` background, `--color-primary` text/icon, rounded corners (8–10px), left-aligned icon + label.
- Top bar: page title + welcome line on the left, search input + notification icon + admin avatar/name on the right, all on `--color-bg` (no hard divider needed, just spacing).
- Below top bar: a row of 5 equal-width stat cards (icon in tinted rounded square, big number, label underneath).
- Below that: a 2-column row — a bar chart card ("Library Uses") and a line/area chart card ("Revenue"), plus a stacked list card on the right ("Issued Books", book cover thumbnail + title + meta).
- Below that: a wide activity table (columns: Books, Members Info, Issue & Due Date, Return Date, Status) paired with a "Top Author" list card on the right.
- All cards: `--color-surface`, `border-radius: 14px`, `1px solid --color-border`, `padding: 20px`, no heavy drop shadow — flat with the hairline border doing the separation work.
- Grid gutter: 20px throughout.

```
┌─────────┬──────────────────────────────────────────────┐
│ Nexus   │  Library Management System        🔍  🔔  👤 │
│         ├──────────────────────────────────────────────┤
│ Dashboard│ [142] [44] [28] [13] [27]  ← 5 stat cards    │
│ Books    ├───────────────────┬──────────────────────────┤
│ ...nav.. │ Library Uses (bar)│ Revenue (line)│ Issued   │
│         │                    │               │ Books    │
│         ├───────────────────┴───────────────┤ list     │
│ [promo] │ Library Activity (table)           ├──────────┤
│  card   │                                     │ Top      │
│         │                                     │ Author   │
└─────────┴─────────────────────────────────────┴──────────┘
```

## 4. Components

- **Buttons (primary):** `--color-primary` fill, white text, `border-radius: 10px`, height ~44px, no gradient, `--color-primary-hover` on hover, no shadow.
- **Buttons (secondary/social):** white fill, `1px solid --color-border`, icon + label centered, same radius/height as primary.
- **Inputs:** white fill, `1px solid --color-border`, `border-radius: 10px`, height ~44px, `--color-primary` border + subtle focus ring on focus. Label sits above the input, 13px, `--color-text-secondary`.
- **Status badges** (table "Status" column): pill shape, `border-radius: 999px`, tinted background + matching text color (`success` for Returned, `danger` for Due/Overdue), no border, 12px text, 500 weight.
- **Stat cards:** icon in a small rounded-square tinted background (top-left), big number, label below in secondary text, optional thin colored top border matching that card's accent.
- **Sidebar nav item:** icon + label, 8–10px vertical padding, rounded corners on the active state only, no active-state border — background tint is enough.
- **Charts:** bar chart uses two blue tones (dark `--color-primary`, light `--color-primary-tint` or a lighter blue) for a two-series comparison; line/area chart uses a single blue line with a soft blue fill beneath it. Keep gridlines very light (`--color-border` at low opacity) and axis labels in `--color-text-secondary`.
- **Avatars/thumbnails:** `border-radius: 10px` (not fully circular) for book covers; fully circular for user/author avatars.

## 5. Motion

Keep it minimal: 150–200ms ease-out transitions on hover/focus states (buttons, nav items, inputs) only. No page-load animation choreography, no per-card stagger effects — this is an internal admin/patron tool, not a marketing site.

## 6. Principles

1. **Calm, data-forward, blue-neutral.** The UI's only strong color is the primary blue; everything else is neutral gray/white plus small, purposeful accent tints on stat cards and status badges.
2. **Flat cards over shadows.** Separation comes from hairline borders and background contrast (`--color-bg` vs `--color-surface`), not drop shadows, except the login card which gets one soft shadow because it floats on an open background.
3. **Density with breathing room.** The dashboard shows a lot of information (tables, charts, lists at once) — keep 20px+ gutters and consistent card padding so it doesn't feel cramped despite the density.
4. **Rounded but not playful.** 10–14px radii throughout, consistent geometric sans, tabular numbers for stats — reads as professional admin tooling, not a consumer app.

---

## Implementation notes for the coding agent

- Define the tokens in section 1–2 as CSS custom properties (or a Tailwind theme extension, if Tailwind is used) at the top of the project before building any screen — don't hardcode hex values inline in components.
- Build the login screen and the dashboard shell (sidebar + top bar + stat card row) first, since nearly every other screen inherits from these.
- Match the two reference screenshots' structure and spacing rhythm, not their literal copy or content — book titles, author names, and numbers in the mockups are placeholder data, not real content requirements.