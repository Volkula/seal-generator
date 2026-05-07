import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import JSZip from "https://esm.sh/jszip@3.10.1";

const viewport = document.getElementById("viewport");
const fileInput = document.getElementById("svgFile");
const baseStlFileInput = document.getElementById("baseStlFile");
const generateBaseInput = document.getElementById("generateBase");
const baseDiameterInput = document.getElementById("baseDiameter");
const baseDiameterValueInput = document.getElementById("baseDiameterValue");
const baseThicknessInput = document.getElementById("baseThickness");
const baseThicknessValueInput = document.getElementById("baseThicknessValue");
const themeSelect = document.getElementById("themeSelect");
const langSelect = document.getElementById("langSelect");
const sizeInput = document.getElementById("size");
const sizeValueInput = document.getElementById("sizeValue");
const thicknessInput = document.getElementById("thickness");
const thicknessValueInput = document.getElementById("thicknessValue");
const liftInput = document.getElementById("lift");
const liftValueInput = document.getElementById("liftValue");
const densityInput = document.getElementById("density");
const autoFixInput = document.getElementById("autoFix");
const flipYInput = document.getElementById("flipY");
const flipXInput = document.getElementById("flipX");
const exportBtn = document.getElementById("exportBtn");
const exportCombinedBtn = document.getElementById("exportCombinedBtn");
const exportZipBtn = document.getElementById("exportZipBtn");
const flatViewBtn = document.getElementById("flatViewBtn");
const fitBaseToEmblemBtn = document.getElementById("fitBaseToEmblemBtn");
const fitEmblemToBaseBtn = document.getElementById("fitEmblemToBaseBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const statusEl = document.getElementById("status");

const densityOut = document.getElementById("densityOut");

let svgText = "";
let svgName = "model";
let currentMesh = null;
let currentBaseMesh = null;
let uploadedBaseMesh = null;
let currentLang = "en";
let uploadedFiles = [];
let isFlatView = false;
let history = [];
let historyIndex = -1;
let isApplyingHistory = false;

const i18n = {
  en: {
    title: "Seal Generator",
    subtitle: "SVG -> STL with live 3D preview",
    theme: "Theme",
    language: "Language",
    svgFile: "SVG file",
    baseStl: "Base STL (optional)",
    generateBase: "Generate round base",
    baseDiameter: "Base diameter (mm)",
    baseThickness: "Base thickness (mm)",
    size: "Size (max dimension, mm)",
    thickness: "Thickness (mm)",
    lift: "Lift over base (mm)",
    density: "Line density",
    autoFix: "Auto-fix unclosed faces",
    flipY: "Flip vertically (top-bottom)",
    flipX: "Flip horizontally (left-right)",
    export: "Export STL",
    exportCombined: "Export STL (with base)",
    exportZip: "Export ZIP (batch)",
    fitBaseToEmblem: "Auto-fit base to emblem",
    fitEmblemToBase: "Auto-fit emblem to base",
    undo: "Undo",
    redo: "Redo",
    tabModel: "Model",
    tabBase: "Base",
    tabExport: "Export",
    flatView: "Flat View",
    perspectiveView: "3D View",
    statusIdle: "Load an SVG to start.",
    statusError: "Error",
    statusFile: "File",
    statusShapes: "Shapes",
    statusSize: "Size",
    statusFix: "Auto-fix",
    statusFlip: "Flip Y",
    statusFlipX: "Flip X",
    statusBatch: "Batch files",
    statusBase: "Base loaded",
    on: "on",
    off: "off",
    license:
      "All code and visual assets in this repo are released under CC0 1.0 (public domain).",
  },
  ru: {
    title: "Seal Generator",
    subtitle: "SVG -> STL с живым 3D-превью",
    theme: "Тема",
    language: "Язык",
    svgFile: "SVG файл",
    baseStl: "Основание STL (опционально)",
    generateBase: "Сгенерировать круглое основание",
    baseDiameter: "Диаметр основания (мм)",
    baseThickness: "Толщина основания (мм)",
    size: "Размер (макс. габарит, мм)",
    thickness: "Толщина (мм)",
    lift: "Подъем над основанием (мм)",
    density: "Плотность линий",
    autoFix: "Автоисправление незамкнутых контуров",
    flipY: "Отразить по вертикали (верх-низ)",
    flipX: "Отразить по горизонтали (лево-право)",
    export: "Экспорт STL",
    exportCombined: "Экспорт STL (с основанием)",
    exportZip: "Экспорт ZIP (batch)",
    fitBaseToEmblem: "Автоподгонка основания под эмблему",
    fitEmblemToBase: "Автоподгонка эмблемы под основание",
    undo: "Отменить",
    redo: "Повторить",
    tabModel: "Модель",
    tabBase: "Основание",
    tabExport: "Экспорт",
    flatView: "Плоский вид",
    perspectiveView: "3D вид",
    statusIdle: "Загрузите SVG для начала.",
    statusError: "Ошибка",
    statusFile: "Файл",
    statusShapes: "Фигуры",
    statusSize: "Размер",
    statusFix: "Автофикс",
    statusFlip: "Флип Y",
    statusFlipX: "Флип X",
    statusBatch: "Файлов в batch",
    statusBase: "Основание загружено",
    on: "вкл",
    off: "выкл",
    license:
      "Весь код и визуальные ассеты в этом репозитории доступны под CC0 1.0 (public domain).",
  },
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
camera.position.set(80, 80, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(100, 160, 120);
scene.add(keyLight);

let grid = new THREE.GridHelper(400, 40, 0x3d444d, 0x2d333b);
scene.add(grid);

function setStatus(text) {
  statusEl.textContent = text;
}

function setActiveTab(tab) {
  for (const btn of tabButtons) {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  }
  for (const panel of tabPanels) {
    panel.classList.toggle("active", panel.dataset.panel === tab);
  }
}

function t(key) {
  return i18n[currentLang][key];
}

function applyLocale() {
  document.documentElement.lang = currentLang;
  document.getElementById("title").textContent = t("title");
  document.getElementById("subtitle").textContent = t("subtitle");
  document.getElementById("themeLabel").textContent = t("theme");
  document.getElementById("langLabel").textContent = t("language");
  document.getElementById("svgFileLabel").textContent = t("svgFile");
  document.getElementById("baseStlLabel").textContent = t("baseStl");
  document.getElementById("generateBaseLabel").textContent = t("generateBase");
  document.getElementById("baseDiameterLabel").textContent = t("baseDiameter");
  document.getElementById("baseThicknessLabel").textContent = t("baseThickness");
  document.getElementById("sizeLabel").textContent = t("size");
  document.getElementById("thicknessLabel").textContent = t("thickness");
  document.getElementById("liftLabel").textContent = t("lift");
  document.getElementById("densityLabel").textContent = t("density");
  document.getElementById("autoFixLabel").textContent = t("autoFix");
  document.getElementById("flipYLabel").textContent = t("flipY");
  document.getElementById("flipXLabel").textContent = t("flipX");
  document.getElementById("exportBtn").textContent = t("export");
  document.getElementById("exportCombinedBtn").textContent = t("exportCombined");
  document.getElementById("exportZipBtn").textContent = t("exportZip");
  document.getElementById("fitBaseToEmblemBtn").textContent = t("fitBaseToEmblem");
  document.getElementById("fitEmblemToBaseBtn").textContent = t("fitEmblemToBase");
  document.getElementById("undoBtn").textContent = t("undo");
  document.getElementById("redoBtn").textContent = t("redo");
  document.getElementById("tabModelBtn").textContent = t("tabModel");
  document.getElementById("tabBaseBtn").textContent = t("tabBase");
  document.getElementById("tabExportBtn").textContent = t("tabExport");
  document.getElementById("flatViewBtn").textContent = isFlatView ? t("perspectiveView") : t("flatView");
  document.getElementById("licenseNote").textContent = t("license");
  if (!svgText) {
    setStatus(t("statusIdle"));
  } else {
    rebuild();
  }
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.dataset.theme = isLight ? "light" : "dark";
  scene.background = new THREE.Color(isLight ? 0xece8dd : 0x0b0c10);
  scene.remove(grid);
  grid.geometry.dispose();
  if (Array.isArray(grid.material)) {
    for (const mat of grid.material) mat.dispose();
  } else {
    grid.material.dispose();
  }
  grid = new THREE.GridHelper(
    400,
    40,
    isLight ? 0xbdae8a : 0x3d444d,
    isLight ? 0xd2c6a7 : 0x2d333b
  );
  scene.add(grid);
}

function setFlatView(enabled) {
  isFlatView = enabled;
  controls.enableRotate = !enabled;
  if (enabled) {
    camera.position.set(0, 220, 0);
    camera.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
  } else {
    camera.position.set(80, 80, 120);
    controls.target.set(0, 0, 0);
  }
  controls.update();
  flatViewBtn.textContent = enabled ? t("perspectiveView") : t("flatView");
}

function makeGeneratedBaseMesh() {
  const diameter = Number(baseDiameterInput.value);
  const thickness = Number(baseThicknessInput.value);
  const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, thickness, 96);
  // Y is up in this scene, keep top at Y=0.
  geometry.translate(0, -thickness / 2, 0);
  geometry.computeVertexNormals();
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x8b8b8b,
      metalness: 0.25,
      roughness: 0.75,
      transparent: true,
      opacity: 0.95,
    })
  );
}

