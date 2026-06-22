/** Procedural surface forge — real geometry displacement (not textures). */

export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function forgedCellRand(ix, iy, salt = 0) {
  let h = (ix * 374761393 + iy * 668265263 + salt * 982451653) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

function forgeSmoothFalloff(t) {
  const x = clampNumber(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function forgeEllipticalInfluence(lx, ly, rx, ry) {
  const nx = lx / rx;
  const ny = ly / ry;
  const d = nx * nx + ny * ny;
  if (d >= 1) return 0;
  return forgeSmoothFalloff(1 - d);
}

function forgeMarkInfluenceAt(x, y, mark, cell, markShape, markSize) {
  const dx = x - mark.cx;
  const dy = y - mark.cy;
  const cos = Math.cos(-mark.angle);
  const sin = Math.sin(-mark.angle);
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  const baseR = cell * markSize * 0.42;
  switch (markShape) {
    case "oval":
      return forgeEllipticalInfluence(lx, ly, baseR * 1.55, baseR * 0.55);
    case "strike":
      return forgeEllipticalInfluence(lx, ly, baseR * 1.85, baseR * 0.28);
    case "cross":
      return Math.max(
        forgeEllipticalInfluence(lx, ly, baseR * 0.42, baseR * 1.35),
        forgeEllipticalInfluence(ly, -lx, baseR * 0.42, baseR * 1.35)
      );
    default:
      return forgeEllipticalInfluence(lx, ly, baseR, baseR);
  }
}

function generateForgeMarks(settings, box) {
  const span = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, 1);
  const cell = span / settings.frequency;
  const cxMid = (box.min.x + box.max.x) * 0.5;
  const cyMid = (box.min.y + box.max.y) * 0.5;
  const halfN = Math.ceil(settings.frequency / 2) + 1;
  const marks = [];
  for (let iy = -halfN; iy <= halfN; iy++) {
    for (let ix = -halfN; ix <= halfN; ix++) {
      if (forgedCellRand(ix, iy, 4) > 0.93) continue;
      marks.push({
        cx: cxMid + (ix + 0.5) * cell + (forgedCellRand(ix, iy, 1) - 0.5) * cell * 0.55,
        cy: cyMid + (iy + 0.5) * cell + (forgedCellRand(ix, iy, 2) - 0.5) * cell * 0.55,
        angle: forgedCellRand(ix, iy, 3) * Math.PI,
      });
    }
  }
  return { marks, cell, cxMid, cyMid, span };
}

function sampleHammerInfluence(x, y, ctx, settings) {
  let sum = 0;
  for (const mark of ctx.marks) {
    sum += forgeMarkInfluenceAt(x, y, mark, ctx.cell, settings.markShape, settings.markSize);
  }
  return 1 - Math.exp(-2.8 * sum);
}

function sampleRingsInfluence(x, y, ctx, settings) {
  const dx = x - ctx.cxMid;
  const dy = y - ctx.cyMid;
  const r = Math.hypot(dx, dy);
  const wave = (r / ctx.cell) * Math.PI * 2 * (settings.frequency / 12);
  const groove = 0.5 + 0.5 * Math.cos(wave);
  const edge = forgeSmoothFalloff(1 - r / (ctx.span * 0.5));
  return groove * edge * settings.markSize;
}

function sampleKnurlInfluence(x, y, ctx, settings) {
  const s = ctx.cell * 0.5 * settings.markSize;
  const px = (x - ctx.cxMid) / s;
  const py = (y - ctx.cyMid) / s;
  const u = px + py;
  const v = px - py;
  const diamond = Math.abs(Math.sin(u * Math.PI)) * Math.abs(Math.sin(v * Math.PI));
  const edge = forgeSmoothFalloff(1 - Math.hypot(x - ctx.cxMid, y - ctx.cyMid) / (ctx.span * 0.5));
  return diamond * edge;
}

function sampleRollInfluence(x, y, ctx, settings) {
  const angle = settings.rollAngle ?? 0;
  const lx = (x - ctx.cxMid) * Math.cos(angle) + (y - ctx.cyMid) * Math.sin(angle);
  const wave = (lx / ctx.cell) * Math.PI * 2;
  const groove = 0.5 + 0.5 * Math.cos(wave);
  const edge = forgeSmoothFalloff(1 - Math.hypot(x - ctx.cxMid, y - ctx.cyMid) / (ctx.span * 0.5));
  return groove * edge * settings.markSize;
}

function samplePittingInfluence(x, y, ctx, settings) {
  const ix = Math.floor((x - ctx.cxMid) / ctx.cell);
  const iy = Math.floor((y - ctx.cyMid) / ctx.cell);
  let peak = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ctx.cxMid + (ix + dx + 0.5) * ctx.cell + (forgedCellRand(ix + dx, iy + dy, 1) - 0.5) * ctx.cell * 0.4;
      const cy = ctx.cyMid + (iy + dy + 0.5) * ctx.cell + (forgedCellRand(ix + dx, iy + dy, 2) - 0.5) * ctx.cell * 0.4;
      if (forgedCellRand(ix + dx, iy + dy, 4) > 0.82) continue;
      const r = ctx.cell * 0.22 * settings.markSize;
      peak = Math.max(peak, forgeEllipticalInfluence(x - cx, y - cy, r, r));
    }
  }
  return peak;
}

