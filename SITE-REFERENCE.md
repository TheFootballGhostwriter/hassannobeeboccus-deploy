# SITE-REFERENCE.md

Single source of truth for **hassannobeeboccus.com** — the Hassan Nobeeboccus / The Football Ghostwriter site.

Read this before making any change. It describes how the site is built, what the conventions are, and how to ship a new page without breaking the patterns everything else depends on.

---

## 1. Overview

- **Brand**: Hassan Nobeeboccus / The Football Ghostwriter (TFG)
- **Domain**: `hassannobeeboccus.com`
- **Stack**: Static HTML + one Vercel serverless function
- **Hosting**: Vercel (project `hassan-ns-projects/hassannobeeboccus-deploy`)
- **Source**: `github.com/TheFootballGhostwriter/hassannobeeboccus-deploy`
- **DNS**: Namecheap
- **Email + EECs**: MailerLite (via `/api/subscribe.js`)
- **Analytics**: GA4 `G-8ER6D68M04` + Vercel Web Analytics, both consent-gated
- **Booking**: cal.eu — two events, both embedded inline on dedicated pages:
  - Free 30-min intro call (`30min` slug) → `/book-a-call`
  - Paid Director's Debrief (`the-director-s-debrief` slug) → `/directors-debrief`

No build step. Edit HTML → `vercel --prod` → git commit + push. That's the entire loop.

---

## 2. File structure

```
hassannobeeboccus-deploy/
├── index.html                          Main home page
├── football-thoughts.html              Football Thoughts hub — unified feed (filter bar + card badges)
├── <post-slug>.html                    Individual Football Thoughts post
│                                       (editions, articles, notes all live at repo root
│                                       and resolve via /football-thoughts/:slug wildcard)
│   e.g.  does-coaching-licence-develop-you.html
│         female-coaches-football-decline-uk.html
│         football-development-practitioners-invisible-online.html
├── buildyourpublicvoice.html           EEC landing (Build Your Public Voice)
├── 5-development-models.html           EEC landing (5 Development Models)
├── freecourses.html                    Courses hub (/courses)
├── privacy.html                        Privacy policy
├── alternative-models-framework.html   In-browser PDF-style viewer (EEC2 asset)
├── conversation-to-content-map.html    In-browser PDF-style viewer (EEC1 asset)
├── blog-post-template.html             Template — duplicate for new editions / articles
├── note-template.html                  Template — duplicate for new notes (site-exclusive)
├── shared.css                          Tiny base stylesheet (loaded on every page)
├── vercel.json                         Routing (redirects + rewrites)
├── sitemap.xml                         Sitemap (manually maintained)
├── robots.txt                          Sitemap pointer
├── api/
│   └── subscribe.js                    MailerLite form handler (serverless)
├── favicon.png
├── og-image.png                        Default OG image (home, FT)
├── og-course.png                       OG image for buildyourpublicvoice
├── og-models.png                       OG image for 5-development-models
├── headshot.{webp,jpg}                 Hero portrait
├── goal-bg.{webp,jpg}                  Page-header background texture
└── SITE-REFERENCE.md                   This file
```

---

## 3. URL map

All routing lives in `vercel.json`. Two sections: `redirects` (308 permanent) and `rewrites` (internal, user-facing URLs resolve to `.html` files).

### Canonical URLs

| URL | Serves | Notes |
|---|---|---|
| `/` | `index.html` | Home |
| `/build-your-public-voice` | `buildyourpublicvoice.html` | EEC landing |
| `/buildyourpublicvoice` | `buildyourpublicvoice.html` | Legacy alias |
| `/course` | `buildyourpublicvoice.html` | Short alias |
| `/5-development-models` | `5-development-models.html` | EEC landing |
| `/courses` | `freecourses.html` | Courses hub |
| `/free-courses` | `freecourses.html` | Alias |
| `/football-thoughts` | `football-thoughts.html` | FT hub — unified feed with filter bar (All · Editions · Articles · Notes) |
| `/football-thoughts/[slug]` | `/[slug].html` | Individual post (editions, articles, notes — single flat namespace) |
| `/book-a-call` | `book-a-call.html` | Free 30-min call (Cal embed, consent-gated) |
| `/directors-debrief` | `directors-debrief.html` | Paid Director's Debrief (Cal embed, consent-gated) |
| `/privacy` | `privacy.html` | Privacy |
| `/alternative-models-framework` | `alternative-models-framework.html` | EEC asset viewer |
| `/alternative-models-framework.pdf` | `alternative-models-framework.html` | Forces `.pdf` URLs to the viewer |
| `/conversation-to-content-map` | `conversation-to-content-map.html` | EEC asset viewer |
| `/conversation-to-content-map.pdf` | `conversation-to-content-map.html` | Forces `.pdf` URLs to the viewer |

### Permanent redirects (308)

| Source | Destination |
|---|---|
| `/footballthoughts` | `/football-thoughts` |
| `/footballthoughts/:slug` | `/football-thoughts/:slug` |
| `/writing` | `/football-thoughts` |
| `/football-thoughts/blog` | `/football-thoughts?filter=edition` |
| `/football-thoughts/notes` | `/football-thoughts?filter=note` |

### Rules for adding routes

- **Specific routes before general.** Vercel evaluates rewrites in order; first match wins. Nested `:slug` patterns must come before the parent.
- **No trailing slashes** in sources.
- **Always add the file before the rewrite.** Otherwise the URL 404s after deploy.
- **Update `sitemap.xml`** for any new indexable URL.

---

## 4. Design tokens

### Colour palette

Defined in `shared.css` `:root` and duplicated in each page's inline `<style>` block.