function getActiveBaseMesh() {
  if (generateBaseInput.checked) {
    return makeGeneratedBaseMesh();
  }
  if (uploadedBaseMesh) {
    return uploadedBaseMesh.clone();
  }
  return null;
}

function composePreview() {
  if (currentMesh) scene.remove(currentMesh);
  if (currentBaseMesh) {
    scene.remove(currentBaseMesh);
    currentBaseMesh.geometry.dispose();
    currentBaseMesh.material.dispose();
    currentBaseMesh = null;
  }
  if (!currentMesh) {
    exportCombinedBtn.disabled = true;
    return;
  }

  const base = getActiveBaseMesh();
  if (base) {
    currentBaseMesh = base;
    const baseBox = new THREE.Box3().setFromObject(base);
    const modelBox = new THREE.Box3().setFromObject(currentMesh);
    const lift = Number(liftInput.value);
    currentMesh.position.set(0, 0, 0);
    currentMesh.position.y += baseBox.max.y + lift - modelBox.min.y;
    scene.add(base);
    exportCombinedBtn.disabled = false;
  } else {
    currentMesh.position.set(0, 0, 0);
    exportCombinedBtn.disabled = true;
  }
  scene.add(currentMesh);
}

function captureState() {
  return {
    lang: currentLang,
    theme: document.body.dataset.theme || "dark",
    size: sizeInput.value,
    thickness: thicknessInput.value,
    lift: liftInput.value,
    density: densityInput.value,
    autoFix: autoFixInput.checked,
    flipX: flipXInput.checked,
    flipY: flipYInput.checked,
    generateBase: generateBaseInput.checked,
    baseDiameter: baseDiameterInput.value,
    baseThickness: baseThicknessInput.value,
    flatView: isFlatView,
    svgText,
    svgName,
  };
}

