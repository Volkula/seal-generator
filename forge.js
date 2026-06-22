/** Procedural surface forge — real geometry displacement (not textures). */

import * as THREE from "three";

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
  const randomness = clampNumber(settings.randomness ?? 0, 0, 1);
  const jitterScale = 0.12 + randomness * 0.58;
  const skipThreshold = 0.92 - randomness * 0.42;
  const halfN = Math.ceil(settings.frequency / 2) + 1;
  const marks = [];
  for (let iy = -halfN; iy <= halfN; iy++) {
    for (let ix = -halfN; ix <= halfN; ix++) {
      if (randomness > 0.05 && forgedCellRand(ix, iy, 5) > skipThreshold) continue;
      const cx = cxMid + (ix + 0.5) * cell + (forgedCellRand(ix, iy, 1) - 0.5) * cell * jitterScale;
      const cy = cyMid + (iy + 0.5) * cell + (forgedCellRand(ix, iy, 2) - 0.5) * cell * jitterScale;
      if (Math.hypot(cx - cxMid, cy - cyMid) > span * 0.48) continue;
      marks.push({
        cx,
        cy,
        angle: forgedCellRand(ix, iy, 3) * Math.PI + (forgedCellRand(ix, iy, 6) - 0.5) * randomness * Math.PI,
        sizeBias: 1 + (forgedCellRand(ix, iy, 7) - 0.5) * randomness * 0.65,
      });
    }
  }
  return {
    marks,
    cell,
    cxMid,
    cyMid,
    span,
    randomness,
    phaseOffset: forgedCellRand(0, 0, 99) * randomness * Math.PI * 2,
  };
}

function rimEdgeFactor(x, y, ctx) {
  const r = Math.hypot(x - ctx.cxMid, y - ctx.cyMid);
  const limit = ctx.diskMode ? ctx.diskRadius * 0.98 : ctx.span * 0.5;
  return forgeSmoothFalloff(1 - r / Math.max(limit, 0.001));
}

function sampleHammerInfluence(x, y, ctx, settings) {
  let sum = 0;
  for (const mark of ctx.marks) {
    const size = settings.markSize * (mark.sizeBias ?? 1);
    sum += forgeMarkInfluenceAt(x, y, mark, ctx.cell, settings.markShape, size);
  }
  return 1 - Math.exp(-2.2 * sum);
}

function sampleRingsInfluence(x, y, ctx, settings) {
  const dx = x - ctx.cxMid;
  const dy = y - ctx.cyMid;
  const r = Math.hypot(dx, dy);
  const wave = (r / ctx.cell) * Math.PI * 2 * (settings.frequency / 12) + (ctx.phaseOffset ?? 0);
  const groove = 0.5 + 0.5 * Math.cos(wave);
  return groove * rimEdgeFactor(x, y, ctx) * settings.markSize;
}

function sampleKnurlInfluence(x, y, ctx, settings) {
  const s = ctx.cell * 0.5 * settings.markSize;
  const rn = ctx.randomness ?? 0;
  const px = (x - ctx.cxMid) / s + 0.25 + (forgedCellRand(Math.floor(x * 7), Math.floor(y * 7), 11) - 0.5) * rn * 0.35;
  const py = (y - ctx.cyMid) / s + 0.25 + (forgedCellRand(Math.floor(x * 7), Math.floor(y * 7), 12) - 0.5) * rn * 0.35;
  const u = px + py;
  const v = px - py;
  const diamond =
    Math.abs(Math.sin(u * Math.PI)) * Math.abs(Math.sin(v * Math.PI));
  const softened = Math.pow(clampNumber(diamond, 0, 1), 0.82);
  return softened * rimEdgeFactor(x, y, ctx);
}

function sampleRollInfluence(x, y, ctx, settings) {
  const angle = settings.rollAngle ?? 0;
  const lx = (x - ctx.cxMid) * Math.cos(angle) + (y - ctx.cyMid) * Math.sin(angle);
  const wave = (lx / ctx.cell) * Math.PI * 2 + (ctx.phaseOffset ?? 0);
  const groove = 0.5 + 0.5 * Math.cos(wave);
  return groove * rimEdgeFactor(x, y, ctx) * settings.markSize;
}

function samplePittingInfluence(x, y, ctx, settings) {
  const ix = Math.floor((x - ctx.cxMid) / ctx.cell);
  const iy = Math.floor((y - ctx.cyMid) / ctx.cell);
  let peak = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ctx.cxMid + (ix + dx + 0.5) * ctx.cell + (forgedCellRand(ix + dx, iy + dy, 1) - 0.5) * ctx.cell * 0.4;
      const cy = ctx.cyMid + (iy + dy + 0.5) * ctx.cell + (forgedCellRand(ix + dx, iy + dy, 2) - 0.5) * ctx.cell * 0.4;
      const pitThreshold = 0.55 - (ctx.randomness ?? 0) * 0.35;
      if (forgedCellRand(ix + dx, iy + dy, 4) > pitThreshold) continue;
      const r = ctx.cell * 0.22 * settings.markSize;
      peak = Math.max(peak, forgeEllipticalInfluence(x - cx, y - cy, r, r));
    }
  }
  return peak * rimEdgeFactor(x, y, ctx);
}