| Token | Light value | Role |
|---|---|---|
| `--cream` | `#FAF7F2` | Page background |
| `--green` | `#1B3A2D` | Primary (nav, CTA, headings) |
| `--gold` | `#C9A84C` | Accent (highlights, buttons, borders) |
| `--terracotta` | `#C0392B` | Secondary accent (italic emphasis) |
| `--green-light` | `#244d3c` | Hover/alt green |
| `--green-dark` | `#0f2318` | Footer background |
| `--text` | `#1a1a1a` | Body text |
| `--text-muted` | `#555` | Muted text, meta |
| `--border` | `#e2ddd6` | Card/element borders |
| `--bg-alt` | `#f0ebe2` | Alternate section background |
| `--card-bg` | `#fff` | Card background |

### Dark mode (body.dark)

| Token | Dark value |
|---|---|
| `--cream` | `#141414` |
| `--text` | `#e0ddd8` |
| `--text-muted` | `#9a9590` |
| `--border` | `#2a2725` |
| `--bg-alt` | `#1c1c1c` |
| `--card-bg` | `#1e1e1e` |

Dark mode is selector-based: `body.dark` applies overrides. No `prefers-color-scheme` auto-switch — the initial class is set from `localStorage.getItem('theme')` on load, falling back to `document.body.classList.add('dark')` unless the user explicitly prefers light via media query.

### Typography

- **Sans**: `Inter` — weights `400, 500, 600, 700`
- **Serif**: `Merriweather` — weights `400, 700, 900`, plus italic `400`
- **Base body**: `Inter`, 17px, line-height 1.7
- **Mobile body**: 16px (≤640px)
- **Headings**: `Merriweather`, `var(--green)`
  - `h1`: `clamp(1.75rem, 3.5vw, 2.5rem)`, weight 900
  - `h2`: `clamp(1.2rem, 2vw, 1.5rem)`, weight 700
  - `h3`: `1.05rem`, weight 700 (cards) or `1.1rem` (article body)
- **Accent italic** (for inline terracotta emphasis): `.accent-italic { font-family: 'Merriweather', serif; font-style: italic; color: var(--terracotta); }`

### Spacing + radius + shadow

- **Container**: `max-width: 700px; margin: 0 auto; padding: 0 1.5rem` (1.25rem on mobile)
- **Section padding**: `3rem 0` (writing-section), `2rem 0` (coming-soon)
- **Card radius**: `12px`
- **Nav/CTA radius**: `50px` (pill)
- **Shadow (card default)**: `0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.04)`
- **Shadow (card hover)**: `0 24px 60px rgba(0,0,0,0.2), 0 0 0 2px rgba(201,168,76,0.2)`

### Easing

`--ease: cubic-bezier(0.22, 1, 0.36, 1)` — used for fade-in, stagger, nav tab underlines, footer icon hover.

---

## 5. Content + voice rules

- **British English.** Colour not color, realise not realize, licence (noun), centred, favour.
- **No em dashes.** Rewrite or use commas / full stops.
- **No exclamation marks.** Ever.
- **Sentence case for headings** (unless a proper noun demands caps). Section titles can title-case occasionally (e.g. `Football Thoughts`) but within-page headings stay sentence case.
- **Italic + terracotta for inline emphasis** (use sparingly — 1 per page max, usually in the hero).
- **Card excerpts**: 2–3 sentences max. Must hook, not summarise.
- **Numbers**: digits for 10+, written for under (`5 days to get known`, but `37,242 impressions`).
- **Card meta**: `<minutes> min read &middot; <Month Year>` for long-form. Impressions for LinkedIn posts.

---

## 6. Page anatomy

Every page follows this DOM sequence:

```
<body>
  ├── .skip-link              (accessibility — hidden, visible on focus)
  ├── <nav>                   (sticky, blurred)
  │     └── .nav-inner
  │           ├── .nav-brand  (wordmark + LinkedIn icon)
  │           ├── .nav-tabs   (in-page/adjacent links)
  │           └── .nav-cta    (Book a Call)
  │
  ├── <main id="main-content">
  │     ├── .page-header      (green hero w/ gradient mesh)
  │     ├── section blocks    (.writing-section.has-texture, etc.)
  │     └── .ft-cta           (green gradient mesh CTA bridge)
  │
  ├── <footer>
  │     ├── .footer-inner     (brand + icons + links)
  │     └── .footer-copy      (copyright line)
  │
  ├── .back-to-top            (fixed bottom-right)
  ├── .theme-float            (fixed above back-to-top)
  ├── .cookie-float           (fixed further up)
  │
  └── <script>                (theme init, scroll, intersection observer, consent)
```

---

## 7. Nav

Sticky top, semi-transparent green with `backdrop-filter: blur(16px)`, gold underline accent.

```html
<nav>
  <div class="nav-inner">
    <div class="nav-brand">
      <a class="wordmark" href="/">
        Hassan Nobeeboccus
        <span class="wm-sep">|</span>
        <span class="wm-title">The Football Ghostwriter</span>
      </a>
      <a class="nav-linkedin" href="https://www.linkedin.com/in/thefootballghostwriter/" target="_blank" rel="noopener" aria-label="LinkedIn">
        <svg class="li-icon" ...>...</svg>
      </a>
    </div>
    <div class="nav-tabs">
      <!-- page-specific links -->
    </div>
    <a href="https://cal.eu/thefootballghostwriter/30min" target="_blank" rel="noopener" class="nav-cta">Book a Call</a>
  </div>
</nav>
```

### Nav rules

- **Wordmark**: `Merriweather`, 0.9rem, 700. The `|` separator is `var(--gold)`. "The Football Ghostwriter" is italic terracotta-ish (`#C4574A`).
- **Below 640px**: the separator + title hide, leaving only "Hassan Nobeeboccus".
- **LinkedIn icon**: 16×16, 50% opacity, scales to 1.15 on hover.
- **Nav tabs**: 0.88rem, 500. Gold 1px underline slides in on hover (`width 0 → 100%`, 0.3s `var(--ease)`).
- **Nav CTA (Book a Call)**: gold pill, green text, 0.85rem, 600, pads 0.5rem × 1.1rem.
- **Below 900px**: `.nav-tabs` wraps to a full-width second row with a gold top border.