function applyState(state) {
  isApplyingHistory = true;
  currentLang = state.lang ?? currentLang;
  langSelect.value = currentLang;
  themeSelect.value = state.theme ?? "dark";
  sizeInput.value = state.size ?? sizeInput.value;
  thicknessInput.value = state.thickness ?? thicknessInput.value;
  liftInput.value = state.lift ?? liftInput.value;
  densityInput.value = state.density ?? densityInput.value;
  autoFixInput.checked = !!state.autoFix;
  flipXInput.checked = !!state.flipX;
  flipYInput.checked = !!state.flipY;
  generateBaseInput.checked = !!state.generateBase;
  baseDiameterInput.value = state.baseDiameter ?? baseDiameterInput.value;
  baseThicknessInput.value = state.baseThickness ?? baseThicknessInput.value;
  svgText = state.svgText ?? svgText;
  svgName = state.svgName ?? svgName;
  applyTheme(themeSelect.value);
  applyLocale();
  setFlatView(!!state.flatView);
  rebuild();
  isApplyingHistory = false;
}

function saveToCache() {
  localStorage.setItem("sealGeneratorStateV1", JSON.stringify(captureState()));
}

function loadFromCache() {
  const raw = localStorage.getItem("sealGeneratorStateV1");
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    applyState(state);
  } catch (_err) {}
}

