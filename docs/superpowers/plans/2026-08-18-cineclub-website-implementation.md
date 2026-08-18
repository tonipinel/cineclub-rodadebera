# Web del Cineclub Roda de Berà — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el nou lloc estàtic del Cineclub Roda de Berà amb Hugo + Tailwind CSS, migrant les 4 pàgines i les 6 sessions existents del Google Sites actual, indexable i desplegat a GitHub Pages via GitHub Actions.

**Architecture:** Generador estàtic Hugo amb plantilles pròpies (sense tema extern). Tailwind CSS es compila amb el Tailwind CLI (no Hugo Pipes) cap a `static/css/main.css`. El contingut de sessions viu com a *page bundles* a `content/programacio/<any>/<slug>/index.md` per poder incloure la imatge del cartell com a recurs local. Els camps estructurats (fitxa tècnica, info de sessió) viuen al front matter; el text llarg (sinopsi, context, curiositats, per què l'hem programat) viu al cos Markdown.

**Tech Stack:** Hugo (extended), Tailwind CSS v3 (CLI), Node.js/npm (només per instal·lar el CLI de Tailwind), GitHub Actions, GitHub Pages.

## Global Constraints

- Fitxer de configuració Hugo: `hugo.toml` (TOML), `languageCode = "ca"`, `baseURL = "https://cineclubrodadebera.cat/"`.
- El camp de data/hora de cada sessió és el `date` natiu de Hugo (ISO 8601 amb hora), NO camps separats `data`/`hora` — Hugo necessita `.Date` per al token `:year` dels permalinks i per ordenar cronològicament. El text en català ("6 d'agost de 2026 a les 19:00h") es genera sempre a partir de `.Date` via el partial `date-ca.html`, mai escrit a mà.
- Cap classe Tailwind solta al markup/plantilles: tots els components visuals es defineixen a `assets/css/components/*.css` amb `@apply` i nomenclatura BEM, important-los des de `assets/css/main.css`. `tailwind.config.js` conté els tokens de marca (`gold`/`gold-dark`, `font-display`/`font-body`).
- En local, sempre s'executa `hugo server` amb `--port 1414` (el 1313 ja el fa servir un altre projecte de l'usuari).
- No es commiteja mai `docs/superpowers/specs/` (ja al `.gitignore`). Aquest pla es pot commitejar amb normalitat; és `docs/superpowers/plans/` el que NO cal ignorar.
- Colors de marca: groc `#BF9000` (`gold`), groc fosc `#7F6000` (`gold-dark`). Tipografies: Comfortaa (`font-display`, títols), Inter (`font-body`, cos).
- Adreça/local de referència per a totes les sessions: "Teatre del Casino Municipal de Roda de Berà", "Plaça dels Pins, 6, 43883 Roda de Berà (Tarragona)".
- Formulari d'alta de sòcia/soci: `https://forms.gle/aPTySW5HKeuU712Z6`.
- Les imatges (cartells/fotogrames) de les 6 sessions migrades **no s'obtenen per scraping automatitzat** (Google Sites reutilitza el mateix node `<img>` entre pàgines i l'URL extreta no és fiable): cada tasca de migració de sessió inclou un pas manual explícit per desar la imatge corresponent al camí exacte indicat.

---

## File Structure

```
hugo.toml
package.json
tailwind.config.js
assets/css/main.css
assets/css/components/header.css
assets/css/components/footer.css
assets/css/components/button.css
assets/css/components/session-card.css
assets/css/components/session-detail.css
assets/css/components/home.css
assets/css/components/page.css
assets/css/components/faq.css
data/monthsCa.yaml
layouts/_default/baseof.html
layouts/_default/single.html
layouts/partials/head.html
layouts/partials/header.html
layouts/partials/footer.html
layouts/partials/date-ca.html
layouts/partials/session-card.html
layouts/partials/jsonld-screening-event.html
layouts/shortcodes/btn.html
layouts/index.html
layouts/programacio/list.html
layouts/programacio/single.html
layouts/faq/single.html
content/_index.md
content/fes-te-socia.md
content/preguntes-frequents.md
content/programacio/_index.md
content/programacio/2026/the-artist/index.md
content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/index.md
content/programacio/2026/jane-eyre/index.md
content/programacio/2026/secrets-i-mentides/index.md
content/programacio/2026/pig/index.md
content/programacio/2026/esperando-a-dali/index.md
.github/workflows/deploy.yml
.gitignore (actualitzat)
```

---

### Task 1: Scaffold del projecte Hugo + configuració base

**Files:**
- Create: `hugo.toml`
- Create: `content/_index.md` (placeholder mínim, es reemplaça a la Tasca 3)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `hugo.toml` amb `[permalinks]` per a `programacio` i `[params]` (`tagline`, `venueName`, `venueAddress`, `membershipFormURL`) i `[[menu.main]]`, que totes les tasques posteriors fan servir.

- [ ] **Step 1: Verificar que Hugo extended està instal·lat**

Run: `hugo version`

Expected: una línia que conté `hugo v0.14x` (o superior) i la paraula `extended`. Si no hi és instal·lat: `brew install hugo`.

- [ ] **Step 2: Intentar un build sense configuració (comprovar que falla de forma esperada)**

Run: `cd /Users/tonipinel/Sites/cineclub && hugo build`

Expected: error `Unable to locate config file or config directory` (encara no existeix `hugo.toml`).

- [ ] **Step 3: Crear `hugo.toml`**

```toml
baseURL = "https://cineclubrodadebera.cat/"
languageCode = "ca"
title = "Cineclub Roda de Berà"
enableRobotsTXT = true

[permalinks]
  programacio = "/programacio/:year/:slug/"

[params]
  tagline = "Un espai per viure i compartir cinema durant tot l'any!"
  venueName = "Teatre del Casino Municipal de Roda de Berà"
  venueAddress = "Plaça dels Pins, 6, 43883 Roda de Berà (Tarragona)"
  membershipFormURL = "https://forms.gle/aPTySW5HKeuU712Z6"

[[menu.main]]
  name = "Inici"
  pageRef = "/"
  url = "/"
  weight = 1

[[menu.main]]
  name = "Programació"
  pageRef = "/programacio"
  url = "/programacio/"
  weight = 2

[[menu.main]]
  name = "Fes-te soci/a"
  pageRef = "/fes-te-socia"
  url = "/fes-te-socia/"
  weight = 3

[[menu.main]]
  name = "Preguntes freqüents"
  pageRef = "/preguntes-frequents"
  url = "/preguntes-frequents/"
  weight = 4
```

Nota: `pageRef` és necessari perquè `.IsMenuCurrent` (usat a `header.html`, Tasca 3) pugui associar cada entrada del menú amb la seva `Page` real i marcar-la com a activa — amb només `url`, `.IsMenuCurrent` no fa mai match. Com que `/programacio`, `/fes-te-socia` i `/preguntes-frequents` encara no existeixen fins a les Tasques 4, 7 i 8, Hugo mostrarà avisos de `pageRef` no resolt fins que es creïn — no fan fallar el build.

- [ ] **Step 4: Crear `content/_index.md` placeholder**

```markdown
---
title: "Cineclub Roda de Berà"
---

Contingut pendent (Tasca 3).
```

- [ ] **Step 5: Build i verificar que ara funciona**

Run: `hugo build`

Expected: exit code 0, sense errors. Comprovar que s'ha generat la sortida:

Run: `test -f public/index.html && echo OK`

Expected: `OK`

- [ ] **Step 6: Actualitzar `.gitignore`**

Afegir a l'existent `/Users/tonipinel/Sites/cineclub/.gitignore` (que ja conté `docs/superpowers/specs/`) les línies:

```
public/
resources/
.hugo_build.lock
node_modules/
static/css/main.css
```

(`static/css/main.css` és un artefacte compilat pel Tailwind CLI a partir de `assets/css/main.css` — es regenera a cada `npm run css:build`, inclòs a CI a la Tasca 9, així que no cal versionar-lo.)

- [ ] **Step 7: Commit**

```bash
git add hugo.toml content/_index.md .gitignore
git commit -m "Scaffold Hugo site with base config"
```

---

### Task 2: Pipeline de compilació de Tailwind CSS

**Files:**
- Create: `package.json`
- Create: `tailwind.config.js`
- Create: `assets/css/main.css`

**Interfaces:**
- Consumes: cap (independent de la resta de tasques).
- Produces: `static/css/main.css` (fitxer compilat), consumit per `layouts/partials/head.html` a la Tasca 3.

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "cineclub-roda-de-bera",
  "private": true,
  "scripts": {
    "css:build": "tailwindcss -i ./assets/css/main.css -o ./static/css/main.css --minify",
    "css:watch": "tailwindcss -i ./assets/css/main.css -o ./static/css/main.css --watch"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

- [ ] **Step 2: Instal·lar dependències**

Run: `npm install`

Expected: exit code 0, es crea `node_modules/` i `package-lock.json`.

- [ ] **Step 3: Crear `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./layouts/**/*.html", "./content/**/*.md"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#BF9000",
          dark: "#7F6000",
        },
      },
      fontFamily: {
        display: ["Comfortaa", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Crear `assets/css/main.css` (sense components encara, es van afegint a tasques posteriors)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Compilar i verificar la sortida**

Run: `npm run css:build`

Expected: exit code 0.

Run: `test -s static/css/main.css && echo OK`

Expected: `OK` (fitxer existeix i no és buit).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tailwind.config.js assets/css/main.css
git commit -m "Add Tailwind CSS build pipeline"
```

---

### Task 3: Layout base, capçalera/peu i pàgina d'inici

**Files:**
- Create: `layouts/_default/baseof.html`
- Create: `layouts/partials/head.html`
- Create: `layouts/partials/header.html`
- Create: `layouts/partials/footer.html`
- Create: `layouts/index.html`
- Create: `layouts/partials/date-ca.html`
- Create: `data/monthsCa.yaml`
- Create: `layouts/partials/session-card.html`
- Create: `assets/css/components/header.css`
- Create: `assets/css/components/footer.css`
- Create: `assets/css/components/button.css`
- Create: `assets/css/components/session-card.css`
- Create: `assets/css/components/home.css`
- Modify: `assets/css/main.css`
- Modify: `content/_index.md`

**Interfaces:**
- Produces: partial `date-ca.html` (rep una pàgina `.` amb `.Date`, retorna text de data en català), partial `session-card.html` (rep una pàgina de secció `programacio`, renderitza una targeta) — ambdós consumits per les Tasques 4, 5 i 6.

- [ ] **Step 1: Crear `data/monthsCa.yaml`**

```yaml
"1": gener
"2": febrer
"3": març
"4": abril
"5": maig
"6": juny
"7": juliol
"8": agost
"9": setembre
"10": octubre
"11": novembre
"12": desembre
```

- [ ] **Step 2: Crear `layouts/partials/date-ca.html`**

```html
{{- $t := .Date -}}
{{- $months := .Site.Data.monthsCa -}}
{{- $day := $t.Day -}}
{{- $monthName := index $months (printf "%d" $t.Month) -}}
{{- $year := $t.Year -}}
{{- $firstLetter := substr $monthName 0 1 -}}
{{- if in (slice "a" "e" "i" "o" "u") $firstLetter -}}
{{ $day }} d'{{ $monthName }} de {{ $year }}
{{- else -}}
{{ $day }} de {{ $monthName }} de {{ $year }}
{{- end -}}
```

- [ ] **Step 3: Crear `layouts/partials/session-card.html`**

```html
<article class="session-card">
  {{ with .Resources.GetMatch "poster*" }}
    <img class="session-card__image" src="{{ .RelPermalink }}" alt="{{ $.Params.titol_original | default $.Title }}">
  {{ end }}
  <div class="session-card__body">
    <span class="session-card__date">{{ partial "date-ca.html" . }}</span>
    <h3 class="session-card__title"><a href="{{ .RelPermalink }}">{{ .Title }}</a></h3>
    {{ $organitza := .Params.organitza | default "cineclub" }}
    {{ if ne $organitza "cineclub" }}
      <span class="session-card__badge">Amb {{ $organitza }}</span>
    {{ end }}
  </div>
</article>
```

- [ ] **Step 4: Crear `layouts/partials/head.html`**

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} · {{ .Site.Title }}{{ end }}</title>
<meta name="description" content="{{ .Site.Params.tagline }}">
<link rel="canonical" href="{{ .Permalink }}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }}{{ end }}">
<meta property="og:description" content="{{ .Site.Params.tagline }}">
<meta property="og:url" content="{{ .Permalink }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ "css/main.css" | relURL }}">
```

- [ ] **Step 5: Crear `layouts/partials/header.html`**

```html
<header class="site-header">
  <a class="site-header__brand" href="{{ "/" | relLangURL }}">{{ .Site.Title }}</a>
  <nav class="site-header__nav">
    {{ range .Site.Menus.main }}
      <a class="site-header__link{{ if $.IsMenuCurrent "main" . }} site-header__link--active{{ end }}" href="{{ .URL }}">{{ .Name }}</a>
    {{ end }}
  </nav>
