import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { Evaluator, Brush, SUBTRACTION } from "three-bvh-csg";
import { CSG } from "https://esm.sh/three-csg-ts@3.2.0";

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
const sidebarSideSelect = document.getElementById("sidebarSideSelect");
const sizeInput = document.getElementById("size");
const sizeValueInput = document.getElementById("sizeValue");
const thicknessInput = document.getElementById("thickness");
const thicknessValueInput = document.getElementById("thicknessValue");
const scaleXInput = document.getElementById("scaleX");
const scaleXValueInput = document.getElementById("scaleXValue");
const scaleYInput = document.getElementById("scaleY");
const scaleYValueInput = document.getElementById("scaleYValue");
const scaleZInput = document.getElementById("scaleZ");
const scaleZValueInput = document.getElementById("scaleZValue");
const liftInput = document.getElementById("lift");
const liftValueInput = document.getElementById("liftValue");
const insetInput = document.getElementById("inset");
const insetValueInput = document.getElementById("insetValue");
const densityInput = document.getElementById("density");
const autoFixInput = document.getElementById("autoFix");
const flipYInput = document.getElementById("flipY");
const flipXInput = document.getElementById("flipX");
const inverseModeInput = document.getElementById("inverseMode");
const wireframeModeInput = document.getElementById("wireframeMode");
const gizmoEnabledInput = document.getElementById("gizmoEnabled");
const gizmoTargetInput = document.getElementById("gizmoTarget");
const gizmoModeBtn = document.getElementById("gizmoModeBtn");
const baseOffsetXInput = document.getElementById("baseOffsetX");
const baseOffsetXValueInput = document.getElementById("baseOffsetXValue");
const baseOffsetYInput = document.getElementById("baseOffsetY");
const baseOffsetYValueInput = document.getElementById("baseOffsetYValue");
const baseOffsetZInput = document.getElementById("baseOffsetZ");
const baseOffsetZValueInput = document.getElementById("baseOffsetZValue");
const emblemOffsetXInput = document.getElementById("emblemOffsetX");
const emblemOffsetXValueInput = document.getElementById("emblemOffsetXValue");
const emblemOffsetYInput = document.getElementById("emblemOffsetY");
const emblemOffsetYValueInput = document.getElementById("emblemOffsetYValue");
const emblemOffsetZInput = document.getElementById("emblemOffsetZ");
const emblemOffsetZValueInput = document.getElementById("emblemOffsetZValue");
const exportBtn = document.getElementById("exportBtn");
const exportCombinedBtn = document.getElementById("exportCombinedBtn");
const exportZipBtn = document.getElementById("exportZipBtn");
const flatViewBtn = document.getElementById("flatViewBtn");
const fitBaseToEmblemBtn = document.getElementById("fitBaseToEmblemBtn");
const fitEmblemToBaseBtn = document.getElementById("fitEmblemToBaseBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const clearCacheBtn = document.getElementById("clearCacheBtn");
const emblemOffsetGroup = document.getElementById("emblemOffsetGroup");
const baseOffsetGroup = document.getElementById("baseOffsetGroup");
const selectedObjectLabel = document.getElementById("selectedObjectLabel");
const statusEl = document.getElementById("status");
const modelWindowContent = document.getElementById("modelWindowContent");
const baseWindowContent = document.getElementById("baseWindowContent");
const batchWindowContent = document.getElementById("batchWindowContent");
const batchSvgFilesInput = document.getElementById("batchSvgFiles");
const batchInverseModeInput = document.getElementById("batchInverseMode");
const batchExportBtn = document.getElementById("batchExportBtn");
const batchFitRatioInput = document.getElementById("batchFitRatio");
const batchLiftInput = document.getElementById("batchLift");
const batchInsetInput = document.getElementById("batchInset");
const libraryCategoryInput = document.getElementById("libraryCategory");
const librarySingleInput = document.getElementById("librarySingle");
const libraryPreviewBtn = document.getElementById("libraryPreviewBtn");
const libraryLoadSingleBtn = document.getElementById("libraryLoadSingleBtn");
const batchLibraryListInput = document.getElementById("batchLibraryList");
const batchPreviewBtn = document.getElementById("batchPreviewBtn");
const batchAddLibraryBtn = document.getElementById("batchAddLibraryBtn");
const libraryPreviewModal = document.getElementById("libraryPreviewModal");
const libraryPreviewTitle = document.getElementById("libraryPreviewTitle");
const libraryPreviewMeta = document.getElementById("libraryPreviewMeta");
const libraryPreviewImg = document.getElementById("libraryPreviewImg");
const libraryPreviewCloseBtn = document.getElementById("libraryPreviewCloseBtn");

const densityOut = document.getElementById("densityOut");

let svgText = "";
let svgName = "model";
let currentMesh = null;
let currentBaseMesh = null;
let currentInversePreviewMesh = null;
let uploadedBaseMesh = null;
let currentLang = "en";
let uploadedFiles = [];
let batchFiles = [];
let libraryManifest = [];
let isFlatView = false;
let history = [];
let historyIndex = -1;
let isApplyingHistory = false;
const csgEvaluator = new Evaluator();
const gizmoModes = ["translate", "rotate", "scale"];
let gizmoModeIndex = 0;
let selectedObjectType = "emblem";
let modelWindow = null;
let baseWindow = null;
let batchWindow = null;
const DEBUG = true;

const i18n = {
  en: {
    title: "Seal Generator",
    subtitle: "SVG -> STL with live 3D preview",
    theme: "Theme",
    language: "Language",
    sidebarSide: "Sidebar",
    libraryCategory: "Library category",
    librarySingle: "Library SVG (single)",
    previewSelected: "Preview selected",
    loadFromLibrary: "Load from library",
    batchLibrary: "Library SVG (multiple)",
    batchAddLibrary: "Add selected from library",
    svgFile: "SVG file",
    baseStl: "Base STL (optional)",
    generateBase: "Generate round base",
    baseDiameter: "Base diameter (mm)",
    baseThickness: "Base thickness (mm)",
    size: "Size (max dimension, mm)",
    thickness: "Thickness (mm)",
    scaleX: "Scale X",
    scaleY: "Scale Y",
    scaleZ: "Scale Z",
    lift: "Lift over base (mm)",
    inset: "Inset depth (inverse, mm)",
    inverseMode: "Inverse (negative stamp)",
    wireframeMode: "Wireframe preview",
    gizmoEnabled: "Enable gizmo",
    gizmoTarget: "Gizmo target",
    gizmoMode: "Gizmo",
    gizmoTranslate: "Translate",
    gizmoRotate: "Rotate",
    gizmoScale: "Scale",
    baseOffsetX: "Base offset X (mm)",
    baseOffsetY: "Base offset Y (mm)",
    baseOffsetZ: "Base offset Z (mm)",
    emblemOffsetX: "Emblem offset X (mm)",
    emblemOffsetY: "Emblem offset Y (mm)",
    emblemOffsetZ: "Emblem offset Z (mm)",
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
    resetSettings: "Reset Settings",
    clearCache: "Clear Cache",
    modelSection: "Model",
    baseSection: "Base",
    batchSection: "Batch",
    viewSection: "View & Export",
    batchSvg: "Batch SVG files",
    batchInverse: "Inverse mode for batch",
    batchExport: "Export Batch ZIP (fit to base)",
    batchFitRatio: "Batch fit ratio",
    batchLift: "Batch lift over base (mm)",
    batchInset: "Batch inset depth (inverse, mm)",
    box1: "1. Gizmo & View",
    box2: "2. Selected Object",
    selectedPrefix: "Selected",
    objectEmblem: "Emblem",
    objectBase: "Base",
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
    sidebarSide: "Сайдбар",
    libraryCategory: "Категория библиотеки",
    librarySingle: "SVG из библиотеки (один)",
    previewSelected: "Предпросмотр выбранного",
    loadFromLibrary: "Загрузить из библиотеки",
    batchLibrary: "SVG из библиотеки (несколько)",
    batchAddLibrary: "Добавить выбранные из библиотеки",
    svgFile: "SVG файл",
    baseStl: "Основание STL (опционально)",
    generateBase: "Сгенерировать круглое основание",
    baseDiameter: "Диаметр основания (мм)",
    baseThickness: "Толщина основания (мм)",
    size: "Размер (макс. габарит, мм)",
    thickness: "Толщина (мм)",
    scaleX: "Масштаб X",
    scaleY: "Масштаб Y",
    scaleZ: "Масштаб Z",
    lift: "Подъем над основанием (мм)",
    inset: "Глубина утапливания (inverse, мм)",
    inverseMode: "Inverse (негатив для оттиска)",
    wireframeMode: "Wireframe-предпросмотр",
    gizmoEnabled: "Включить гизмо",
    gizmoTarget: "Цель гизмо",
    gizmoMode: "Гизмо",
    gizmoTranslate: "Перемещение",
    gizmoRotate: "Поворот",
    gizmoScale: "Масштаб",
    baseOffsetX: "Смещение основания X (мм)",
    baseOffsetY: "Смещение основания Y (мм)",
    baseOffsetZ: "Смещение основания Z (мм)",
    emblemOffsetX: "Смещение эмблемы X (мм)",
    emblemOffsetY: "Смещение эмблемы Y (мм)",
    emblemOffsetZ: "Смещение эмблемы Z (мм)",
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
    resetSettings: "Сбросить настройки",
    clearCache: "Очистить кэш",
    modelSection: "Модель",
    baseSection: "Основание",
    batchSection: "Пакетный режим",
    viewSection: "Вид и экспорт",
    batchSvg: "SVG файлы для batch",
    batchInverse: "Inverse режим для batch",
    batchExport: "Экспорт Batch ZIP (под размер базы)",
    batchFitRatio: "Коэффициент подгонки batch",
    batchLift: "Подъем batch над базой (мм)",
    batchInset: "Глубина batch inset (inverse, мм)",
    box1: "1. Гизмо и отображение",
    box2: "2. Выбранный объект",
    selectedPrefix: "Выбрано",
    objectEmblem: "Эмблема",
    objectBase: "Основание",
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
camera.up.set(0, 0, 1);
camera.position.set(120, -120, 80);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
// Blender-like navigation: MMB orbit, Shift+MMB pan, wheel zoom.
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.ROTATE,
  RIGHT: THREE.MOUSE.PAN,
};
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") {
    controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
  }
});

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setMode("translate");
transformControls.showY = true;
transformControls.size = 0.75;
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});
transformControls.addEventListener("objectChange", () => {
  const obj = transformControls.object;
  if (!obj) return;
  if (obj === currentBaseMesh || obj === currentInversePreviewMesh) {
    baseOffsetXInput.value = `${obj.position.x.toFixed(1)}`;
    baseOffsetYInput.value = `${obj.position.y.toFixed(1)}`;
    baseOffsetZInput.value = `${obj.position.z.toFixed(1)}`;
  } else if (obj === currentMesh) {
    emblemOffsetXInput.value = `${obj.position.x.toFixed(1)}`;
    emblemOffsetYInput.value = `${obj.position.y.toFixed(1)}`;
    emblemOffsetZInput.value = `${obj.position.z.toFixed(1)}`;
  }
  refreshOutputs();
});
transformControls.addEventListener("mouseUp", () => {
  // Don't rebuild here: rebuild recreates meshes and resets gizmo scale/rotation.
  commitHistory();
});
scene.add(transformControls);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(100, 160, 120);
scene.add(keyLight);

