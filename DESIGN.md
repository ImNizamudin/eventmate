---
name: EventMate
description: Student team discovery and collaboration system anchored in EventMate's violet and rose brand identity, built for fast scanning and safe contact exchange.
colors:
  primary: "#5425a7"
  primary-deep: "#3d1880"
  accent-rose: "#b82366"
  accent-rose-bright: "#e74791"
  surface-ground: "#fbf9fd"
  surface-card: "#ffffff"
  surface-rail: "#f6f2fb"
  surface-soft: "#f3eafa"
  ink-primary: "#24163d"
  ink-muted: "#5e5370"
  border-subtle: "#e5dcf0"
  status-pending-bg: "#fef6e7"
  status-pending-fg: "#8a4b00"
  status-accepted-bg: "#eaf7f0"
  status-accepted-fg: "#155e3d"
  status-rejected-bg: "#fdeeee"
  status-rejected-fg: "#9e2424"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-soft:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  button-outline:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  card-surface:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: EventMate

## Overview

**Creative North Star: "The Campus Roster"**

EventMate pairs the warmth and clarity of a student collaboration board with the discipline of an operational directory. Derived from EventMate's existing Brand Refresh identity and logo, the interface anchors itself in deep violet ink and crisp white work surfaces over a faint tinted ground, reserving rose-magenta strictly for primary brand moments and key actions rather than spreading it across every panel.

Inside the signed-in workspace (Operate mode), density, scanability, and state clarity outrank decoration. Every table, filter bar, status badge, and member contact card is laid out so a student can verify slots, application status (`Pending`, `Accepted`, `Rejected`), and consented contact channels in a single pass. On the public entry surface (Persuade mode), the layout opens onto a single clear product frame without invented stats or marketing filler.

**Key Characteristics:**
- Solid white operational cards separated by 1px subtle violet-tinted borders rather than stacked drop shadows.
- Crisp semantic state badges (`Pending`, `Accepted`, `Rejected`) pairing icon, tint, and high-contrast text.
- Consistent 12px control radius and 16px container radius across all screens, reserving pills only for compact status chips.
- Single-axis brand gradient restricted to the hero banner and membership card so working tables and forms stay calm.

## Colors

The palette preserves EventMate's official brand identity from the embedded logo while deepening muted neutrals and rose text fills to pass WCAG AA contrast across every surface.

### Primary
- **Deep Violet** (`#5425a7`): Primary CTA fills, active navigation indicators, primary interactive focus, and brand hero surfaces.
- **Pressed Violet** (`#3d1880`): Hover and active states for primary buttons and high-emphasis links.

### Secondary
- **Rose Magenta** (`#b82366`) & **Bright Rose** (`#e74791`): Brand emphasis derived from the EventMate logo; `#b82366` serves text/badges requiring AA contrast on light surfaces or white text on rose fills, while `#e74791` serves decorative accents inside the brand hero and membership band.

### Neutral
- **Ground Paper** (`#fbf9fd`): Page canvas behind workspace cards.
- **Card Surface** (`#ffffff`): Elevated content cards, forms, modals, and data panels.
- **Rail Tint** (`#f6f2fb`) & **Soft Tint** (`#f3eafa`): Navigation rail background, active nav states, and soft secondary buttons.
- **Primary Ink** (`#24163d`): Headings, card titles, form labels, and primary body copy.
- **Muted Ink** (`#5e5370`): Secondary metadata, helper text, and timestamps (verified >= 6.8:1 on `#fbf9fd`).
- **Subtle Border** (`#e5dcf0`): Hairline dividers and card outlines.

### Named Rules
**The Brand Restraint Rule.** Gradients and rose accents appear only on the public entry hero, workspace announcement/welcome banner, and membership plan card. Forms, filter bars, directories, and status lists remain solid, flat, and high-contrast.

## Typography

**Display Font:** `Manrope` (with `system-ui, sans-serif`)
**Body Font:** `DM Sans` (with `system-ui, sans-serif`)

**Character:** `Manrope` gives headings, team names, and metric numbers geometric firmness without feeling rigid, while `DM Sans` keeps multi-field forms, bio copy, and contact details legible at compact workspace sizes.

### Hierarchy
- **Display** (`800`, `2.25rem` on Operate / `clamp(2rem, 4vw, 3.25rem)` on Persuade, `1.15`, `-0.03em`): Landing page headline and primary workspace greeting.
- **Headline** (`800`, `1.5rem`, `1.25`, `-0.02em`): Page section headers and modal titles.
- **Title** (`700`, `1.0625rem`, `1.35`, `-0.01em`): Team card titles, member names, and panel headings.
- **Body** (`400`, `0.9375rem`, `1.55`, `0em`): Descriptions, announcements, and review copy (constrained to 65-75ch for prose).
- **Label** (`700`, `0.75rem`, `1.3`, `0.06em`): Form field labels, navigation group headers, and status pills.