</header>
```

- [ ] **Step 6: Crear `layouts/partials/footer.html`**

```html
<footer class="site-footer">
  <p>&copy; {{ now.Format "2006" }} {{ .Site.Title }}</p>
</footer>
```

- [ ] **Step 7: Crear `layouts/_default/baseof.html`**

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  {{ partial "head.html" . }}
  {{ block "head_extra" . }}{{ end }}
</head>
<body class="site-body">
  {{ partial "header.html" . }}
  <main>
    {{ block "main" . }}{{ end }}
  </main>
  {{ partial "footer.html" . }}
</body>
</html>
```

- [ ] **Step 8: Crear `layouts/index.html`**

```html
{{ define "main" }}
<section class="hero">
  <p class="hero__tagline">{{ .Site.Params.tagline }}</p>
</section>
<section class="intro">
  {{ .Content }}
</section>
{{ $upcoming := where (where .Site.RegularPages "Section" "programacio") "Date" "ge" now }}
{{ with (first 1 $upcoming) }}
  {{ range . }}
    <section class="next-session">
      <h2>Pròxima sessió</h2>
      {{ partial "session-card.html" . }}
    </section>
  {{ end }}
{{ end }}
<section class="membership-teaser">
  <a class="btn" href="{{ "/fes-te-socia/" | relLangURL }}">Fes-te sòcia/soci</a>
</section>
{{ end }}
```

- [ ] **Step 9: Actualitzar `content/_index.md` amb el contingut real**

```markdown
---
title: "Cineclub Roda de Berà"
---

## Neix un nou espai de cinema a Roda de Berà

Roda de Berà és municipi de cinema. El Cineclub Roda de Berà neix amb la voluntat d'ampliar l'oferta cultural i donar-li continuïtat al llarg de tot l'any. Perquè un municipi que té un festival de cinema també ha de tenir programació estable.

El Cineclub Roda de Berà és una associació cultural sense ànim de lucre que impulsarà una programació anual amb una projecció mensual, col·loqui posterior i espai de trobada per compartir mirades, reflexions i passió pel cinema.

Les sessions es faran al Teatre del Casino Municipal de Roda de Berà. Després de cada sessió, el debat i la germanor podran continuar al bar del Casino en un ambient distès.

Comptem amb el suport de l'Ajuntament de Roda de Berà, que ens cedeix els espais condicionats per poder exercir aquesta activitat i ens ajuda en la difusió de la mateixa.

El cineclub és participatiu. Pots proposar pel·lícules, col·laborar com a voluntària o voluntari, impulsar cicles temàtics o donar suport com a entitat o empresa local.
```

- [ ] **Step 10: Crear `assets/css/components/header.css`**

```css
.site-header {
  @apply fixed inset-y-0 left-0 z-10 flex hidden w-64 flex-col gap-1 bg-black px-6 py-8 text-white md:flex;
}
.site-header__brand {
  @apply font-display text-xl font-bold text-white no-underline;
}
.site-header__nav {
  @apply mt-8 flex flex-col gap-3;
}
.site-header__link {
  @apply text-white/80 no-underline hover:text-gold;
}
.site-header__link--active {
  @apply font-semibold text-gold;
}
```

- [ ] **Step 11: Crear `assets/css/components/footer.css`**

```css
.site-footer {
  @apply px-4 py-6 text-center text-sm text-black/60 md:ml-64;
}
```

- [ ] **Step 12: Crear `assets/css/components/button.css`**

```css
.btn {
  @apply inline-block rounded-full bg-gold px-6 py-3 font-display font-bold text-black no-underline transition hover:bg-gold-dark hover:text-white;
}
```

- [ ] **Step 13: Crear `assets/css/components/session-card.css`**

```css
.session-card {
  @apply flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md;
}
.session-card__image {
  @apply aspect-[2/3] w-full object-cover;
}
.session-card__body {
  @apply flex flex-1 flex-col gap-1 p-4;
}
.session-card__date {
  @apply font-display text-sm font-semibold uppercase tracking-wide text-gold-dark;
}
.session-card__title {
  @apply font-display text-lg font-bold text-black;
}
.session-card__title a {
  @apply text-black no-underline hover:text-gold-dark;
}
.session-card__badge {
  @apply inline-block w-fit rounded-full bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-dark;
}
```

- [ ] **Step 13b: Crear `assets/css/components/layout.css`**

```css
.site-body {
  @apply bg-white font-body text-black md:pl-64;
}
```

- [ ] **Step 14: Crear `assets/css/components/home.css`**

```css
.hero {
  @apply bg-black px-6 py-16 text-center text-white;
}
.hero__tagline {
  @apply font-display text-2xl font-bold text-gold sm:text-3xl;
}
.intro {
  @apply mx-auto max-w-2xl px-6 py-12 text-black;
}
.intro p {
  @apply mb-4;
}
.next-session {
  @apply mx-auto max-w-sm px-6 pb-12;
}
.next-session h2 {
  @apply mb-4 font-display text-xl font-bold text-black;
}
.membership-teaser {
  @apply flex justify-center pb-16;
}
```

- [ ] **Step 15: Actualitzar `assets/css/main.css` per importar els components**

Nota: els `@import` han d'anar abans dels `@tailwind` — per espec CSS, un `@import` que no és el primer contingut del fitxer (fora de comentaris) s'ignora silenciosament.

```css
@import "./components/layout.css";
@import "./components/header.css";
@import "./components/footer.css";
@import "./components/button.css";
@import "./components/session-card.css";
@import "./components/home.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 16: Recompilar CSS i buildar el lloc**

Run: `npm run css:build && hugo build`

Expected: exit code 0 en ambdues comandes.

- [ ] **Step 17: Verificar contingut generat**

Run: `grep -q "Un espai per viure i compartir cinema" public/index.html && grep -q "Fes-te soci/a" public/index.html && echo OK`

Expected: `OK`

- [ ] **Step 18: Verificació visual en local**

Run: `hugo server --port 1414 &`

Obrir `http://localhost:1414/` al navegador i comprovar que es veu la capçalera negra amb el menú, el groc `#BF9000` a la marca, i el text de la home. Aturar el servidor després (`kill %1` o `Ctrl+C`).

- [ ] **Step 19: Commit**

```bash
git add layouts assets/css data content/_index.md
git commit -m "Add base layout, header/footer and home page"
```

---

### Task 4: Llistat de Programació

**Files:**
- Create: `content/programacio/_index.md`
- Create: `layouts/programacio/list.html`
- Modify: `assets/css/components/session-card.css`

**Interfaces:**
- Consumes: `session-card.html` i `date-ca.html` (Tasca 3).
- Produces: pàgina `/programacio/` que la Tasca 6 pot verificar visualment un cop hi hagi sessions reals.

- [ ] **Step 1: Crear `content/programacio/_index.md`**

```markdown
---
title: "Programació"
---

Descobreix què fem aquest mes al Cineclub Roda de Berà.
```

- [ ] **Step 2: Afegir la regla `.session-grid` a `assets/css/components/session-card.css`**

Afegir al final del fitxer (creat a la Tasca 3), sense tocar les regles existents:

```css
.session-grid {
  @apply grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3;
}
```

- [ ] **Step 3: Crear `layouts/programacio/list.html`**

```html
{{ define "main" }}
<h1>{{ .Title }}</h1>
{{ .Content }}
<div class="session-grid">
  {{ range .Pages.ByDate.Reverse }}
    {{ partial "session-card.html" . }}
  {{ end }}
</div>
{{ end }}
```

- [ ] **Step 4: Build i verificar**

Run: `npm run css:build && hugo build && grep -q "Descobreix què fem aquest mes" public/programacio/index.html && echo OK`

Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add content/programacio/_index.md layouts/programacio/list.html assets/css/components/session-card.css
git commit -m "Add unified programació listing page"
```

---

### Task 5: Plantilla de fitxa de sessió (single) + dades estructurades

**Files:**
- Create: `layouts/programacio/single.html`
- Create: `layouts/partials/jsonld-screening-event.html`
- Create: `assets/css/components/session-detail.css`
- Modify: `assets/css/main.css`

**Interfaces:**
- Consumes: `date-ca.html` (Tasca 3), esquema de camps de front matter definit a les Global Constraints.
- Produces: layout `programacio/single.html`, consumit per les 6 fitxes de la Tasca 6.

- [ ] **Step 1: Crear `layouts/partials/jsonld-screening-event.html`**

Nota: NO es pot construir el JSON-LD escrivint claus JSON a mà i passant cada valor per `jsonify` individualment — dins d'un `<script>`, l'autoescapament contextual de `html/template` de Go tracta cada valor de tipus `string` com si fos una expressió JS i el torna a escapar, duplicant les cometes (p. ex. `"name": "\"Jane Eyre\""`). Cal construir tot l'objecte com un `dict` de Hugo i fer `jsonify` una sola vegada sobre el conjunt, marcant el resultat com seguro amb `safeJS`.

```html
{{- $data := dict
  "@context" "https://schema.org"
  "@type" "ScreeningEvent"
  "name" .Title
  "startDate" (.Date.Format "2006-01-02T15:04:05-07:00")
  "location" (dict
    "@type" "Place"
    "name" .Site.Params.venueName
    "address" .Site.Params.venueAddress
  )
  "workPresented" (dict
    "@type" "Movie"
    "name" (.Params.titol_original | default .Title)
  )
  "offers" (dict
    "@type" "Offer"
    "price" "5"
    "priceCurrency" "EUR"
    "url" .Permalink
  )
-}}
<script type="application/ld+json">
{{ $data | jsonify | safeJS }}
</script>
```

- [ ] **Step 2: Crear `layouts/programacio/single.html`**

```html
{{ define "head_extra" }}
{{ with .Resources.GetMatch "poster*" }}
<meta property="og:image" content="{{ .Permalink }}">
{{ end }}
{{ partial "jsonld-screening-event.html" . }}
{{ end }}

{{ define "main" }}
<section class="session-hero">
  <span class="session-hero__date">{{ partial "date-ca.html" . }} a les {{ .Date.Format "15:04" }}h</span>
  <h1 class="session-hero__title">{{ .Title }}</h1>
</section>

{{ with .Resources.GetMatch "poster*" }}
  <img src="{{ .RelPermalink }}" alt="{{ $.Params.titol_original | default $.Title }}" class="session-detail__image">
{{ end }}