let grid = new THREE.GridHelper(400, 40, 0x3d444d, 0x2d333b);
grid.rotateX(Math.PI / 2);
scene.add(grid);

function setStatus(text) {
  statusEl.textContent = text;
}

function createFloatingWindows() {
  if (typeof WinBox === "undefined" || !modelWindowContent || !baseWindowContent || !batchWindowContent) return;
  modelWindow = new WinBox({
    title: t("modelSection"),
    class: "sg-window",
    x: 276,
    y: 44,
    width: 236,
    height: 610,
    mount: modelWindowContent,
  });
  baseWindow = new WinBox({
    title: t("baseSection"),
    class: "sg-window",
    x: 520,
    y: 44,
    width: 236,
    height: 575,
    mount: baseWindowContent,
  });
  batchWindow = new WinBox({
    title: t("batchSection"),
    class: "sg-window",
    x: 764,
    y: 44,
    width: 236,
    height: 260,
    mount: batchWindowContent,
  });
}

function updateWindowTitles() {
  if (modelWindow) modelWindow.setTitle(t("modelSection"));
  if (baseWindow) baseWindow.setTitle(t("baseSection"));
  if (batchWindow) batchWindow.setTitle(t("batchSection"));
}

function dlog(step, details = {}) {
  if (!DEBUG) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[seal-generator][${ts}] ${step}`, details);
}

function boxInfo(meshOrGeom) {
  const box = meshOrGeom.isBufferGeometry
    ? (meshOrGeom.computeBoundingBox(), meshOrGeom.boundingBox)
    : new THREE.Box3().setFromObject(meshOrGeom);
  if (!box) return null;
  return {
    min: [box.min.x, box.min.y, box.min.z].map((v) => Number(v.toFixed(4))),
    max: [box.max.x, box.max.y, box.max.z].map((v) => Number(v.toFixed(4))),
  };
}

function ensureIndexedGeometry(geometry) {
  let g = geometry.clone();
  if (!g.index) {
    const count = g.attributes?.position?.count || 0;
    const index = new Uint32Array(count);
    for (let i = 0; i < count; i += 1) index[i] = i;
    g.setIndex(new THREE.BufferAttribute(index, 1));
  }
  g.computeVertexNormals();
  return g;
}

function geometrySignature(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const p = geometry.attributes?.position;
  let sum = 0;
  let sq = 0;
  if (p?.array) {
    const arr = p.array;
    const step = Math.max(1, Math.floor(arr.length / 2048));
    for (let i = 0; i < arr.length; i += step) {
      const v = Number(arr[i]) || 0;
      sum += v;
      sq += v * v;
    }
  }
  return {
    verts: p?.count || 0,
    min: box ? [box.min.x, box.min.y, box.min.z].map((v) => Number(v.toFixed(5))) : [0, 0, 0],
    max: box ? [box.max.x, box.max.y, box.max.z].map((v) => Number(v.toFixed(5))) : [0, 0, 0],
    sum: Number(sum.toFixed(5)),
    sq: Number(sq.toFixed(5)),
  };
}

function sameSignature(a, b) {
  return (
    a.verts === b.verts &&
    a.min[0] === b.min[0] &&
    a.min[1] === b.min[1] &&
    a.min[2] === b.min[2] &&
    a.max[0] === b.max[0] &&
    a.max[1] === b.max[1] &&
    a.max[2] === b.max[2] &&
    a.sum === b.sum &&
    a.sq === b.sq
  );
}

function updateSelectedObjectUI() {
  const isBase = selectedObjectType === "base";
  baseOffsetGroup.style.display = isBase ? "block" : "none";
  emblemOffsetGroup.style.display = isBase ? "none" : "block";
  selectedObjectLabel.textContent = `${t("selectedPrefix")}: ${isBase ? t("objectBase") : t("objectEmblem")}`;
}

function t(key) {
  return i18n[currentLang][key];
}

function makeVirtualBatchFile(name, svgTextContent) {
  return {
    name,
    text: async () => svgTextContent,
  };
}

function updateBatchButtonState() {
  batchExportBtn.disabled = batchFiles.length === 0;
}

function updateLibraryItemLists() {
  const category = libraryCategoryInput.value;
  const filtered = libraryManifest.filter((item) => item.category === category);
  librarySingleInput.innerHTML = "";
  batchLibraryListInput.innerHTML = "";
  for (const item of filtered) {
    const optSingle = document.createElement("option");
    optSingle.value = item.path;
    optSingle.textContent = item.name;
    librarySingleInput.appendChild(optSingle);
    const optBatch = document.createElement("option");
    optBatch.value = item.path;
    optBatch.textContent = item.name;
    batchLibraryListInput.appendChild(optBatch);
  }
}

function closeLibraryPreview() {
  libraryPreviewModal.classList.add("hidden");
}

async function openLibraryPreview(path) {
  if (!path) return;
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("preview fetch failed");
    const svgRaw = await response.text();
    const item = libraryManifest.find((x) => x.path === path);
    libraryPreviewTitle.textContent = item?.name || t("previewSelected");
    libraryPreviewMeta.textContent = `${item?.category || ""}`;
    libraryPreviewImg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgRaw)}`;
    libraryPreviewModal.classList.remove("hidden");
  } catch (_err) {
    setStatus(`${t("statusError")}: library preview load failed`);
  }
}