### Per-page nav-tabs patterns

| Page | Tabs |
|---|---|
| `/` | About · Services · Courses · Questions · Contact |
| `/football-thoughts` (and archives, post pages) | Home · Football Thoughts · Football Academy Intelligence (ext) |
| `/build-your-public-voice` | Home · Courses · etc. |
| `/5-development-models` | Home · Courses · etc. |

Nav tabs are **page-scoped** — an anchor like `#services` only makes sense on the page that owns the section. For cross-page references, use absolute `/page#section`.

---

## 8. Page header (hero block)

Green block with a radial-gradient mesh, optional SVG texture or image, eyebrow OR breadcrumb + h1 + subtitle.

```html
<div class="page-header">
  <div class="container">
    <div class="eyebrow">Football Thoughts</div>   <!-- optional, archive/landing pages -->
    <h1>Page title</h1>
    <p>Standfirst / subtitle.</p>
  </div>
</div>
```

For individual blog posts and notes, swap the `.eyebrow` for a breadcrumb:

```html
<nav class="breadcrumbs" aria-label="Breadcrumb">
  <a href="/football-thoughts">Football Thoughts</a>
  <span class="bc-divider" aria-hidden="true"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10.5"/><polygon points="14.2 8.18 9.8 8.18 7.59 12 9.8 15.82 14.2 15.82 16.41 12 14.2 8.18"/></svg></span>
  <a href="/football-thoughts">Football Thoughts</a>
</nav>
<h1>Article title</h1>
```

- **Padding**: `3.5rem 0 3rem` desktop, `2.5rem 0 2rem` mobile.
- **Gradient mesh** (`::before`): two radial gradients at 25%/50% gold (0.18) and 75%/30% terracotta (0.10), transparent beyond 55%.
- **Optional image texture** (`::after`): `goal-bg.webp` with 0.03 opacity, greyscale. Only used on `football-thoughts.html` and similar brand pages.
- **Eyebrow**: `Merriweather` italic, 0.78rem, 600, uppercase, gold, letter-spacing 0.08em.
- **Hub mark (Football Thoughts pages)**: the football-hex SVG scaled to 52×52 (44×44 mobile), gold stroke at 1.75, soft gold drop-shadow (`rgba(201,168,76,0.35)` at 10px blur). Sits **inline to the left of the H1** inside a `.hero-title-row` flex wrapper (`display: flex; align-items: center; gap: 1rem; flex-wrap: wrap`) so the mark and the heading read as a single title unit. Used on `/football-thoughts` only. Do not use on individual post/note pages — those use the breadcrumb instead.
- **Breadcrumb**: `Merriweather` italic, 0.85rem, gold links with terracotta hover and a sliding 1px underline, separated by the football-hex SVG at 11×11 in soft gold (`rgba(201,168,76,0.55)`). One crumb only — `Football Thoughts`. The article title sits below as the implicit current page; don't add a second crumb.
- **h1**: cream, margin-bottom 0.5rem.
- **Subtitle `p`**: `rgba(250,247,242,0.6)`, 0.95rem.

Dark mode: header background darkens to `#0d1f16`.

---

## 9. Writing sections (the card list pattern)

```html
<div class="writing-section has-texture fade-in" id="section-id">
  <div class="container">
    <div style="width:40px;height:3px;background:var(--gold);margin-bottom:1.5rem;"></div>
    <h2>Section heading</h2>
    <p class="section-desc">Optional italic description.</p>
    <div class="writing-list">
      <!-- cards go here -->
    </div>
    <p class="section-note">Optional footer note (e.g. subscribe).</p>
  </div>
</div>
```

### Variants

- **Default**: full-width, cream background, `has-texture` SVG overlay at 0.05 opacity
- **Alt background**: add `style="background:var(--bg-alt);"` to alternate sections visually
- **Gold divider bar**: the small `<div>` with `width:40px;height:3px;background:var(--gold);` — present at the top of every section for consistency

### Card types

| Class | Left border | Tag colour | Used for |
|---|---|---|---|
| `.writing-card` (default) | `var(--terracotta)` | terracotta | LinkedIn-linked cards (external), was used for historical FT content |
| `.writing-card.blog-card` | `var(--gold)` | gold | Blog posts (republished, on-site) |
| `.writing-card.note-card` | `var(--gold)` | gold | Notes (site-exclusive short form) |

```html
<!-- Football Thoughts card (used on /football-thoughts feed) -->
<a class="writing-card blog-card fade-in" data-type="edition" href="/football-thoughts/[slug]">
  <div class="card-type-badge">Edition</div>
  <div class="card-tag">Football Academy Intelligence &middot; Edition 3</div>
  <h3>Card title</h3>
  <p class="card-excerpt">2–3 sentence hook.</p>
  <div class="card-meta">
    <span>April 2026</span>
    <span>&middot;</span>
    <span>6 min read</span>
  </div>
</a>
```

### Filter bar (Football Thoughts hub only)

The `/football-thoughts` hub prepends a sticky filter bar **outside** `.writing-section`, directly below the `.page-header`:

```html
<nav class="writing-filter" aria-label="Filter writing by type">
  <div class="wf-inner" role="group">
    <button class="wf-chip is-active" data-filter="all" aria-pressed="true">All</button>
    <button class="wf-chip" data-filter="edition" aria-pressed="false">Editions</button>
    <button class="wf-chip" data-filter="article" aria-pressed="false">Articles</button>
    <button class="wf-chip" data-filter="note" aria-pressed="false">Notes</button>
    <span class="wf-count" aria-live="polite"></span>
  </div>
</nav>
```

