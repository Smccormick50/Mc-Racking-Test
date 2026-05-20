# Mc Racking — Inventory Tracker

A live multi-device racking inventory and invoicing app, branded for Mc Racking. Built as a Progressive Web App so it installs to iPhone and Android home screens just like a native app.

## Setup steps (one time)

### 1. Set Firestore security rules
1. Go to https://console.firebase.google.com → your `racking-inventory-tracker` project
2. Databases & Storage → Firestore Database → **Rules** tab
3. Paste in the contents of `firestore.rules`, click **Publish**

### 2. Upload to GitHub Pages
Drop ALL of the following files into your repo:

**App files**
- `index.html`
- `style.css`
- `app.js`
- `data.js`
- `firebase-config.js`

**Icons & branding** (new)
- `icon-32.png`
- `icon-180.png`     ← iOS home screen icon
- `icon-192.png`     ← Android home screen icon
- `icon-512.png`     ← Android splash screen
- `favicon.png`
- `mc-logo.png`      ← small logo shown in the site header
- `manifest.json`    ← PWA app manifest

**Docs**
- `README.md`
- `firestore.rules`

Make sure all PNG files end up in the **root** of the repo (same folder as `index.html`).

## Install on iPhone

1. Open the site in **Safari** (must be Safari, not Chrome on iPhone)
2. Tap the Share button (square with arrow at the bottom)
3. Scroll down → **Add to Home Screen**
4. The name pre-fills as "Mc Racking" — tap **Add**

The Racking App icon now sits on the home screen. Tapping it opens the site fullscreen, no browser address bar.

## Install on Android

1. Open the site in **Chrome**
2. Tap the ⋮ menu (top right) → **Install app** or **Add to Home screen**
3. Confirm

Same result — a Mc Racking app icon on the home screen.

## What's in the app

- **User dropdown** — pick your name from the list at the top of the page; required before creating an invoice
- **Live invoice list** at the bottom, syncs across all devices in real time
- **Edit** any invoice if a mistake was made (restores inventory, lets you re-save)
- **Delete** an invoice — quantities go back into inventory automatically
- **PDF download** of any invoice
- **Connection status badge** in the header — green "Live" when connected

To add or remove users from the dropdown, edit the `STARTING_USERS` list at the bottom of `data.js` and re-upload.

## Notes

- The site needs internet to work (Firebase backend).
- The free Firebase tier is far more than this site will use.
- The current Firestore rules allow anyone with the link to read/write. Add a login if you ever share the URL outside your team.
- The Racking App home-screen icon is set in `manifest.json`. To change icons later, replace the PNG files and bump the cache by reinstalling the home screen icon.

## File reference

| File | Purpose |
|---|---|
| `index.html` | Main page |
| `style.css` | Green/yellow branded styling |
| `app.js` | Firestore reads/writes, inventory, invoices, PDFs |
| `data.js` | Initial part list (used only to seed Firestore once) |
| `firebase-config.js` | Firebase project keys |
| `manifest.json` | Tells iOS/Android how to install the app |
| `mc-logo.png` | Small "Mc" logo in the page header |
| `icon-*.png` | Home screen icons at the sizes iOS and Android need |
| `firestore.rules` | Security rules to paste into Firebase console |