<dl class="session-fitxa">
  <dt class="session-fitxa__label">Títol original</dt><dd>{{ .Params.titol_original }}</dd>
  {{ with .Params.direccio }}<dt class="session-fitxa__label">Direcció</dt><dd>{{ . }}</dd>{{ end }}
  {{ with .Params.guio }}<dt class="session-fitxa__label">Guió</dt><dd>{{ . }}</dd>{{ end }}
  <dt class="session-fitxa__label">País</dt><dd>{{ .Params.pais }}</dd>
  <dt class="session-fitxa__label">Any</dt><dd>{{ .Params.any }}</dd>
  <dt class="session-fitxa__label">Durada</dt><dd>{{ .Params.durada }} minuts</dd>
  <dt class="session-fitxa__label">Idioma</dt><dd>{{ .Params.idioma }}</dd>
  {{ with .Params.genere }}<dt class="session-fitxa__label">Gènere</dt><dd>{{ . }}</dd>{{ end }}
  {{ with .Params.fotografia }}<dt class="session-fitxa__label">Fotografia</dt><dd>{{ . }}</dd>{{ end }}
  {{ with .Params.muntatge }}<dt class="session-fitxa__label">Muntatge</dt><dd>{{ . }}</dd>{{ end }}
  {{ with .Params.musica }}<dt class="session-fitxa__label">Música</dt><dd>{{ . }}</dd>{{ end }}
  {{ with .Params.produccio }}<dt class="session-fitxa__label">Producció</dt><dd>{{ . }}</dd>{{ end }}
  <dt class="session-fitxa__label">Repartiment</dt><dd>{{ delimit .Params.repartiment ", " }}</dd>
  {{ with .Params.premis_destacats }}<dt class="session-fitxa__label">Premis destacats</dt><dd>{{ . }}</dd>{{ end }}
</dl>

{{ with .Params.versio_idiomatica }}<p class="session-version">{{ . }}</p>{{ end }}

{{ .Content }}

<div class="session-info">
  <p>{{ .Params.preu_o_acces }}</p>
  <p>{{ .Params.que_inclou }}</p>
  {{ with .Params.edat_minima_recomanada }}<p>Pel·lícula no recomanada per a menors de {{ . }} anys.</p>{{ end }}
  {{ with .Params.suport_distribucio }}<p>La distribució i cessió de drets per a aquesta sessió compta amb el suport de {{ . }}, a qui agraïm la col·laboració.</p>{{ end }}
</div>
{{ end }}
```

- [ ] **Step 3: Crear `assets/css/components/session-detail.css`**

```css
.session-detail__image {
  @apply w-full;
}
.session-hero {
  @apply flex flex-col items-center justify-center gap-2 bg-black px-4 py-16 text-center text-white;
}
.session-hero__date {
  @apply font-body text-sm text-white/80;
}
.session-hero__title {
  @apply font-display text-3xl font-bold text-gold sm:text-4xl;
}
.session-fitxa {
  @apply grid grid-cols-1 gap-x-8 gap-y-2 bg-gray-50 p-6 text-sm sm:grid-cols-2;
}
.session-fitxa__label {
  @apply font-semibold text-gold-dark;
}
.session-version {
  @apply px-6 pt-4 text-sm font-semibold text-gold-dark;
}
.session-info {
  @apply m-6 rounded-lg border border-gold/30 bg-gold/5 p-6 text-sm;
}
```

- [ ] **Step 4: Actualitzar `assets/css/main.css`**

Nota: els `@import` han d'anar SEMPRE abans dels `@tailwind`, no després — per espec CSS, un `@import` que no és el primer contingut del fitxer (fora de comentaris) s'ignora silenciosament.

```css
@import "./components/layout.css";
@import "./components/header.css";
@import "./components/footer.css";
@import "./components/button.css";
@import "./components/session-card.css";
@import "./components/home.css";
@import "./components/session-detail.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Build (encara sense contingut de sessió real, només comprova que no trenca res)**

Run: `npm run css:build && hugo build`

Expected: exit code 0 en ambdues comandes.

- [ ] **Step 6: Commit**

```bash
git add layouts/programacio/single.html layouts/partials/jsonld-screening-event.html assets/css
git commit -m "Add session detail template and ScreeningEvent structured data"
```

---

### Task 6: Migrar les 6 sessions existents

**Files:**
- Create: `content/programacio/2026/the-artist/index.md`
- Create: `content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/index.md`
- Create: `content/programacio/2026/jane-eyre/index.md`
- Create: `content/programacio/2026/secrets-i-mentides/index.md`
- Create: `content/programacio/2026/pig/index.md`
- Create: `content/programacio/2026/esperando-a-dali/index.md`

**Interfaces:**
- Consumes: `layouts/programacio/single.html` (Tasca 5), `session-card.html`/`layouts/programacio/list.html` (Tasca 4).

- [ ] **Step 1: Crear `content/programacio/2026/the-artist/index.md`**

```markdown
---
title: "The Artist"
date: 2026-03-05T19:00:00+01:00
titol_original: "The Artist"
direccio: "Michel Hazanavicius"
guio: "Michel Hazanavicius"
pais: "França"
any: 2011
durada: 100
idioma: "Pel·lícula muda (intertítols en anglès)"
fotografia: "Blanc i negre"
repartiment:
  - "Jean Dujardin"
  - "Bérénice Bejo"
  - "John Goodman"
premis_destacats: "5 Premis Oscar (incloent millor pel·lícula, millor director i millor actor)"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original subtitulada i col·loqui moderat posterior."
suport_distribucio: "A Contracorriente Films"
organitza: "cineclub"
aliases:
  - /programacio/5-de-març-the-artist/
---

## Sinopsi

Hollywood, finals dels anys 20. George Valentin és una estrella consagrada del cinema mut que veu com la seva carrera comença a trontollar amb l'arribada del cinema sonor. Al mateix temps, una jove actriu, Peppy Miller, inicia un ascens imparable cap a la fama.

Entre l'orgull, la por al canvi i una història d'amor subtil, The Artist retrata un moment clau en la història del cinema: el pas del silenci a la paraula.

## Context

Estrenada el 2011 i dirigida per Michel Hazanavicius, The Artist és una declaració d'amor al cinema clàssic de Hollywood. Rodada en blanc i negre i pràcticament muda, reprodueix l'estètica, el llenguatge i els codis narratius del cinema dels anys 20.

La pel·lícula evoca figures com Douglas Fairbanks i Gene Kelly, i homenatja l'època daurada dels grans estudis.

El seu èxit internacional va ser inesperat: una pel·lícula muda i en blanc i negre que va conquerir el públic contemporani i va triomfar als Premis Oscar.

## Curiositats

- Va guanyar 5 Premis Oscar, incloent millor pel·lícula i millor director.
- La banda sonora té un paper fonamental, ja que substitueix els diàlegs i reforça les emocions.
- És una de les poques pel·lícules mudes modernes amb èxit comercial global.
- El gos Uggie, que interpreta Jack, es va convertir en una autèntica estrella mediàtica.
- L'escena final juga amb el so d'una manera molt simbòlica, reforçant el tema central del film.

## Per què l'hem programat?

The Artist és, sobretot, una declaració d'amor al cinema. No només al cinema mut, sinó al cinema com a llenguatge universal capaç d'emocionar sense necessitat de paraules.

És una pel·lícula que parla del canvi, de la transformació i de la capacitat d'adaptar-se als nous temps sense perdre l'essència. I això connecta plenament amb el naixement del nostre cineclub: un projecte que vol mirar al passat per entendre'l, però també construir futur cultural i cinèfil a Roda de Berà. Inaugurar el Cineclub Roda de Berà amb The Artist és un gest simbòlic:

- Celebra els orígens del setè art.
- Reivindica la màgia de la sala fosca i la projecció compartida.
- Recorda que el cinema és emoció col·lectiva.

No hi ha millor manera de començar un cineclub que amb una pel·lícula que parla del propi cinema. Una obra que ens convida a estimar-lo, a defensar-lo i a viure'l en comunitat. El millor punt de partida és recordar per què el cinema ens enamora.
```

- [ ] **Step 2: Desar la imatge manualment**

Exportar/desar el fotograma de "The Artist" del lloc antic (o un cartell oficial de qualitat equivalent) com a `content/programacio/2026/the-artist/poster.jpg`.

- [ ] **Step 3: Crear `content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/index.md`**

```markdown
---
title: "L'avi de 100 anys que es va escapar per la finestra"
date: 2026-04-02T19:00:00+02:00
titol_original: "Hundraåringen som klev ut genom fönstret och försvann"
direccio: "Felix Herngren"
guio: "Felix Herngren, Hans Ingemansson (basat en la novel·la de Jonas Jonasson)"
pais: "Suècia"
any: 2013
durada: 112
idioma: "Suec"
fotografia: "Göran Hallberg"
premis_destacats: "Nominació a l'Oscar al millor maquillatge i perruqueria"
repartiment:
  - "Robert Gustafsson"
  - "Iwar Wiklander"
  - "David Wiberg"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original subtitulada i col·loqui moderat posterior."
edat_minima_recomanada: 7
suport_distribucio: "A Contracorriente Films"
organitza: "cineclub"
aliases:
  - /programacio/2-dabril-lavi-de-100-anys-que-es-va-escapar-per-la-finestra/
---

## Sinopsi

Allan Karlsson està a punt de celebrar el seu centè aniversari en una residència d'avis. Però ell no té cap intenció de participar en la festa que li han preparat. Sense pensar-s'ho gaire, decideix escapar-se saltant per la finestra i començar una nova aventura.

A partir d'aquí, Allan es veu embolicat en una sèrie de situacions tan absurdes com divertides: una maleta plena de diners, criminals que el persegueixen i un grup d'aliats inesperats. Paral·lelament, la història repassa la seva vida extraordinària, en què, gairebé sense voler-ho, ha estat present en alguns dels moments clau de la història del segle XX.

## Context

La pel·lícula és l'adaptació cinematogràfica del bestseller internacional de l'escriptor suec Jonas Jonasson, publicat el 2009. El llibre es va convertir en un fenomen editorial i es va traduir a nombrosos idiomes.

Estrenada el 2013, la pel·lícula també va tenir un gran èxit de públic i es va convertir en una de les produccions sueques més populars dels darrers anys. El seu humor absurd i el recorregut del protagonista a través de diferents episodis històrics del segle XX han fet que sovint es compari amb relats que barregen història i ficció amb un to humorístic.

## Curiositats

- L'actor i humorista suec Robert Gustafsson —que en el moment del rodatge no arribava als 50 anys— interpreta Allan Karlsson amb un elaborat treball de maquillatge que el transforma en un home de cent anys.
- La pel·lícula alterna dues línies narratives: les aventures d'Allan amb cent anys i els records de la seva vida al llarg del segle XX.
- El protagonista es troba accidentalment amb diversos personatges històrics i participa indirectament en esdeveniments importants del segle passat.
- L'èxit del film va donar lloc a una seqüela estrenada el 2016.

## Per què l'hem programat?

Aquesta pel·lícula és una comèdia original que combina aventura, història i humor absurd. El personatge d'Allan Karlsson, amb la seva actitud despreocupada davant la vida, ofereix una mirada divertida sobre alguns dels grans esdeveniments del segle XX.

És una proposta ideal per gaudir en comunitat: una història plena de situacions inesperades, personatges peculiars i un humor que convida tant al riure com a la reflexió sobre el pas del temps i les casualitats de la vida.
```

- [ ] **Step 4: Desar la imatge manualment**

Desar la imatge d'aquesta sessió com a `content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/poster.jpg`.

- [ ] **Step 5: Crear `content/programacio/2026/jane-eyre/index.md`**