function commitHistory() {
  if (isApplyingHistory) return;
  const snapshot = captureState();
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);
  if (history.length > 80) history.shift();
  historyIndex = history.length - 1;
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = true;
  saveToCache();
}

function goHistory(delta) {
  const next = historyIndex + delta;
  if (next < 0 || next >= history.length) return;
  historyIndex = next;
  applyState(history[historyIndex]);
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);
resize();

function closeOpenSubpaths(data) {
  for (const p of data.paths) {
    for (const sub of p.subPaths) {
      sub.autoClose = true;
    }
  }
}

function applyMirror(geometry, flipX, flipY) {
  if (!flipX && !flipY) return;

  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  geometry.scale(sx, sy, 1);

  // If we mirror over exactly one axis, triangle winding must be reversed.
  if (flipX !== flipY && geometry.index) {
    const idx = geometry.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    geometry.index.needsUpdate = true;
  }
}

function buildMesh(svg, opts) {
  const loader = new SVGLoader();
  const data = loader.parse(svg);

  if (opts.autoFix) {
    closeOpenSubpaths(data);
  }

  const geometries = [];
  let shapeCount = 0;

  for (const path of data.paths) {
    const shapes = SVGLoader.createShapes(path);
    shapeCount += shapes.length;
    for (const shape of shapes) {
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: opts.thickness,
        bevelEnabled: false,
        curveSegments: opts.density,
      });
      geometries.push(g);
    }
  }

  if (geometries.length === 0) {
    throw new Error(currentLang === "ru" ? "Нет замкнутых фигур. Включите автофикс." : "No closed shapes found. Try enabling auto-fix.");
  }

  const merged = mergeGeometries(geometries, false);
  if (!merged) {
    throw new Error(currentLang === "ru" ? "Не удалось объединить геометрию." : "Could not merge geometry.");
  }
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const scale = opts.targetSize / maxDim;
  merged.scale(scale, scale, scale);

  merged.computeBoundingBox();
  const box2 = merged.boundingBox;
  const center = new THREE.Vector3();
  box2.getCenter(center);
  merged.translate(-center.x, -box2.min.y, -center.z);
  // Lay emblem flat on XZ plane (Y-up world).
  merged.rotateX(-Math.PI / 2);

  applyMirror(merged, opts.flipX, opts.flipY);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  const finalBox = merged.boundingBox;
  const finalSize = new THREE.Vector3();
  finalBox.getSize(finalSize);

  const mesh = new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({
      color: 0x58a6ff,
      metalness: 0.1,
      roughness: 0.55,
    })
  );

  return {
    mesh,
    shapeCount,
    bbox: finalSize,
  };
}

