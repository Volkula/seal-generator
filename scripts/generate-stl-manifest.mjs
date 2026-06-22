import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const stlsDir = path.join(root, "stls");
const outFile = path.join(stlsDir, "library-manifest.json");

function walkStls(dir, relBase = "stls") {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.posix.join(relBase.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) {
      items.push(...walkStls(abs, rel));
      continue;
    }
    if (!entry.name.toLowerCase().endsWith(".stl")) continue;
    const relDir = path.posix.dirname(rel);
    const category =
      relDir === "stls"
        ? "General"
        : path.basename(relDir).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const name = entry.name.replace(/\.stl$/i, "").replace(/[-_]+/g, " ");
    items.push({
      name,
      category,
      path: `./${rel.replace(/\\/g, "/")}`,
    });
  }
  return items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

if (!fs.existsSync(stlsDir)) fs.mkdirSync(stlsDir, { recursive: true });
const manifest = walkStls(stlsDir);
fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${manifest.length} STL entries to ${path.relative(root, outFile)}`);