```markdown
---
title: "Jane Eyre"
date: 2026-08-06T19:00:00+02:00
titol_original: "Jane Eyre"
direccio: "Cary Joji Fukunaga"
guio: "Moira Buffini (basat en la novel·la de Charlotte Brontë)"
pais: "Regne Unit / Estats Units"
any: 2011
durada: 120
idioma: "Anglès"
genere: "Drama, romàntic, època"
fotografia: "Adriano Goldman"
muntatge: "Melanie Oliver"
musica: "Dario Marianelli"
repartiment:
  - "Mia Wasikowska"
  - "Michael Fassbender"
  - "Jamie Bell"
  - "Judi Dench"
  - "Sally Hawkins"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original subtitulada i col·loqui moderat posterior."
edat_minima_recomanada: 7
suport_distribucio: "A Contracorriente Films"
organitza: "cineclub"
aliases:
  - /programacio/6-dagost-jane-eyre/
---

## Sinopsi

Jane Eyre, una jove òrfena amb una forta voluntat i un profund sentit moral, és contractada com a institutriu a Thornfield Hall, una mansió misteriosa. Allà coneix el seu enigmàtic propietari, Edward Rochester, amb qui estableix una relació intensa i complexa. Però un secret ocult amenaça de destruir el vincle entre tots dos.

## Context

Aquesta adaptació del clàssic de Charlotte Brontë ofereix una mirada austera i íntima del relat, apostant per una posada en escena naturalista i una gran fidelitat emocional als personatges. Dirigida per Cary Joji Fukunaga, la pel·lícula combina el romanticisme amb una atmosfera fosca i continguda, allunyada de versions més idealitzades.

## Curiositats

- El director va apostar per utilitzar llum natural i espelmes en moltes escenes, reforçant el to realista i gòtic del film.
- La història de Jane Eyre ha estat adaptada al cinema i la televisió en nombroses ocasions, fet que la converteix en un dels grans clàssics universals.
- Mia Wasikowska va ser escollida per la seva proximitat a l'edat i al caràcter del personatge original.
- La mansió de Thornfield es va rodar en localitzacions reals com Haddon Hall (Anglaterra).
- La pel·lícula destaca per evitar una estètica excessivament romàntica i apostar per una representació més crua i versemblant de l'època.

## Per què l'hem programat?

Amb Jane Eyre proposem revisitar un gran clàssic de la literatura des d'una mirada contemporània, que posa el focus en la força del personatge femení i en la seva lluita per la independència i la dignitat.

La pel·lícula combina emoció, atmosfera i rigor formal per oferir una experiència cinematogràfica immersiva, que convida a reflexionar sobre l'amor, les desigualtats socials i la construcció de la identitat. És una obra que dialoga amb el present tot mantenint l'essència del relat original.
```

- [ ] **Step 6: Desar la imatge manualment**

Desar la imatge com a `content/programacio/2026/jane-eyre/poster.jpg`.

- [ ] **Step 7: Crear `content/programacio/2026/secrets-i-mentides/index.md`**

```markdown
---
title: "Secrets i mentides"
date: 2026-05-07T19:00:00+02:00
titol_original: "Secrets & Lies"
direccio: "Mike Leigh"
guio: "Mike Leigh"
pais: "Regne Unit / França"
any: 1996
durada: 136
idioma: "Anglès"
genere: "Drama"
fotografia: "Dick Pope"
muntatge: "Jon Gregory"
musica: "Andrew Dickson"
repartiment:
  - "Brenda Blethyn"
  - "Marianne Jean-Baptiste"
  - "Timothy Spall"
  - "Phyllis Logan"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original subtitulada i col·loqui moderat posterior."
edat_minima_recomanada: 12
suport_distribucio: "A Contracorriente Films"
organitza: "cineclub"
aliases:
  - /programacio/7-de-maig-secrets-i-mentides/
---

## Sinopsi

Després de la mort dels seus pares adoptius, una jove optometrista d'èxit decideix buscar la seva mare biològica. Quan finalment la troba, descobreix que és una dona blanca de classe treballadora amb una vida marcada per la solitud i les dificultats.

A partir d'aquesta trobada inesperada, es desencadena un procés emocional que farà aflorar secrets familiars, tensions i veritats amagades.

## Context

Secrets & Lies és una de les obres més reconegudes de Mike Leigh, caracteritzada pel seu estil realista i pel treball intens amb els actors. El film es construeix a partir d'improvisacions, fet que aporta una gran naturalitat als personatges i a les relacions que s'hi desenvolupen.

La pel·lícula destaca per la seva mirada profunda sobre la família, la identitat i les diferències de classe, combinant moments de gran càrrega dramàtica amb tocs d'humor i humanitat.

## Curiositats

- La pel·lícula es va construir a partir del mètode habitual de treball de Mike Leigh, basat en llargues sessions d'improvisació amb les actrius i actors abans del rodatge.
- Brenda Blethyn va guanyar el premi a la millor actriu al Festival de Cannes per la seva interpretació, considerada una de les més destacades del cinema britànic dels anys 90.
- Marianne Jean-Baptiste va ser nominada a l'Oscar, convertint-se en una de les primeres actrius negres britàniques en aconseguir-ho.
- Moltes escenes es van rodar en ordre cronològic per facilitar l'evolució emocional dels personatges.

## Per què l'hem programat?

Secrets & Lies és una obra clau del cinema europeu contemporani que aborda amb sensibilitat temes universals com la família, la identitat i la necessitat de pertinença. La seva mirada honesta i profundament humana connecta amb l'espectador des de la veritat emocional dels personatges.

Amb aquesta projecció volem reivindicar el cinema d'autor que posa les actrius i actors i les emocions al centre, i oferir una experiència que convida al debat i a la reflexió col·lectiva sobre els vincles familiars i les diferències socials.
```

- [ ] **Step 8: Desar la imatge manualment**

Desar la imatge com a `content/programacio/2026/secrets-i-mentides/poster.jpg`.

- [ ] **Step 9: Crear `content/programacio/2026/pig/index.md`**

```markdown
---
title: "Pig"
date: 2026-06-25T19:00:00+02:00
titol_original: "Pig"
direccio: "Michael Sarnoski"
guio: "Michael Sarnoski i Vanessa Block"
pais: "Estats Units"
any: 2021
durada: 92
idioma: "Anglès"
genere: "Drama / Misteri / Drama psicològic"
repartiment:
  - "Nicolas Cage"
  - "Alex Wolff"
  - "Adam Arkin"
versio_idiomatica: "Versió Original Subtitulada Espanyol"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original subtitulada i col·loqui moderat posterior."
edat_minima_recomanada: 12
suport_distribucio: "A Contracorriente Films"
organitza: "cineclub"
aliases:
  - /programacio/25-de-juny-pig/
---

## Sinopsi

En Rob és un antic xef d'alta cuina que viu retirat als boscos d'Oregon, dedicat a la cerca de tòfones amb l'ajuda de la seva inseparable truja. Quan l'animal és segrestat, es veu obligat a tornar a Portland i enfrontar-se a un passat que havia intentat deixar enrere. El que comença com una recerca aparentment senzilla es converteix en un viatge profund sobre la pèrdua, el record i els vincles que donen sentit a la vida.

## Context

Lluny de ser el thriller de venjança que la seva premissa podria suggerir, Pig és una obra intimista i emocionant que reflexiona sobre el dol, l'amor, la memòria i la necessitat humana de connectar amb els altres.

El debut com a director de Michael Sarnoski va sorprendre crítica i públic per la seva sensibilitat narrativa i per una interpretació de Nicolas Cage considerada entre les millors de la seva carrera.

La pel·lícula va obtenir un ampli reconeixement crític i va guanyar l'Independent Spirit Award al millor primer guió.

## Curiositats

- El món de la gastronomia és real. Diversos xefs professionals van assessorar la producció per representar amb autenticitat l'alta cuina de Portland i la cultura gastronòmica de la ciutat.
- El porc era una autèntica especialista. La truja que acompanya el protagonista estava entrenada específicament per al rodatge i va treballar amb l'equip durant diverses setmanes abans de començar la filmació.
- Una de les millors interpretacions de Nicolas Cage. La interpretació de Cage va ser àmpliament elogiada i va aparèixer en nombroses llistes de les millors actuacions cinematogràfiques de l'any.

## Per què l'hem programat?

Perquè és una de les pel·lícules més singulars i commovedores dels darrers anys: una història aparentment petita que acaba parlant de les grans pèrdues i dels records que ens defineixen.

Una experiència cinematogràfica delicada, sorprenent i profundament humana.
```

- [ ] **Step 10: Desar la imatge manualment**

Desar la imatge com a `content/programacio/2026/pig/poster.jpg`.

- [ ] **Step 11: Crear `content/programacio/2026/esperando-a-dali/index.md`**

```markdown
---
title: "Esperando a Dalí"
slug: "esperando-a-dali"
date: 2026-07-23T19:00:00+02:00
titol_original: "Esperando a Dalí"
direccio: "David Pujol"
guio: "David Pujol"
pais: "Espanya"
any: 2023
durada: 114
idioma: "Castellà"
genere: "Comèdia dramàtica, romàntica i gastronòmica"
fotografia: "Román Martínez de Bujo"
muntatge: "Jordi Muñoz"
musica: "Pascal Comelade"
produccio: "FishCorb, Arlong Productions i Loco Films"
repartiment:
  - "Iván Massagué"
  - "José Garcia"
  - "Clara Ponsot"
  - "Pol López"
  - "Francesc Ferrer"
  - "Vicky Peña"
  - "Paco Tous"
  - "Gal Soler"
versio_idiomatica: "Versió Original en Castellà"
preu_o_acces: "Per accedir a la sessió caldrà fer-se soci/a o fer una aportació de 5€ per persona a l'associació."
que_inclou: "La sessió inclou projecció en versió original en espanyol i col·loqui moderat posterior."
edat_minima_recomanada: 7
suport_distribucio: "Arlong Productions"
organitza: "cineclub"
aliases:
  - /programacio/23-de-juliol-esperando-a-dalí/
---

## Sinopsi

A la dècada dels setanta, Fernando, un jove cuiner amb un talent extraordinari, arriba a Cadaqués fugint d'un passat complicat. Allà comença a treballar en un modest restaurant familiar mentre somia desenvolupar una cuina innovadora i creativa. L'ombra de Salvador Dalí, que viu a la població amb Gala i exerceix una fascinació constant sobre els habitants, acabarà influint decisivament en la vida del cuiner. Entre l'efervescència artística, els canvis socials del final del franquisme i la passió per la gastronomia, Fernando descobrirà que la creativitat pot transformar una vida sencera.

## Context

Esperando a Dalí ens transporta al Cadaqués de mitjans dels anys setanta, en els darrers anys del franquisme i els primers compassos de la Transició. En aquell moment, aquest petit poble de la Costa Brava era un punt de trobada excepcional entre pescadors, artistes, intel·lectuals i visitants arribats d'arreu del món. La presència de Salvador Dalí i Gala havia convertit Cadaqués en un espai únic, on convivien les tradicions locals amb les avantguardes artístiques internacionals.

La pel·lícula s'inspira lliurement en el naixement de la nova cuina catalana i en l'esperit innovador que, anys més tard, acabaria situant la gastronomia del país entre les més influents del món. A través de la figura d'un jove cuiner que busca la seva pròpia veu, el film explora la relació entre cuina i creativitat, mostrant com la gastronomia pot esdevenir una forma d'expressió artística tan poderosa com la pintura, la música o el cinema.

Al mateix temps, l'obra retrata una societat que comença a canviar, deixant enrere dècades d'immobilisme i obrint-se a noves idees, sensibilitats i maneres d'entendre la cultura.

## Curiositats

- Tot i que Salvador Dalí és una presència constant al llarg de la història, el personatge apareix relativament poc en pantalla. La seva figura funciona sobretot com un mite que inspira, condiciona i transforma la vida dels protagonistes.
- Bona part del rodatge es va realitzar a localitzacions de l'Alt Empordà i la Costa Brava, contribuint a recrear amb autenticitat l'atmosfera del Cadaqués dels anys setanta.
- El film combina elements reals i ficticis, inspirant-se en l'entorn de Dalí i en l'evolució de la gastronomia catalana, però sense pretendre ser una biografia ni una reconstrucció històrica estricta.
- La pel·lícula estableix un paral·lelisme entre la revolució artística representada per Dalí i la revolució gastronòmica que començava a gestar-se en aquells anys.

## Per què l'hem programat?

Perquè és una pel·lícula que celebra la creativitat en totes les seves formes. Esperando a Dalí ens parla de cuina, però també de l'art, dels somnis i de la necessitat d'atrevir-se a imaginar coses noves. Amb una combinació molt atractiva d'humor, emoció i evocació històrica, el film ofereix una mirada optimista sobre el talent i la capacitat transformadora de la cultura.

També perquè ens permet redescobrir una figura universal com Salvador Dalí des d'una perspectiva diferent, més humana i quotidiana, alhora que reivindica el paisatge i la riquesa cultural de l'Empordà. És una obra accessible per a tots els públics, que connecta cinema, gastronomia i patrimoni, i que convida a reflexionar sobre com les grans revolucions creatives sovint neixen en els llocs més inesperats.

Finalment, és una oportunitat per gaudir d'una producció catalana amb vocació internacional que posa en valor una part essencial de la nostra història cultural recent, i que ho fa amb sensibilitat, humor i una gran cura visual.
```

