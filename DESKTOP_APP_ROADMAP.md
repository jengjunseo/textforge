# TextForge Desktop App Roadmap

## Current Patch

TextForge keeps its existing local web app architecture. The first desktop-like layer is intentionally small:

- `manifest.json` enables standalone PWA installation where the browser supports it.
- `launch-textforge-app.bat` opens the local server in Chrome or Edge app mode.
- Focus Mode expands the writing area without changing document storage or editor behavior.
- No service worker is registered yet.

## Windows App Mode

Run:

```bat
launch-textforge-app.bat
```

Manual alternatives:

```bat
chrome.exe --app=http://127.0.0.1:4291
msedge.exe --app=http://127.0.0.1:4291
```

## Future Tauri Migration

Tauri is a later packaging step, not part of this patch. It becomes useful when TextForge needs an independent taskbar app, native local file paths, stronger backup handling, and future `.hnote` file associations.

### Reusable Web App Parts

- Existing HTML, CSS, and JavaScript UI
- Rich text editor behavior
- Smart Copy and existing export flows
- Forge Snapshot
- Diagnostics and MTTR tests

### Parts That Need Explicit Migration Design

- IndexedDB and localStorage persistence
- Native app data directory
- Backup and recovery paths
- File-system permissions
- Optional automatic updates

### Suggested Phases

1. Keep the current HTML, CSS, and JavaScript UI intact.
2. Build a Tauri WebView wrapper prototype without changing storage.
3. Add an explicit file-based library design and backup path.
4. Introduce the `.hnote` package format only after migration tests exist.
5. Add a signed Windows installer after browser-mode regression tests pass.

### Risks

- File and directory permissions
- Existing document migration
- Preserving user drafts during storage changes
- Windows WebView behavior differences
- Installer signing and update policy

### Why Not Now

- MVP stability and document preservation take priority.
- A wrapper and storage migration in one patch would increase regression risk.
- PWA installation and browser app mode solve the immediate address-bar and taskbar workflow complaints.

## Deferred Work

- Service worker and offline asset caching
- Native file open/save dialogs
- Native tray and startup integration
- Signed Windows installer
- IndexedDB-to-native-store migration