async function loadLibraryManifest() {
  try {
    const response = await fetch("./wh40k/library-manifest.json");
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data)) return;
    libraryManifest = data;
    const categories = [...new Set(libraryManifest.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
    libraryCategoryInput.innerHTML = "";
    for (const category of categories) {
      const opt = document.createElement("option");
      opt.value = category;
      opt.textContent = category;
      libraryCategoryInput.appendChild(opt);
    }
    updateLibraryItemLists();
  } catch (_err) {}
}

function applyLocale() {
  document.documentElement.lang = currentLang;
  document.getElementById("title").textContent = t("title");
  document.getElementById("subtitle").textContent = t("subtitle");
  document.getElementById("themeLabel").textContent = t("theme");
  document.getElementById("langLabel").textContent = t("language");
  document.getElementById("sidebarSideLabel").textContent = t("sidebarSide");
  document.getElementById("libraryCategoryLabel").textContent = t("libraryCategory");
  document.getElementById("librarySingleLabel").textContent = t("librarySingle");
  document.getElementById("libraryPreviewBtn").textContent = t("previewSelected");
  document.getElementById("batchPreviewBtn").textContent = t("previewSelected");
  document.getElementById("libraryLoadSingleBtn").textContent = t("loadFromLibrary");
  document.getElementById("batchLibraryLabel").textContent = t("batchLibrary");
  document.getElementById("batchAddLibraryBtn").textContent = t("batchAddLibrary");
  document.getElementById("batchFitRatioLabel").textContent = t("batchFitRatio");
  document.getElementById("batchLiftLabel").textContent = t("batchLift");
  document.getElementById("batchInsetLabel").textContent = t("batchInset");
  document.getElementById("modelSectionLabel").textContent = t("modelSection");
  document.getElementById("baseSectionLabel").textContent = t("baseSection");
  document.getElementById("batchSectionLabel").textContent = t("batchSection");
  document.getElementById("viewSectionLabel").textContent = t("viewSection");
  document.getElementById("box1Label").textContent = t("box1");
  document.getElementById("box2Label").textContent = t("box2");
  document.getElementById("svgFileLabel").textContent = t("svgFile");
  document.getElementById("batchSvgLabel").textContent = t("batchSvg");
  document.getElementById("baseStlLabel").textContent = t("baseStl");
  document.getElementById("generateBaseLabel").textContent = t("generateBase");
  document.getElementById("baseDiameterLabel").textContent = t("baseDiameter");
  document.getElementById("baseThicknessLabel").textContent = t("baseThickness");
  document.getElementById("sizeLabel").textContent = t("size");
  document.getElementById("thicknessLabel").textContent = t("thickness");
  document.getElementById("scaleXLabel").textContent = t("scaleX");
  document.getElementById("scaleYLabel").textContent = t("scaleY");
  document.getElementById("scaleZLabel").textContent = t("scaleZ");
  document.getElementById("liftLabel").textContent = t("lift");
  document.getElementById("insetLabel").textContent = t("inset");
  document.getElementById("baseOffsetXLabel").textContent = t("baseOffsetX");
  document.getElementById("baseOffsetYLabel").textContent = t("baseOffsetY");
  document.getElementById("baseOffsetZLabel").textContent = t("baseOffsetZ");
  document.getElementById("emblemOffsetXLabel").textContent = t("emblemOffsetX");
  document.getElementById("emblemOffsetYLabel").textContent = t("emblemOffsetY");
  document.getElementById("emblemOffsetZLabel").textContent = t("emblemOffsetZ");
  document.getElementById("densityLabel").textContent = t("density");
  document.getElementById("autoFixLabel").textContent = t("autoFix");
  document.getElementById("flipYLabel").textContent = t("flipY");
  document.getElementById("flipXLabel").textContent = t("flipX");
  document.getElementById("inverseModeLabel").textContent = t("inverseMode");
  document.getElementById("batchInverseLabel").textContent = t("batchInverse");
  document.getElementById("wireframeModeLabel").textContent = t("wireframeMode");
  document.getElementById("gizmoEnabledLabel").textContent = t("gizmoEnabled");
  document.getElementById("gizmoTargetLabel").textContent = t("gizmoTarget");
  updateGizmoModeButtonLabel();
  document.getElementById("exportBtn").textContent = t("export");
  document.getElementById("exportCombinedBtn").textContent = t("exportCombined");
  document.getElementById("exportZipBtn").textContent = t("exportZip");
  document.getElementById("batchExportBtn").textContent = t("batchExport");
  document.getElementById("fitBaseToEmblemBtn").textContent = t("fitBaseToEmblem");
  document.getElementById("fitEmblemToBaseBtn").textContent = t("fitEmblemToBase");
  document.getElementById("undoBtn").textContent = t("undo");
  document.getElementById("redoBtn").textContent = t("redo");
  document.getElementById("resetSettingsBtn").textContent = t("resetSettings");
  document.getElementById("clearCacheBtn").textContent = t("clearCache");
  document.getElementById("flatViewBtn").textContent = isFlatView ? t("perspectiveView") : t("flatView");
  document.getElementById("licenseNote").textContent = t("license");
  updateWindowTitles();
  updateSelectedObjectUI();
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
  grid.rotateX(Math.PI / 2);
  scene.add(grid);
}

