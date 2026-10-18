---
name: LAOTESI Factory Website
description: A warm, practical B2B kitchenware manufacturing system for the LAOTESI factory website.
colors:
  paper: "#fbfaf6"
  paper-deep: "#f3ede3"
  sage-paper: "#eef3ec"
  white: "#fffefa"
  ink: "#27332f"
  ink-soft: "#46554e"
  muted: "#5f7067"
  about-muted: "#52645a"
  line: "#dedbd2"
  teal: "#176158"
  teal-dark: "#173f3a"
  teal-ink: "#153a35"
  orange: "#e86f42"
  orange-soft: "#f8ddd2"
  gold: "#f2b544"
  steel: "#c9c5bb"
  accent-coral-soft: "rgba(235, 108, 70, 0.12)"
  sage-line: "rgba(39, 51, 47, 0.18)"
typography:
  display:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "clamp(50px, 5.2vw, 76px)"
    fontWeight: 500
    lineHeight: 1.03
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "clamp(32px, 3.2vw, 46px)"
    fontWeight: 500
    lineHeight: 1.13
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
    fontSize: "25px"
    fontWeight: 500
    lineHeight: 1.22
    letterSpacing: "-0.03em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.17em"
rounded:
  none: "0"
  xs: "2px"
  sm: "3px"
  md: "6px"
  circle: "50%"
  pill: "999px"
spacing:
  content-max: "1240px"
  gutter-wide: "48px"
  gutter-tablet: "28px"
  gutter-compact: "20px"
  gutter-mobile: "16px"
  section-y: "122px"
  about-intro-top: "154px"
  about-honors-y: "94px"
  about-responsibility-y: "100px"
  grid-gap: "21px"
  card-padding: "22px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "46px"
  button-header:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "0 15px"
    height: "40px"
  button-ghost:
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "46px"
  about-button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "46px"
  filter-button:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.xs}"
    padding: "0 16px"
    height: "37px"
  product-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0 12px"
    height: "44px"
  about-community-panel:
    backgroundColor: "{colors.teal-dark}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "42px 48px 40px"
---

# Design System: LAOTESI Factory Website

## Overview

**Creative North Star: "The Working Factory, Clearly Seen"**

LAOTESI presents a real manufacturing partner with a warm, practical visual system. Warm paper is the default canvas; sage bands separate proof-oriented content; deep green and teal carry factory confidence; and coral is reserved for action, emphasis, and wayfinding. The result should feel grounded and capable rather than anonymous or overly polished.

The global site uses DM Sans for readable operational copy and Space Grotesk as the scoped About heading voice. The About surface extends this incumbent world with an image-led factory panorama, a sticky section index, calm editorial spacing, direct honors, and dark community panels. Keep the page persuasive for international kitchenware buyers while preserving the static HTML, CSS, and JavaScript implementation.

**Key Characteristics:**

- Warm-white paper with sage proof bands and deep teal action surfaces.
- DM Sans body copy paired with Space Grotesk About headings.
- Restrained 2px, 3px, and 6px corners; rounded pills and circles are reserved for controls.
- Real factory imagery, thin rules, and tonal blocks provide hierarchy without decorative noise.
- The About extension is scoped under `.page-about` and must not change unrelated routes.

## Colors

The palette moves from warm paper and muted sage into deep green-teal proof surfaces, with restrained coral and gold signals for action and status.

### Primary

- **Deep Teal:** `var(--teal)` is the About link, active navigation, and About primary action color.
- **Deep Green:** `var(--teal-dark)` anchors dark community panels and the global dark section.
- **Coral Signal:** `var(--orange)` marks calls to action, active tabs, underlines, labels, and selected metrics.

### Secondary

- **Gold Signal:** `var(--gold)` supports trust-strip metrics and secondary status emphasis.

### Neutral

