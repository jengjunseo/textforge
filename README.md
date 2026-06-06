# TextForge

TextForge is a local-first rich text document workspace for fast writing, clean output, and portable archives.

> Rich formatting while writing. Clean output when sharing.

## Principles

- No server requirement
- No account requirement
- No cloud sync requirement
- Local storage first
- Fast document writing
- Strong source document protection

## Current Highlights

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
- Focus Mode with adjustable writing width
- Long document typing fast sync
- Display-only word wrap
- Safety Snapshot and bulk undo/redo
- AI cleanup that preserves the original document

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

On Windows, app-mode launch helpers are available:

```txt
Start TextForge.cmd
launch-textforge-app.bat
```

## Checks

```bash
npm run check
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd run check
```

## Project Docs

- [Project Overview](docs/TEXTFORGE_PROJECT_OVERVIEW.md)
- [Architecture](docs/TEXTFORGE_ARCHITECTURE.md)
- [File Dependency Map](docs/TEXTFORGE_FILE_DEPENDENCY_MAP.md)
- [Developer Guide](docs/TEXTFORGE_DEV_GUIDE.md)
- [Safety And Recovery](docs/TEXTFORGE_SAFETY_AND_RECOVERY.md)
- [Feature History](docs/TEXTFORGE_FEATURE_HISTORY.md)
- [Next Steps](docs/TEXTFORGE_NEXT_STEPS.md)

## Important Local-First Note

TextForge stores documents in the browser profile's localStorage / IndexedDB. The repository contains the app code, not user documents.

For user document backup, use Forge Snapshot, Export, or browser profile backup. Do not assume a Git commit backs up the user's document library.
