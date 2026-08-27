# Cartell imprimible per sessió (`/cartell`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every session page (`content/programacio/<any>/<slug>/`) gets an automatically generated, standalone, single-A4-page printable poster at `.../<slug>/cartell.html` (resolves to `.../<slug>/cartell` on the production GitHub Pages host), reproducing the layout of `cartell cineclub.pdf` using the site's own fonts (Oswald/Inter) and each session's own poster/gallery/sinopsi data.

**Architecture:** A new Hugo output format (`CARTELL`) is cascaded onto every page inside the `programacio` section. A dedicated standalone template (`layouts/programacio/single.cartell.html`, no site header/footer) renders a fixed `210mm × 297mm` container using CSS Grid/Flexbox, mapping existing front matter (poster, gallery, preu, versio_tipus, organitza/participa/collabora) plus one new optional field (`sinopsi_cartell`) into the poster layout. A floating "Imprimeix / Desa PDF" button calls `window.print()`.

**Tech Stack:** Hugo 0.158 (output formats, page resources, `.RawContent`), Tailwind CSS 3.4 via `@apply` in dedicated component CSS files (project convention — no inline Tailwind classes in markup), vanilla JS (one `onclick` attribute, no build step).

## Global Constraints

- No inline Tailwind utility classes in HTML — define classes in `assets/css/components/cartell.css` using `@apply`, BEM-style naming (`cartell__block`, `cartell__block--modifier`), per the project's CSS convention (`CLAUDE.md`).
- No comments in code unless documenting a non-obvious WHY.
- Never write "—" (em dash) in any user-facing Catalan text (project convention).
- The `CARTELL` output format must NOT apply to the `content/programacio/_index.md` listing page — only to individual session pages (`kind: "page"`).
- The template must not depend on `layouts/_default/baseof.html` or the site's `header.html`/`footer.html` partials — it is a fully standalone HTML document.
- All new/changed template code must be validated against real content (`los-domingos` = cartellera, no collab, 6 gallery images, `preu: 5`; `jane-eyre` = cartellera, `preu: 5`, will get `sinopsi_cartell`; `carretera-a-gusen` = xarxa, `preu: 0`, `organitza`+`participa`+`collabora` all set, only 3 gallery images) at every task.
- Every `hugo` build check in this plan uses a one-off `hugo --source . --quiet` (writes to `public/`), which is independent of the already-running `hugo server` dev preview (port 1414, in-memory) — rebuild `public/` fresh (`rm -rf public`) before each check to avoid stale files masking a bug.

---

## File Structure

