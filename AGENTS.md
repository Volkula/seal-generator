# AGENTS.md

## Project Goal

Build and maintain a browser-based SVG-to-STL generator with live 3D preview, base composition, inverse stamp mode, and production-ready GitHub Pages deployment.

## Core Product Requirements

- Convert SVG to STL directly in browser.
- Live preview with parameter changes applied immediately.
- Support batch SVG processing and ZIP export.
- Support standalone STL export (emblem only) and combined export (base + emblem).
- Preserve reliable behavior between preview and export (same transforms).

## Geometry and Composition Requirements

- Scene uses Blender-style Z-up orientation.
- Emblem can be mirrored on both axes.
- Base can be loaded from STL or procedurally generated as a round base.
- Base and emblem support full XYZ offsets.
- Lift parameter controls positive relief above base.
- Inverse mode creates negative stamp result and uses boolean subtraction for combined export.

## Interaction and UX Requirements

- Sidebar can be placed on left or right.
- UI uses collapsible sections instead of tabs.
- Two logical inspector boxes in View & Export:
  - Box 1: gizmo and display controls.
  - Box 2: selected-object controls (dynamic for base vs emblem).
- Object selection in scene by click.
- Gizmo enabled by default.
- Gizmo supports translate/rotate/scale cycling and axis constraints.
- Wireframe preview toggle.
- Blender-like viewport navigation and shortcuts.

## State Management Requirements

- Undo/redo must work reliably (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).
- Persist user state in browser cache.
- Separate actions for:
  - reset settings
  - clear cache

## Localization and Theme Requirements

- Language toggle EN/RU for all key UI labels.
- Theme toggle dark/light.

## Legal and Licensing Requirements

- Repository content is open and reusable under permissive terms (CC0 already applied).

## Delivery and DevOps Requirements

- Push changes directly to `main` when requested.
- Deploy via GitHub Actions to GitHub Pages.
- Keep app static-hosting compatible (no backend dependency).