### Named Rules
**The Tabular Metric Rule.** Slot counts, deadlines, and rating averages use `font-variant-numeric: tabular-nums` so numbers align cleanly across cards and directory rows.

## Layout

The signed-in workspace uses a persistent 248px left navigation rail paired with a sticky 72px top header bar and a fluid content canvas capped at 1200px (`padding: 28px 32px` on desktop). Navigation groups actions into **Workspace** (Temukan Tim, Temukan Individu, Permintaan, Tim Saya, Notifikasi) and **Akun** (Profil, Membership).

On tablet widths (768px to 1024px), the sidebar collapses into a compact 76px icon-plus-label rail or slide-over drawer. Below 768px, the sidebar transitions to a fixed bottom navigation bar for primary destinations plus a full menu drawer so no navigation item clips or overflows, and main content reserves bottom padding (`88px`) to prevent occlusion.

## Elevation & Depth

Surfaces rely on tonal layering (`#fbf9fd` ground vs. `#ffffff` card vs. `#f6f2fb` rail) and crisp `1px solid #e5dcf0` borders rather than pervasive drop shadows.

### Shadow Vocabulary
- **Card Hover** (`0 10px 28px rgba(36, 22, 61, 0.08)`): Applied only to interactive linked cards on hover.
- **Modal Dialog** (`0 24px 64px rgba(18, 10, 34, 0.24)`): Reserved strictly for modal overlays and drawers above the backdrop.

### Named Rules
**The Single-Elevation Rule.** Never stack both a heavy shadow and a thick border on resting cards. Resting cards stay flat with a 1px hairline border; shadows indicate active hover or modal layer separation only.

## Shapes

Controls use structured rectangular radii (`8px` for inputs and skill chips, `12px` for buttons and navigation items, `16px` for cards and panels, `24px` for hero banners and modals), reserving `9999px` pills strictly for compact status badges and small avatars.

## Components

### Buttons
- **Shape:** Gently rounded control corners (`12px` radius) with minimum `44px` touch target height on mobile.
- **Primary:** Deep Violet (`#5425a7`) fill with white label, `11px 18px` padding; shifts to `#3d1880` on hover and `scale(0.99)` on active press.
- **Soft / Secondary:** Soft Tint (`#f3eafa`) fill with Deep Violet (`#5425a7`) text; Outline uses white fill with `1px solid #e5dcf0` border.
- **Danger:** Soft red tint (`#fdeeee`) with `#9e2424` text for reject, block, and sign-out actions.

### Chips & Status Badges
- **Style:** Compact capsule (`9999px`) for `Pending` (`#fef6e7` / `#8a4b00`), `Accepted` (`#eaf7f0` / `#155e3d`), and `Rejected` (`#fdeeee` / `#9e2424`), always pairing an icon and readable text label (never color alone).
- **Skill Tags:** Rectangular (`8px` radius) `#f3eafa` chips with `#3d1880` text so skills never look identical to status pills.

### Cards / Containers
- **Corner Style:** `16px` radius.
- **Background:** `#ffffff` with `1px solid #e5dcf0`.
- **Internal Padding:** `20px` on desktop, `16px` on mobile.

### Inputs / Fields
- **Style:** `1px solid #d5c9e6` border (meets 3:1 non-text contrast), `#ffffff` fill, `8px` radius, explicit visible `<label>` above every field.
- **Focus:** `2px solid #5425a7` outline with `2px` offset (`focus-visible`) so keyboard navigation is unmistakable.

### Navigation
- **Style:** Grouped vertical rail with solid active background (`#f3eafa`), `#5425a7` bold label, and solid icon badge. Never uses decorative left-edge stripes on cards or rows.

## Do's and Don'ts

### Do:
- **Do** verify every foreground/background pair against WCAG AA (>= 4.5:1 normal text, >= 3:1 UI borders and large text).
- **Do** include explicit Loading skeleton, Empty (with next action), and Error (with retry) states on every data page.
- **Do** show shared contact fields only after mutual `Accepted` membership and never for blocked users.

### Don't:
- **Don't** invent placeholder statistics, fake testimonials, or simulated payment activations.
- **Don't** place decorative glow, backdrop blur on every card, or em dashes (`—`) in UI copy.
- **Don't** trap keyboard users in modals without `Escape` close and visible focus rings.