- **Sticky positioning**: `top: 60px` desktop, `110px` ≤900px, `100px` ≤640px (below the nav).
- **Chip**: Merriweather italic pill with terracotta hover and gold outline. Active chip flips to Inter 600 on a solid gold background.
- **Filter JS** (inline on `/football-thoughts`): reads `data-type` on each card, toggles `.hidden`, updates the live count. `?filter=edition|article|note` URL param pre-selects the chip (used by the `/blog` and `/notes` 308 redirects). On filter change the feed scrolls into view (honours `prefers-reduced-motion`).
- **Show more**: initial render caps the list at 6 cards; a `.show-more` button reveals the rest with a "`Show N more`" label. Lives inside `.show-more-wrap`, which the JS toggles via the `[hidden]` attribute.
- **Critical CSS guard**: the default `.writing-card { display: block }` overrides the native `[hidden]` attribute, so the page stylesheet **must** include `.writing-card[hidden], .show-more-wrap[hidden] { display: none }` alongside the base rule. Without that rule the JS fires but cards stay visible.

### Card type badge (Football Thoughts only)

Every card on `/football-thoughts` carries:

- `data-type="edition" | "article" | "note"` on the `<a>` (filter hook)
- `<div class="card-type-badge">Edition|Article|Note</div>` as the first child — a small pill in the top-right corner. **Edition badges are terracotta**; article/note badges are gold.
- `.card-tag` gets `padding-right: 5.5rem` so it never collides with the badge.

### Card styling (exact)

- **Background**: `var(--card-bg)`
- **Border**: `1px solid var(--border)`, plus `4px solid` left border in the type colour
- **Radius**: `12px`
- **Padding**: `1.5rem`
- **Hover**: border becomes `var(--gold)`, shadow grows, transform `translateY(-2px)`
- **Transition**: `0.3s var(--ease)` on shadow and transform

---

## 10. `.has-texture` overlay

Subtle hand-drawn SVG pattern baked into the CSS as a data-URI. Opacity 0.05 light, 0.025 inverted dark.

Apply by adding `has-texture` to any container element. The pseudo-element sits behind content (`z-index: 0`), content is lifted via `.has-texture > * { position: relative; z-index: 1; }`.

---

## 11. `.section-desc`, `.section-note`, `.coming-soon`

- **`.section-desc`**: italic, 0.88rem, muted, sits directly below the `h2`, above the card list. For introducing the section.
- **`.section-note`**: italic, 0.88rem, muted, sits below the card list. For addendum (e.g. newsletter subscribe line). Links in here are gold.
- **`.coming-soon`**: italic bridge paragraph, 0.93rem, muted, padding `2rem 0`. Used for site-level "more coming" messages between sections.

---

## 12. `.ft-cta` (CTA bridge)

Green block with a gradient mesh, centered text, gold pill button. Sits between the last content section and the footer.

```html
<div class="ft-cta">
  <div style="max-width:700px;margin:0 auto;position:relative;z-index:1;">
    <p style="font-size:0.95rem;color:rgba(250,247,242,0.75);margin-bottom:1.25rem;">
      This is the kind of content I ghostwrite<br>for football development leaders.<br>If you want to get known for your thinking, let's talk.
    </p>
    <a href="https://cal.eu/thefootballghostwriter/30min" target="_blank" rel="noopener"
       style="display:inline-block;background:var(--gold);color:var(--green);font-family:'Inter',sans-serif;font-weight:600;font-size:1rem;padding:0.9rem 2rem;border-radius:50px;text-decoration:none;">
      Book a Call
    </a>
  </div>
</div>
```

Gradient mesh: two radial gradients at 30%/50% gold (0.22) and 70%/40% terracotta (0.13).

---

## 13. Article body (for individual blog posts + notes)

See `blog-post-template.html` / `note-template.html`. Live inside `.article-body` within a `<main>`, max-width 680px.

```css
.article-body { padding: 3rem 0 4rem; }
.article-body article { max-width: 680px; margin: 0 auto; }
.article-body h2 { margin: 2rem 0 0.75rem; font-size: 1.25rem; }
.article-body h3 { margin: 1.5rem 0 0.5rem; font-size: 1.1rem; }
.article-body p { margin-bottom: 1.25rem; line-height: 1.8; }
.article-body blockquote {
  border-left: 4px solid var(--gold);
  padding-left: 1.25rem;
  margin: 1.5rem 0;
  color: var(--text-muted);
  font-style: italic;
}
.article-body .reading-time {
  font-size: 0.82rem; color: var(--text-muted);
  margin-bottom: 2rem; font-family: 'Inter', sans-serif;
}
.article-back {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: var(--green); font-size: 0.88rem; font-weight: 600;
  text-decoration: none; margin-top: 2.5rem;
}
.article-back:hover { color: var(--gold); }

/* Blog posts only — not notes */
.article-linkedin {
  display: inline-block;
  color: var(--text-muted); font-size: 0.82rem;
  text-decoration: none; margin-top: 0.5rem;
}
.article-linkedin:hover { text-decoration: underline; }
```

### Template metadata to populate per post

Every individual blog post / note must update these:

- `<title>`
- `<meta name="description">`
- `<link rel="canonical">`
- `<meta property="og:url">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta name="twitter:title">`
- `<meta name="twitter:description">`
- JSON-LD `headline`, `description`, `url`, `datePublished`
- `.page-header h1`, standfirst paragraph
- `.reading-time` value
- Article body
- Blog posts only: `<a class="article-linkedin" href="[LINKEDIN_URL]">`

---

## 14. Footer

Dark green, 2.5rem padding, two-group layout (brand+icons left, links right), copyright line across full width.

