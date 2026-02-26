# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step. Open `index.html` directly in a browser:

```bash
xdg-open index.html   # Linux
open index.html        # macOS
```

All dependencies are loaded from CDN:
- [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) v1.6.0-rc1 — QR generation
- [Tailwind CSS](https://tailwindcss.com) Play CDN — utility classes (`tailwind.config = { darkMode: 'class' }`)

## Architecture

Single-page vanilla JS app with no framework. Three files:

- **`index.html`** — Static layout; all interactive elements have IDs. Selectors (`#typeSelector`, `#dotStyleSelector`, etc.) are empty `div`s populated by JS on init.
- **`app.js`** — All application logic: state, QR generation, form rendering, encoding, history, dark mode.
- **`styles.css`** — Only styles that Tailwind can't handle: color picker, range slider, scrollbar, toast animation, password toggle.

### State model (`app.js`)

One global `state` object with three sections:
- `state.type` — active input type (`'url'`, `'text'`, `'email'`, `'phone'`, `'sms'`, `'wifi'`, `'vcard'`)
- `state.data[type]` — per-type field values, preserved when switching types
- `state.config` — QR options (errorCorrection, dotStyle, eyeStyle, colors, gradient, logo, size, margin)

### QR update flow

User input → `scheduleUpdate(immediate?)` → debounce 180ms → `updateQR()` → `qrCode.update(getQROptions())` + `updateCapacity()` + `updateWarnings()`

`getEncodedData()` converts `state.data[state.type]` to the appropriate QR payload string (plain URL, `mailto:`, `tel:`, `sms:`, `WIFI:`, vCard 3.0).

### Selector pattern

All button-group selectors (type, EC level, dot style, eye style) follow the same pattern: `renderXxx()` regenerates the HTML from constants and re-attaches click listeners. Called on init and whenever selection changes.

`btnCls(active)` returns the Tailwind class string for active/inactive button state.

### Persistence

- `localStorage.qrstudio_history` — up to 20 history entries (JSON), each with a snapshot of `state.data[type]`, `state.config`, and an SVG thumbnail
- `localStorage.qrstudio_dark` — dark mode preference (`'true'`/`'false'`)

Dark mode flash prevention is handled by an inline script in `<head>` that adds `class="dark"` to `<html>` before render.