function setFlatView(enabled) {
  isFlatView = enabled;
  controls.enableRotate = !enabled;
  if (enabled) {
    camera.position.set(0, 0, 220);
    camera.up.set(0, 1, 0);
    controls.target.set(0, 0, 0);
  } else {
    camera.position.set(120, -120, 80);
    camera.up.set(0, 0, 1);
    controls.target.set(0, 0, 0);
  }
  controls.update();
  flatViewBtn.textContent = enabled ? t("perspectiveView") : t("flatView");
}

function updateGizmoModeButtonLabel() {
  const mode = gizmoModes[gizmoModeIndex];
  const modeLabel =
    mode === "translate" ? t("gizmoTranslate") : mode === "rotate" ? t("gizmoRotate") : t("gizmoScale");
  gizmoModeBtn.textContent = `${t("gizmoMode")}: ${modeLabel}`;
}

function setGizmoMode(mode) {
  const idx = gizmoModes.indexOf(mode);
  if (idx !== -1) gizmoModeIndex = idx;
  transformControls.setMode(gizmoModes[gizmoModeIndex]);
  transformControls.showY = true;
  updateGizmoModeButtonLabel();
}

function focusView(axis, sign = 1) {
  const dist = camera.position.distanceTo(controls.target) || 220;
  const p = controls.target.clone();
  if (axis === "x") camera.position.set(p.x + sign * dist, p.y, p.z);
  if (axis === "y") camera.position.set(p.x, p.y + sign * dist, p.z);
  if (axis === "z") camera.position.set(p.x, p.y, p.z + sign * dist);
  camera.lookAt(p);
  controls.update();
}

function setAxisConstraint(axis) {
  transformControls.showX = axis === "x";
  transformControls.showY = axis === "y";
  transformControls.showZ = axis === "z";
}

function resetAxisConstraint() {
  transformControls.showX = true;
  transformControls.showY = true;
  transformControls.showZ = true;
}

function makeGeneratedBaseMesh() {
  const diameter = Number(baseDiameterInput.value);
  const thickness = Number(baseThicknessInput.value);
  const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, thickness, 96);
  // Z is up in this scene, keep top at Z=0.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, -thickness / 2);
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

function setWireframe(mesh) {
  if (!mesh?.material) return;
  mesh.material.wireframe = wireframeModeInput.checked;
}

function updateGizmoTarget() {
  if (!gizmoEnabledInput.checked) {
    transformControls.detach();
    transformControls.visible = false;
    return;
  }
  selectedObjectType = gizmoTargetInput.value === "base" ? "base" : "emblem";
  updateSelectedObjectUI();
  const isBaseTarget = gizmoTargetInput.value === "base";
  const baseTarget = currentInversePreviewMesh || currentBaseMesh;
  const target = isBaseTarget ? baseTarget : currentMesh;
  // In inverse mode, hide cutter mesh while editing base to avoid ghost-like overlay.
  if (inverseModeInput.checked && currentMesh) {
    currentMesh.visible = !isBaseTarget;
  } else if (currentMesh) {
    currentMesh.visible = true;
  }
  if (target) {
    transformControls.visible = true;
    transformControls.attach(target);
  } else {
    transformControls.detach();
    transformControls.visible = false;
  }
}

function placeEmblem(baseMesh, emblemMesh, inverseOverride = null, liftOverride = null, insetOverride = null) {
  const lift = liftOverride === null ? Number(liftInput.value) : Number(liftOverride);
  const inset = insetOverride === null ? Number(insetInput.value) : Number(insetOverride);
  const inverse = inverseOverride === null ? inverseModeInput.checked : !!inverseOverride;
  emblemMesh.position.set(0, 0, 0);
  const baseBox = baseMesh ? new THREE.Box3().setFromObject(baseMesh) : null;
  let emblemBox = new THREE.Box3().setFromObject(emblemMesh);
  if (baseBox) {
    if (inverse) {
      const currentDepth = Math.max(emblemBox.max.z - emblemBox.min.z, 1e-6);
      const targetDepth = Math.max(inset, 0.05);
      emblemMesh.scale.z *= targetDepth / currentDepth;
      emblemBox = new THREE.Box3().setFromObject(emblemMesh);
      // In inverse mode, keep cutter placement aligned with user-visible position.
      const desiredTop = baseBox.max.z + lift;
      emblemMesh.position.z += desiredTop - emblemBox.max.z;
    } else {
      emblemMesh.position.z = baseBox.max.z + lift - emblemBox.min.z;
    }
  }
  emblemMesh.position.x += Number(emblemOffsetXInput.value);
  emblemMesh.position.y += Number(emblemOffsetYInput.value);
  emblemMesh.position.z += Number(emblemOffsetZInput.value);
}