```html
<footer>
  <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;align-items:flex-start;gap:1rem;">
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <span style="font-family:'Merriweather',serif;font-size:0.88rem;font-weight:700;color:rgba(250,247,242,0.6);">Hassan Nobeeboccus</span>
      <a href="https://www.linkedin.com/in/thefootballghostwriter/" target="_blank" rel="noopener" aria-label="LinkedIn" style="color:rgba(250,247,242,0.5);"><!-- LinkedIn SVG --></a>
      <a href="/football-thoughts" aria-label="Football Thoughts" style="color:rgba(250,247,242,0.5);"><!-- FT hex icon SVG --></a>
    </div>
    <div style="display:flex;gap:1.25rem;flex-wrap:wrap;align-items:center;">
      <a href="/">Home</a>
      <a href="/#services">Services</a>
      <a href="/courses">Courses</a>
      <a href="mailto:thefootballghostwriter@outlook.com">Email</a>
      <a href="/privacy">Privacy Policy</a>
    </div>
  </div>
  <div style="width:100%;text-align:center;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid rgba(250,247,242,0.1);font-size:0.8rem;color:rgba(250,247,242,0.35);">
    &copy; 2026 Hassan Nobeeboccus. All rights reserved.
  </div>
</footer>
```

### Footer rules

- **Background**: `var(--green-dark)` (`#0f2318`) light, `#090f0c` dark
- **Link colour**: `rgba(250,247,242,0.5)`, hover → `var(--gold)`
- **Link font-size**: 0.85rem
- **Mobile**: links get `min-height: 44px` for touch targets
- **Icons (aria-label links)**: `display: inline-flex; align-items: center; justify-content: center`, scale to 1.15 on hover (`transition: transform 0.2s var(--ease), color 0.2s`). The `min-width: 44px; min-height: 44px` touch-target sizing **only applies at `max-width: 640px`** — on desktop the icons hug the brand text and each other at the natural 15×15 SVG size (8px gap, set by the brand flex container's `gap: 0.5rem`). Pulling the 44×44 box onto desktop puts ~22px of dead space between the brand text and each icon and reads as a spacing bug. Both rules live in `shared.css`.
- **Link text**: include `Home`, `Services` (home anchor), `Courses` (→ `/courses`), `Email` (mailto), `Privacy Policy`. EEC landing pages may have reduced sets (Home · Email · Privacy Policy only).
- **Layout**: outer flex stacks vertically (`flex-direction: column; align-items: flex-start; gap: 1rem`) so every page gets three rows — brand+icons, link list, copyright — regardless of how many links fit. The alternative (row + `space-between`) leaves the LinkedIn and Football Thoughts icons floating in the middle of the footer when the link list is short, and the mismatch against the home page (where 9 links force a natural wrap) reads as a spacing bug. Stacking is the consistent answer.
- The copyright `<div>` stays a sibling of the flex container with `width:100%; text-align:center`, so it renders full-width and centred no matter how the rows above stack.

### Required footer icons

1. **LinkedIn** — `aria-label="LinkedIn"`, 15×15, opens in new tab
2. **Football Thoughts** — `aria-label="Football Thoughts"`, 15×15, hex-shape SVG with 6 tick lines (circle + polygon + 6 `<line>` elements)

---

## 15. Back-to-top button

Fixed, bottom-right, appears after 600px scroll, 0.4 opacity default, 0.7 on hover.

```css
.back-to-top {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 90;
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--green); color: var(--cream);
  border: none; cursor: pointer; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.back-to-top.show { opacity: 0.4; pointer-events: auto; }
.back-to-top:hover { opacity: 0.7; }
body.dark .back-to-top { background: var(--gold); color: #141414; }
```

```html
<button class="back-to-top" id="backToTop" aria-label="Back to top">&uarr;</button>
```

```js
var btt = document.getElementById('backToTop');
window.addEventListener('scroll', function() {
  btt.classList.toggle('show', window.scrollY > 600);
});
btt.addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

---

## 16. Theme float (light/dark toggle)

Stacked above the back-to-top button, same styling. Shows/hides on the same 600px scroll threshold. Toggles `body.dark` and persists to `localStorage`.

```html
<button class="theme-float" id="themeFloat" aria-label="Toggle dark mode">
  <svg class="theme-sun" ...>...</svg>
  <svg class="theme-moon" ...>...</svg>
</button>
```

```js
var tf = document.getElementById('themeFloat');
tf.addEventListener('click', function() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// On load:
var s = localStorage.getItem('theme');
if (s === 'dark') { document.body.classList.add('dark'); }
else if (!s && !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)) {
  document.body.classList.add('dark');
}
```

- Sun icon shows when dark is active, moon when light
- `localStorage` key: `theme` (values: `dark` | `light`)

---

## 17. Cookie consent + analytics gating

### The contract

1. **Nothing loads before consent.** No GA4, no Vercel Web Analytics, no network call whatsoever until the user clicks Accept.
2. **Consent persists.** Stored in `localStorage` under `cookieConsent` (values: `all` | `none`).
3. **Banner reappears if consent not yet set.** No countdown, no auto-accept.
4. **Declining blocks analytics permanently** (until user clears storage or toggles).

### Markup (floating button + expandable options)

```html
<div class="cookie-float" id="cookieConsent" aria-live="polite">
  <button class="cookie-btn" id="cookieToggle" aria-label="Cookie preferences">
    <svg viewBox="0 0 24 24"><!-- cookie icon --></svg>
  </button>
  <div class="cookie-options">
    <button class="cookie-opt" data-consent="all">Accept</button>
    <button class="cookie-opt" data-consent="none">Decline</button>
  </div>
</div>
```

### Script

```js
function loadAnalytics() {
  if (window._analyticsLoaded) return;
  window._analyticsLoaded = true;
  var va = document.createElement('script');
  va.defer = true;
  va.src = '/_vercel/insights/script.js';
  document.head.appendChild(va);
  var ga = document.createElement('script');
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-8ER6D68M04';
  document.head.appendChild(ga);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-8ER6D68M04', { anonymize_ip: true });
}

var cc = document.getElementById('cookieConsent');
var ct = document.getElementById('cookieToggle');
var consent = localStorage.getItem('cookieConsent');
if (consent) {
  cc.classList.add('hidden');
  if (consent === 'all') loadAnalytics();
} else {
  cc.classList.add('open');
}
ct.addEventListener('click', function() { cc.classList.toggle('open'); });
document.querySelectorAll('.cookie-opt').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var choice = this.dataset.consent;
    localStorage.setItem('cookieConsent', choice);
    cc.classList.add('hidden');
    if (choice === 'all') loadAnalytics();
  });
});
```

### GA4 config

- **Tag**: `G-8ER6D68M04`
- **Flag**: `anonymize_ip: true`
- **Vercel Web Analytics**: loaded alongside GA4 via `/_vercel/insights/script.js`. Same gate.

### Cookie rules summary

| Item | Value |
|---|---|
| `localStorage.theme` | `dark` \| `light` — persistent, set on toggle |
| `localStorage.cookieConsent` | `all` \| `none` — persistent, set on Accept/Decline |
| Pre-consent tracking | None. No IP logging, no beacons, no third-party scripts. |
| User can revoke | Yes — click the cookie icon, re-choose (currently stores new value) |

---

## 18. JSON-LD schema patterns

Always one `<script type="application/ld+json">` block per page in `<head>`. Schema by page type:

### Home page → `Person` + `Service`

See `index.html`. Includes `serviceType` array.

### Landing pages (EECs, courses) → `WebPage`

Use `@type: "WebPage"` with `name`, `description`, `url`, `author`.

### Collection pages (archives, listings) → `CollectionPage`

`@type: "CollectionPage"` with `mainEntity: { "@type": "ItemList", "itemListElement": [...] }`. Keep `itemListElement` empty `[]` until there's content to list — don't leave stale entries.

### Individual posts (blog posts, notes) → `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Post title",
  "description": "Post description.",
  "url": "https://hassannobeeboccus.com/football-thoughts/post-slug",
  "author": {
    "@type": "Person",
    "name": "Hassan Nobeeboccus",
    "url": "https://hassannobeeboccus.com"
  },
  "datePublished": "2026-04-16",
  "image": "https://hassannobeeboccus.com/og-image.png"
}
```

### Privacy page

Can skip JSON-LD entirely.

---

## 19. Meta tag checklist (every new page)

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Page title | Hassan Nobeeboccus</title>
<meta name="description" content="Max 160 chars, no em dashes, no exclamation marks." />
<link rel="canonical" href="https://hassannobeeboccus.com/<path>" />
<link rel="icon" type="image/png" href="/favicon.png" />
<meta name="robots" content="index, follow" />

<!-- Open Graph -->
<meta property="og:type" content="website" />         <!-- or "article" for posts -->
<meta property="og:url" content="https://hassannobeeboccus.com/<path>" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://hassannobeeboccus.com/og-image.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://hassannobeeboccus.com/og-image.png" />

<!-- JSON-LD -->
<script type="application/ld+json">...</script>

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="/shared.css" />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&display=swap" />
<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
```