- `hugo.toml` — add `[outputFormats.CARTELL]`.
- `content/programacio/_index.md` — add `cascade` so `CARTELL` output applies to session pages only.
- `layouts/programacio/single.cartell.html` — new, standalone template. Grows section by section across Tasks 1–5.
- `layouts/partials/cartell-synopsis-fallback.html` — new partial, extracts the `## Sinopsi` markdown section as plain text when `sinopsi_cartell` isn't set.
- `layouts/partials/date-ca-cartell.html` — new partial, formats the session date as "Dijous 6 d'agost a les 19:00h" (no year, `date-ca.html`'s sibling for the poster footer).
- `assets/css/components/cartell.css` — new component stylesheet. Grows section by section across Tasks 1–5.
- `assets/css/main.css` — add one `@import` line.
- `content/programacio/2026/jane-eyre/index.md` — add `sinopsi_cartell` field (Task 3), reusing the exact synopsis text from the original design PDF.

---

### Task 1: Hugo routing plumbing + page shell

**Files:**
- Modify: `hugo.toml`
- Modify: `content/programacio/_index.md`
- Create: `layouts/programacio/single.cartell.html`
- Create: `assets/css/components/cartell.css`
- Modify: `assets/css/main.css`

**Interfaces:**
- Produces: the `CARTELL` output format, applied to every page in the `programacio` section. Later tasks only edit the body of `single.cartell.html` and append rules to `cartell.css` — the `<head>`, print button, and `.cartell` container established here stay unchanged.

- [ ] **Step 1: Write the failing check**

Run:
```bash
rm -rf public
hugo --source . --quiet
find public/programacio/2026/los-domingos -iname "*cartell*"
```
Expected: no output (no `cartell.html` file exists yet).

- [ ] **Step 2: Add the output format to `hugo.toml`**

Insert right after the top-level settings, before `[permalinks]`:

```toml
[outputFormats.CARTELL]
  baseName = "cartell"
  mediaType = "text/html"
  isHTML = true
```

So the top of `hugo.toml` reads:

```toml
baseURL = "https://cineclubrodadebera.cat/"
languageCode = "ca"
title = "Cineclub Roda de Berà"
enableRobotsTXT = true
buildFuture = true
titleCaseStyle = "none"

[outputFormats.CARTELL]
  baseName = "cartell"
  mediaType = "text/html"
  isHTML = true

[permalinks]
  programacio = "/programacio/:year/:slug/"
```

- [ ] **Step 3: Cascade the new output format onto session pages only**

In `content/programacio/_index.md`, add a `cascade` key to the front matter (after `sessions_pendents`, before the closing `---`):

```yaml
cascade:
  - _target:
      kind: "page"
    outputs:
      - "HTML"
      - "CARTELL"
```

Full resulting front matter:

```yaml
---
title: "Programació"
date: 2026-08-20
description: "Consulta totes les pel·lícules programades pel Cineclub Roda de Berà: properes sessions, calendari complet i fitxes amb sinopsi, context i curiositats."
sessions_pendents:
  - data: "2026-11-05T19:00:00+01:00"
  - data: "2026-12-03T19:00:00+01:00"
cascade:
  - _target:
      kind: "page"
    outputs:
      - "HTML"
      - "CARTELL"
---
```

- [ ] **Step 4: Create the standalone template shell**

Create `layouts/programacio/single.cartell.html`:

```html
<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cartell: {{ .Title }} ({{ .Site.Title }})</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ "css/main.css" | relURL }}">
</head>
<body class="cartell-page">
<button type="button" class="cartell-print-btn" onclick="window.print()">Imprimeix / Desa PDF</button>
<div class="cartell">
  {{ .Title }}
</div>
</body>
</html>
```

- [ ] **Step 5: Create the base CSS (container + print button + A4 print rules)**

Create `assets/css/components/cartell.css`:

```css
.cartell-page {
  @apply m-0 bg-neutral-300 p-0;
}
.cartell-print-btn {
  @apply font-display fixed right-4 top-4 z-50 rounded bg-gold px-4 py-2 font-semibold uppercase text-white shadow-lg;
}
.cartell-print-btn:hover {
  @apply bg-gold-dark;
}
.cartell {
  @apply flex flex-col overflow-hidden bg-white;
  width: 210mm;
  height: 297mm;
  margin: 12mm auto;
  box-shadow: 0 0 12mm rgba(0, 0, 0, 0.25);
}

@media print {
  .cartell-print-btn {
    display: none;
  }
  .cartell-page {
    background: none;
  }
  .cartell {
    margin: 0;
    box-shadow: none;
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4;
    margin: 0;
  }
}
```

- [ ] **Step 6: Import the new stylesheet in `main.css`**

In `assets/css/main.css`, add after the `prose.css` import:

```css
@import "./components/prose.css";
@import "./components/cartell.css";
```

- [ ] **Step 7: Build and verify the route exists for three representative sessions**

Run:
```bash
rm -rf public
hugo --source . --quiet
find public/programacio/2026/los-domingos -iname "*cartell*"
find public/programacio/2026/jane-eyre -iname "*cartell*"
find public/programacio/2026/carretera-a-gusen -iname "*cartell*"
grep -o "Los domingos" public/programacio/2026/los-domingos/cartell.html
```
Expected: each `find` prints exactly one line, `.../cartell.html`; the `grep` prints `Los domingos`.

- [ ] **Step 8: Verify the section listing page did NOT get a `cartell` output**

Run:
```bash
find public/programacio -maxdepth 1 -iname "*cartell*"
```
Expected: no output (the `cascade` `_target.kind: "page"` correctly excludes the section's own list page).

- [ ] **Step 9: Verify the CSS compiles**

Run:
```bash
npm run css:build
grep -c "cartell" static/css/main.css
```
Expected: exits `0`, count > 0. `static/css/main.css` is a build artifact and is gitignored (see `.gitignore`) — do not `git add` it; the CI workflow (`.github/workflows`) runs `npm run css:build` itself before `hugo --minify`, so nothing further is needed here.

- [ ] **Step 10: Commit**

```bash
git add hugo.toml content/programacio/_index.md layouts/programacio/single.cartell.html assets/css/components/cartell.css assets/css/main.css
git commit -m "Add cartell print output format and page shell for sessions"
```

---

### Task 2: Capçalera — preu, logo, versió i col·laboradors

**Files:**
- Modify: `layouts/programacio/single.cartell.html`
- Modify: `assets/css/components/cartell.css`

**Interfaces:**
- Consumes: `.Params.preu` (int), `.Params.versio_tipus` (string), `.Params.idioma` (string), `.Params.organitza`/`.Params.participa`/`.Params.collabora` (string/[]string), `.Site.Data.entitats` (map keyed by entity name → `{logo, url}`), `.Site.Home.Resources.GetMatch "hero-logo.png"`, `.Site.BaseURL`.
- Produces: nothing new consumed by later tasks (header is visually independent of body/footer).

- [ ] **Step 1: Write the failing check**

Run:
```bash
rm -rf public
hugo --source . --quiet
grep -o "No soci/a" public/programacio/2026/los-domingos/cartell.html
```
Expected: no match (grep exits 1, empty output) — the header markup doesn't exist yet.

- [ ] **Step 2: Replace the placeholder body with the header markup**

In `layouts/programacio/single.cartell.html`, replace:

```html
<div class="cartell">
  {{ .Title }}
</div>
```

with:

```html
{{ $entitats := .Site.Data.entitats }}
<div class="cartell">
  <header class="cartell__header">
    <div class="cartell__price">
      {{ if eq .Params.preu 0 }}
        <span class="cartell__price-line cartell__price-line--free">Entrada gratuïta</span>
      {{ else }}
        <span class="cartell__price-line">Soci/a: <strong>Gratuït</strong></span>
        <span class="cartell__price-line">No soci/a: <strong>{{ .Params.preu }}€</strong></span>
      {{ end }}
      <span class="cartell__web-label">Informa't al web</span>
      <span class="cartell__web-url">www.{{ .Site.BaseURL | replaceRE "^https?://(www\\.)?" "" | replaceRE "/$" "" | upper }}</span>
    </div>

    {{ with .Site.Home.Resources.GetMatch "hero-logo.png" }}
      <img class="cartell__logo" src="{{ .RelPermalink }}" alt="{{ $.Site.Title }}">
    {{ end }}

    <div class="cartell__version-collab">
      {{ with .Params.versio_tipus }}
        {{ $tipus := . }}
        {{ $text := "" }}
        {{ if eq $tipus "vo" }}
          {{ $text = printf "Versió original en %s" $.Params.idioma }}
        {{ else if eq $tipus "vose" }}
          {{ $text = "Versió original subtitulada en espanyol" }}
        {{ else if eq $tipus "vosc" }}
          {{ $text = "Versió original subtitulada en català" }}
        {{ else if eq $tipus "doblada-cat" }}
          {{ $text = "Doblada al català" }}
        {{ else if eq $tipus "doblada-cast" }}
          {{ $text = "Doblada al castellà" }}
        {{ end }}
        <span class="cartell__version-badge">{{ $text | upper }}</span>
      {{ end }}

      {{ $collabEntities := slice }}
      {{ with .Params.organitza }}
        {{ if ne . "cineclub" }}{{ $collabEntities = $collabEntities | append . }}{{ end }}
      {{ end }}
      {{ range .Params.participa }}{{ $collabEntities = $collabEntities | append . }}{{ end }}
      {{ range .Params.collabora }}{{ $collabEntities = $collabEntities | append . }}{{ end }}
      {{ if gt (len $collabEntities) 0 }}
        <div class="cartell__collab">
          <span class="cartell__collab-label">Amb la col·laboració de:</span>
          <div class="cartell__collab-logos">
            {{ range $collabEntities }}
              {{ $nom := . }}
              {{ with index $entitats $nom }}
                <img class="cartell__collab-logo" src="{{ .logo }}" alt="{{ $nom }}">
              {{ end }}
            {{ end }}
          </div>
        </div>
      {{ end }}
    </div>
  </header>
</div>
```

- [ ] **Step 3: Append the header CSS**

In `assets/css/components/cartell.css`, append (before the final `@media print` block):

```css
.cartell__header {
  @apply flex items-start justify-between gap-4;
  padding: 8mm 8mm 4mm;
}
.cartell__price {
  @apply flex flex-col gap-1;
}
.cartell__price-line {
  @apply font-body text-[11pt] font-semibold uppercase text-black;
}
.cartell__price-line--free {
  @apply text-[12pt];
}
.cartell__web-label {
  @apply font-display text-[9pt] font-semibold uppercase text-gold;
  margin-top: 3mm;
}
.cartell__web-url {
  @apply font-body text-[8pt] font-semibold text-black;
}
.cartell__logo {
  @apply h-auto flex-shrink-0;
  width: 55mm;
}
.cartell__version-collab {
  @apply flex flex-col items-end gap-2 text-right;
}
.cartell__version-badge {
  @apply font-body bg-black text-[9pt] font-semibold uppercase text-white;
  padding: 1mm 3mm;
}
.cartell__collab {
  @apply flex flex-col items-end gap-1;
}
.cartell__collab-label {
  @apply font-body text-[7pt] font-semibold uppercase text-black;
}
.cartell__collab-logos {
  @apply flex flex-wrap items-center justify-end gap-2;
}
.cartell__collab-logo {
  @apply w-auto object-contain;
  height: 8mm;
}
```

- [ ] **Step 4: Run the check again and verify all three sample sessions**

Run:
```bash
rm -rf public
hugo --source . --quiet
echo "-- los-domingos (preu 5, organitza cineclub, no collab) --"
grep -o "No soci/a: <strong>5€" public/programacio/2026/los-domingos/cartell.html
grep -o "VERSIÓ ORIGINAL EN CASTELLÀ" public/programacio/2026/los-domingos/cartell.html
grep -c "cartell__collab-label" public/programacio/2026/los-domingos/cartell.html
echo "-- carretera-a-gusen (preu 0, organitza+participa+collabora = 5 entities) --"
grep -o "Entrada gratuïta" public/programacio/2026/carretera-a-gusen/cartell.html
grep -c "cartell__collab-logo" public/programacio/2026/carretera-a-gusen/cartell.html
```
Expected: los-domingos matches the price/version lines and prints `0` for `cartell__collab-label` (no collab box); carretera-a-gusen prints `Entrada gratuïta` and `5` for the logo count — organitza (`L'Ateneu Rodenc`, 1) + participa (`Associació Republicana de Roda de Berà`, `Cineclub Roda de Berà`, 2) + collabora (`Amical de Mauthausen`, `Ajuntament de Roda de Berà`, 2) = 5 entities total.

- [ ] **Step 5: Commit**

```bash
git add layouts/programacio/single.cartell.html assets/css/components/cartell.css
git commit -m "Add price, logo, version badge and collaborators to cartell header"
```

---

### Task 3: Cos — sinopsi (amb fallback) i pòster

**Files:**
- Create: `layouts/partials/cartell-synopsis-fallback.html`
- Modify: `layouts/programacio/single.cartell.html`
- Modify: `assets/css/components/cartell.css`
- Modify: `content/programacio/2026/jane-eyre/index.md`

**Interfaces:**
- Consumes: `.Params.sinopsi_cartell` (string, optional), `.RawContent`, `.Resources.GetMatch "poster*"`.
- Produces: `cartell-synopsis-fallback.html` partial — takes a `Page` context (`.`), returns a plain-text string (the content of the `## Sinopsi` markdown section, trimmed).

- [ ] **Step 1: Write the failing check**

Run:
```bash
rm -rf public
hugo --source . --quiet
grep -o "Ainara té disset anys" public/programacio/2026/los-domingos/cartell.html
```
Expected: no match — the synopsis fallback doesn't exist yet.

- [ ] **Step 2: Create the synopsis fallback partial**

Create `layouts/partials/cartell-synopsis-fallback.html`:

```html
{{- $raw := .RawContent -}}
{{- $afterHeading := "" -}}
{{- if in $raw "## Sinopsi" -}}
  {{- $parts := split $raw "## Sinopsi" -}}
  {{- $afterHeading = index $parts 1 -}}
{{- end -}}
{{- $upToNextHeading := $afterHeading -}}
{{- if in $afterHeading "\n## " -}}
  {{- $upToNextHeading = index (split $afterHeading "\n## ") 0 -}}
{{- end -}}
{{- trim $upToNextHeading "\n " -}}
```

- [ ] **Step 3: Add the body section markup**

In `layouts/programacio/single.cartell.html`, add right after `</header>` and before the closing `</div>` of `.cartell`:

```html
  <div class="cartell__body">
    <div class="cartell__synopsis">
      <p>{{ with .Params.sinopsi_cartell }}{{ . }}{{ else }}{{ partial "cartell-synopsis-fallback.html" . }}{{ end }}</p>
    </div>
    {{ with .Resources.GetMatch "poster*" }}
      {{ $poster := . }}
      {{ if gt $poster.Width 1000 }}{{ $poster = $poster.Resize "1000x" }}{{ end }}
      <img class="cartell__poster" src="{{ $poster.RelPermalink }}" alt="{{ $.Params.titol_original | default $.Title }}">
    {{ end }}
  </div>
```

- [ ] **Step 4: Append the body/synopsis/poster CSS**

In `assets/css/components/cartell.css`, append (before `@media print`):

```css
.cartell__body {
  @apply flex flex-1;
  min-height: 0;
}
.cartell__synopsis {
  @apply flex items-center overflow-hidden bg-black text-white;
  flex: 0 0 38%;
  padding: 6mm;
}
.cartell__synopsis p {
  @apply font-body text-[11pt] leading-relaxed;
  display: -webkit-box;
  -webkit-line-clamp: 14;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cartell__poster {
  @apply h-full w-full flex-1 object-cover;
}
```

- [ ] **Step 5: Add `sinopsi_cartell` to Jane Eyre, reusing the original design PDF text**

In `content/programacio/2026/jane-eyre/index.md`, add this field to the front matter, right after `titol_espanya: "Jane Eyre"`:

```yaml
sinopsi_cartell: "Jane Eyre, una jove òrfena amb una forta voluntat i un profund sentit moral, és contractada com a institutriu a Thornfield Hall, una mansió misteriosa. Allà coneix el seu enigmàtic propietari, Edward Rochester, amb qui estableix una relació intensa i complexa. Però un secret ocult amenaça de destruir el vincle entre tots dos..."
```

- [ ] **Step 6: Run the check again — fallback path and explicit-field path**

Run:
```bash
rm -rf public
hugo --source . --quiet
echo "-- los-domingos: fallback from ## Sinopsi --"
grep -o "Ainara té disset anys" public/programacio/2026/los-domingos/cartell.html
echo "-- jane-eyre: explicit sinopsi_cartell field --"
grep -o "amenaça de destruir" public/programacio/2026/jane-eyre/cartell.html
echo "-- poster present on both --"
grep -c "cartell__poster" public/programacio/2026/los-domingos/cartell.html
grep -c "cartell__poster" public/programacio/2026/jane-eyre/cartell.html
```
Expected: both `grep -o` calls print a match; both poster counts are `1`.

- [ ] **Step 7: Commit**

```bash
git add layouts/partials/cartell-synopsis-fallback.html layouts/programacio/single.cartell.html assets/css/components/cartell.css content/programacio/2026/jane-eyre/index.md
git commit -m "Add synopsis (with markdown fallback) and poster to cartell body"
```

---

### Task 4: Filmstrip — 4 fotogrames de la galeria

**Files:**
- Modify: `layouts/programacio/single.cartell.html`
- Modify: `assets/css/components/cartell.css`

**Interfaces:**
- Consumes: `.Resources.Match "gallery*"`.

- [ ] **Step 1: Write the failing check**

Run:
```bash
rm -rf public
hugo --source . --quiet
grep -c "cartell__filmstrip-image" public/programacio/2026/los-domingos/cartell.html
```
Expected: `0`.

- [ ] **Step 2: Add the filmstrip markup**

In `layouts/programacio/single.cartell.html`, add right after the closing `</div>` of `.cartell__body`:

```html
  {{ $filmstripImages := first 4 (sort (.Resources.Match "gallery*") "Name") }}
  {{ if gt (len $filmstripImages) 0 }}
  <div class="cartell__filmstrip">
    {{ range $filmstripImages }}
      {{ $img := . }}
      {{ if gt $img.Width 400 }}{{ $img = $img.Resize "400x" }}{{ end }}
      <img class="cartell__filmstrip-image" src="{{ $img.RelPermalink }}" alt="">
    {{ end }}
  </div>
  {{ end }}
```

- [ ] **Step 3: Append the filmstrip CSS**

In `assets/css/components/cartell.css`, append (before `@media print`):

```css
.cartell__filmstrip {
  @apply flex items-stretch gap-1 bg-black;
  height: 32mm;
  padding: 2mm 1mm;
}
.cartell__filmstrip-image {
  @apply h-full w-full flex-1 object-cover;
}
```

- [ ] **Step 4: Run the check again — 4 images vs. fewer than 4**

Run:
```bash
rm -rf public
hugo --source . --quiet
echo "-- los-domingos: 6 gallery images, expect 4 in filmstrip --"
grep -c "cartell__filmstrip-image" public/programacio/2026/los-domingos/cartell.html
echo "-- carretera-a-gusen: only 3 gallery images, expect 3, no crash --"
grep -c "cartell__filmstrip-image" public/programacio/2026/carretera-a-gusen/cartell.html
```
Expected: `4` for los-domingos, `3` for carretera-a-gusen (build succeeds without error even with fewer than 4 images).

- [ ] **Step 5: Commit**

```bash
git add layouts/programacio/single.cartell.html assets/css/components/cartell.css
git commit -m "Add filmstrip gallery band to cartell"
```

---

### Task 5: Peu — data i lloc

**Files:**
- Create: `layouts/partials/date-ca-cartell.html`
- Modify: `layouts/programacio/single.cartell.html`
- Modify: `assets/css/components/cartell.css`

**Interfaces:**
- Consumes: `.Date`, `.Site.Data.monthsCa`, `.Site.Data.weekdaysCa`, `.Site.Params.venueName`.
- Produces: `date-ca-cartell.html` partial — takes a `Page` context, returns two `<span>` elements (`cartell__date`, `cartell__date-time`).

- [ ] **Step 1: Write the failing check**

Run:
```bash
rm -rf public
hugo --source . --quiet
grep -o "Dijous 6 d'agost" public/programacio/2026/jane-eyre/cartell.html
```
Expected: no match.

- [ ] **Step 2: Create the date partial**

Create `layouts/partials/date-ca-cartell.html`:

```html
{{- $t := .Date -}}
{{- $months := .Site.Data.monthsCa -}}
{{- $weekdays := .Site.Data.weekdaysCa -}}
{{- $day := $t.Day -}}
{{- $monthName := index $months (printf "%d" $t.Month) -}}
{{- $weekdayName := index $weekdays (printf "%d" $t.Weekday) -}}
{{- $firstLetter := substr $monthName 0 1 -}}
{{- $vowelStart := in (slice "a" "e" "i" "o" "u") $firstLetter -}}
<span class="cartell__date">{{ $weekdayName }} {{ $day }} {{ if $vowelStart }}d'{{ else }}de {{ end }}{{ $monthName }}</span> <span class="cartell__date-time">a les {{ $t.Format "15:04" }}h</span>
```

- [ ] **Step 3: Add the footer markup**

In `layouts/programacio/single.cartell.html`, add right after the filmstrip `{{ end }}` and before the closing `</div>` of `.cartell`:

```html
  <footer class="cartell__footer">
    {{ partial "date-ca-cartell.html" . }}
    <span class="cartell__venue">{{ .Site.Params.venueName }}</span>
  </footer>
```

- [ ] **Step 4: Append the footer CSS**

In `assets/css/components/cartell.css`, append (before `@media print`):

```css
.cartell__footer {
  @apply flex flex-col items-center gap-1 text-center;
  padding: 5mm 8mm 8mm;
}
.cartell__date {
  @apply font-display text-[16pt] font-bold uppercase text-gold;
}
.cartell__date-time {
  @apply font-body text-[16pt] text-black;
}
.cartell__venue {
  @apply font-body text-[10pt] text-neutral-600;
}
```

- [ ] **Step 5: Run the check again**

Run:
```bash
rm -rf public
hugo --source . --quiet
grep -o "Dijous 6 d'agost" public/programacio/2026/jane-eyre/cartell.html
grep -o "a les 19:00h" public/programacio/2026/jane-eyre/cartell.html
grep -o "Teatre del Casino Municipal de Roda de Berà" public/programacio/2026/jane-eyre/cartell.html
```
Expected: all three `grep -o` calls print a match.

- [ ] **Step 6: Commit**

```bash
git add layouts/partials/date-ca-cartell.html layouts/programacio/single.cartell.html assets/css/components/cartell.css
git commit -m "Add date and venue footer to cartell"
```

---

### Task 6: Visual QA in the browser

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Rebuild CSS and reload the dev server**

Run:
```bash
npm run css:build
```
The `hugo server` dev preview (already running on port 1414) picks up template/content changes automatically via live reload; CSS changes need this explicit rebuild since `static/css/main.css` is a committed, pre-built file (not built on the fly by `hugo server`).

- [ ] **Step 2: Open and screenshot the three sample cartells**

Using the browser tools, navigate to and screenshot each of:
- `http://localhost:1414/programacio/2026/los-domingos/cartell.html`
- `http://localhost:1414/programacio/2026/jane-eyre/cartell.html`
- `http://localhost:1414/programacio/2026/carretera-a-gusen/cartell.html`

For each, verify against `cartell cineclub.pdf`:
- Price box top-left matches (two lines for los-domingos/jane-eyre, one line "Entrada gratuïta" for carretera-a-gusen).
- Cineclub logo centered at the top.
- Version badge + collaborators top-right (empty for los-domingos and jane-eyre — `organitza: cineclub`, no `participa`/`collabora`; 5 logos in a row for carretera-a-gusen).
- Black synopsis box (left) with white text, poster image (right).
- Filmstrip band with fotogrames at the bottom (4 for los-domingos/jane-eyre, 3 for carretera-a-gusen).
- Date + venue centered at the very bottom.
- No site header/footer/nav visible anywhere on the page.

- [ ] **Step 3: Verify the container is exactly one A4 page**

Using the browser's JS evaluation tool, on any of the three pages:
```javascript
document.querySelector('.cartell').getBoundingClientRect()
```
Expected: `width` ≈ 793.7px and `height` ≈ 1122.5px (210mm/297mm at 96dpi, allow ±2px for subpixel rounding).

- [ ] **Step 4: Verify the print button hides in print media and colors survive print**

Using the browser tools, emulate print media (or check computed style) and confirm:
- `.cartell-print-btn` has `display: none` under `@media print`.
- The rule `* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }` is present in the compiled `static/css/main.css` inside the `@media print` block (grep it):
```bash
grep -A2 "print-color-adjust" static/css/main.css
```
Expected: match found, confirming black backgrounds (synopsis box, filmstrip, version badge) will actually print black instead of defaulting to no-background in browsers that omit background colors by default when printing.

- [ ] **Step 5: Click the print button and confirm the browser print dialog opens**

Click "Imprimeix / Desa PDF" on one of the three pages and confirm the native print preview shows a single A4 page with no browser header/footer chrome bleeding into the design (cropped correctly).

- [ ] **Step 6: No commit needed**

This task is verification-only; nothing to add to git beyond what Tasks 1–5 already committed.

---

## Self-Review

**Spec coverage:**
- Rutes (`.../cartell.html`, cascade limited to session pages) → Task 1. ✓
- `sinopsi_cartell` field + fallback extraction → Task 3. ✓
- A4 fixed physical size, screen vs. print styling, `@page` rule → Task 1. ✓
- Preu (both branches: 0 and non-zero) → Task 2. ✓
- Logo central (`hero-logo.png` from home resources) → Task 2. ✓
- Badge de versió (5 `versio_tipus` variants) → Task 2. ✓
- Col·laboradors (organitza excluding "cineclub" + participa + collabora, all in one row) → Task 2. ✓
- Sinopsi (explicit field + fallback) → Task 3. ✓
- Pòster → Task 3. ✓
- Filmstrip (first 4 gallery images, graceful with fewer) → Task 4. ✓
- Peu (data sense any + lloc) → Task 5. ✓
- Botó d'impressió, amagat en `@media print` → Task 1. ✓
- Standalone page (no header/footer del lloc) → Task 1. ✓
- Visual QA en navegador abans de donar per acabat → Task 6. ✓

**Placeholder scan:** no TBD/TODO, every step has complete real code, every grep check has a concrete expected result. Clear.

**Type consistency:** `$collabEntities` (slice of strings) is built identically in Task 2's single edit — no cross-task signature drift since the header is written once. `cartell-synopsis-fallback.html` and `date-ca-cartell.html` partials each take `.` (Page context) and are invoked identically (`{{ partial "name.html" . }}`) in Tasks 3 and 5. Consistent.