function refreshOutputs() {
  sizeValueInput.value = `${Number(sizeInput.value).toFixed(0)}`;
  thicknessValueInput.value = `${Number(thicknessInput.value).toFixed(1)}`;
  liftValueInput.value = `${Number(liftInput.value).toFixed(1)}`;
  baseDiameterValueInput.value = `${Number(baseDiameterInput.value).toFixed(0)}`;
  baseThicknessValueInput.value = `${Number(baseThicknessInput.value).toFixed(1)}`;
  densityOut.textContent = `${Number(densityInput.value).toFixed(0)}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rebuild() {
  refreshOutputs();
  if (!svgText) {
    return;
  }

  const opts = {
    targetSize: Number(sizeInput.value),
    thickness: Number(thicknessInput.value),
    density: Number(densityInput.value),
    autoFix: autoFixInput.checked,
    flipY: flipYInput.checked,
    flipX: flipXInput.checked,
  };

  try {
    const { mesh, shapeCount, bbox } = buildMesh(svgText, opts);
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }
    currentMesh = mesh;
    composePreview();
    exportBtn.disabled = false;
    exportZipBtn.disabled = uploadedFiles.length === 0;
    setStatus(
      [
        `${t("statusFile")}: ${svgName}`,
        `${t("statusBase")}: ${generateBaseInput.checked || uploadedBaseMesh ? t("on") : t("off")}`,
        `${t("statusBatch")}: ${uploadedFiles.length}`,
        `${t("statusShapes")}: ${shapeCount}`,
        `${t("statusSize")}: ${bbox.x.toFixed(2)} x ${bbox.y.toFixed(2)} x ${bbox.z.toFixed(2)} mm`,
        `${t("statusFix")}: ${opts.autoFix ? t("on") : t("off")}`,
        `${t("statusFlip")}: ${opts.flipY ? t("on") : t("off")}`,
        `${t("statusFlipX")}: ${opts.flipX ? t("on") : t("off")}`,
      ].join("\n")
    );
  } catch (err) {
    exportBtn.disabled = true;
    setStatus(`${t("statusError")}: ${err.message}`);
  }
}

fileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) {
    return;
  }
  uploadedFiles = files;
  const first = files[0];
  svgName = first.name.replace(/\.svg$/i, "");
  svgText = await first.text();
  rebuild();
  commitHistory();
});

baseStlFileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    if (uploadedBaseMesh) {
      uploadedBaseMesh.geometry.dispose();
      uploadedBaseMesh.material.dispose();
      uploadedBaseMesh = null;
    }
    composePreview();
    rebuild();
    return;
  }

  const loader = new STLLoader();
  const buffer = await file.arrayBuffer();
  const geometry = loader.parse(buffer);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  // Keep uploaded base top face at Y=0.
  geometry.translate(-center.x, -box.max.y, -center.z);
  geometry.computeVertexNormals();

  if (uploadedBaseMesh) {
    uploadedBaseMesh.geometry.dispose();
    uploadedBaseMesh.material.dispose();
  }

  uploadedBaseMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x8b8b8b,
      metalness: 0.25,
      roughness: 0.75,
      transparent: true,
      opacity: 0.95,
    })
  );
  rebuild();
  commitHistory();
});

for (const input of [sizeInput, thicknessInput, liftInput, densityInput, autoFixInput, flipYInput, flipXInput]) {
  input.addEventListener("input", rebuild);
  input.addEventListener("change", () => {
    rebuild();
    commitHistory();
  });
}

for (const input of [generateBaseInput, baseDiameterInput, baseThicknessInput]) {
  input.addEventListener("input", rebuild);
  input.addEventListener("change", () => {
    rebuild();
    commitHistory();
  });
}

sizeValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(sizeValueInput.value || sizeInput.value), 10, 200);
  sizeInput.value = `${value}`;
  rebuild();
});
sizeValueInput.addEventListener("change", commitHistory);

thicknessValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(thicknessValueInput.value || thicknessInput.value), 0.5, 20);
  thicknessInput.value = `${value}`;
  rebuild();
});
thicknessValueInput.addEventListener("change", commitHistory);

liftValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(liftValueInput.value || liftInput.value), 0, 5);
  liftInput.value = `${value}`;
  rebuild();
});
liftValueInput.addEventListener("change", commitHistory);

baseDiameterValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseDiameterValueInput.value || baseDiameterInput.value), 10, 200);
  baseDiameterInput.value = `${value}`;
  rebuild();
});
baseDiameterValueInput.addEventListener("change", commitHistory);

baseThicknessValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseThicknessValueInput.value || baseThicknessInput.value), 0.5, 20);
  baseThicknessInput.value = `${value}`;
  rebuild();
});
baseThicknessValueInput.addEventListener("change", commitHistory);

themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  applyLocale();
  commitHistory();
});
themeSelect.addEventListener("change", commitHistory);

exportBtn.addEventListener("click", () => {
  if (!currentMesh) {
    return;
  }
  const exporter = new STLExporter();
  const stl = exporter.parse(currentMesh, { binary: false });
  const blob = new Blob([stl], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${svgName || "model"}.stl`;
  a.click();
  URL.revokeObjectURL(url);
});