function buildCombinedMeshForExport(baseMesh, emblemMesh, inverseOverride = null) {
  const inverseMode = inverseOverride === null ? inverseModeInput.checked : !!inverseOverride;
  dlog("inverse.export.start", {
    inverse: inverseMode,
    baseBox: boxInfo(baseMesh),
    emblemBox: boxInfo(emblemMesh),
  });
  if (!inverseMode) {
    const group = new THREE.Group();
    group.add(baseMesh);
    group.add(emblemMesh);
    return group;
  }
  // True inverse: subtract emblem volume from base.
  baseMesh.updateMatrixWorld(true);
  emblemMesh.updateMatrixWorld(true);
  let baseWorld = baseMesh.geometry.clone().applyMatrix4(baseMesh.matrixWorld);
  let cutWorldBase = emblemMesh.geometry.clone().applyMatrix4(emblemMesh.matrixWorld);
  if (baseWorld.index) baseWorld = baseWorld.toNonIndexed();
  if (cutWorldBase.index) cutWorldBase = cutWorldBase.toNonIndexed();
  baseWorld = ensureIndexedGeometry(mergeVertices(baseWorld, 1e-5));
  cutWorldBase = ensureIndexedGeometry(mergeVertices(cutWorldBase, 1e-5));
  const baseSig = geometrySignature(baseWorld);
  dlog("inverse.export.normalized", {
    baseVerts: baseWorld.attributes?.position?.count || 0,
    cutVerts: cutWorldBase.attributes?.position?.count || 0,
    baseBox: boxInfo(baseWorld),
    cutBox: boxInfo(cutWorldBase),
  });

  const attempt = (extraDepth) => {
    dlog("inverse.export.attempt.begin", { extraDepth });
    const cutWorld = cutWorldBase.clone();
    if (extraDepth > 0) {
      cutWorld.translate(0, 0, -extraDepth);
    }
    const baseBrush = new Brush(baseWorld.clone());
    baseBrush.updateMatrixWorld(true);
    const cutBrush = new Brush(cutWorld);
    cutBrush.updateMatrixWorld(true);
    const subtracted = csgEvaluator.evaluate(baseBrush, cutBrush, SUBTRACTION);
    const vertCount = subtracted?.geometry?.attributes?.position?.count || 0;
    const resultSig = vertCount ? geometrySignature(subtracted.geometry) : null;
    dlog("inverse.export.attempt.result", {
      extraDepth,
      vertCount,
      unchanged: resultSig ? sameSignature(baseSig, resultSig) : null,
      resultBox: vertCount ? boxInfo(subtracted) : null,
    });
    if (vertCount === 0) return null;
    if (resultSig && sameSignature(baseSig, resultSig)) return null;
    subtracted.material = baseMesh.material.clone();
    return subtracted;
  };

  try {
    // Keep fallback nudges shallow so exported cut matches user placement.
    const result = attempt(0) || attempt(0.02) || attempt(0.06);
    if (result) {
      dlog("inverse.export.end", { success: true, method: "bvh-csg" });
      return result;
    }
  } catch (_err) {
    dlog("inverse.export.exception", { message: String(_err), method: "bvh-csg" });
  }

  // Fallback: BSP-based subtraction (slower, but often robust on messy SVG meshes).
  try {
    const baseClone = baseMesh.clone();
    const cutClone = emblemMesh.clone();
    const bspResult = CSG.subtract(baseClone, cutClone);
    const vertCount = bspResult?.geometry?.attributes?.position?.count || 0;
    const resultSig = vertCount ? geometrySignature(bspResult.geometry) : null;
    dlog("inverse.export.fallback.bsp", {
      vertCount,
      unchanged: resultSig ? sameSignature(baseSig, resultSig) : null,
    });
    if (vertCount > 0 && !(resultSig && sameSignature(baseSig, resultSig))) {
      bspResult.material = baseMesh.material.clone();
      dlog("inverse.export.end", { success: true, method: "three-csg-ts" });
      return bspResult;
    }
  } catch (_err) {
    dlog("inverse.export.exception", { message: String(_err), method: "three-csg-ts" });
  }

  dlog("inverse.export.end", { success: false, method: "none" });
  return null;
}

function cloneMeshInWorldSpace(mesh) {
  if (!mesh?.geometry || !mesh?.material) return null;
  mesh.updateMatrixWorld(true);
  const worldGeom = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  worldGeom.computeVertexNormals();
  const cloned = new THREE.Mesh(worldGeom, mesh.material.clone());
  cloned.position.set(0, 0, 0);
  cloned.rotation.set(0, 0, 0);
  cloned.scale.set(1, 1, 1);
  cloned.updateMatrixWorld(true);
  return cloned;
}

function getBaseFitTargetSize() {
  const baseProbe = getActiveBaseMesh() || makeGeneratedBaseMesh();
  const box = new THREE.Box3().setFromObject(baseProbe);
  const size = new THREE.Vector3();
  box.getSize(size);
  baseProbe.geometry?.dispose?.();
  baseProbe.material?.dispose?.();
  const diameter = Math.max(size.x, size.y, 10);
  return clampNumber(Math.floor(diameter * 0.9), 10, 200);
}

function composePreview() {
  if (currentMesh) scene.remove(currentMesh);
  if (currentInversePreviewMesh) {
    scene.remove(currentInversePreviewMesh);
    currentInversePreviewMesh.geometry?.dispose?.();
    currentInversePreviewMesh.material?.dispose?.();
    currentInversePreviewMesh = null;
  }
  if (currentBaseMesh) {
    scene.remove(currentBaseMesh);
    currentBaseMesh.geometry.dispose();
    currentBaseMesh.material.dispose();
    currentBaseMesh = null;
  }
  const base = getActiveBaseMesh();
  if (!currentMesh) {
    if (base) {
      currentBaseMesh = base;
      currentBaseMesh.position.set(
        Number(baseOffsetXInput.value),
        Number(baseOffsetYInput.value),
        Number(baseOffsetZInput.value)
      );
      currentBaseMesh.material.transparent = false;
      currentBaseMesh.material.opacity = 0.95;
      setWireframe(currentBaseMesh);
      scene.add(currentBaseMesh);
    }
    exportCombinedBtn.disabled = true;
    updateGizmoTarget();
    return;
  }

  if (base) {
    currentBaseMesh = base;
    currentBaseMesh.position.set(
      Number(baseOffsetXInput.value),
      Number(baseOffsetYInput.value),
      Number(baseOffsetZInput.value)
    );
    placeEmblem(currentBaseMesh, currentMesh);
    setWireframe(currentBaseMesh);
    if (inverseModeInput.checked) {
      const previewCombined = buildCombinedMeshForExport(currentBaseMesh.clone(), currentMesh.clone());
      if (previewCombined) {
        setWireframe(previewCombined);
        scene.add(previewCombined);
        currentInversePreviewMesh = previewCombined;
      }
      currentMesh.material.transparent = false;
      currentMesh.material.opacity = 1.0;
      currentMesh.material.color.setHex(0xff7a59);
      currentMesh.material.emissive = new THREE.Color(0x5a1f00);
      currentMesh.material.emissiveIntensity = 0.55;
      currentMesh.visible = false;
      scene.add(currentMesh);
      // Don't render the source base mesh in inverse mode to avoid "ghost" interaction.
      currentBaseMesh.visible = false;
    } else {
      currentMesh.material.transparent = false;
      currentMesh.material.opacity = 1.0;
      currentMesh.material.color.setHex(0x58a6ff);
      currentMesh.material.emissive = new THREE.Color(0x000000);
      currentMesh.material.emissiveIntensity = 0.0;
      scene.add(currentBaseMesh);
    }
    exportCombinedBtn.disabled = false;
  } else {
    currentMesh.material.transparent = false;
    currentMesh.material.opacity = 1.0;
    currentMesh.material.color.setHex(0x58a6ff);
    currentMesh.material.emissive = new THREE.Color(0x000000);
    currentMesh.material.emissiveIntensity = 0.0;
    currentMesh.position.set(0, 0, 0);
    currentMesh.position.x += Number(emblemOffsetXInput.value);
    currentMesh.position.y += Number(emblemOffsetYInput.value);
    currentMesh.position.z += Number(emblemOffsetZInput.value);
    exportCombinedBtn.disabled = true;
  }
  setWireframe(currentMesh);
  scene.add(currentMesh);
  updateGizmoTarget();
}