function sampleSunburstInfluence(x, y, ctx, settings) {
  const dx = x - ctx.cxMid;
  const dy = y - ctx.cyMid;
  const r = Math.hypot(dx, dy);
  const a = Math.atan2(dy, dx);
  const rays = settings.frequency;
  const ray = 0.5 + 0.5 * Math.cos(a * rays + r / ctx.cell * 0.35);
  return ray * rimEdgeFactor(x, y, ctx) * settings.markSize;
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
  return edge * rimEdgeFactor(x, y, ctx);
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
  const rn = ctx.randomness ?? 0;
  const grainAmp = 0.015 + rn * 0.11;
  const grain = (forgedCellRand(Math.floor(x * 19), Math.floor(y * 19), 8) - 0.5) * grainAmp;
  return clampNumber(raw + grain * settings.strength, 0, 1);
}

export function computeForgeGridResolution(diameter, frequency, forExport = false) {
  if (forExport) {
    const byDiameter = Math.round(diameter * 3.5);
    const byFrequency = Math.round(frequency * 22);
    return clampNumber(Math.max(byDiameter, byFrequency, 160), 160, 320);
  }
  const byDiameter = Math.round(diameter * 1.5);
  const byFrequency = Math.round(frequency * 10);
  return clampNumber(Math.max(byDiameter, byFrequency, 72), 72, 120);
}

/**
 * Disk with a smooth polar top grid so forge patterns are not blocky/pixelated.
 */
export function makeForgeDiskGeometry(diameter, thickness, radialSegs = 256) {
  const radius = diameter / 2;
  const nRad = clampNumber(Math.round(radialSegs), 48, 320);
  const ringSegs = clampNumber(Math.round(nRad * 0.38), 32, 120);
  const positions = [];
  const indices = [];
  const ringStart = [0];

  positions.push(0, 0, 0);
  for (let ring = 1; ring <= ringSegs; ring++) {
    ringStart.push(positions.length / 3);
    const r = (ring / ringSegs) * radius;
    for (let i = 0; i < nRad; i++) {
      const a = (i / nRad) * Math.PI * 2;
      positions.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
  }

  for (let i = 0; i < nRad; i++) {
    const next = (i + 1) % nRad;
    indices.push(0, ringStart[1] + next, ringStart[1] + i);
  }

  for (let ring = 1; ring < ringSegs; ring++) {
    for (let i = 0; i < nRad; i++) {
      const next = (i + 1) % nRad;
      const a = ringStart[ring] + i;
      const b = ringStart[ring] + next;
      const c = ringStart[ring + 1] + next;
      const d = ringStart[ring + 1] + i;
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const rimTopStart = ringStart[ringSegs];
  const rimBottomStart = positions.length / 3;
  for (let i = 0; i < nRad; i++) {
    const ix = rimTopStart + i;
    positions.push(positions[ix * 3], positions[ix * 3 + 1], -thickness);
  }

  for (let i = 0; i < nRad; i++) {
    const next = (i + 1) % nRad;
    const a = rimTopStart + i;
    const b = rimTopStart + next;
    const c = rimBottomStart + next;
    const d = rimBottomStart + i;
    indices.push(a, c, b);
    indices.push(a, d, c);
  }

  const bottomCenter = positions.length / 3;
  positions.push(0, 0, -thickness);
  for (let i = 0; i < nRad; i++) {
    const next = (i + 1) % nRad;
    indices.push(bottomCenter, rimBottomStart + next, rimBottomStart + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * @param {import("three").BufferGeometry} geometry
 * @param {{ preset: string, frequency: number, markShape: string, markSize: number, strength: number, randomness?: number, reverse?: boolean, topOnly?: boolean }} settings
 * @param {{ diskMode?: boolean, diskRadius?: number }} options
 */
export function applyForgeDisplacement(geometry, settings, options = {}) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const thickness = Math.max(box.max.z - box.min.z, 0.001);
  const maxDepth = Math.min(
    Math.max(thickness * 0.42 * settings.strength, 0.12),
    thickness * 0.55
  );
  if (maxDepth <= 0.0005) return;

  const markData = generateForgeMarks(settings, box);
  const diskMode = !!options.diskMode;
  const diskRadius = options.diskRadius ?? Math.max(box.max.x - box.min.x, box.max.y - box.min.y) * 0.5;
  const ctx = { ...markData, marks: markData.marks, diskMode, diskRadius };

  const pos = geometry.attributes.position;
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const topZ = box.max.z;
  const topEps = Math.max(thickness * 0.06, 0.02);
  const topOnly = settings.topOnly !== false;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nz = normals.getZ(i);

    if (topOnly) {
      const nearTop = topZ - z <= topEps;
      const upFacing = nz > 0.5;
      const onDiskTop = diskMode && nearTop && Math.hypot(x, y) <= diskRadius * 1.001;
      if (!onDiskTop && !(nearTop && upFacing)) continue;
    }

    if (diskMode && Math.hypot(x, y) > diskRadius * 1.002) continue;

    const depth = sampleForgeInfluenceAt(x, y, ctx, settings) * maxDepth;
    if (depth <= 0.0005) continue;

    const sign = settings.reverse ? 1 : -1;
    if (diskMode || topOnly) {
      pos.setZ(i, z + sign * depth);
    } else {
      const nx = normals.getX(i);
      const ny = normals.getY(i);
      pos.setXYZ(i, x - nx * sign * depth, y - ny * sign * depth, z - nz * sign * depth);
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