### OG image per page

- Default: `/og-image.png`
- `/build-your-public-voice`: `/og-course.png`
- `/5-development-models`: `/og-models.png`
- Individual blog posts: `/og-image.png` (unless a custom one is created — name it `og-<slug>.png`)

---

## 20. Image loading

Use `<picture>` with `image-set()` CSS for backgrounds:

```css
background-image: url('/goal-bg.webp');
background-image: image-set(
  url('/goal-bg.webp') type('image/webp'),
  url('/goal-bg.jpg') type('image/jpeg')
);
```

For inline `<img>`:

```html
<picture>
  <source srcset="/image.webp" type="image/webp">
  <img src="/image.jpg" alt="..." loading="lazy" width="..." height="...">
</picture>
```

- Always provide `.webp` + `.jpg` fallback
- `loading="lazy"` on non-hero images
- Explicit `width` + `height` to prevent CLS
- Original (unoptimised) files kept with `-original` suffix for regeneration

---

## 21. Accessibility conventions

- **Skip link**: every page has `<a href="#main-content" class="skip-link">Skip to content</a>` as the first body child, visible only on focus (`top: -50px` → `top: 0` on `:focus`).
- **Focus ring**: `:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }`
- **Aria labels**: all icon-only links and buttons must have `aria-label`.
- **Landmarks**: `<nav>`, `<main id="main-content">`, `<footer>`.
- **Heading order**: one `<h1>` per page. Sections `<h2>`. Card titles `<h3>`.
- **Touch targets**: 44×44 min on mobile (footer links get `min-height: 44px`).
- **Reduced motion**: all animations respect `@media (prefers-reduced-motion: reduce)` — fade-ins become instant, smooth scroll disabled, transitions removed.

---

## 22. Form handling (MailerLite)

All EEC opt-in forms `POST` to `/api/subscribe` with:

```html
<form action="/api/subscribe" method="POST">
  <input type="hidden" name="course" value="models">  <!-- or "voice" -->
  <input type="email" name="email" required>
  <button type="submit">Get free course</button>
</form>
```

### `api/subscribe.js` behaviour

- **Course registry** (hardcoded at top of file):
  - `models` → MailerLite group `183924441027184080` → redirects to `/5-development-models`
  - `voice` → MailerLite group `184737667850700274` → redirects to `/build-your-public-voice`