function captureState() {
  return {
    lang: currentLang,
    theme: document.body.dataset.theme || "dark",
    sidebarSide: sidebarSideSelect.value,
    size: sizeInput.value,
    thickness: thicknessInput.value,
    scaleX: scaleXInput.value,
    scaleY: scaleYInput.value,
    scaleZ: scaleZInput.value,
    lift: liftInput.value,
    inset: insetInput.value,
    density: densityInput.value,
    autoFix: autoFixInput.checked,
    flipX: flipXInput.checked,
    flipY: flipYInput.checked,
    inverseMode: inverseModeInput.checked,
    wireframeMode: wireframeModeInput.checked,
    gizmoEnabled: gizmoEnabledInput.checked,
    gizmoTarget: gizmoTargetInput.value,
    gizmoMode: gizmoModes[gizmoModeIndex],
    baseOffsetX: baseOffsetXInput.value,
    baseOffsetY: baseOffsetYInput.value,
    baseOffsetZ: baseOffsetZInput.value,
    emblemOffsetX: emblemOffsetXInput.value,
    emblemOffsetY: emblemOffsetYInput.value,
    emblemOffsetZ: emblemOffsetZInput.value,
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
  sidebarSideSelect.value = state.sidebarSide ?? "left";
  sizeInput.value = state.size ?? sizeInput.value;
  thicknessInput.value = state.thickness ?? thicknessInput.value;
  scaleXInput.value = state.scaleX ?? scaleXInput.value;
  scaleYInput.value = state.scaleY ?? scaleYInput.value;
  scaleZInput.value = state.scaleZ ?? scaleZInput.value;
  liftInput.value = state.lift ?? liftInput.value;
  insetInput.value = state.inset ?? insetInput.value;
  densityInput.value = state.density ?? densityInput.value;
  autoFixInput.checked = !!state.autoFix;
  flipXInput.checked = !!state.flipX;
  flipYInput.checked = !!state.flipY;
  inverseModeInput.checked = !!state.inverseMode;
  wireframeModeInput.checked = !!state.wireframeMode;
  gizmoEnabledInput.checked = !!state.gizmoEnabled;
  gizmoTargetInput.value = state.gizmoTarget ?? "emblem";
  setGizmoMode(state.gizmoMode ?? "translate");
  baseOffsetXInput.value = state.baseOffsetX ?? baseOffsetXInput.value;
  baseOffsetYInput.value = state.baseOffsetY ?? baseOffsetYInput.value;
  baseOffsetZInput.value = state.baseOffsetZ ?? baseOffsetZInput.value;
  emblemOffsetXInput.value = state.emblemOffsetX ?? emblemOffsetXInput.value;
  emblemOffsetYInput.value = state.emblemOffsetY ?? emblemOffsetYInput.value;
  emblemOffsetZInput.value = state.emblemOffsetZ ?? emblemOffsetZInput.value;
  generateBaseInput.checked = !!state.generateBase;
  baseDiameterInput.value = state.baseDiameter ?? baseDiameterInput.value;
  baseThicknessInput.value = state.baseThickness ?? baseThicknessInput.value;
  svgText = state.svgText ?? svgText;
  svgName = state.svgName ?? svgName;
  applyTheme(themeSelect.value);
  document.body.dataset.sidebar = sidebarSideSelect.value;
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

function resetSettingsToDefaults() {
  sizeInput.value = "60";
  thicknessInput.value = "2";
  scaleXInput.value = "1";
  scaleYInput.value = "1";
  scaleZInput.value = "1";
  liftInput.value = "0.2";
  insetInput.value = "1.0";
  densityInput.value = "16";
  autoFixInput.checked = true;
  flipXInput.checked = true;
  flipYInput.checked = true;
  inverseModeInput.checked = false;
  wireframeModeInput.checked = false;
  gizmoEnabledInput.checked = true;
  gizmoTargetInput.value = "emblem";
  setGizmoMode("translate");
  generateBaseInput.checked = false;
  baseDiameterInput.value = "40";
  baseThicknessInput.value = "2.0";
  baseOffsetXInput.value = "0";
  baseOffsetYInput.value = "0";
  baseOffsetZInput.value = "0";
  emblemOffsetXInput.value = "0";
  emblemOffsetYInput.value = "0";
  emblemOffsetZInput.value = "0";
  rebuild();
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

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const candidates = [currentMesh, currentBaseMesh, currentInversePreviewMesh].filter(Boolean);
  const hit = raycaster.intersectObjects(candidates, false)[0];
  if (!hit?.object) return;
  const pickedBase = hit.object === currentBaseMesh || hit.object === currentInversePreviewMesh;
  gizmoTargetInput.value = pickedBase ? "base" : "emblem";
  updateGizmoTarget();
});

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
  // Keep emblem on Z=0 plane in Z-up world.
  merged.translate(-center.x, -center.y, -box2.min.z);
  merged.scale(opts.scaleX || 1, opts.scaleY || 1, opts.scaleZ || 1);
  merged.computeBoundingBox();
  const b3 = merged.boundingBox;
  merged.translate(0, 0, -b3.min.z);

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
  scaleXValueInput.value = `${Number(scaleXInput.value).toFixed(2)}`;
  scaleYValueInput.value = `${Number(scaleYInput.value).toFixed(2)}`;
  scaleZValueInput.value = `${Number(scaleZInput.value).toFixed(2)}`;
  liftValueInput.value = `${Number(liftInput.value).toFixed(1)}`;
  insetValueInput.value = `${Number(insetInput.value).toFixed(1)}`;
  baseDiameterValueInput.value = `${Number(baseDiameterInput.value).toFixed(0)}`;
  baseThicknessValueInput.value = `${Number(baseThicknessInput.value).toFixed(1)}`;
  baseOffsetXValueInput.value = `${Number(baseOffsetXInput.value).toFixed(1)}`;
  baseOffsetYValueInput.value = `${Number(baseOffsetYInput.value).toFixed(1)}`;
  baseOffsetZValueInput.value = `${Number(baseOffsetZInput.value).toFixed(1)}`;
  emblemOffsetXValueInput.value = `${Number(emblemOffsetXInput.value).toFixed(1)}`;
  emblemOffsetYValueInput.value = `${Number(emblemOffsetYInput.value).toFixed(1)}`;
  emblemOffsetZValueInput.value = `${Number(emblemOffsetZInput.value).toFixed(1)}`;
  densityOut.textContent = `${Number(densityInput.value).toFixed(0)}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rebuild() {
  refreshOutputs();
  if (!svgText) {
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
      currentMesh = null;
    }
    composePreview();
    exportBtn.disabled = true;
    exportZipBtn.disabled = uploadedFiles.length === 0;
    setStatus(
      `${t("statusBase")}: ${generateBaseInput.checked || uploadedBaseMesh ? t("on") : t("off")}\n${t("statusIdle")}`
    );
    return;
  }

  const opts = {
    targetSize: Number(sizeInput.value),
    thickness: Number(thicknessInput.value),
    scaleX: Number(scaleXInput.value),
    scaleY: Number(scaleYInput.value),
    scaleZ: Number(scaleZInput.value),
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
  // Keep uploaded base top face at Z=0.
  geometry.translate(-center.x, -center.y, -box.max.z);
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

for (const input of [sizeInput, thicknessInput, scaleXInput, scaleYInput, scaleZInput, liftInput, insetInput, densityInput, autoFixInput, flipYInput, flipXInput, inverseModeInput, baseOffsetXInput, baseOffsetYInput, baseOffsetZInput, emblemOffsetXInput, emblemOffsetYInput, emblemOffsetZInput, wireframeModeInput, gizmoEnabledInput]) {
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

scaleXValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(scaleXValueInput.value || scaleXInput.value), 0.1, 3);
  scaleXInput.value = `${value}`;
  rebuild();
});
scaleXValueInput.addEventListener("change", commitHistory);

scaleYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(scaleYValueInput.value || scaleYInput.value), 0.1, 3);
  scaleYInput.value = `${value}`;
  rebuild();
});
scaleYValueInput.addEventListener("change", commitHistory);

scaleZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(scaleZValueInput.value || scaleZInput.value), 0.1, 3);
  scaleZInput.value = `${value}`;
  rebuild();
});
scaleZValueInput.addEventListener("change", commitHistory);

liftValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(liftValueInput.value || liftInput.value), 0, 5);
  liftInput.value = `${value}`;
  rebuild();
});
liftValueInput.addEventListener("change", commitHistory);

insetValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(insetValueInput.value || insetInput.value), 0, 10);
  insetInput.value = `${value}`;
  rebuild();
});
insetValueInput.addEventListener("change", commitHistory);

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

baseOffsetXValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseOffsetXValueInput.value || baseOffsetXInput.value), -100, 100);
  baseOffsetXInput.value = `${value}`;
  rebuild();
});
baseOffsetXValueInput.addEventListener("change", commitHistory);

baseOffsetYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseOffsetYValueInput.value || baseOffsetYInput.value), -100, 100);
  baseOffsetYInput.value = `${value}`;
  rebuild();
});
baseOffsetYValueInput.addEventListener("change", commitHistory);

baseOffsetZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseOffsetZValueInput.value || baseOffsetZInput.value), -100, 100);
  baseOffsetZInput.value = `${value}`;
  rebuild();
});
baseOffsetZValueInput.addEventListener("change", commitHistory);

emblemOffsetXValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetXValueInput.value || emblemOffsetXInput.value), -100, 100);
  emblemOffsetXInput.value = `${value}`;
  rebuild();
});
emblemOffsetXValueInput.addEventListener("change", commitHistory);

emblemOffsetYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetYValueInput.value || emblemOffsetYInput.value), -100, 100);
  emblemOffsetYInput.value = `${value}`;
  rebuild();
});
emblemOffsetYValueInput.addEventListener("change", commitHistory);

emblemOffsetZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetZValueInput.value || emblemOffsetZInput.value), -100, 100);
  emblemOffsetZInput.value = `${value}`;
  rebuild();
});
emblemOffsetZValueInput.addEventListener("change", commitHistory);

themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
sidebarSideSelect.addEventListener("change", () => {
  document.body.dataset.sidebar = sidebarSideSelect.value;
  commitHistory();
});
langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  applyLocale();
  commitHistory();
});
themeSelect.addEventListener("change", commitHistory);
gizmoTargetInput.addEventListener("change", () => {
  updateGizmoTarget();
  commitHistory();
});
gizmoModeBtn.addEventListener("click", () => {
  gizmoModeIndex = (gizmoModeIndex + 1) % gizmoModes.length;
  setGizmoMode(gizmoModes[gizmoModeIndex]);
  commitHistory();
});

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
  const activeBase = currentBaseMesh ? cloneMeshInWorldSpace(currentBaseMesh) : getActiveBaseMesh();
  if (!activeBase) return;
  dlog("export.combined.click", {
    hasMesh: !!currentMesh,
    hasBase: !!activeBase,
    inverse: inverseModeInput.checked,
    offsets: {
      base: [baseOffsetXInput.value, baseOffsetYInput.value, baseOffsetZInput.value],
      emblem: [emblemOffsetXInput.value, emblemOffsetYInput.value, emblemOffsetZInput.value],
    },
    lift: liftInput.value,
    inset: insetInput.value,
  });
  const model = cloneMeshInWorldSpace(currentMesh) || currentMesh.clone();
  if (!currentBaseMesh) {
    activeBase.position.set(
      Number(baseOffsetXInput.value),
      Number(baseOffsetYInput.value),
      Number(baseOffsetZInput.value)
    );
    placeEmblem(activeBase, model);
  }
  // In inverse mode export exactly what preview already shows.
  let result =
    inverseModeInput.checked && currentInversePreviewMesh ? cloneMeshInWorldSpace(currentInversePreviewMesh) : null;
  if (!result) result = buildCombinedMeshForExport(activeBase, model);
  if (!result) {
    dlog("export.combined.failed", {});
    setStatus(`${t("statusError")}: inverse subtraction failed for this geometry`);
    return;
  }
  dlog("export.combined.success", {
    resultBox: boxInfo(result),
  });
  const exporter = new STLExporter();
  const stl = exporter.parse(result, { binary: false });
  const blob = new Blob([stl], { type: "model/stl" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${svgName || "model"}_with_base.stl`;
  a.click();
  URL.revokeObjectURL(url);
});

