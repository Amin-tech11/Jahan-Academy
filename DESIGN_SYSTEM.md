# Jahan Academy — Design System

> **Version:** 1.0
> **Scope:** MVP v1
> **Date:** September 22, 2026
> **Source of truth:** [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
> **UX specifications:** [UX_PAGE_SPECIFICATIONS.md](./UX_PAGE_SPECIFICATIONS.md)
> **Information architecture:** [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
> **Visual references:** [design-references](./design-references/)

## 1. Design Direction

Jahan Academy uses a calm, credible, academic visual language. The system combines deep navy primary actions, the blue from the supplied logo, generous white space, restrained neutral surfaces, readable bilingual typography, and clear structured content.

The supplied logo is the current brand authority. Approved AI screens and the supplied consultation screenshot guide composition and interaction, but their placeholder facts, typefaces, colors, controls, and third-party branding are not implementation assets.

### 1.1 Principles

1. **Trust over decoration:** Verified content and clear hierarchy take priority.
2. **One dominant action:** Free consultation is the primary public CTA.
3. **Readable in two directions:** Persian RTL and English LTR have equal hierarchy and comfort.
4. **Calm density:** Public pages are spacious; Admin pages are denser but never cramped.
5. **Accessible states:** Focus, validation, status, and selection never rely on color alone.
6. **Responsive by behavior:** Components reflow and reprioritize rather than merely shrink.
7. **Token-driven implementation:** Components consume semantic tokens, not arbitrary local values.

## 2. Foundations

## 2.1 Colors

### Brand palette

| Token | Value | Usage |
|---|---:|---|
| `brand.navy.950` | `#071F31` | Dark hero/footer overlays, strongest brand surface |
| `brand.navy.900` | `#0B2E45` | Primary button, headings on light backgrounds, navbar emphasis |
| `brand.navy.800` | `#123D59` | Primary hover and dark section variants |
| `brand.navy.700` | `#1B526F` | Selected outlines, secondary dark accents |
| `brand.blue.900` | `#12388C` | Logo-aligned deep blue |
| `brand.blue.700` | `#2458B8` | Links and interactive accent |
| `brand.blue.600` | `#2F6FD0` | Hover/active accent where contrast permits |
| `brand.blue.500` | `#4F92D1` | Decorative highlights, charts, soft icon accents |
| `brand.blue.100` | `#E8F1FB` | Selected/light information surface |
| `brand.blue.50` | `#F3F8FD` | Very light branded section background |
| `brand.silver.500` | `#9FA4AA` | Logo-related decorative silver only |
| `brand.silver.100` | `#EEF0F2` | Secondary neutral decoration |

### Neutral palette

| Token | Value | Usage |
|---|---:|---|
| `neutral.950` | `#101820` | Highest-emphasis text |
| `neutral.900` | `#17212B` | Default body/heading text |
| `neutral.700` | `#344054` | Secondary text and labels |
| `neutral.600` | `#475467` | Muted but accessible text |
| `neutral.500` | `#667085` | Placeholder/metadata; verify size/contrast |
| `neutral.400` | `#98A2B3` | Disabled icon/border, never normal body text on white |
| `neutral.300` | `#D0D5DD` | Default input/card border |
| `neutral.200` | `#EAECF0` | Dividers and subtle border |
| `neutral.100` | `#F2F4F7` | Muted surface, skeleton base |
| `neutral.50` | `#F8FAFC` | Page alternate surface |
| `white` | `#FFFFFF` | Primary surface and text on dark backgrounds |
| `black` | `#000000` | Overlays only; normal text uses semantic foreground |

### Semantic palette

| Semantic token | Foreground | Surface | Border | Usage |
|---|---:|---:|---:|---|
| `success` | `#067647` | `#ECFDF3` | `#ABEFC6` | Successful save/submission/sync |
| `warning` | `#B54708` | `#FFFAEB` | `#FEDF89` | Caution, expiring/deferred state |
| `danger` | `#B42318` | `#FEF3F2` | `#FECDCA` | Validation error, destructive action, failed sync |
| `info` | `#175CD3` | `#EFF8FF` | `#B2DDFF` | Informational guidance and system notices |

### Semantic aliases

```css
:root {
  --color-bg-page: #ffffff;
  --color-bg-subtle: #f8fafc;
  --color-bg-muted: #f2f4f7;
  --color-surface: #ffffff;
  --color-surface-brand: #0b2e45;
  --color-text-primary: #17212b;
  --color-text-secondary: #475467;
  --color-text-muted: #667085;
  --color-text-on-brand: #ffffff;
  --color-border: #d0d5dd;
  --color-border-subtle: #eaecf0;
  --color-link: #2458b8;
  --color-link-hover: #12388c;
  --color-action-primary: #0b2e45;
  --color-action-primary-hover: #123d59;
  --color-focus: #2f6fd0;
  --color-selection-bg: #e8f1fb;
}
```

### Color usage rules

- White text is approved on `brand.navy.900` and darker brand surfaces.
- `brand.blue.500`, silver, and `neutral.400` are decorative or large-component colors, not normal text on white.
- Links are underlined in long-form content; navigation links may rely on position plus hover/focus/active treatment.
- Error, success, warning, and sync statuses always combine icon/text with color.
- Hero images require an overlay when text contrast would otherwise vary.
- Do not apply transparent opacity to essential text; choose an explicit accessible token.

### Verified core contrast pairs

| Pair | Contrast ratio | WCAG AA normal text |
|---|---:|:---:|
| White on Navy 900 | 14.08:1 | Pass |
| White on Navy 800 | 11.43:1 | Pass |
| White on Blue 900 | 10.66:1 | Pass |
| Primary text on White | 16.29:1 | Pass |
| Secondary text on White | 7.69:1 | Pass |
| Muted text on White | 4.97:1 | Pass |
| Link Blue 700 on White | 6.64:1 | Pass |
| Danger foreground on White | 6.57:1 | Pass |
| Success foreground on White | 5.69:1 | Pass |
| Warning foreground on White | 5.43:1 | Pass |
| Info foreground on White | 5.99:1 | Pass |

These ratios validate the documented pair only; overlays, opacity, hover combinations, and text over images require separate component-level testing.

## 2.2 Typography

### Font families

| Context | Primary | Fallback stack |
|---|---|---|
| Persian/Arabic | `Vazirmatn` | `Tahoma`, `Arial`, sans-serif |
| English/Latin | `Inter` | `Segoe UI`, `Arial`, sans-serif |
| Numeric/tabular Admin data | Inherit with tabular figures | `font-variant-numeric: tabular-nums` |

Font files shall be self-hosted when licensing permits and subset/loaded by required script and weight. `font-display: swap` is required. Decorative fonts from concept images are not part of the production system.

### Weight tokens

| Token | Weight | Usage |
|---|---:|---|
| `regular` | 400 | Body, helper text |
| `medium` | 500 | Controls, navigation, metadata emphasis |
| `semibold` | 600 | Buttons, card titles, subheadings |
| `bold` | 700 | Page/display headings only |

### Type scale

| Token | Desktop | Tablet | Mobile | Line height | Weight |
|---|---:|---:|---:|---:|---:|
| `display-xl` | 56 px | 48 px | 38 px | 1.15 | 700 |
| `display-lg` | 48 px | 42 px | 34 px | 1.18 | 700 |
| `heading-1` | 40 px | 36 px | 30 px | 1.25 | 700 |
| `heading-2` | 32 px | 30 px | 26 px | 1.3 | 700 |
| `heading-3` | 26 px | 24 px | 22 px | 1.35 | 600 |
| `heading-4` | 22 px | 20 px | 19 px | 1.4 | 600 |
| `body-lg` | 18 px | 18 px | 17 px | 1.8 Persian / 1.65 English | 400 |
| `body-md` | 16 px | 16 px | 16 px | 1.75 Persian / 1.6 English | 400 |
| `body-sm` | 14 px | 14 px | 14 px | 1.7 Persian / 1.55 English | 400 |
| `label-md` | 14 px | 14 px | 14 px | 1.5 | 500 |
| `caption` | 12 px | 12 px | 12 px | 1.6 Persian / 1.45 English | 400 |

### Typography rules

- Public reading text should remain between roughly 55–75 Latin characters per line; Persian content uses a visually comparable readable measure.
- Admin body and table text never drops below 14 px.
- Buttons and inputs use at least 14 px; primary large actions use 16 px.
- Persian numerals follow locale presentation, while stored values remain locale-neutral.
- Headings use semantic HTML hierarchy; visual size does not replace document order.
- Do not justify long text. Persian text aligns start/right; English aligns start/left.

## 2.3 Spacing

The spacing system uses a 4 px base unit.

| Token | Value | Typical use |
|---|---:|---|
| `space-0` | 0 | Reset |
| `space-1` | 4 px | Icon/text micro gap |
| `space-2` | 8 px | Compact internal gap |
| `space-3` | 12 px | Control/icon spacing |
| `space-4` | 16 px | Default component gap/mobile gutter |
| `space-5` | 20 px | Card compact padding |
| `space-6` | 24 px | Card/form padding |
| `space-8` | 32 px | Group separation/tablet gutter |
| `space-10` | 40 px | Large component separation |
| `space-12` | 48 px | Section internal spacing |
| `space-16` | 64 px | Mobile/tablet section spacing |
| `space-20` | 80 px | Desktop section spacing |
| `space-24` | 96 px | Hero/major desktop spacing |

### Layout spacing

| Context | Desktop | Tablet | Mobile |
|---|---:|---:|---:|
| Page horizontal gutter | 32 px minimum | 24–32 px | 16 px |
| Public section vertical padding | 80–96 px | 64–80 px | 48–64 px |
| Admin page padding | 24–32 px | 24 px | 16 px |
| Standard card padding | 24 px | 20–24 px | 16–20 px |
| Form field vertical gap | 24 px | 20–24 px | 20 px |
| Grid gap | 24–32 px | 20–24 px | 16 px |

No component introduces arbitrary spacing outside this scale without a documented exception.

## 2.4 Border Radius

| Token | Value | Usage |
|---|---:|---|
| `radius-none` | 0 | Tables/dividers where edges must align |
| `radius-xs` | 4 px | Tiny tags/progress segments |
| `radius-sm` | 6 px | Compact Admin controls |
| `radius-md` | 8 px | Inputs, standard buttons, alerts |
| `radius-lg` | 12 px | Cards, dropdowns, modal panels |
| `radius-xl` | 16 px | Feature cards, consultation panel |
| `radius-2xl` | 24 px | Hero/media compositions used sparingly |
| `radius-full` | 9999 px | Pills, avatars, status chips |

Nested elements use a radius no larger than the containing surface. Public cards typically use `12–16 px`; Admin tables and dense controls favor `6–8 px`.

## 2.5 Elevation and Borders

| Token | Definition | Usage |
|---|---|---|
| `shadow-none` | none | Default flat surfaces |
| `shadow-xs` | `0 1px 2px rgba(16,24,40,.06)` | Inputs/cards requiring slight separation |
| `shadow-sm` | `0 2px 8px rgba(16,24,40,.08)` | Dropdowns, sticky bars |
| `shadow-md` | `0 8px 24px rgba(16,24,40,.12)` | Modals/drawers |
| `shadow-lg` | `0 16px 40px rgba(16,24,40,.16)` | Large overlays only |

- Prefer `neutral.200/300` borders and surface contrast before shadows.
- Focus ring: 2 px `brand.blue.600` plus 2 px white/surface offset where needed.
- Selected cards use a visible 2 px brand border, optional check icon, and semantic selection state.

## 2.6 Grid, Containers, and Breakpoints

| Mode | Range | Container | Columns | Gutter |
|---|---|---|---:|---:|
| Mobile | 0–767 px | Fluid | 4 | 16 px |
| Tablet | 768–1199 px | Fluid, max 1120 px | 8 | 24 px |
| Desktop | ≥1200 px | Max 1200 px default; 1320 px for approved dense/list layouts | 12 | 24–32 px |

Breakpoints describe component behavior, not device identity. Content must remain usable at intermediate widths and browser zoom up to 200%.

### Responsive layout rules

- Desktop public form grids may use two columns; mobile uses one.
- Tablet uses two columns only when each control retains a comfortable minimum width.
- Public reading content stays narrower than the full container.
- Admin sidebar is persistent on desktop and becomes an accessible drawer below desktop.
- Dense tables progressively hide lower-priority columns into row details/cards.

## 2.7 Icons and Imagery

- Use one consistent outline icon family with 1.75–2 px optical stroke.
- Default icon sizes: 16, 20, 24, and 32 px.
- Icon-only controls require an accessible name and tooltip where the action is not obvious.
- Directional icons mirror in RTL; non-directional symbols do not.
- University/destination media uses stable aspect ratios and meaningful localized alt text.
- Avoid generic AI imagery for factual university representation unless explicitly approved and labeled appropriately.

## 2.8 Motion

- Standard transition: 150 ms ease-out for hover/focus; 200–250 ms for drawers/modals.
- No essential information depends on animation.
- Respect `prefers-reduced-motion`; remove parallax, autoplay, and large transforms.
- Skeleton shimmer may be replaced by a static pulse and must stop when reduced motion is requested.

## 3. Buttons

### 3.1 Variants

| Variant | Default | Hover | Active | Disabled | Usage |
|---|---|---|---|---|---|
| Primary | Navy surface, white text | Navy 800 | Navy 950 | Neutral 200/400 | Main action/consultation/save |
| Secondary | White, navy text, neutral border | Brand blue 50 | Brand blue 100 | Neutral styling | Supporting action |
| Tertiary/Ghost | Transparent, navy/blue text | Subtle brand surface | Brand blue 100 | Muted text | Low-emphasis navigation |
| Danger | Danger foreground/surface or solid danger | Darker danger | Darkest danger | Neutral styling | Delete/anonymize/destructive confirm |
| Link | Blue text, underline contextually | Deep blue | Deep blue | Muted | Inline navigation |

### 3.2 Sizes

| Size | Height | Horizontal padding | Text | Icon |
|---|---:|---:|---:|---:|
| Small | 36 px | 12 px | 14 px medium | 16 px |
| Medium | 44 px | 16 px | 14–16 px semibold | 20 px |
| Large | 52 px | 20–24 px | 16 px semibold | 20–24 px |

Minimum interactive target is 44 × 44 px even when the visual icon is smaller.

### 3.3 Button behavior

- Labels use action verbs: `ثبت درخواست مشاوره`, `ذخیره پیش‌نویس`, `انتشار`, `تلاش مجدد`.
- Loading replaces or precedes the icon while preserving button width.
- Disabled state is not used to hide validation without explanation.
- Full-width is standard for consultation submission and narrow mobile primary actions.
- Button groups stack on mobile with primary first visually; destructive actions remain separated.

## 4. Inputs

### 4.1 Anatomy

1. Persistent label.
2. Optional required/optional indicator.
3. Control container.
4. Optional leading/trailing icon or unit.
5. Helper text.
6. Error/success message.
7. Character count where relevant.

### 4.2 Dimensions

| Context | Height | Padding | Radius | Border |
|---|---:|---:|---:|---:|
| Public default | 48–52 px | 12–16 px | 8 px | 1 px neutral 300 |
| Admin default | 44–48 px | 10–14 px | 6–8 px | 1 px neutral 300 |
| Textarea | Min 120 px | 12–16 px | 8 px | 1 px neutral 300 |

### 4.3 States

| State | Treatment |
|---|---|
| Default | White surface, neutral border, primary text |
| Hover | Border darkens to neutral 400/brand navy 700 |
| Focus | Brand border plus visible focus ring |
| Filled | Same as default; value uses primary text |
| Error | Danger border, icon where useful, error text below |
| Success | Success border/icon only when meaningful, not on every valid field |
| Disabled | Muted surface/text; remains readable and excluded from interaction |
| Read-only | Subtle surface with clear read-only label/icon; value remains selectable |

### 4.4 Input types

- Text/email/URL/number inputs.
- Phone input with country code support and E.164 normalization.
- Select/combobox with keyboard search for long country/university lists.
- Checkbox for consent; radio group for short mutually exclusive choices.
- Date input/date picker with locale-aware display and ISO storage.
- Rich text exists only in authorized Admin content forms and uses an allowlist sanitizer.

### 4.5 RTL/LTR rules

- Field layout follows page direction, but email, URL, phone, currency code, slug, and technical identifiers may use `dir="ltr"` inside RTL forms.
- Icons appear on the logical start/end appropriate to meaning.
- Numeric alignment must remain readable and must not reorder symbols incorrectly.

## 5. Cards

### 5.1 Base card

- Surface: white.
- Border: 1 px `neutral.200`.
- Radius: 12 px standard; 16 px feature card.
- Padding: 24 px desktop, 20 px tablet, 16–20 px mobile.
- Shadow: none or `shadow-xs`; hover elevation only for clickable cards.
- Entire card may be clickable only when it contains one destination; nested controls require distinct hit targets.

### 5.2 Card variants

| Card | Required content | Primary action |
|---|---|---|
| Country | Image, localized name, concise approved descriptor | View country |
| University | Logo/image, name, country/city, type, concise description | View details |
| Program | Title, university, level/field, tuition, duration/intake when available | View details |
| Article | Image, title, summary, author/date where used | Read article |
| Service | Icon, service title, concise description | Learn more/consultation |
| Statistic | Verified number, label, optional source context | Usually none |
| Admin metric | Count, label, trend/status when valid | Open queue/list |
| Admin row card | Primary identifier, key statuses, priority metadata | Open record |

### 5.3 Interactive states

- Hover: border darkens and optional `shadow-sm`; no large movement.
- Focus: full visible focus ring around card link.
- Selected: 2 px brand border plus selected indicator.
- Disabled/unavailable: use only when an action truly cannot occur and explain why.

## 6. Tables

### 6.1 Desktop table

- Header height: 44–48 px; neutral 50/100 surface; 12–14 px semibold.
- Row height: 52–64 px depending on content.
- Horizontal padding: 16 px; vertical padding: 12–16 px.
- Row separators use `neutral.200`; zebra striping is optional and subtle.
- First/primary column remains visually dominant.
- Status uses compact chips with icon/text.
- Row actions appear as labeled action or accessible overflow menu.
- Sticky header may be used within a bounded scrolling region.

### 6.2 Sorting and selection

- Sort control exposes direction in text/accessible state, not icon alone.
- Checkbox selection is used only when a supported bulk action exists.
- Pagination, result count, and page-size control are outside the table body.
- Loading skeletons match visible columns and row heights.

### 6.3 Tablet and mobile

- Tablet hides or moves low-priority columns into row expansion.
- Mobile defaults to labeled cards for operational lists.
- If horizontal scroll is unavoidable, the first column and context remain identifiable and the region is keyboard accessible; this is a last resort.
- Critical lead fields on mobile: reference, name, operational status, assignee, sync status, created/last activity, primary action.

## 7. Modal, Dialog, Drawer, and Sheet

### 7.1 Dialog sizes

| Size | Desktop width | Use |
|---|---:|---|
| Small | 400–440 px | Confirmation, simple warning |
| Medium | 560–640 px | Short form or detail |
| Large | 800–960 px | Complex preview only when a full page is unnecessary |

### 7.2 Modal anatomy

- Backdrop: black at 40–55% opacity.
- Panel: white, 12–16 px radius, `shadow-md/lg`.
- Header: title, optional description, close button.
- Body: scrolls independently only when necessary.
- Footer: primary and secondary actions; destructive confirmation clearly separated.

### 7.3 Behavior

- Focus moves into the dialog, is trapped, and returns to the trigger on close.
- Escape closes non-destructive dialogs; destructive in-progress actions cannot be dismissed accidentally.
- Background is inert and not screen-reader navigable.
- Do not stack dialogs.
- Important creation/edit workflows use full pages rather than large nested modals.

### 7.4 Responsive behavior

- Desktop: centered dialog.
- Tablet: centered or side drawer based on workflow.
- Mobile: bottom sheet for short choices/filters; full-screen dialog for forms and complex details.
- Mobile panel corners are 16 px at exposed top edges; safe-area insets are respected.

## 8. Navbar

### 8.1 Public desktop navbar

- Height: 72–80 px.
- Container: centered max width with 32 px minimum gutter.
- Logo: start side; enough clear space; never distorted.
- Primary links: one line, medium weight, visible active/hover/focus state.
- Utilities: search, locale switcher, consultation button at end side.
- Background: white or lightly translucent only when contrast and performance remain safe.
- Sticky behavior may be used; it must not obscure anchor destinations.

### 8.2 Public tablet navbar

- Height: 68–72 px.
- Keep logo, locale, CTA, and menu trigger.
- Collapse lower-priority links into drawer before labels become cramped.

### 8.3 Public mobile navbar

- Height: 60–64 px.
- Logo, menu trigger, and compact consultation action or clearly visible action inside the menu.
- Drawer uses full-height or near-full-height layout, clear close action, grouped links, locale switch, and primary CTA.
- Current page is announced and visually indicated.

### 8.4 Admin navigation

- Desktop sidebar: 248–280 px expanded; optional compact state only if labels remain discoverable.
- Tablet/mobile: off-canvas drawer triggered from top bar.
- Active section uses brand-light surface, brand text, and indicator—not color alone.
- Section groups match IA: Dashboard, Leads, Discovery, Editorial, Media, Taxonomies, SEO, Integrations, Team, Audit, Settings.
- Hidden menu items improve usability but never replace server authorization.

## 9. Footer

### 9.1 Visual treatment

- Preferred surface: white with top border for standard pages, or `brand.navy.950` for approved campaign/hero ending treatment.
- Dark footer uses white primary text and accessible muted light text.
- Logo retains clear space and uses a version approved for the background.

### 9.2 Desktop

- 4–5 column grid: brand/contact, Discovery, Information, Support, Legal.
- Bottom row: copyright, locale/social actions, policy links as needed.
- Vertical padding: 64–80 px; bottom row separated by subtle border.

### 9.3 Tablet

- 2–3 column wrapping grid.
- Brand/contact spans a wider row where useful.

### 9.4 Mobile

- Single column or accessible accordion groups.
- Primary contact/consultation route appears early.
- Touch targets ≥44 px; social icons have labels accessible to assistive technology.
- Padding: 48–64 px vertical, 16 px horizontal.

## 10. Alerts and Status

### 10.1 Alert variants

| Variant | Icon | Content | Typical use |
|---|---|---|---|
| Success | Check circle | Title + concise outcome + optional action | Lead accepted, saved, synced |
| Error | Alert circle | What failed + corrective action + optional reference | Validation summary, save/sync failure |
| Warning | Warning triangle | Consequence + required attention | Unsaved changes, archive, incomplete content |
| Info | Information circle | Context/help | Form guidance, mock integration notice |

### 10.2 Alert dimensions

- Border/radius: 1 px semantic border, 8–12 px radius.
- Padding: 12–16 px compact, 16–20 px standard.
- Icon: 20–24 px aligned with title.
- Dismiss control only when the message is non-critical and remains discoverable elsewhere.

### 10.3 Toasts

- Use for non-critical confirmations such as saved note or copied reference.
- Do not use toast alone for destructive failure, form validation, or consultation success.
- Desktop: logical top/end stack; mobile: top below navbar or bottom above safe area.
- Minimum visible duration accounts for reading; pause on hover/focus.

### 10.4 Status chips

- Height: 24–28 px; pill radius; 12–14 px medium text.
- Operational lead and Noura sync statuses use distinct labels and never merge.
- Status mapping remains consistent across dashboard, table, detail, and filters.

## 11. Forms

### 11.1 Form layout

| Mode | Columns | Width | Behavior |
|---|---:|---|---|
| Desktop | 2 for related short fields; 1 for long content | Consultation max 780–880 px; Admin based on content | Message, consent, summaries, and primary action span full width |
| Tablet | 1–2 based on minimum control width | Fluid within 24–32 px gutters | Avoid narrow paired selects |
| Mobile | 1 | Full available width within 16 px gutter | Logical sequence; full-width submit |

### 11.2 Consultation form grouping

1. Contact: first name, last name, mobile, email.
2. Study intent: country, intake, start year.
3. Qualification: age, gender, occupation, marital status.
4. Budget: range and currency.
5. Optional message.
6. Privacy/contact consent.
7. Full-width submit.

The form follows the supplied layout reference in structure, while using Jahan Academy tokens, field set, privacy language, and brand identity.

### 11.3 Validation

- Validate on blur for fields already interacted with and on submit for the complete form.
- Do not show an error before the user has a reasonable chance to answer.
- Error summary links/focuses the invalid field.
- Preserve values after server rejection unless they are secrets.
- Required consent cannot be preselected.
- Optional sensitive qualification fields include `Prefer not to say` where applicable.

### 11.4 Admin forms

- Use sections/tabs: General, Persian, English, Structured Data, Media, Relations, SEO, Publish.
- Cross-tab errors appear in a global summary and on the relevant tab.
- Sticky save/action bar may be used on long forms.
- Save Draft is distinct from Publish.
- Publication completeness is visible before the user reaches the Publish action.
- Rich text is sanitized and provides semantic headings/lists/links—not arbitrary visual styling.

### 11.5 Form success and failure

- Public consultation success is an inline/page-level success panel with reference and next step.
- Admin success uses persistent saved status plus optional toast.
- Network failure retains input and offers retry.
- Duplicate consultation is a successful already-received state, not a destructive error.

## 12. Component Responsive Matrix

| Component | Desktop | Tablet | Mobile |
|---|---|---|---|
| Container | 1200 px max, 32 px gutters | Fluid, 24–32 px gutters | Fluid, 16 px gutters |
| Navbar | Full links + utilities + CTA | Logo + selected utilities + menu | Logo + menu + compact/prominent CTA |
| Footer | 4–5 columns | 2–3 columns | Single column/accordion |
| Hero | 2-column or media background | Balanced 1–2 column | Text-first stack, CTA full-width |
| Card grid | 3–4 columns by content | 2 columns | 1 column, occasional 2 for simple tiles |
| Consultation form | 2 columns | 1–2 columns | 1 column |
| Filters | Sidebar/toolbar | Toolbar/drawer hybrid | Drawer/sheet + active chips |
| Public lists | Rich cards/rows | Reduced columns | Stacked cards |
| Admin sidebar | Persistent | Drawer/collapsible | Drawer |
| Admin tables | Full priority columns | Hidden/expanded columns | Labeled cards/row detail |
| Modal | Centered fixed width | Centered/drawer | Bottom sheet or full-screen |
| Button group | Inline | Inline/wrap | Stack when space is insufficient |
| Page actions | Header end side | Header wrap | Sticky/single primary + overflow |

## 13. Accessibility Requirements

- Target WCAG 2.2 AA for critical public and Admin flows.
- Normal text contrast ≥4.5:1; large text and essential graphical components ≥3:1.
- Visible focus is required for every interactive control.
- Minimum pointer target is 44 × 44 px where practical and mandatory for primary/mobile actions.
- Components work with keyboard alone and do not trap focus outside intentional dialogs.
- Form fields have programmatic labels, descriptions, required/invalid states, and error association.
- Live regions announce async search results, validation summary, save, retry, and consultation outcomes without excessive repetition.
- RTL/LTR and 200% zoom must not cause content loss or two-dimensional scrolling in normal content.
- Reduced-motion preference is honored.

## 14. Implementation Token Starter

```css
:root {
  --font-fa: "Vazirmatn", Tahoma, Arial, sans-serif;
  --font-en: "Inter", "Segoe UI", Arial, sans-serif;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  --shadow-xs: 0 1px 2px rgb(16 24 40 / 0.06);
  --shadow-sm: 0 2px 8px rgb(16 24 40 / 0.08);
  --shadow-md: 0 8px 24px rgb(16 24 40 / 0.12);
  --shadow-lg: 0 16px 40px rgb(16 24 40 / 0.16);

  --container-public: 75rem;
  --container-wide: 82.5rem;
  --control-height-sm: 2.25rem;
  --control-height-md: 2.75rem;
  --control-height-lg: 3.25rem;
}

html[lang="fa"] { font-family: var(--font-fa); }
html[lang="en"] { font-family: var(--font-en); }
```

Tailwind theme values shall reference these conceptual tokens. Components shall use semantic aliases such as `bg-surface`, `text-primary`, `border-default`, and `action-primary`, avoiding raw hex values inside component markup.

## 15. Component Definition of Done

A component is ready for use only when:

- [ ] Default, hover, focus, active, disabled, loading, error, and success states relevant to it exist.
- [ ] Persian RTL and English LTR are tested.
- [ ] Desktop, Tablet, and Mobile behavior is documented and verified.
- [ ] Keyboard and screen-reader semantics are correct.
- [ ] Color contrast meets the stated requirements.
- [ ] Text expansion and long Persian/English labels do not break layout.
- [ ] Component consumes design tokens rather than one-off values.
- [ ] Automated component tests and visual examples cover high-risk states.
- [ ] No placeholder brand, copied third-party asset, or unapproved functionality remains.

## 16. Change Control

Changes to brand colors, typography, spacing scale, breakpoints, component anatomy, or interaction states require an update to this document and affected UX specifications. Changes that alter product behavior, form fields, navigation, permissions, or scope must first be approved in `PROJECT_CONTEXT.md` and synchronized with the SRS, Information Architecture, User Journeys, implementation, and tests.
