# Seal Generator

Browser SVG → STL converter with live 3D preview, draggable control windows, optional inverse (stamp) mode, batch export, and a themed library of SVG seals.

## Features

### Core

- Convert SVG to STL entirely in the browser (Three.js extrusion + STL export).
- Scene is **Z-up** (consistent with Blender-style view).
- STL export: **emblem only** or **combined with base**.
- Batch: many SVG → ZIP with per-job fit, lift/inset overrides, optional inverse flag.
- Inverse (negative stamp): subtract emblem mesh from base; combined export follows preview after CSG.

### Model & bases

- Size, thickness, line density (curve detail), XYZ scale sliders.
- Auto-fix unclosed SVG subpaths before extrusion.
- Flip horizontally and vertically.
- Load a **STL** base or generate a **round** base (diameter/thickness).
- **Auto-fit** base to emblem / emblem to base.
- **Fit margin** — configurable inward margin when fitting emblem width to base (percentage from edge of base diameter; useful with rotated emblems).

### Editing & UX

- **WinBox** draggable panels (Model, Base, Batch) with tall viewport-filling height.
- **Transform gizmo**: translate / rotate / scale with axis shortcuts; persists emblem rotation & scale across rebuilds.
- Gizmo-aligned **offsets** versus canonical seal-on-base placement (inverse preview stays in sync).
- Inverse mode: **live CSG preview** updates while moving/rotating/scaling the emblem with the gizmo.
- Raycast object pick in the viewport; Blender-like orbit controls (middle mouse etc.).
- Collapsible sidebar: **View & Export** + theme (dark/light), **EN / RU** locale.

### Library

- **`wh40k/library-manifest.json`**: categorized SVG thumbnails, browser modal with delayed hover preview, single load or multi-select into batch without duplicate rows on re-confirm.

### State

- Undo / redo, reset settings, clear cached state (localStorage).

## Releases

See [GitHub Releases](https://github.com/Volkula/seal-generator/releases).

### v3.0.0

- **Inverse preview**: repositioning or transforming the emblem with the gizmo now rebuilds the cut preview (CSG) so the recessed shape matches placement.
- **Fit margin (%)**: separate control for inset from base edge when auto-fitting; batch sizing uses the same base metric.
- **Gizmo offsets**: emblem UI offsets derived from canonical “on base” position; rotation/scale from gizmo stored and reapplied after mesh rebuild.
- **Wider offset range** on sliders for large moves.
- Batch library confirm **replaces** library-driven rows instead of appending duplicates; floating panels use full usable height.

## Run locally

**Do not open `index.html` via `file://`.**  
The app uses **`import` (ES modules)** and `importmap`; browsers block loading `app.js` from the local filesystem (CORS / unique `file:` origins), so you will see errors like *“blocked by CORS policy”* or *“Failed to load module script”*.

Serve the folder over **HTTP** and open `http://127.0.0.1:8080` (or the port you choose).

**Option A — Python** (if installed):

```bash
cd /path/to/seal-generator
python -m http.server 8080
```

**Option B — batch file (Windows)**  
Double-click `serve.bat` in the project folder (uses `python -m http.server 8080`).

**Option C — PowerShell** (Windows):

```powershell
.\serve.ps1
```

**Option D — Node** (no Python):

```bash
npm start
```

(`npx serve` is run on demand; no lockfile required.)

## Deploy

Workflow `.github/workflows/deploy-pages.yml` deploys **`main`** to GitHub Pages on each push.

## License

Repository contents are **CC0 1.0** (`LICENSE`) — code, UI, and assets committed here may be reused without restriction.
