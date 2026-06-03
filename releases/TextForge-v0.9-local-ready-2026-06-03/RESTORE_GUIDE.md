# TextForge v0.9 Restore Guide

## What This Backup Is

This folder is a source-code release snapshot of TextForge v0.9 Local Ready.

It contains the app code, launcher files, manifest, diagnostics code, docs, and selected benchmark result JSON files. It does not contain the user's browser-profile document database.

## Restore Method

1. Close any running TextForge app windows.
2. Make a fresh backup of the current working project folder before overwriting anything.
3. Copy this release folder to a new workspace location, or copy its files over the project folder if you intentionally want to roll back the source.
4. Start the app with:

```bash
node dev-server.js
```

5. Open:

```txt
http://127.0.0.1:4291
```

## If The Current Project Is Broken

Prefer restoring into a new folder first:

```txt
TextForge-restore-test
```

Run the restored copy and confirm the app opens before replacing the current project.

## Source Backup vs User Documents

This backup is for source code.

User documents live in the browser profile through local storage / IndexedDB. They are not part of this release folder.

For user document preservation, create a Forge Snapshot from inside TextForge. Forge Snapshot produces a portable read-only HTML archive that can be opened independently.

## Warning

Before overwriting the active project folder, back it up again. Do not assume this source snapshot contains all user-authored documents.