exportCombinedBtn.addEventListener("click", () => {
  if (!currentMesh) {
    return;
  }
  const activeBase = getActiveBaseMesh();
  if (!activeBase) return;
  const baseBox = new THREE.Box3().setFromObject(activeBase);
  const model = currentMesh.clone();
  const modelBox = new THREE.Box3().setFromObject(model);
  model.position.y += baseBox.max.y + Number(liftInput.value) - modelBox.min.y;
  const exporter = new STLExporter();
  const combined = new THREE.Group();
  combined.add(activeBase);
  combined.add(model);
  const stl = exporter.parse(combined, { binary: false });
  const blob = new Blob([stl], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${svgName || "model"}_with_base.stl`;
  a.click();
  URL.revokeObjectURL(url);
});

exportZipBtn.addEventListener("click", async () => {
  if (!uploadedFiles.length) {
    return;
  }

  const opts = {
    targetSize: Number(sizeInput.value),
    thickness: Number(thicknessInput.value),
    density: Number(densityInput.value),
    autoFix: autoFixInput.checked,
    flipY: flipYInput.checked,
    flipX: flipXInput.checked,
  };

  const zip = new JSZip();
  const exporter = new STLExporter();
  let success = 0;

  setStatus(`${t("statusBatch")}: ${uploadedFiles.length}\nProcessing...`);

  for (const file of uploadedFiles) {
    try {
      const text = await file.text();
      const { mesh } = buildMesh(text, opts);
      const stl = exporter.parse(mesh, { binary: false });
      const name = file.name.replace(/\.svg$/i, "") || "model";
      zip.file(`${name}.stl`, stl);
      success += 1;
      mesh.geometry.dispose();
      mesh.material.dispose();
    } catch (err) {
      // Skip broken files and continue batch.
    }
  }

  if (success === 0) {
    setStatus(`${t("statusError")}: no files were converted`);
    return;
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seal-generator-batch.zip";
  a.click();
  URL.revokeObjectURL(url);

  setStatus(`${t("statusBatch")}: ${uploadedFiles.length}\nConverted: ${success}`);
});

flatViewBtn.addEventListener("click", () => {
  setFlatView(!isFlatView);
  commitHistory();
});

fitBaseToEmblemBtn.addEventListener("click", () => {
  if (!currentMesh) return;
  const box = new THREE.Box3().setFromObject(currentMesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const targetDiameter = clampNumber(Math.ceil(Math.max(size.x, size.z) * 1.1), 10, 200);
  baseDiameterInput.value = `${targetDiameter}`;
  baseThicknessInput.value = `${clampNumber(Number(thicknessInput.value), 0.5, 20)}`;
  generateBaseInput.checked = true;
  rebuild();
  commitHistory();
});

fitEmblemToBaseBtn.addEventListener("click", () => {
  let diameter = Number(baseDiameterInput.value);
  if (!generateBaseInput.checked && uploadedBaseMesh) {
    const box = new THREE.Box3().setFromObject(uploadedBaseMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    diameter = Math.max(size.x, size.z);
  }
  sizeInput.value = `${clampNumber(Math.floor(diameter * 0.9), 10, 200)}`;
  rebuild();
  commitHistory();
});

undoBtn.addEventListener("click", () => goHistory(-1));
redoBtn.addEventListener("click", () => goHistory(1));

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
    e.preventDefault();
    goHistory(-1);
  } else if ((e.ctrlKey && e.key.toLowerCase() === "y") || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z")) {
    e.preventDefault();
    goHistory(1);
  }
});

for (const btn of tabButtons) {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

refreshOutputs();
applyTheme("dark");
applyLocale();
loadFromCache();
commitHistory();
setActiveTab("model");
