# TextForge MVP3 Architecture

TextForge is a local-first rich document editor. The app now treats rich HTML as the working document model, then routes that model through Markdown, plain text, board-friendly text, rich clipboard, and export pipelines.

## Runtime

- `index.html`: Shell, editor surface, inspector panels, command palette.
- `styles.css`: Fixed app layout, editor modes, inspector panels, command palette.
- `app.js`: Local state, Markdown-lite parser, Smart Copy, exports, history, command system.
- `dev-server.js`: Local static server for testing.

## Core State

Documents are stored in `localStorage` under `textforge.documents.v1`.

Each document has:

- `id`
- `title`
- `content`
- `tags`
- `favorite`
- `history`
- `createdAt`
- `updatedAt`

The app normalizes old documents at load time, so MVP1/MVP2 data keeps working.

## Pipelines

TextForge uses small local pipelines instead of server services:

- Rich HTML document -> Clean Preview HTML
- Rich HTML document -> Markdown source
- Rich HTML document -> Plain Text
- Rich HTML document -> Board/DC-friendly text
- Rich HTML document -> Rich HTML Clipboard
- Rich HTML document -> DOC/HTML/PDF/EPUB/Image Card
- Clipboard text -> Clean Paste -> editor insertion

The `textPipelines` registry in `app.js` is the first plugin-like extension point.

## MVP3 Systems

- Rich Text Layer: contenteditable editing surface with font, size, marks, color, alignment, links, images, tables, rules, and spoiler-style marks.
- Source Mode: Markdown-compatible fallback generated from the document model.
- Command Palette: central command registry plus document search.
- System Panel: links, backlinks, long-line state, pipeline list, storage usage.
- Log Mode: no-wrap, denser editor typography, long-line friendly editing.
- Wiki Links: `[[Document Title]]` links open or create local documents.
- EPUB Export: generates a minimal valid EPUB zip container locally.
- Image Card Export: renders the current document summary to PNG with Canvas.
- Font Presets: Modern, Report, Board, Essay, and Code themes use local/system font stacks rather than bundling large font files.

## Next Optimization Targets

- Replace contenteditable/execCommand with Tiptap or ProseMirror when package installation is available.
- Move storage from `localStorage` to OPFS or SQLite when packaging as Tauri.
- Package `.hnote` bundles with `document.json`, `content.md`, `preview.html`, assets, and history.
- Add import/export backup bundle for all documents and prompts.
- Add true PDF text/annotation import when a desktop runtime is available.
