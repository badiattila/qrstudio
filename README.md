# QR Studio

Free, browser-based QR code generator. No login, no watermarks, no uploads — everything runs locally in your browser.

**[Live Demo →](https://badiattila.github.io/qrstudio)**

---

## Features

### Input Types
| Type | Encoding |
|---|---|
| URL | Plain URL string |
| Text | Free-form text |
| Email | `mailto:` URI with subject/body |
| Phone | `tel:` URI |
| SMS | `sms:` URI with pre-filled message |
| Wi-Fi | `WIFI:` string (WPA/WEP/open, hidden flag) |
| vCard | vCard 3.0 contact card |

### Styling
- **Dot styles** — Square, Rounded, Dots, Classy, Classy Rounded, Extra Rounded
- **Eye styles** — Square, Rounded, Dot
- **Colors** — Foreground and background color pickers with hex input
- **Gradient** — Linear or radial gradient across dots
- **Logo embed** — Upload any image; error correction auto-upgrades to H

### Configuration
- Error correction level: L / M / Q / H
- Preview size: 150–600px slider
- Quiet zone (margin): 0–40px slider

### Export
- **SVG** — Vector, scalable to any size
- **PNG** — High resolution 1200×1200px
- **Copy** — SVG copied to clipboard

### UX
- Live preview with debounced update
- Data capacity indicator (% of QR capacity used)
- Scannability warnings — low contrast, wrong EC level for logo, near-full capacity
- History — up to 20 saved QRs in `localStorage` with thumbnails, restore, delete
- Dark mode — respects system preference, persists toggle
- Mobile responsive

---

## Stack

| | |
|---|---|
| Language | Vanilla HTML / CSS / JavaScript |
| QR Library | [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling) v1.6.0-rc1 |
| CSS | [Tailwind CSS](https://tailwindcss.com) Play CDN |
| Build | None — open `index.html` directly |

---

## Getting Started

```bash
git clone https://github.com/badiattila/qrstudio.git
cd qrstudio
open index.html        # macOS
# or
xdg-open index.html    # Linux
# or just drag index.html into a browser
```

No dependencies to install. No build step.

---

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create qrstudio --public --push --source=.
```

Then in the GitHub repo: **Settings → Pages → Branch: main → / (root) → Save**

Your site will be live at `https://badiattila.github.io/qrstudio`.

---

## Project Structure

```
qrstudio/
├── index.html   # Page structure and layout
├── app.js       # All state, QR generation, form rendering, history, dark mode
└── styles.css   # Color picker, range slider, scrollbar, toast animation
```

---

## Roadmap

- [ ] Batch ZIP download (multiple QRs at once)
- [ ] More input types: Event (iCal), WhatsApp, Location, UPI payment
- [ ] Custom eye color (separate from dot color)
- [ ] Printable mockup preview
- [ ] Dynamic QRs with redirect tracking (requires backend)

---

## License

MIT