- **Warm Paper:** `var(--paper)` is the default page canvas and About header surface.
- **Paper Deep:** `var(--paper-deep)` separates product and utility surfaces.
- **Sage Paper:** `var(--sage-paper)` carries factory proof, honors, and quiet content bands.
- **Warm White:** `var(--white)` is used for cards, controls, and reversed text.
- **Ink:** `var(--ink)` is the primary text and dark control color.
- **Ink Soft:** `var(--ink-soft)` supports readable secondary headings and copy.
- **Muted:** `var(--muted)` is used for labels, metadata, and secondary copy.
- **About Muted:** `var(--about-muted)` is the About-specific body-copy tone.
- **Line:** `var(--line)` supplies quiet borders and dividers.
- **Steel:** `var(--steel)` is a restrained neutral for material-adjacent UI details.
- **Soft Coral:** `var(--orange-soft)` and `var(--accent-coral-soft)` keep coral emphasis low-volume.
- **Sage Line:** `var(--sage-line)` is the recurring translucent divider and hover border.

**The Coral Signal Rule.** Coral is a wayfinding and action signal, not a general page wash. Keep it rare enough that a button, underline, or active state remains immediately legible.

## Typography

**Display Font:** Space Grotesk (with DM Sans fallback)
**Body Font:** DM Sans (with Arial fallback)
**Label/Mono Font:** DM Sans; there is no distinct mono face.

**Character:** DM Sans keeps product, factory, and contact copy direct and readable. Space Grotesk gives About headings a measured, technical edge without breaking continuity with the rest of the site.

### Hierarchy

- **Display** (500, `clamp(50px, 5.2vw, 76px)`, line-height `1.03`): About page opening heading; Space Grotesk with tight `-0.03em` tracking.
- **Headline** (500, `clamp(32px, 3.2vw, 46px)`, line-height `1.13`): About section headings and major statements.
- **Title** (500, `25px`, line-height `1.22`): About reason cards and compact content headings.
- **Body** (400, `16px`, line-height `1.55`): global reading copy; About paragraphs tighten to 14-15px with approximately `1.85` line-height for long-form scanning.
- **Label** (700, `10px`, line-height `1.2`, tracking `0.17em`, uppercase where used): eyebrow, metadata, and compact navigation labels.

The global homepage hero remains DM Sans at 72px/0.99 with weight 600; the Space Grotesk override is intentionally scoped to `.page-about` headings.

**The Two Voices, One System Rule.** Use Space Grotesk for About headings and DM Sans for everything users must read, scan, enter, or act on. Do not introduce a third type family.

## Layout

The site uses a centered content rail capped at `1240px`. The default desktop gutter is 48px per side (`calc(100% - 96px)`); it contracts to 28px at the tablet breakpoint, 20px at the compact breakpoint, and 16px on mobile. The About stylesheet adds an About-specific 1100px pass before the global 1060px layout adjustment, then follows the shared 860px and 600px responsive structure. Global sections use 122px vertical padding and collapse to 92px and then 74px at smaller widths.

The About opening uses a large panorama followed by a two-column story layout with a 100px desktop gap. Its section index is sticky beneath the 86px header, uses a 58px minimum row, and tracks the reading position with a coral underline. Honors and responsibility use roughly 0.9/1.1 two-column splits; Why choose uses a 0.8/1.2 split. These collapse to one column on mobile, with the section index reducing its gap to 10px and its row to 53px.

Maintain the existing image-led proof rhythm: the About panorama uses a 2400/953 aspect ratio, the honor wall uses 740/607, and the factory/workplace image uses 548/306. Keep `object-fit: contain` where the source image should remain fully inspectable. Use the existing 21px product-grid gap and the About-specific 24-36px compact gaps rather than introducing a new spacing vocabulary.

## Elevation & Depth

The system is primarily flat and tonal. Paper, sage, teal, and dark green bands establish depth before shadows do. Global product cards use a restrained ambient shadow on hover, while the About extension keeps its header and primary button flat and relies on borders, tonal panels, and image framing. Focus rings are explicit state indicators, not decorative elevation.

### Shadow Vocabulary

- **Ambient Card:** `var(--shadow)` (`0 20px 50px rgba(73, 64, 48, 0.14)`) for global product-card hover.
- **Header Rule:** `0 1px 0 rgba(73, 64, 48, 0.14)` for the scrolled site header.
- **Interactive Product Lift:** `0 14px 32px rgba(39, 51, 47, 0.1)` for the later product-card hover treatment.

**The Flat About Rule.** About surfaces should feel architectural and inspectable. Prefer sage/teal blocks and one-pixel rules; do not add floating shadows to every section.

## Shapes