- [ ] **Step 12: Desar la imatge manualment**

Desar la imatge com a `content/programacio/2026/esperando-a-dali/poster.jpg`.

- [ ] **Step 13: Build i verificar les 6 fitxes**

Run:

```bash
npm run css:build && hugo build
for slug in the-artist lavi-de-100-anys-que-es-va-escapar-per-la-finestra jane-eyre secrets-i-mentides pig esperando-a-dali; do
  test -f "public/programacio/2026/$slug/index.html" && echo "OK $slug" || echo "FALTA $slug"
done
```

Expected: `OK <slug>` per a les 6 sessions.

- [ ] **Step 14: Verificar els alias (redirect de les URLs antigues)**

Run:

```bash
test -f "public/programacio/6-dagost-jane-eyre/index.html" && echo "OK alias jane-eyre"
grep -q "programacio/2026/jane-eyre" "public/programacio/6-dagost-jane-eyre/index.html" && echo "OK redirect jane-eyre"
```

Expected: `OK alias jane-eyre` i `OK redirect jane-eyre`. Repetir el mateix patró per als altres 5 alias si es vol confirmar-los tots.

- [ ] **Step 15: Verificar el llistat de programació**

Run: `grep -c "session-card" public/programacio/index.html`

Expected: un número ≥ 6 (compta l'obertura de cada targeta; si la classe apareix un cop per targeta, hauria de ser exactament 6).

- [ ] **Step 16: Verificació visual en local**

Run: `hugo server --port 1414 &`

Obrir `http://localhost:1414/programacio/` i comprovar que es veuen les 6 targetes amb data en català correcta (p. ex. "6 d'agost de 2026"), i entrar a la fitxa de Jane Eyre per comprovar que la fitxa tècnica, el cos i la caixa d'informació de sessió es veuen bé. Aturar el servidor després.

- [ ] **Step 17: Commit**

```bash
git add content/programacio/2026
git commit -m "Migrate 6 existing sessions with legacy URL aliases"
```

---

### Task 7: Pàgina "Fes-te soci/a"

**Files:**
- Create: `layouts/shortcodes/btn.html`
- Create: `content/fes-te-socia.md`
- Create: `layouts/_default/single.html`
- Create: `assets/css/components/page.css`
- Modify: `assets/css/main.css`

**Interfaces:**
- Produces: shortcode `btn` (`{{< btn "URL" "Text" >}}`), reutilitzable en qualsevol contingut Markdown futur que necessiti un botó d'acció. Produces classes `.page`/`.page__title`, reutilitzades a la Tasca 8.

- [ ] **Step 1: Crear `layouts/shortcodes/btn.html`**

```html
<a class="btn" href="{{ .Get 0 }}">{{ .Get 1 }}</a>
```

- [ ] **Step 2: Crear `assets/css/components/page.css`**

```css
.page {
  @apply p-6;
}
.page__title {
  @apply font-display text-2xl font-bold;
}
```

- [ ] **Step 3: Actualitzar `assets/css/main.css` per importar el nou component**

Nota: els `@import` han d'anar abans dels `@tailwind` (si no, PostCSS els descarta silenciosament).

```css
@import "./components/layout.css";
@import "./components/header.css";
@import "./components/footer.css";
@import "./components/button.css";
@import "./components/session-card.css";
@import "./components/session-detail.css";
@import "./components/home.css";
@import "./components/page.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Crear `layouts/_default/single.html`**

```html
{{ define "main" }}
<article class="page">
  <h1 class="page__title">{{ .Title }}</h1>
  {{ .Content }}
</article>
{{ end }}
```

- [ ] **Step 5: Crear `content/fes-te-socia.md`**

```markdown
---
title: "Fes-te soci/a"
---

La quota anual és de 30 € i dona accés a:

- Un mínim de 12 projeccions anuals
- Programació anunciada amb antelació
- Participació en votacions de la programació de futures pel·lícules
- Activitats i cicles especials amb avantatges per a sòcies

Amb el passi d'una persona adulta poden accedir fins a dos menors sota la seva responsabilitat.

La quota és la manera de garantir que el cinema tingui un espai estable a Roda de Berà. Però si ho prefereixes pots assistir a una sessió amb una aportació mínima de 5€, i decidir després si et fas sòcia o soci.

{{< btn "https://forms.gle/aPTySW5HKeuU712Z6" "Vull fer-me soci/a" >}}
```

- [ ] **Step 6: Build i verificar**

Run: `npm run css:build && hugo build && grep -q "forms.gle/aPTySW5HKeuU712Z6" public/fes-te-socia/index.html && echo OK`

Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add layouts/shortcodes/btn.html layouts/_default/single.html content/fes-te-socia.md assets/css/components/page.css assets/css/main.css
git commit -m "Add fes-te-socia page with membership CTA"
```

---

### Task 8: Pàgina "Preguntes freqüents"

**Files:**
- Create: `content/preguntes-frequents.md`
- Create: `layouts/faq/single.html`
- Create: `assets/css/components/faq.css`
- Modify: `assets/css/main.css`

**Interfaces:**
- Consumes: `layouts/_default/single.html` no s'aplica aquí — aquesta pàgina té `type: faq` i per tant Hugo fa servir `layouts/faq/single.html` en comptes del genèric.

- [ ] **Step 1: Crear `content/preguntes-frequents.md`**

```markdown
---
title: "Preguntes freqüents"
type: faq
faq:
  - pregunta: "Què és el Cineclub Roda de Berà?"
    resposta: |
      És una associació cultural sense ànim de lucre dedicada a la difusió del cinema i la cultura audiovisual. Organitzem projeccions, cinefòrums i activitats relacionades amb el setè art.

      El Cineclub Roda de Berà és un projecte col·lectiu per compartir cinema, debat i cultura. La quota no és una entrada, és una manera de garantir que el cinema tingui un espai estable al municipi.
  - pregunta: "On es fan les projeccions?"
    resposta: |
      Les sessions es realitzen al Teatre del Casino Municipal de Roda de Berà. Plaça dels Pins, 6, 43883 Roda de Berà (Tarragona).
  - pregunta: "Quin és el format de les sessions?"
    resposta: |
      Cada sessió inclou:

      - Projecció de la pel·lícula en versió original subtitulada.
      - Sempre que sigui possible, els subtítols seran en català; en cas contrari, seran en castellà.
      - Col·loqui posterior moderat.
      - Espai opcional de trobada al restobar per continuar el debat de manera informal.

      El Cineclub Roda de Berà vol fomentar no només la visualització, sinó també la reflexió i el debat compartit.
  - pregunta: "Quant costa fer-se sòcia o soci?"
    resposta: |
      La quota anual és de 30 euros per persona.

      La condició de sòcia o soci és individual i nominal. No obstant això, amb el passi d'una persona adulta sòcia poden accedir a les projeccions de la secció Cineclub General fins a dos menors d'edat sota la seva responsabilitat, sense cost addicional.

      La quota contribueix a:

      - Fer possible un mínim de 12 projeccions anuals.
      - Cobrir drets d'exhibició, logística i despeses organitzatives.
      - Garantir la continuïtat i estabilitat del projecte.
  - pregunta: "Què inclou la quota?"
    resposta: |
      Com a sòcia o soci general tens dret a:

      - Accedir a totes les projeccions de la secció Cineclub General.
      - Gaudir d'un mínim de 12 projeccions anuals.
      - Conèixer la programació amb una antelació mínima de 2-3 mesos.
      - Rebre informació periòdica sobre activitats i gestió de l'entitat.
      - Votar les properes pel·lícules programades (a partir d'una selecció feta per la junta).

      A més, podràs participar en cicles especials, activitats complementàries i sessions extraordinàries que, segons el format i els costos de cada activitat, podran ser gratuïtes o oferir-se amb quota reduïda per a les persones sòcies.
  - pregunta: "Com he de fer l'alta al Cineclub i pagar la quota?"
    resposta: |
      Per completar l'alta com a sòcia o soci, cal seguir dos passos:

      1. Omplir el formulari d'alta que trobaràs al nostre web o que t'enviarem per e-mail.
      2. Pagar la quota de 30 € mitjançant transferència bancària al compte que t'indicarem per correu electrònic, o bé pagar la quota en mà a la propera sessió presencial.

      Aquest procés garanteix que la teva alta quedi registrada i puguis accedir a totes les activitats incloses a la quota.
  - pregunta: "I si només vull venir a una sessió puntual?"
    resposta: |
      Cap problema! Si prefereixes provar primer, pots venir a una projecció fent una aportació mínima de 5 €.

      Si després de la sessió decideixes fer-te sòcia o soci en aquell mateix moment, els 5 € es descomptaran de la quota anual. En canvi, no es descomptaran aportacions si l'alta es fa en un moment posterior.

      Recorda que amb el passi d'una persona adulta poden accedir fins a dos menors sota la seva responsabilitat. La quota anual és la manera de garantir que el cinema tingui un espai estable a Roda de Berà.
  - pregunta: "Quan es fan les projeccions?"
    resposta: |
      La base del calendari serà el primer dijous de cada mes.

      En situacions excepcionals (festes, manca de disponibilitat d'espais, qüestions tècniques...) la data es podrà reajustar. En aquests casos ens comprometem a:

      - Avisar amb antelació
      - Mantenir regularitat
      - Garantir el mínim anual
  - pregunta: "Hi haurà calendari anual?"
    resposta: |
      Sí. Cada any presentarem:

      - Un calendari bàsic anual orientatiu.
      - Programació detallada amb un mínim de 2-3 mesos d'antelació.

      Això permet planificació i transparència.
  - pregunta: "Hi ha diferents tipus de sòcies o socis?"
    resposta: |
      Sí. Hi ha dues modalitats:

      - Sòcies o socis generals: participen en les projeccions i activitats del Cineclub.
      - Sòcies o socis vocals: a més, poden votar a l'Assemblea General, elegir i ser elegits per a càrrecs directius.

      Qualsevol sòcia general pot sol·licitar ser vocal si compleix els requisits establerts als estatuts.
  - pregunta: "És obligatori implicar-se en la gestió?"
    resposta: |
      No. Com a sòcia o soci general pots:

      - Assistir a les projeccions.
      - Participar en activitats.
      - Fer propostes.

      La implicació en la governança és voluntària i correspon a les persones sòcies vocals.
  - pregunta: "Com es decideixen les pel·lícules?"
    resposta: |
      La programació la coordina la Junta Directiva, que elabora una proposta coherent amb els objectius culturals del Cineclub i la disponibilitat de drets.

      Tot i això, el funcionament és participatiu:

      - Es poden proposar títols per part de les persones sòcies.
      - Es poden crear grups de treball temàtics.
      - Es poden organitzar votacions per escollir les següents pel·lícules programades, a partir d'una selecció prèviament definida per la Junta.

      El Cineclub vol combinar criteri cultural, viabilitat tècnica i participació de les persones sòcies.
  - pregunta: "El Cineclub té ànim de lucre?"
    resposta: |
      No. Els possibles excedents econòmics es destinen íntegrament a:

      - Més activitats.
      - Millorar la programació.
      - Fer créixer el projecte.

      No hi ha repartiment de beneficis.
  - pregunta: "Puc donar-me de baixa quan vulgui?"
    resposta: |
      Sí. La baixa és voluntària i només cal comunicar-la per escrit. En qualsevol cas es contempla retornar la quota anual, però com és evident, no es cobrarà la quota del proper any.
  - pregunta: "Vull col·laborar amb el Cineclub. Com ho puc fer?"
    resposta: |
      El Cineclub és un projecte col·lectiu i el voluntariat és benvingut. Pots col·laborar de diverses maneres:

      - Participant en grups de programació o debat.
      - Donant suport en tasques organitzatives.
      - Ajudant en comunicació o difusió.
      - Proposant activitats o cicles temàtics.

      La implicació és sempre voluntària i adaptable a la disponibilitat de cada persona.

      També s'accepten patrocinis i col·laboracions d'empreses o entitats locals, que contribueixin a reforçar la viabilitat i el creixement del projecte. Si vols implicar-te, només cal contactar amb la Junta.
  - pregunta: "El Cineclub com pot créixer en el futur?"
    resposta: |
      Aquest és el començament del Cineclub. Si la resposta és positiva i el nombre de sòcies augmenta, podem valorar:

      - Incorporar iniciatives com el Cicle Gaudí, que permet disposar d'una pel·lícula mensual addicional de cinema català.
      - Organitzar cicles temàtics específics.
      - Obrir sessions més comercials, infantils o familiars (no necessàriament en versió original).
      - Augmentar considerablement el nombre de sessions i oferta mensual.

      Tot això, però, depèn directament del nombre de persones sòcies, del voluntariat i de la viabilitat econòmica del projecte. El creixement serà progressiu i responsable.
---
```

- [ ] **Step 2: Crear `layouts/faq/single.html`**

```html
{{ define "main" }}
<article class="page">
  <h1 class="page__title">{{ .Title }}</h1>
  <div class="faq">
    {{ range .Params.faq }}
      <details class="faq__item">
        <summary class="faq__question">{{ .pregunta }}</summary>
        <div class="faq__answer">{{ .resposta | markdownify }}</div>
      </details>
    {{ end }}
  </div>
</article>
{{ end }}
```

- [ ] **Step 3: Crear `assets/css/components/faq.css`**

```css
.faq__item {
  @apply border-b border-gray-200 py-4;
}
.faq__question {
  @apply cursor-pointer font-display font-semibold text-black;
}
.faq__answer {
  @apply mt-2 text-sm text-gray-700;
}
```

- [ ] **Step 4: Actualitzar `assets/css/main.css`**

Nota: els `@import` han d'anar abans dels `@tailwind` (si no, PostCSS els descarta silenciosament).

```css
@import "./components/layout.css";
@import "./components/header.css";
@import "./components/footer.css";
@import "./components/button.css";
@import "./components/session-card.css";
@import "./components/session-detail.css";
@import "./components/home.css";
@import "./components/page.css";
@import "./components/faq.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Build i verificar**

Run:

```bash
npm run css:build && hugo build
grep -c "faq__item" public/preguntes-frequents/index.html
```

Expected: `16` (una per pregunta).

- [ ] **Step 6: Commit**

```bash
git add content/preguntes-frequents.md layouts/faq assets/css
git commit -m "Add preguntes-frequents FAQ page"
```

---

### Task 9: Desplegament a GitHub Pages via GitHub Actions

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `package.json` (Tasca 2), `hugo.toml` (Tasca 1).

- [ ] **Step 1: Crear `.github/workflows/deploy.yml`**

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install npm dependencies
        run: npm ci

      - name: Build Tailwind CSS
        run: npm run css:build

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: "0.140.0"
          extended: true

      - name: Build site
        run: hugo --minify

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verificar la sintaxi del YAML localment**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/deploy.yml')" && echo OK`

Expected: `OK` (Ruby amb suport YAML ve preinstal·lat a macOS, evitant dependre de paquets Python addicionals com PyYAML).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to build and deploy to GitHub Pages"
```

- [ ] **Step 4: Push i activar GitHub Pages (acció manual fora d'aquest repo local)**

Un cop fet `git push origin main`, cal anar a la configuració del repositori a GitHub (`Settings → Pages`) i triar **Source: GitHub Actions**. Aquest pas no es pot automatitzar des d'aquí — demanar confirmació a l'usuari abans de fer-lo si l'agent que executa el pla té accés a `gh`.

---

### Task 10: Build final complet i revisió visual

**Files:**
- Cap fitxer nou — tasca de verificació integral.

- [ ] **Step 1: Build complet net**

Run: `rm -rf public resources && npm run css:build && hugo --minify`

Expected: exit code 0, es regenera `public/` sencer.

- [ ] **Step 2: Comprovar sitemap i robots**

Run: `test -f public/sitemap.xml && test -f public/robots.txt && echo OK`

Expected: `OK`

- [ ] **Step 3: Revisió visual completa en local**

Run: `hugo server --port 1414 &`

Recórrer manualment a `http://localhost:1414/`:
- Inici (hero, intro, pròxima sessió, CTA)
- Programació (llistat de 6 targetes)
- Cadascuna de les 6 fitxes de sessió
- Fes-te soci/a (botó cap al Google Form)
- Preguntes freqüents (16 desplegables)
- Comprovar responsive: redimensionar a mida mòbil (menú i targetes s'han d'adaptar correctament)

Aturar el servidor en acabar.

- [ ] **Step 4: Commit final (si hi ha canvis pendents)**

```bash
git status
```

Si hi ha fitxers sense commitejar (p. ex. imatges afegides manualment a les Tasques 6), fer:

```bash
git add content/programacio/2026/*/poster.jpg
git commit -m "Add poster images for migrated sessions"
```

---

### Addendum: troballes de la revisió visual (aplicades)

La revisió visual de la Tasca 10 va detectar dos forats reals no coberts pels passos anteriors, corregits abans de tancar el pla:

1. **Sense navegació mòbil**: `.site-header` és `hidden md:flex`, i cap plantilla oferia cap substitut per sota del breakpoint `md`. S'ha afegit una segona capçalera (`.site-header-mobile`, `md:hidden`) al partial `header.html`, amb el mateix menú i lògica `IsMenuCurrent`.
2. **Tipografia de Markdown sense estil**: el reset de Tailwind elimina els estils per defecte de `h2`/`ul`/`ol`, i cap classe els restaurava allà on es renderitza Markdown lliure (cos de sessió, respostes de FAQ, pàgines estàtiques, intro de la llista de programació). S'ha afegit `assets/css/components/prose.css` amb una classe `.prose-ca` (títols, paràgrafs, llistes amb pics/números), aplicada a `.intro` (home), `.session-body` (nova, cos de sessió — abans `{{ .Content }}` no tenia cap contenidor ni padding), `.page` (pàgines genèriques i llistat de programació) i `.faq__answer`.

### Addendum 2: troballes de la revisió final (aplicades)

La revisió final de tot el conjunt de canvis (abans de tancar el projecte) va trobar un bug crític i cinc troballes importants, totes corregides:

- **Crític**: `buildFuture = false` (valor per defecte de Hugo) feia que qualsevol sessió amb data futura respecte al moment del build desaparegués silenciosament (sense pàgina, sense targeta, sense alias, sense entrada al sitemap). Invisible avui perquè les 6 sessions migrades ja són totes passades, però hauria trencat el lloc en el moment d'afegir la primera sessió futura real. Corregit amb `buildFuture = true` a `hugo.toml` (abans de `[permalinks]`) i `--buildFuture` al pas de build de GitHub Actions.
- La "Pròxima sessió" de la home triava la sessió futura més llunyana, no la més propera (`.Site.RegularPages` ve ordenat per data descendent) — corregit amb `.ByDate` abans de `first 1`.
- El `sitemap.xml` anunciava `/categories/` i `/tags/` (taxonomies de Hugo actives per defecte però sense ús ni plantilla HTML) — corregit amb `disableKinds = ["taxonomy", "term"]`.
- El local (`venueName`/`venueAddress`) apareixia al JSON-LD però mai es mostrava a la pàgina de sessió — afegit a `.session-info`.
- `.session-detail__image` no tenia `max-width`, cosa que hauria fet que el primer cartell real es veiés desproporcionat — acotat a `max-w-sm`.
- Sense `static/CNAME`, GitHub Pages no sap servir el domini propi — afegit (calen també registres DNS al proveïdor de domini, fora de l'abast d'aquest repositori).

Nota per a un futur contribuïdor: un cop hi hagi sessions amb data futura, el llistat de `/programacio/` (ordenat `.ByDate.Reverse`, més recent primer) mostrarà la sessió futura més llunyana a dalt de tot, mentre que la home ja mostra la més propera — és una inconsistència de disseny menor detectada però no corregida, pendent de decisió.

---

## Fase 2: Redisseny (identitat visual real, navegació, muntatges)

**Context**: la Fase 1 (Tasques 1-10) va deixar un lloc funcional però massa auster: no feia servir el logo real del cineclub, no reproduïa cap dels mòduls visuals de la home (icones+text, xarxes socials), i les fitxes de sessió no tenien ni el carrusel d'imatges ni el tràiler de YouTube incrustat que sí té el lloc antic. Aquesta fase corregeix això amb una direcció més "forta gràficament" (inspirada en https://phenomena-experience.com), sense trencar cap de les Global Constraints ni Tasques 1-10 ja aprovades — només se substitueix la capçalera (de barra lateral a barra horitzontal unificada) i s'amplien home/fitxa/footer.

**Actius reals obtinguts** (no substitucions ni placeholders):
- Logo oficial del cineclub (marca en arc amb estrelles, PNG amb transparència, negre sòlid): desat a `static/images/logo.png`. Com que és negre sobre transparent i s'usa sobre fons negre, s'aplica el filtre CSS `invert` perquè aparegui en blanc — no cal cap altra versió del fitxer.
- 6 IDs de tràiler de YouTube (extrets dels `<iframe>` reals del lloc antic), un per sessió — veure Tasca 13.
- Enllaços socials reals: Instagram `https://www.instagram.com/cineclub.rodadebera`, Facebook `https://www.facebook.com/cineclub.rodadebera`, correu `cineclub.rodadebera@gmail.com`.
- El fons fotogràfic del splash original (bobines/claqueta) sembla banc d'imatges de tercers sense llicència clara identificable — **no es replica**; l'impacte visual es construeix amb el logo real + tipografia contundent + color, no amb aquesta foto.
- Pòsters de les 6 pel·lícules: es demanen per separat (font oficial via cerca web — Wikipedia/TMDB —, no el carrusel del lloc antic, que és pràcticament impossible d'extreure de manera fiable), i es desen a la mateixa ruta `poster.*` que ja fa servir la Tasca 6/`session-card`/`session-hero`.

### Global Constraints addicionals (Fase 2)

- El logo (`.Site.Params.logo` = `/images/logo.png`) sempre es renderitza amb la classe utilitària `invert` quan va sobre fons negre (header, footer, hero) — mai una segona versió del fitxer.
- La capçalera passa a ser **una sola** barra horitzontal (`.site-header`), igual a totes les mides de pantalla — se substitueix la parella `.site-header` (barra lateral, Tasca 3) + `.site-header-mobile` (Tasca 10) per un únic component. `md:pl-64` desapareix de `.site-body` (Tasca 3) perquè ja no hi ha barra lateral fixa que compensar.
- Tipografia més contundent a partir d'aquí: titulars principals (`hero__tagline`, `session-hero__title`, `page__title` a mòduls destacats) en majúscules (`uppercase`) i pes `font-bold`, mida més gran que a la Fase 1.
- El tràiler de YouTube s'incrusta sempre via `youtube-nocookie.com` (no `youtube.com`), per no carregar cookies de tercers fins que la persona usuària interactuï amb el reproductor.
- Nou camp de front matter de sessió: `trailer_youtube_id` (l'ID de vídeo, no la URL sencera). S'afegeix a l'esquema existent (Tasca 5/6) sense eliminar cap camp previ.

---

### Task 11: Logo real, capçalera horitzontal unificada i footer potent

**Files:**
- Modify: `hugo.toml`
- Modify: `layouts/partials/header.html`
- Modify: `layouts/partials/footer.html`
- Modify: `layouts/_default/baseof.html`
- Modify: `assets/css/components/header.css`
- Modify: `assets/css/components/footer.css`
- Modify: `assets/css/components/layout.css`
- Ja present (no cal crear-lo): `static/images/logo.png` (PNG RGBA 1220x786 amb transparència, el logotip real en arc amb estrelles sobre fons transparent — no una fotografia; ja descarregat i verificat visualment)

**Interfaces:**
- Consumes: `.Site.Menus.main` (Tasca 1), `IsMenuCurrent`/`pageRef` (Tasca 3 fix).
- Produces: `.Site.Params.logo`, `.Site.Params.instagramURL`, `.Site.Params.facebookURL`, `.Site.Params.contactEmail`, consumits també per la Tasca 12 (hero de la home).

- [ ] **Step 1: Afegir els nous params a `hugo.toml`**

Afegir dins el bloc `[params]` ja existent (sense tocar els params previs `tagline`, `venueName`, `venueAddress`, `membershipFormURL`):

```toml
  logo = "/images/logo.png"
  instagramURL = "https://www.instagram.com/cineclub.rodadebera"
  facebookURL = "https://www.facebook.com/cineclub.rodadebera"
  contactEmail = "cineclub.rodadebera@gmail.com"
```

- [ ] **Step 2: Reescriure `layouts/partials/header.html` com a barra única horitzontal**

```html
<header class="site-header">
  <div class="site-header__inner">
    <a class="site-header__brand" href="{{ "/" | relLangURL }}">
      <img class="site-header__logo" src="{{ .Site.Params.logo | relURL }}" alt="">
      <span class="site-header__brand-text">{{ .Site.Title }}</span>
    </a>
    <nav class="site-header__nav">
      {{ range .Site.Menus.main }}
        <a class="site-header__link{{ if $.IsMenuCurrent "main" . }} site-header__link--active{{ end }}" href="{{ .URL }}">{{ .Name }}</a>
      {{ end }}
    </nav>
  </div>
</header>
```

- [ ] **Step 3: Reescriure `assets/css/components/header.css` (substitueix TOT el contingut anterior, incloent-hi `.site-header-mobile*`, que desapareix)**

```css
.site-header {
  @apply sticky top-0 z-20 bg-black text-white;
}
.site-header__inner {
  @apply mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6;
}
.site-header__brand {
  @apply flex items-center gap-3 no-underline;
}
.site-header__logo {
  @apply h-10 w-auto invert;
}
.site-header__brand-text {
  @apply font-display text-lg font-bold text-white sm:text-xl;
}
.site-header__nav {
  @apply flex flex-wrap gap-x-6 gap-y-1;
}
.site-header__link {
  @apply text-sm font-semibold uppercase tracking-wide text-white/70 no-underline hover:text-gold;
}
.site-header__link--active {
  @apply text-gold;
}
```

- [ ] **Step 4: Actualitzar `assets/css/components/layout.css` (treure `md:pl-64`, ja no hi ha barra lateral)**

```css
.site-body {
  @apply bg-white font-body text-black;
}
```

- [ ] **Step 5: Reescriure `layouts/partials/footer.html`**

```html
<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      <img class="site-footer__logo" src="{{ .Site.Params.logo | relURL }}" alt="">
      <span>{{ .Site.Title }}</span>
    </div>
    <nav class="site-footer__nav">
      {{ range .Site.Menus.main }}
        <a class="site-footer__link" href="{{ .URL }}">{{ .Name }}</a>
      {{ end }}
    </nav>
    <div class="site-footer__social">
      <a class="site-footer__icon" href="{{ .Site.Params.instagramURL }}" aria-label="Instagram" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 4.95 4.95.06 1.3.07 1.6.07 4.8s0 3.5-.07 4.8c-.15 3.25-1.65 4.8-4.95 4.95-1.3.06-1.6.07-4.9.07s-3.6 0-4.9-.07c-3.3-.15-4.8-1.7-4.95-4.95C2.08 15.5 2.07 15.2 2.07 12s0-3.5.07-4.8c.15-3.25 1.65-4.8 4.95-4.95C8.4 2.2 8.7 2.2 12 2.2zm0 1.8c-3.14 0-3.5 0-4.74.07-2.32.1-3.4 1.2-3.5 3.5C3.7 8.5 3.7 8.86 3.7 12s0 3.5.06 4.43c.1 2.3 1.18 3.4 3.5 3.5.94.05 1.3.06 4.44.06s3.5 0 4.44-.06c2.32-.1 3.4-1.2 3.5-3.5.05-.93.06-1.3.06-4.43s0-3.5-.06-4.43c-.1-2.3-1.18-3.4-3.5-3.5A67 67 0 0 0 12 4zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.9-2a1.08 1.08 0 1 1-2.15 0 1.08 1.08 0 0 1 2.15 0z"/></svg>
      </a>
      <a class="site-footer__icon" href="{{ .Site.Params.facebookURL }}" aria-label="Facebook" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7C16.4 3.66 15.4 3.6 14.3 3.6c-2.3 0-3.9 1.4-3.9 4v2.3H7.7v3.1h2.7v8h3.1z"/></svg>
      </a>
      <a class="site-footer__icon" href="mailto:{{ .Site.Params.contactEmail }}" aria-label="Correu electrònic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>
      </a>
    </div>
  </div>
  <p class="site-footer__copyright">&copy; {{ now.Format "2006" }} {{ .Site.Title }}</p>
</footer>
```

- [ ] **Step 6: Reescriure `assets/css/components/footer.css`**

```css
.site-footer {
  @apply bg-black text-white;
}
.site-footer__inner {
  @apply mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left;
}
.site-footer__brand {
  @apply flex items-center gap-3;
}
.site-footer__logo {
  @apply h-8 w-auto invert;
}
.site-footer__brand span {
  @apply font-display text-base font-bold;
}
.site-footer__nav {
  @apply flex flex-wrap justify-center gap-4 text-sm;
}
.site-footer__link {
  @apply text-white/70 no-underline hover:text-gold;
}
.site-footer__social {
  @apply flex gap-4;
}
.site-footer__icon {
  @apply flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-gold hover:text-gold;
}
.site-footer__icon svg {
  @apply h-4 w-4;
}
.site-footer__copyright {
  @apply border-t border-white/10 py-4 text-center text-xs text-white/50;
}
```

- [ ] **Step 7: Actualitzar `layouts/_default/baseof.html` (el `<body>` ja no necessita res relacionat amb la barra lateral — el fitxer no canvia de contingut perquè ja usava `class="site-body"`, però cal confirmar-ho i eliminar el `{{ partial "header.html" . }}` duplicat si Task 10 n'havia deixat dos)**

Confirmar que `layouts/_default/baseof.html` crida `{{ partial "header.html" . }}` una sola vegada (ja hauria de ser així des de la Tasca 3; la duplicació de capçalera mòbil vivia dins del partial, no a `baseof.html`, així que aquest fitxer no hauria de necessitar cap canvi — verificar-ho i deixar-ho tal qual si ja és correcte).

- [ ] **Step 8: Build i verificació**

Run: `npm run css:build && hugo build`

Expected: exit 0.

Run: `grep -o 'site-header[^"]*' public/index.html | sort -u`

Expected: veure `site-header`, `site-header__inner`, `site-header__brand`, `site-header__logo`, `site-header__brand-text`, `site-header__nav`, `site-header__link` i `site-header__link--active` (per a "Inici"), i **NO** `site-header-mobile` (ha de quedar eliminat).

Run: `test -f public/images/logo.png && echo OK`

Expected: `OK`.

- [ ] **Step 9: Verificació visual (desktop i mòbil)**

Run: `hugo server --port 1414 &`

Comprovar a `http://localhost:1414/` que la barra horitzontal amb el logo (blanc gràcies a `invert`) i el menú en majúscules es veu correctament tant a mida escriptori com mòbil (redimensionar el navegador), i que el footer mostra el logo, els enllaços de menú i les 3 icones socials. Aturar el servidor en acabar.

- [ ] **Step 10: Commit**

```bash
git add hugo.toml layouts/partials/header.html layouts/partials/footer.html assets/css/components/header.css assets/css/components/footer.css assets/css/components/layout.css static/images/logo.png
git commit -m "Add real logo, unify header as horizontal bar, expand footer"
```

---

### Task 12: Home page — mòduls de la Fase 1 de Google Sites restaurats

**Files:**
- Modify: `content/_index.md`
- Modify: `layouts/index.html`
- Modify: `assets/css/components/home.css`
- Modify: `assets/css/components/button.css`

**Interfaces:**
- Consumes: `.Site.Params.logo` (Tasca 11), `session-card.html`/`date-ca.html` (Tasca 3).

- [ ] **Step 1: Actualitzar `content/_index.md` amb els nous camps `features` i `membership_benefits`**

```markdown
---
title: "Cineclub Roda de Berà"
features:
  - titol: "Suport de l'Ajuntament"
    text: "Comptem amb el suport de l'Ajuntament de Roda de Berà, que ens cedeix els espais condicionats per poder exercir aquesta activitat i ens ajuda en la difusió de la mateixa."
  - titol: "Un projecte participatiu"
    text: "El cineclub és participatiu. Pots proposar pel·lícules, col·laborar com a voluntària o voluntari, impulsar cicles temàtics o donar suport com a entitat o empresa local."
  - titol: "Creixement de futur"
    text: "Si el projecte creix en número de persones sòcies i/o aportacions, podrem ampliar sessions, incorporar iniciatives com el Cicle Gaudí i oferir més cinema per a tots els públics."
membership_benefits:
  - "Un mínim de 12 projeccions anuals"
  - "Programació anunciada amb antelació"
  - "Participació en votacions de futures pel·lícules"
  - "Activitats i cicles especials amb avantatges per a persones sòcies"
---

## Neix un nou espai de cinema a Roda de Berà

Roda de Berà és municipi de cinema. El Cineclub Roda de Berà neix amb la voluntat d'ampliar l'oferta cultural i donar-li continuïtat al llarg de tot l'any. Perquè un municipi que té un festival de cinema també ha de tenir programació estable.

El Cineclub Roda de Berà és una associació cultural sense ànim de lucre que impulsarà una programació anual amb una projecció mensual, col·loqui posterior i espai de trobada per compartir mirades, reflexions i passió pel cinema.

Les sessions es faran al Teatre del Casino Municipal de Roda de Berà. Després de cada sessió, el debat i la germanor podran continuar al bar del Casino en un ambient distès.
```

- [ ] **Step 2: Reescriure `layouts/index.html`**

```html
{{ define "main" }}
<section class="hero">
  <img class="hero__logo" src="{{ .Site.Params.logo | relURL }}" alt="">
  <p class="hero__tagline">{{ .Site.Params.tagline }}</p>
</section>
<section class="intro prose-ca">
  {{ .Content }}
</section>
<section class="features">
  {{ range .Params.features }}
    <div class="features__item">
      <h2 class="features__title">{{ .titol }}</h2>
      <p>{{ .text }}</p>
    </div>
  {{ end }}
</section>
{{ $upcoming := where (where .Site.RegularPages "Section" "programacio") "Date" "ge" now }}
{{ with (first 1 $upcoming.ByDate) }}
  {{ range . }}
    <section class="next-session">
      <h2>Pròxima sessió</h2>
      {{ partial "session-card.html" . }}
    </section>
  {{ end }}
{{ end }}
<section class="membership-teaser">
  <h2 class="membership-teaser__title">Fes-te sòcia/soci!</h2>
  <ul class="membership-teaser__list">
    {{ range .Params.membership_benefits }}
      <li>{{ . }}</li>
    {{ end }}
  </ul>
  <a class="btn" href="{{ "/fes-te-socia/" | relLangURL }}">Vull ser sòcia/soci</a>
</section>
<section class="faq-teaser">
  <h2>Encara tens dubtes?</h2>
  <a class="btn btn--outline" href="{{ "/preguntes-frequents/" | relLangURL }}">Accedeix a Preguntes Freqüents</a>
</section>
{{ end }}
```

- [ ] **Step 3: Afegir la variant `.btn--outline` a `assets/css/components/button.css` (sense tocar la regla `.btn` existent)**

```css
.btn--outline {
  @apply border-2 border-gold bg-transparent text-gold hover:bg-gold hover:text-black;
}
```

- [ ] **Step 4: Reescriure `assets/css/components/home.css`**

```css
.hero {
  @apply flex flex-col items-center gap-6 bg-black px-6 py-20 text-center text-white;
}
.hero__logo {
  @apply h-24 w-auto invert;
}
.hero__tagline {
  @apply font-display text-3xl font-bold uppercase tracking-tight text-gold sm:text-5xl;
}
.intro {
  @apply mx-auto max-w-2xl px-6 py-12 text-black;
}
.intro p {
  @apply mb-4;
}
.features {
  @apply mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3;
}
.features__title {
  @apply mb-2 font-display text-lg font-bold uppercase text-gold-dark;
}
.next-session {
  @apply mx-auto max-w-sm px-6 pb-12;
}
.next-session h2 {
  @apply mb-4 font-display text-xl font-bold uppercase text-black;
}
.membership-teaser {
  @apply mx-auto max-w-2xl px-6 pb-16 text-center;
}
.membership-teaser__title {
  @apply mb-4 font-display text-2xl font-bold uppercase text-black;
}
.membership-teaser__list {
  @apply mb-6 list-disc space-y-1 pl-5 text-left;
}
.faq-teaser {
  @apply bg-gold/10 px-6 py-16 text-center;
}
.faq-teaser h2 {
  @apply mb-4 font-display text-xl font-bold uppercase text-black;
}
```

- [ ] **Step 5: Build i verificació**

Run: `npm run css:build && hugo build && grep -c "features__item" public/index.html`

Expected: `3`.

Run: `grep -q "Suport de l'Ajuntament" public/index.html && grep -q "Un mínim de 12 projeccions anuals" public/index.html && echo OK`

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add content/_index.md layouts/index.html assets/css/components/home.css assets/css/components/button.css
git commit -m "Restore home page feature modules and membership summary"
```

---

### Task 13: Muntatge de la fitxa de sessió (pòster + tràiler de YouTube)

**Files:**
- Modify: `layouts/programacio/single.html`
- Modify: `assets/css/components/session-detail.css`
- Modify: els 6 fitxers `content/programacio/2026/<slug>/index.md` (afegir `trailer_youtube_id`)

**Interfaces:**
- Produces: nou camp de front matter `trailer_youtube_id`, consumit per la miniatura de YouTube (`https://img.youtube.com/vi/<id>/hqdefault.jpg`, sense necessitat d'autenticació ni descàrrega) i per l'`<iframe>` incrustat.

- [ ] **Step 1: Reescriure la capçalera de `layouts/programacio/single.html` (substituir des de `{{ define "main" }}` fins abans de `<dl class="session-fitxa">`, mantenint la resta del fitxer intacte)**

```html
{{ define "main" }}
<section class="session-hero">
  <div class="session-hero__montage">
    {{ with .Resources.GetMatch "poster*" }}
      <img class="session-hero__poster" src="{{ .RelPermalink }}" alt="{{ $.Params.titol_original | default $.Title }}">
    {{ end }}
    {{ with .Params.trailer_youtube_id }}
      <img class="session-hero__still" src="https://img.youtube.com/vi/{{ . }}/hqdefault.jpg" alt="">
    {{ end }}
  </div>
  <div class="session-hero__text">
    <span class="session-hero__date">{{ partial "date-ca.html" . }} a les {{ .Date.Format "15:04" }}h</span>
    <h1 class="session-hero__title">{{ .Title }}</h1>
  </div>
</section>

{{ with .Params.trailer_youtube_id }}
<div class="session-trailer">
  <iframe src="https://www.youtube-nocookie.com/embed/{{ . }}" title="Tràiler de {{ $.Title }}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
{{ end }}

<dl class="session-fitxa">
```

- [ ] **Step 2: Eliminar el bloc d'imatge antic, ara redundant amb el muntatge**

Buscar i eliminar aquest bloc (queda substituït pel muntatge del Step 1):

```html
{{ with .Resources.GetMatch "poster*" }}
  <img src="{{ .RelPermalink }}" alt="{{ $.Params.titol_original | default $.Title }}" class="session-detail__image">
{{ end }}
```

- [ ] **Step 3: Actualitzar `assets/css/components/session-detail.css` (treure `.session-detail__image`, afegir les regles del muntatge i del tràiler)**

```css
.session-hero {
  @apply flex flex-col gap-6 bg-black px-4 py-10 text-white sm:flex-row sm:items-end sm:gap-10 sm:px-10;
}
.session-hero__montage {
  @apply relative mx-auto w-full max-w-xs sm:mx-0 sm:max-w-sm;
}
.session-hero__poster {
  @apply w-full rounded-lg shadow-2xl;
}
.session-hero__still {
  @apply absolute -bottom-6 -right-6 w-2/3 rounded-lg border-4 border-black shadow-xl;
}
.session-hero__text {
  @apply flex flex-1 flex-col gap-2 pb-8 text-center sm:pb-2 sm:text-left;
}
.session-hero__date {
  @apply font-body text-sm text-white/80;
}
.session-hero__title {
  @apply font-display text-4xl font-bold uppercase leading-tight text-gold sm:text-5xl;
}
.session-trailer {
  @apply relative mx-auto my-8 aspect-video w-full max-w-3xl overflow-hidden rounded-lg;
}
.session-trailer iframe {
  @apply absolute inset-0 h-full w-full border-0;
}
.session-fitxa {
  @apply grid grid-cols-1 gap-x-8 gap-y-2 bg-gray-50 p-6 text-sm sm:grid-cols-2;
}
.session-fitxa__label {
  @apply font-semibold text-gold-dark;
}
.session-version {
  @apply px-6 pt-4 text-sm font-semibold text-gold-dark;
}
.session-body {
  @apply p-6;
}
.session-info {
  @apply m-6 rounded-lg border border-gold/30 bg-gold/5 p-6 text-sm;
}
```

- [ ] **Step 4: Afegir `trailer_youtube_id` al front matter de les 6 sessions**

Afegir la línia corresponent (just sota `titol_original`, per exemple) a cadascun dels 6 fitxers:

| Fitxer | `trailer_youtube_id` |
|---|---|
| `content/programacio/2026/the-artist/index.md` | `YB9Oq0hn5KY` |
| `content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/index.md` | `MkgScyhbys8` |
| `content/programacio/2026/jane-eyre/index.md` | `8IFsdfk3mlk` |
| `content/programacio/2026/secrets-i-mentides/index.md` | `dSnI4_6DrFw` |
| `content/programacio/2026/pig/index.md` | `TGOcqxU-_l8` |
| `content/programacio/2026/esperando-a-dali/index.md` | `uMJL0VTSQV8` |

- [ ] **Step 5: Build i verificació**

Run: `npm run css:build && hugo build`

Expected: exit 0.

Run:
```bash
for slug in the-artist lavi-de-100-anys-que-es-va-escapar-per-la-finestra jane-eyre secrets-i-mentides pig esperando-a-dali; do
  grep -q "youtube-nocookie.com/embed/" "public/programacio/2026/$slug/index.html" && echo "OK $slug" || echo "FALTA $slug"
done
```

Expected: `OK <slug>` per a les 6 sessions.

- [ ] **Step 6: Verificació visual**

Run: `hugo server --port 1414 &`

Comprovar a `http://localhost:1414/programacio/2026/jane-eyre/` que es veu el muntatge (pòster + miniatura de YouTube superposada) i que el reproductor de tràiler funciona (clicar play). Aturar el servidor en acabar.

- [ ] **Step 7: Commit**

```bash
git add layouts/programacio/single.html assets/css/components/session-detail.css content/programacio/2026
git commit -m "Add poster+trailer hero montage and embedded YouTube trailer to session pages"
```

---

### Task 14: Pòsters oficials de les 6 pel·lícules

**Files:**
- Create (binaris, obtinguts prèviament per un agent de cerca web, no generats per aquesta tasca): `content/programacio/2026/<slug>/poster.jpg` (o `.png`, segons la font) per a cadascuna de les 6 sessions.

**Interfaces:**
- Consumes: `session-hero__poster`/`session-card__image` (Tasques 3 i 13), que ja gestionen l'absència d'imatge sense error (`{{ with .Resources.GetMatch "poster*" }}`).

- [ ] **Step 1: Copiar els pòsters descarregats a la seva ubicació final**

Cada pòster ja ha d'existir en algun directori (obtingut per un agent de cerca web previ). Copiar/moure cadascun exactament a:

```
content/programacio/2026/the-artist/poster.jpg
content/programacio/2026/lavi-de-100-anys-que-es-va-escapar-per-la-finestra/poster.jpg
content/programacio/2026/jane-eyre/poster.jpg
content/programacio/2026/secrets-i-mentides/poster.jpg
content/programacio/2026/pig/poster.jpg
content/programacio/2026/esperando-a-dali/poster.jpg
```

(L'extensió pot variar segons la font — `.jpg` o `.png` són vàlides, `.Resources.GetMatch "poster*"` ja les cobreix totes dues.)

- [ ] **Step 2: Verificar que cada fitxer és una imatge vàlida**

Run: `for f in content/programacio/2026/*/poster.*; do file "$f"; done`

Expected: cada línia ha de dir `JPEG image data` o `PNG image data`, mai `HTML document` (símptoma d'una descàrrega fallida).

- [ ] **Step 3: Build i verificació**

Run: `npm run css:build && hugo build`

Expected: exit 0.

Run:
```bash
for slug in the-artist lavi-de-100-anys-que-es-va-escapar-per-la-finestra jane-eyre secrets-i-mentides pig esperando-a-dali; do
  grep -q "session-hero__poster" "public/programacio/2026/$slug/index.html" && echo "OK $slug" || echo "FALTA $slug"
done
```

Expected: `OK <slug>` per a les 6 sessions (si algun pòster no es va poder obtenir, aquesta comprovació fallarà per a aquell slug específic — reportar-ho, no bloquejar la resta).

- [ ] **Step 4: Verificació visual final completa (Fase 2)**

Run: `hugo server --port 1414 &`

Recórrer `http://localhost:1414/` sencer (home amb logo+mòduls, programació, cada fitxa de sessió amb muntatge+tràiler, fes-te-socia, FAQ) en escriptori i mòbil. Aturar el servidor en acabar.

- [ ] **Step 5: Commit**

```bash
git add content/programacio/2026/*/poster.*
git commit -m "Add official movie posters for the 6 migrated sessions"
```

## Self-Review

**Cobertura de l'spec:** Stack Hugo+Tailwind (Tasques 1-2) ✓, hosting GitHub Pages/Actions (Tasca 9) ✓, identitat visual/CSS BEM+@apply (Tasca 3) ✓, arquitectura de contingut i llistat unificat amb `organitza` (Tasques 3-4) ✓, esquema de camps de sessió (Tasca 5-6) ✓, URLs `/programacio/:year/:slug/` i aliases (Tasca 6) ✓, SEO (lang, meta, OG, JSON-LD, sitemap/robots) (Tasques 3, 5, 10) ✓, mobile-first/desktop (breakpoints Tailwind a totes les tasques de CSS, revisió responsive a la Tasca 10) ✓, port 1414 en local (Global Constraints + totes les verificacions) ✓.

**Placeholders:** cap "TBD"/"TODO" als passos. Els únics passos manuals explícits (desar imatges, activar GitHub Pages a la UI) són accions que no es poden automatitzar per motius tècnics reals (binaris no editables des d'un pla de text; configuració que viu fora del repositori), no ambigüitats deixades per resoldre.

**Consistència de tipus/noms:** els noms de camp de front matter (`titol_original`, `direccio`, `guio`, `pais`, `any`, `durada`, `idioma`, `genere`, `fotografia`, `muntatge`, `musica`, `produccio`, `repartiment`, `premis_destacats`, `versio_idiomatica`, `edat_minima_recomanada`, `preu_o_acces`, `que_inclou`, `suport_distribucio`, `organitza`) es fan servir exactament igual a la Tasca 5 (plantilla) i a la Tasca 6 (contingut real). El partial `session-card.html` i `date-ca.html` (Tasca 3) es criden amb la mateixa signatura (`partial "date-ca.html" .` rebent la pàgina sencera) a totes les tasques que els consumeixen (4, 5, 6, Task 3 mateix per a "pròxima sessió").
