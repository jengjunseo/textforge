# TextForge

TextForge is a local-first rich text document workspace for fast writing, clean output, and portable archives.

## Principles

- No server
- No account
- No cloud sync
- Local storage
- Rich writing, clean export

## Features

- Rich text editing
- Write, Source, Preview, and Split views
- Finder-style document library
- Tags, folders, favorites, search, and sort
- Smart Copy: Plain, Rich, Markdown, and Board
- Export: TXT, MD, HTML, PDF, DOC, EPUB, and PNG Card
- Document history snapshots
- Prompt Vault
- Table of contents, document links, and backlinks
- Light and dark themes
- Forge Snapshot read-only HTML archives
- Diagnostics and benchmark tools
- PWA manifest and app-mode launch helpers

## Run Locally

```bash
npm start
```

Then open:

```txt
http://127.0.0.1:4291
```

You can also run the static server directly:

```bash
node dev-server.js
```

## Important Local-First Note

TextForge stores documents in the browser's local storage / IndexedDB for the current browser profile. The repository contains the app code, not user documents.