function sampleSunburstInfluence(x, y, ctx, settings) {
  const dx = x - ctx.cxMid;
  const dy = y - ctx.cyMid;
  const r = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  const rays = settings.frequency;
  const ray = 0.5 + 0.5 * Math.cos(a * rays + r / ctx.cell * 0.35);
  const edge = forgeSmoothFalloff(1 - r / (ctx.span * 0.5));
  return ray * edge * settings.markSize;
}

function sampleHexInfluence(x, y, ctx, settings) {
  const s = ctx.cell * 0.58 * settings.markSize;
  const px = (x - ctx.cxMid) / s;
  const py = (y - ctx.cyMid) / s;
  const q = (2 / 3) * px;
  const r = (-1 / 3) * px + (Math.sqrt(3) / 3) * py;
  const sx = Math.round(q);
  const sy = Math.round(r);
  const sz = Math.round(-q - r);
  const qf = q - sx;
  const rf = r - sy;
  const dist = Math.max(Math.abs(qf), Math.abs(rf), Math.abs(-qf - rf - sz + sx + sy));
  const edge = forgeSmoothFalloff(1 - dist * 2.2);
  const rim = forgeSmoothFalloff(1 - Math.hypot(x - ctx.cxMid, y - ctx.cyMid) / (ctx.span * 0.5));
  return edge * rim;
}

function sampleForgeInfluenceAt(x, y, ctx, settings) {
  let raw = 0;
  switch (settings.preset) {
    case "rings":
      raw = sampleRingsInfluence(x, y, ctx, settings);
      break;
    case "knurl":
      raw = sampleKnurlInfluence(x, y, ctx, settings);
      break;
    case "roll":
      raw = sampleRollInfluence(x, y, ctx, settings);
      break;
    case "pitting":
      raw = samplePittingInfluence(x, y, ctx, settings);
      break;
    case "sunburst":
      raw = sampleSunburstInfluence(x, y, ctx, settings);
      break;
    case "hex":
      raw = sampleHexInfluence(x, y, ctx, settings);
      break;
    case "forgedMetal":
    case "hammer":
    default:
      raw = sampleHammerInfluence(x, y, ctx, settings);
      break;
  }
  const grain = (forgedCellRand(Math.floor(x * 19), Math.floor(y * 19), 8) - 0.5) * 0.05;
  return clampNumber(raw + grain * settings.strength, 0, 1);
}

/**
 * @param {import("three").BufferGeometry} geometry
 * @param {{ preset: string, frequency: number, markShape: string, markSize: number, strength: number, topOnly?: boolean }} settings
 * @param {{ diskMode?: boolean, diskRadius?: number }} options
 */
export function applyForgeDisplacement(geometry, settings, options = {}) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const thickness = Math.max(box.max.z - box.min.z, 0.001);
  const depthMul = settings.preset === "pitting" ? 0.55 : 0.62;
  const maxDepth = Math.min(thickness * depthMul * settings.strength, thickness * 0.65);
  if (maxDepth <= 0.001) return;

  const markData = generateForgeMarks(settings, box);
  const ctx = { ...markData, marks: markData.marks };
  if (!ctx.marks.length && settings.preset === "hammer") return;

  const diskMode = !!options.diskMode;
  const diskRadius = options.diskRadius ?? Math.max(box.max.x - box.min.x, box.max.y - box.min.y) * 0.5;
  const pos = geometry.attributes.position;
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const topZ = box.max.z;
  const topEps = diskMode ? Math.max(thickness * 0.08, 0.05) : Math.max(thickness * 0.16, 0.06);
  const topOnly = settings.topOnly !== false;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (topOnly && z < topZ - topEps) continue;

    if (diskMode && Math.hypot(x, y) > diskRadius * 1.002) continue;
    if (!diskMode && topOnly && normals.getZ(i) < 0.3) continue;

    const depth = sampleForgeInfluenceAt(x, y, ctx, settings) * maxDepth;
    if (depth <= 0.0005) continue;

    if (diskMode || (topOnly && normals.getZ(i) > 0.55)) {
      pos.setZ(z - depth);
    } else {
      const nx = normals.getX(i);
      const ny = normals.getY(i);
      const nz = normals.getZ(i);
      pos.setXYZ(i, x - nx * depth, y - ny * depth, z - nz * depth);
    }
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function detectRoundFlatTop(box) {
  const spanX = box.max.x - box.min.x;
  const spanY = box.max.y - box.min.y;
  return (
    Math.abs(spanX - spanY) / Math.max(spanX, spanY, 1) < 0.12 &&
    Math.max(spanX, spanY) / Math.max(box.max.z - box.min.z, 0.001) > 4
  );
}
