# Mc Racking-Test

Simple Firebase + GitHub Pages web app for tracking racking inventory, creating multi-line invoices, and downloading PDF invoices.

## What was upgraded in this version

- Test Firebase project ready: replace `firebase-config.js` with the config from **Mc Racking-Test**.
- Anonymous Firebase sign-in added so Firestore rules do not have to be public.
- Safer Firestore rules included.
- Invoice save now uses a Firestore transaction.
- Invoice edit no longer restores inventory before saving. It now calculates the difference between old and new invoice quantities.
- Inventory movements are recorded in `inventory_movements`.
- Invoice PDF now includes Work Order #, PO #, notes, company header placeholders, and signature line.
- Up to 24 line items are still supported.
- Admin export, recovery, users, locations, parts, and audit log remain included.

## Files

- `index.html` — main inventory/invoice page
- `admin.html` — admin page
- `style.css` — design
- `data.js` — starter inventory/location/user data
- `app.js` — main invoice, PDF, dashboard, and inventory transaction logic
- `admin.js` — admin tools
- `firebase-config.js` — Firebase project connection file
- `firestore.rules` — recommended safer rules
- `firestore-testing-open.rules` — temporary setup-only rules

## Connect this to the new Firebase project

1. Open Firebase Console.
2. Open project: **Mc Racking-Test**.
3. Go to **Project settings**.
4. Under **Your apps**, create/select a Web App.
5. Copy the Firebase config.
6. Open `firebase-config.js`.
7. Replace all placeholder values with your actual test config.

Example fields to replace:

```js
apiKey: "PASTE_TEST_API_KEY_HERE",
authDomain: "PASTE_TEST_AUTH_DOMAIN_HERE",
projectId: "PASTE_TEST_PROJECT_ID_HERE",
storageBucket: "PASTE_TEST_STORAGE_BUCKET_HERE",
messagingSenderId: "PASTE_TEST_MESSAGING_SENDER_ID_HERE",
appId: "PASTE_TEST_APP_ID_HERE"
```

## Firebase setup

### 1. Enable Firestore

Firebase Console → Build → Firestore Database → Create database.

For first setup, you can temporarily publish `firestore-testing-open.rules`.

### 2. Enable Anonymous Authentication

Firebase Console → Build → Authentication → Sign-in method → Anonymous → Enable.

### 3. First test run

Open your GitHub Pages test site once. This signs your browser into Firebase anonymously and creates a UID.

To see the UID, open browser Developer Tools → Console. The app logs:

```text
Signed in test user UID: ...
Admin test UID: ...
```

### 4. Make yourself admin

In Firestore, create this document:

```text
admins/{YOUR_UID}
```

Fields:

```text
role: admin
name: Your Name
```

### 5. Publish safer rules

After your admin document exists, publish `firestore.rules`.

## GitHub Pages

Upload the files to your test GitHub repository, then turn on Pages:

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

## Important

This is the test version. Do not connect it to your production Firebase project.

Recommended setup:

| Purpose | GitHub Repo | Firebase Project |
|---|---|---|
| Test | McCoy-s-Racking-Tracker-Test | Mc Racking-Test |
| Production | McCoy-s-Racking-Tracker | production Firebase project |
