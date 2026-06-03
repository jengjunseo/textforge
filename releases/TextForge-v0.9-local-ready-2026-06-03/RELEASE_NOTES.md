# TextForge v0.9 Local Ready

## Purpose

This release snapshot preserves the current stable local-first TextForge MVP before larger web, mobile, sync, or desktop-runtime expansion work begins.

TextForge v0.9 Local Ready is intended as a known-good baseline for local writing, document management, clean export, and portable archive creation.

## Core Features

- Rich text editing
- Fast memo-to-memo switching
- Finder/GoodNotes-style document library
- Tags, folders, favorites, search, and sorting
- Smart Copy: Plain, Rich, Markdown, and Board
- Export: TXT, MD, HTML, PDF, DOC, EPUB, and PNG Card
- Auto-save and session recovery
- Document history snapshots
- Prompt Vault
- Table of contents, document links, and backlinks
- Light and dark themes
- Dark-mode inline text readability correction
- Focus Mode
- Forge Snapshot read-only HTML archive export
- PWA manifest and app-mode launcher files
- Diagnostics, benchmark, and MTTR tooling

## Recent Improvements

- Memo-to-memo switching fast path
- Deferred post-switch rendering for preview, inspector panels, and split workspace
- Left sidebar document list recovery after fast-path optimization
- Dark-mode inline color flicker reduction through pre-render color adaptation
- Focus Mode
- App-mode launcher and shortcut helper
- Diagnostics and MTTR reliability checks
- Forge Snapshot archive flow

## Run

From this folder:

```bash
node dev-server.js
```

Then open:

```txt
http://127.0.0.1:4291
```

If using the full project folder, `npm start` also runs the same local server.

## Backup Date

2026-06-03

## Known Limits

- No cloud sync
- No account system
- No Supabase backend
- No Vercel deployment
- No mobile editing mode yet
- No Tauri/Electron packaging yet
- User documents are stored in the browser profile, not in this source snapshot

## Next Candidates

- Continue code diet by separating core, optional, and lab-only features
- Design a web mirror flow without changing local-first storage
- Design a mobile Web Draft mode
- Keep Tauri conversion on hold until the local baseline stays stable