exportZipBtn.addEventListener("click", async () => {
  if (!batchFiles.length) {
    return;
  }

  const inverse = !!batchInverseModeInput.checked;
  const fitRatio = clampNumber(Number(batchFitRatioInput.value || 0.9), 0.5, 1.2);
  const fitSize = clampNumber(Math.floor(getBaseFitTargetSize() * fitRatio), 10, 200);
  const batchLift = clampNumber(Number(batchLiftInput.value || 0.2), 0, 5);
  const batchInset = clampNumber(Number(batchInsetInput.value || 1.0), 0, 10);
  const opts = {
    targetSize: fitSize,
    thickness: Number(thicknessInput.value),
    scaleX: Number(scaleXInput.value),
    scaleY: Number(scaleYInput.value),
    scaleZ: Number(scaleZInput.value),
    density: Number(densityInput.value),
    autoFix: autoFixInput.checked,
    flipY: flipYInput.checked,
    flipX: flipXInput.checked,
  };

  const zip = new JSZip();
  const exporter = new STLExporter();
  let success = 0;

  setStatus(`${t("statusBatch")}: ${batchFiles.length}\nProcessing...`);

  for (const file of batchFiles) {
    try {
      const text = await file.text();
      const { mesh } = buildMesh(text, opts);
      const activeBase = getActiveBaseMesh() || makeGeneratedBaseMesh();
      activeBase.position.set(0, 0, 0);
      placeEmblem(activeBase, mesh, inverse, batchLift, batchInset);
      const combined = buildCombinedMeshForExport(activeBase, mesh, inverse);
      if (!combined) throw new Error("Batch combined export failed");
      const stl = exporter.parse(combined, { binary: false });
      const name = file.name.replace(/\.svg$/i, "") || "model";
      zip.file(`${name}_with_base.stl`, stl);
      success += 1;
      activeBase.geometry.dispose();
      activeBase.material.dispose();
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

  setStatus(`${t("statusBatch")}: ${batchFiles.length}\nConverted: ${success}`);
});

batchSvgFilesInput.addEventListener("change", (e) => {
  const incoming = Array.from(e.target.files || []);
  batchFiles = [...batchFiles, ...incoming];
  updateBatchButtonState();
});

batchExportBtn.addEventListener("click", () => exportZipBtn.click());

libraryCategoryInput.addEventListener("change", updateLibraryItemLists);

libraryLoadSingleBtn.addEventListener("click", async () => {
  const selectedPath = librarySingleInput.value;
  if (!selectedPath) return;
  try {
    const response = await fetch(selectedPath);
    if (!response.ok) throw new Error("Failed to load library SVG");
    const text = await response.text();
    svgText = text;
    svgName = selectedPath.split("/").pop().replace(/\.svg$/i, "");
    rebuild();
    commitHistory();
  } catch (_err) {
    setStatus(`${t("statusError")}: library svg load failed`);
  }
});

libraryPreviewBtn.addEventListener("click", () => openLibraryPreview(librarySingleInput.value));

batchPreviewBtn.addEventListener("click", () => {
  const firstSelected = batchLibraryListInput.selectedOptions?.[0];
  if (!firstSelected) return;
  openLibraryPreview(firstSelected.value);
});

batchAddLibraryBtn.addEventListener("click", async () => {
  const selected = Array.from(batchLibraryListInput.selectedOptions || []);
  if (selected.length === 0) return;
  const added = [];
  for (const option of selected) {
    try {
      const path = option.value;
      const response = await fetch(path);
      if (!response.ok) continue;
      const text = await response.text();
      const name = path.split("/").pop();
      added.push(makeVirtualBatchFile(name, text));
    } catch (_err) {}
  }
  batchFiles = [...batchFiles, ...added];
  updateBatchButtonState();
  setStatus(`${t("statusBatch")}: ${batchFiles.length}`);
});

libraryPreviewCloseBtn.addEventListener("click", closeLibraryPreview);
libraryPreviewModal.addEventListener("click", (e) => {
  if (e.target === libraryPreviewModal) closeLibraryPreview();
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
  const targetDiameter = clampNumber(Math.ceil(Math.max(size.x, size.y) * 1.1), 10, 200);
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
    diameter = Math.max(size.x, size.y);
  }
  sizeInput.value = `${clampNumber(Math.floor(diameter * 0.9), 10, 200)}`;
  rebuild();
  commitHistory();
});

undoBtn.addEventListener("click", () => goHistory(-1));
redoBtn.addEventListener("click", () => goHistory(1));
resetSettingsBtn.addEventListener("click", () => {
  resetSettingsToDefaults();
  commitHistory();
});
clearCacheBtn.addEventListener("click", () => {
  localStorage.removeItem("sealGeneratorStateV1");
  setStatus("Cache cleared.");
});

window.addEventListener("keydown", (e) => {
  // Keep undo/redo higher priority than axis shortcuts.
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey) {
    e.preventDefault();
    goHistory(-1);
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.code === "KeyY" || (e.shiftKey && e.code === "KeyZ"))) {
    e.preventDefault();
    goHistory(1);
    return;
  }
  if (["g", "r", "s"].includes(e.key.toLowerCase())) {
    const mode = e.key.toLowerCase() === "g" ? "translate" : e.key.toLowerCase() === "r" ? "rotate" : "scale";
    setGizmoMode(mode);
    commitHistory();
    return;
  }
  if (!e.ctrlKey && !e.metaKey && ["x", "y", "z"].includes(e.key.toLowerCase())) {
    setAxisConstraint(e.key.toLowerCase());
    return;
  }
  if (e.key === "Escape") {
    resetAxisConstraint();
    transformControls.detach();
    updateGizmoTarget();
    return;
  }
  if (e.key === "1") {
    focusView("y", e.ctrlKey ? -1 : 1);
    return;
  }
  if (e.key === "3") {
    focusView("x", e.ctrlKey ? -1 : 1);
    return;
  }
  if (e.key === "7") {
    focusView("z", e.ctrlKey ? -1 : 1);
    return;
  }
  if (e.code === "Numpad1") {
    focusView("y", e.ctrlKey ? -1 : 1);
    return;
  }
  if (e.code === "Numpad3") {
    focusView("x", e.ctrlKey ? -1 : 1);
    return;
  }
  if (e.code === "Numpad7") {
    focusView("z", e.ctrlKey ? -1 : 1);
    return;
  }
  // Undo/redo handled above.
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

refreshOutputs();
applyTheme("dark");
document.body.dataset.sidebar = "left";
setGizmoMode("translate");
gizmoEnabledInput.checked = true;
createFloatingWindows();
applyLocale();
loadLibraryManifest();
loadFromCache();
commitHistory();
