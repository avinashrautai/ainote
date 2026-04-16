# AI Notes App

A premium AI Notes App built with Next.js 15, TypeScript, Tailwind CSS, and a local-first note store designed to package cleanly with Tauri.

## Included

- Next.js 15 App Router project structure
- TypeScript configuration
- Tailwind CSS setup
- Notes workspace with CRUD, filtering, autosave, import/export, and installable PWA support
- Local-first persistence for notebooks and notes
- Tauri-ready static desktop bundle flow for Windows packaging

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Browser local storage persistence
- Progressive Web App support
- Tauri 2

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## PWA Usage

- Build and run the app in production mode to test installability:

```bash
npm run build
npm run start
```

- Visit the app in a Chromium-based browser and use the install prompt from the browser UI.
- On mobile, open the production deployment in a supported browser and choose the install or add-to-home-screen option.
- The app includes a web app manifest, install icons, and a production service worker for basic offline shell support.
- Notes, notebooks, and preferences are stored locally in the browser or desktop webview.

## Local Persistence

- Core note data is stored client-side so the app can run without a Next.js server.
- On first launch, the app seeds a small starter workspace locally.
- Theme and accent preferences are also persisted locally.

## Tauri Packaging

Build the desktop-ready frontend bundle:

```bash
npm run build:desktop
```

Build the Windows MSI with Tauri:

```bash
npx tauri build --bundles msi
```

The Tauri build uses a dedicated static export path so the packaged app does not depend on Next.js API routes or a running Next server.

## Suggested Local Setup Flow

```bash
npm install
npm run dev
```