- **Default course**: `models` (used if no `course` param sent)
- **Success**: 302 redirect to `{redirect}?subscribed=1`
- **Failure**: 302 redirect to `{redirect}?error=1`
- **GET** to `/api/subscribe`: 302 to the course's landing page

### Confirmation handling (landing pages)

Each landing page checks `URLSearchParams` on load:

```js
var params = new URLSearchParams(window.location.search);
if (params.get('subscribed') === '1') {
  // show "Thanks! Check your inbox." message
}
if (params.get('error') === '1') {
  // show "Something went wrong — try again" message
}
```

### Environment variable

`MAILERLITE_API_KEY` — set in Vercel project env, never committed.

### Adding a new EEC

1. Create the MailerLite group, note the ID
2. Add an entry to `COURSES` in `api/subscribe.js`
3. Create the landing page with the form `course` hidden field
4. Wire the URLSearchParams confirmation handler

---

## 23. Cal.eu booking embeds (`/book-a-call`, `/directors-debrief`)

Both booking pages embed the cal.eu widget inline so users stay on-site. Same structural pattern, different `calLink` + namespace per event.

### Why separate pages (not one page with both)

Single-CTA landing pages convert ~266% better than multi-offer pages (Colorlib, DigitalApplied, 2026). B2B best practice is one event type per booking page (intelemark, b2bappointmentsetting). Applied here: free intro on one page, paid session on another.

### Page anatomy

```
Nav (no Book a Call button — the page is the CTA)
Page header (eyebrow + h1 + standfirst)
Context block (3–4 sentences + small meta line)
Cal wrapper card
  ├── #cal-placeholder  (shown until consent)
  └── #cal-embed        (cal widget injects here after consent)
Cross-sell card (links to the other booking page)
Footer
```

### Consent-gating

Cal loads a third-party script and sets cookies. Following the site's existing consent pattern, we gate it behind `cookieConsent === 'all'`.

- **Before consent**: `#cal-placeholder` shows a styled card: *"The calendar is hosted by Cal.eu and uses cookies. Accept cookies to load it, or email me to book directly."* with an inline Accept button.
- **On accept**: `loadCal()` fires, placeholder hides, embed shows. `loadAnalytics()` fires too.
- **On decline**: placeholder stays. User can email.
- **On revisit with prior consent**: embed loads immediately.

### Brand colour

The cal.eu dashboard brand-colour setting is paid-tier / unreliable. Force it per-embed via `cssVarsPerTheme`:

```js
Cal.ns["<namespace>"]("ui", {
  "cssVarsPerTheme": {
    "light": {"cal-brand": "#C9A84C"},
    "dark":  {"cal-brand": "#C9A84C"}
  },
  "hideEventTypeDetails": false,
  "layout": "month_view",
  "theme": calThemeName()  // syncs to site theme
});
```

### Theme sync

When the site's theme toggle fires, re-call `Cal.ns["<namespace>"]("ui", { theme })` with the new value so the embed follows the site instead of OS preference.

```js
tf.addEventListener('click', function() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  if (window.Cal && window.Cal.ns && window.Cal.ns["<namespace>"]) {
    window.Cal.ns["<namespace>"]("ui", { theme: calThemeName() });
  }
});
```

### Where the Director's Debrief gets promoted

Following progressive-disclosure best practice (trajectorywebdesign 2026): premium tiers stay out of nav, surface contextually only.

- **Home page mid-CTA**: small italic line under the primary Book a Call button: *"Or book the Director's Debrief for a paid strategy session."*
- **`/book-a-call` cross-sell card**: after the embed, linking to `/directors-debrief`
- **Footer**: secondary link on the home page, `/book-a-call`, and `/directors-debrief` pages only
- **Not in main nav**. Not at top of home. Not on EEC landings (those have their own conversion goal).

### Key invariants for these pages

- **Do not load cal unconditionally.** Always gate behind consent.
- **Don't hardcode `target="_blank"` on `/book-a-call` or `/directors-debrief` links.** They are internal same-tab.
- **Every Book a Call CTA across the site points to `/book-a-call`.** Grep for `href="/book-a-call"` when auditing.
- **When adding a new event type**: duplicate `book-a-call.html`, rename the `Cal.ns[...]` namespace everywhere in the script (single string replace), update `calLink`, add to vercel.json and sitemap.xml.

### Director's Debrief price — three places to update if it changes

`£249` lives in:

1. `<meta name="description">` in `directors-debrief.html`
2. `<meta property="og:description">` + `<meta name="twitter:description">` in the same file
3. JSON-LD `@graph[1].offers.price` (the Service schema block)
4. The visible `.investment-price` element in the Investment section

Also update the `priceCurrency` (currently `GBP`) if selling in another currency. The Service schema has the authoritative price — search engines and AI agents read it.

---

## 24. Sitemap + robots

`sitemap.xml` is hand-maintained (no generator). Every indexable URL has an entry:

```xml
<url>
  <loc>https://hassannobeeboccus.com/<path></loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>weekly</changefreq>   <!-- optional -->
  <priority>0.7</priority>
</url>
```

- **Home**: priority 1.0
- **Main landing pages** (EECs, FT): 0.7–0.9
- **Individual posts/notes**: 0.7, `changefreq: monthly`
- **Individual posts**: 0.5–0.7, `changefreq: monthly`

`robots.txt` is static and points to the sitemap. Don't disallow anything unless you specifically want to de-index something.

---

## 24. Templates + publishing workflow

### New blog post (Edition or Article)