The form language is restrained and mostly rectangular: 2px fields and filter controls, 3px buttons, and 6px product cards. Language pills use a 999px radius and icon controls use a circular silhouette only where the control is inherently round. About community and reason panels are square-edged tonal blocks. Images clip through `overflow: hidden` only when the source composition calls for it.

Borders are quiet and frequent: the paper line, sage line, and translucent white rules separate information without creating a boxed-in dashboard. Global focus uses a 2px coral outline offset by 4px; About uses a 3px teal outline offset by 5px.

## Components

The component language is practical, tactile, and low-noise. Components should retain visible state changes while staying subordinate to real factory imagery and factual content.

### Buttons

- **Shape:** 3px corners, 46px minimum height, 20px horizontal padding, 10px icon gap.
- **Primary:** global actions use orange with warm-white text; `.page-about` overrides primary and header actions to teal with warm-white text.
- **Header:** 40px minimum height and 15px horizontal padding; hidden at the existing mobile breakpoint.
- **Hover / Focus:** buttons lift by 1-2px, change background or border, and retain a visible focus outline. About focus uses teal with a 5px offset.
- **Ghost / Dark:** ghost buttons preserve a translucent white border on dark imagery; dark buttons use ink and move to teal on interaction.

### Chips

- **Style:** filter bars are paper-deep, 47px high, padded by 4px, and bordered with the line color at 3px radius.
- **State:** filter buttons are 37px high with 2px corners; inactive labels are muted, active labels use ink on warm white, and accent tabs use coral.

### Cards / Containers

- **Corner Style:** global product cards use 6px; About panels are generally square-edged.
- **Background:** product cards use warm white; About alternates warm paper, sage paper, teal, and deep green.
- **Shadow Strategy:** see Elevation & Depth; hover lift belongs to global product cards, not every About block.
- **Border:** one-pixel paper or sage rules are the default separator.
- **Internal Padding:** product-card bodies use roughly 22px; About panels use 42-48px at desktop and contract through the existing media queries.

### Inputs / Fields

- **Style:** labels are compact uppercase DM Sans; fields use a one-pixel line, 2px corners, warm paper background, 44px controls, and 12px horizontal padding. Textareas start at 99px minimum height.
- **Focus:** teal border plus a 3px translucent teal ring.
- **Error / Disabled:** no distinct error or disabled token is defined in the incumbent CSS; preserve the base field language until a real state is implemented.

### Navigation

- **Header:** fixed 86px header, 13px semibold links, 29px desktop gap, and a 2px coral underline that grows on hover/focus. About removes the translucent backdrop treatment and opens with a warm-paper header.
- **About Section Index:** sticky under the header, teal for the current location, coral for the active underline, and 58px minimum height on desktop.
- **Mobile:** existing navigation collapses at the site breakpoints; About section links remain horizontally scannable and reduce to a 53px row with 10px gaps.

### Signature About Surface

The About surface is the distinctive extension: a complete factory panorama, a two-column company story, a sticky reading index, a direct honors block, a dark community panel paired with a sage workplace panel, and a Why choose grid. Keep those patterns under `.page-about` and preserve the uninterrupted image-first opening.

## Do's and Don'ts

### Do:

- **Do** keep warm paper as the default canvas and use sage/teal bands to distinguish proof, community, and action content.
- **Do** use DM Sans for body copy and Space Grotesk for About headings; preserve the established fallback stacks.
- **Do** use real factory and product imagery with the observed aspect ratios and `object-fit: contain` where inspection matters.
- **Do** use coral sparingly for calls to action, active rules, labels, and selected metrics.
- **Do** keep About overrides scoped to `.page-about` so existing product, factory, quality, and contact routes remain stable.
- **Do** retain visible focus states and the existing responsive gutters at 48px, 28px, 20px, and 16px.

### Don't:

- **Don't** replace the warm-white/sage/deep-teal world with a new palette or typography system.
- **Don't** turn the About page into an anonymous supplier-card wall; let the factory panorama and people/workplace proof lead.
- **Don't** add broad rounded cards, decorative gradients, or floating shadows that conflict with the flat tonal system.
- **Don't** introduce unsupported company claims, awards, customer names, testimonials, or capabilities into the visual documentation.
- **Don't** widen About selectors into global styles or break the existing mobile navigation behavior.
