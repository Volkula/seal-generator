# Seal Generator

Browser app for converting SVG to STL with instant 3D preview.

## Features

- Upload SVG and preview 3D result immediately
- Live controls for:
  - output size (max dimension)
  - thickness
  - line density (curve detail)
- Auto-fix for unclosed faces (forces subpath closure before shape generation)
- Vertical flip option (top-bottom)
- One-click STL export

## Run locally

Open `index.html` in a browser.

## Deploy

GitHub Actions workflow `.github/workflows/deploy-pages.yml` deploys this repository to GitHub Pages on every push to `main`.