1. Duplicate `blog-post-template.html`
2. Save as `<slug>.html` at the repo root (e.g. `does-coaching-licence-develop-you.html`)
3. Populate all meta tags, JSON-LD, canonical, OG — canonical points to `/football-thoughts/<slug>`
4. Set `.page-header h1` + standfirst
5. Set `.reading-time` (e.g. "8 min read · April 2026")
6. Write the article body (use `<h2>` for section breaks, `<blockquote>` for pulls)
7. Set the `<a class="article-linkedin" href="[LINKEDIN_URL]">` to the LinkedIn original
8. `.article-back` points to `/football-thoughts`
9. Breadcrumb: two crumbs — `Football Thoughts › <Type>` where `<Type>` is `Editions` / `Articles` / `Notes`, linking to `/football-thoughts?filter=edition|article|note` so the reader returns to the same slice of the feed. See §8 for the breadcrumb snippet.
10. Add card to the `.writing-list` on `/football-thoughts`, most recent first. Set `data-type="edition|article|note"` on the `<a class="writing-card ...">` and add a `<div class="card-type-badge">Edition / Article / Note</div>` as the first child — this is how the filter bar identifies the card.
11. Update `sitemap.xml` — new `<url>` entry at `/football-thoughts/<slug>`
12. Deploy + commit

### New note

1. Duplicate `note-template.html`
2. Save as `<slug>.html` at the repo root
3. Same metadata workflow — canonical points to `/football-thoughts/<slug>`, `og:type="article"`
4. Notes have **no** "Also published on LinkedIn" link — they are site-exclusive
5. `.article-back` points to `/football-thoughts`
6. Breadcrumb: `Football Thoughts › Notes` linking to `/football-thoughts?filter=note`
7. Add card to `/football-thoughts` writing list with `data-type="note"` and a `<div class="card-type-badge">Note</div>`
8. Update `sitemap.xml`
9. Deploy + commit

---

## 25. Deploy workflow

Every change ships the same way:

```bash
cd /Users/hassan.n/TFG/hassannobeeboccus-deploy
vercel --prod
```

Wait for "Aliased: https://hassannobeeboccus.com" in the output — confirms the alias updated. Use `vercel --prod --force` to skip build cache if Vercel is serving stale assets.

### Then commit to GitHub

```bash
git add -A
git commit -m "<imperative subject>

<body explaining why>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
```

**Do not skip the git push.** The Vercel deploy happens from local files, not from GitHub — GitHub is the backup + history. Running `vercel --prod` without pushing means the live site is ahead of the repo.

### Rollback

```bash
vercel rollback              # interactive, choose previous deployment
git revert HEAD && git push  # undo the code change in the repo
```

---

## 26. DNS + external services

- **Namecheap**: DNS only. A records point to Vercel, SPF TXT record for MailerLite.
- **Search Console**: property owned as `hassannobeeboccus.com` (domain-wide). Verified via DNS TXT.
- **GA4**: property ID `G-8ER6D68M04`.
- **MailerLite**: account linked. Groups listed in §22. API key in Vercel env only.
- **Cal.eu**: two public events — `thefootballghostwriter/30min` (free intro) and `thefootballghostwriter/the-director-s-debrief` (paid). Both are embedded inline on-site — the external URLs are no longer used as CTAs anywhere. Brand colour set via embed `cssVarsPerTheme` to `#C9A84C` (gold) for both light and dark, since the cal dashboard brand setting doesn't apply. Theme is synced to the site's dark mode toggle.

---

## 27. Known invariants (don't break these)

- **`shared.css` is loaded on every page.** Any base style change there ripples everywhere — check every page type.
- **Cookie consent script must exist on every page**. No exceptions.
- **`loadAnalytics()` fires only after explicit `Accept`.** Never call it on page load.
- **Every indexable page has a canonical URL.** Even redirects should ultimately land on a canonical.
- **No inline event handlers** (no `onclick=` etc.) — use `addEventListener`.
- **No framework, no build step.** If a change requires one, that's a red flag — revisit the requirement.
- **No secrets in the repo.** API keys go in Vercel env vars.
- **British English + no em dashes + no exclamation marks.** Not negotiable.

---

## 28. Quick-reference: what to touch for common changes

| Change | Files |
|---|---|
| New blog post | Copy `blog-post-template.html` → `<slug>.html` (repo root), update `sitemap.xml`, add card to `football-thoughts.html` writing list |
| New note | Copy `note-template.html` → `<slug>.html` (repo root), update `sitemap.xml`, add card to `football-thoughts.html` writing list |
| Change a colour | `shared.css` `:root` + every page's `<style>` `:root` (they duplicate the tokens) |
| Add a new page | Use any existing page as starting point, update `vercel.json` rewrites, add to `sitemap.xml`, footer link if global |
| Change footer links | Every page (currently duplicated inline) — search for the link text |
| Add an EEC | `api/subscribe.js` COURSES object + new landing page |
| New redirect | `vercel.json` `redirects` array — set `"permanent": true` for 308 |
| Change booking link | Every "Book a Call" CTA points to `/book-a-call` (internal). To change the underlying cal event, update the `calLink` in `book-a-call.html` (and namespace string across the script block). |
| Add a new cal event page | Duplicate `book-a-call.html`, rename, update canonical/OG/JSON-LD, update `Cal.ns["<namespace>"]` references in the script, set `calLink` and event slug, add rewrite in `vercel.json`, add to `sitemap.xml`. Consent-gating and theme-sync already baked in. |

---

## 29. Contact + credentials

- **Email**: thefootballghostwriter@outlook.com (listed in every footer)
- **LinkedIn**: linkedin.com/in/thefootballghostwriter
- **GitHub repo**: github.com/TheFootballGhostwriter/hassannobeeboccus-deploy (private)
- **Vercel project**: hassan-ns-projects/hassannobeeboccus-deploy
- **Domain registrar**: Namecheap

Credentials live in 1Password / Vercel dashboard. Never in the repo.

---

*Last updated: 2026-04-19. Keep this file current — if you change a pattern, update the doc in the same commit.*
