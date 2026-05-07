import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { Evaluator, Brush, SUBTRACTION } from "three-bvh-csg";

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
const fitInsetPctInput = document.getElementById("fitInsetPct");
const stlAddonOffsetXInput = document.getElementById("stlAddonOffsetX");
const stlAddonOffsetXValueInput = document.getElementById("stlAddonOffsetXValue");
const stlAddonOffsetYInput = document.getElementById("stlAddonOffsetY");
const stlAddonOffsetYValueInput = document.getElementById("stlAddonOffsetYValue");
const stlAddonOffsetZInput = document.getElementById("stlAddonOffsetZ");
const stlAddonOffsetZValueInput = document.getElementById("stlAddonOffsetZValue");
const stlAddonScaleInput = document.getElementById("stlAddonScale");
const stlAddonScaleValueInput = document.getElementById("stlAddonScaleValue");
const stlAddonTransformWrap = document.getElementById("stlAddonTransformWrap");
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
const batchPreviewBtn = document.getElementById("batchPreviewBtn");
const batchSelectionList = document.getElementById("batchSelectionList");
const batchClearSelectionBtn = document.getElementById("batchClearSelectionBtn");
const libraryPreviewModal = document.getElementById("libraryPreviewModal");
const libraryPreviewTitle = document.getElementById("libraryPreviewTitle");
const libraryPreviewMeta = document.getElementById("libraryPreviewMeta");
const libraryCategoryList = document.getElementById("libraryCategoryList");
const librarySvgGrid = document.getElementById("librarySvgGrid");
const libraryPreviewPrimaryBtn = document.getElementById("libraryPreviewPrimaryBtn");
const libraryPreviewCancelBtn = document.getElementById("libraryPreviewCancelBtn");
const libraryPreviewCloseBtn = document.getElementById("libraryPreviewCloseBtn");
const libraryHoverPreview = document.getElementById("libraryHoverPreview");
const libraryHoverPreviewImg = document.getElementById("libraryHoverPreviewImg");
const libraryHoverPreviewName = document.getElementById("libraryHoverPreviewName");
const libraryHoverDelayInput = document.getElementById("libraryHoverDelay");

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
let libraryBrowserMode = "single";
let libraryBrowserCategory = "";
let libraryBrowserSelectedPath = "";
let batchLibrarySelectedPaths = new Set();
let hoverPreviewTimer = null;
let isFlatView = false;
let history = [];
let historyIndex = -1;
let isApplyingHistory = false;
const csgEvaluator = new Evaluator();
// sanitizeGeometryForMerge strips uv/normal before merging; tell three-bvh-csg to only consume what we provide.
csgEvaluator.attributes = ["position", "normal"];
const gizmoModes = ["translate", "rotate", "scale"];
let gizmoModeIndex = 0;
let selectedObjectType = "emblem";
let modelWindow = null;
let baseWindow = null;
let batchWindow = null;
const DEBUG = true;

/** Matches emblem/base offset sliders and number clamps (±mm). */
const OFFSET_MM_LIMIT = 400;

/** Matches add-on STL offset sliders (±mm). */
const STL_ADDON_OFFSET_MM = 200;

/** Position after aligning emblem to base, before emblem offset sliders (scene space). */
const lastEmblemCanonicalPosition = new THREE.Vector3();
/** Persisted emblem rotation/scale from gizmo across rebuild(buildMesh resets mesh). */
const emblemGizmoEuler = new THREE.Euler(0, 0, 0, "XYZ");
const emblemGizmoScale = new THREE.Vector3(1, 1, 1);
let inverseCombinedRafId = 0;
/** Low-density emblem geometry for inverse-mode CSG preview only; export uses full-density `currentMesh`. */
let inversePreviewCutterMesh = null;
/** Max SVG extrusion `curveSegments` for preview cutter; lower = faster coarse inverse preview vs export quality. */
const INVERSE_PREVIEW_CURVE_SEGMENTS_CAP = 12;
/** Invalidate when emblem extrusion opts / SVG fingerprint change — avoids rebuilding the coarse cutter on every lift/offset rebuild. */
let inversePreviewCutterCacheKey = "";

const i18n = {
  en: {
    title: "Seal Generator",
    subtitle: "SVG -> STL with live 3D preview",
    theme: "Theme",
    language: "Language",
    sidebarSide: "Sidebar",
    libraryCategory: "Library category",
    librarySingle: "Library SVG (single)",
    previewSelected: "Open library browser",
    libraryBrowserTitle: "Library Browser",
    libraryBrowserCategory: "Library Category",
    libraryBrowserLoad: "Load selected",
    libraryBrowserAdd: "Add to batch",
    libraryHoverDelay: "Hover preview delay (ms)",
    cancel: "Cancel",
    loadFromLibrary: "Load from library",
    batchLibrary: "Library SVG (multiple)",
    batchSelection: "Selected batch items",
    batchClearSelection: "Clear selected",
    svgFile: "SVG file",
    baseStl: "Extra STL (under disk)",
    baseStlHint:
      "Stacked below the disk when both are enabled. If disk is off, only the STL defines the base.",
    generateBase: "Generate round disk base",
    stlAddonOffsetX: "Add-on STL offset X (mm)",
    stlAddonOffsetY: "Add-on STL offset Y (mm)",
    stlAddonOffsetZ: "Add-on STL offset Z (mm)",
    stlAddonScale: "Add-on STL scale",
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
    fitInsetPct: "Fit margin from base edge (%)",
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
    previewSelected: "Открыть библиотеку",
    libraryBrowserTitle: "Библиотека",
    libraryBrowserCategory: "Категория библиотеки",
    libraryBrowserLoad: "Загрузить выбранный",
    libraryBrowserAdd: "Добавить в batch",
    libraryHoverDelay: "Задержка hover-preview (мс)",
    cancel: "Отмена",
    loadFromLibrary: "Загрузить из библиотеки",
    batchLibrary: "SVG из библиотеки (несколько)",
    batchSelection: "Выбранные batch элементы",
    batchClearSelection: "Очистить выбранные",
    svgFile: "SVG файл",
    baseStl: "Доп. STL (под диск)",
    baseStlHint:
      "Под диском, если включены оба; если диск выключен — только STL как база.",
    generateBase: "Круглый диск (основа)",
    stlAddonOffsetX: "Смещение STL доп. X (мм)",
    stlAddonOffsetY: "Смещение STL доп. Y (мм)",
    stlAddonOffsetZ: "Смещение STL доп. Z (мм)",
    stlAddonScale: "Масштаб STL доп.",
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
    fitInsetPct: "Запас от края базы при подгонке (%)",
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
/** Tracks gizmo positions at drag start so the CSG preview can be slid by the drag delta in real time. */
const _gizmoDragStartBasePos = new THREE.Vector3();
const _gizmoDragStartInversePreviewPos = new THREE.Vector3();
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
  const o = transformControls.object;
  if (event.value) {
    if (o === currentBaseMesh) _gizmoDragStartBasePos.copy(o.position);
    if (currentInversePreviewMesh) _gizmoDragStartInversePreviewPos.copy(currentInversePreviewMesh.position);
  } else if (
    inverseModeInput.checked &&
    currentMesh &&
    currentBaseMesh &&
    (o === currentMesh || o === currentBaseMesh)
  ) {
    if (inverseCombinedRafId) {
      cancelAnimationFrame(inverseCombinedRafId);
      inverseCombinedRafId = 0;
    }
    rebuildInverseCombinedMesh();
  }
});
transformControls.addEventListener("objectChange", () => {
  const obj = transformControls.object;
  if (!obj) return;
  if (obj === currentBaseMesh) {
    baseOffsetXInput.value = `${obj.position.x.toFixed(1)}`;
    baseOffsetYInput.value = `${obj.position.y.toFixed(1)}`;
    baseOffsetZInput.value = `${obj.position.z.toFixed(1)}`;
    if (inverseModeInput.checked && currentInversePreviewMesh) {
      currentInversePreviewMesh.position.set(
        _gizmoDragStartInversePreviewPos.x + (obj.position.x - _gizmoDragStartBasePos.x),
        _gizmoDragStartInversePreviewPos.y + (obj.position.y - _gizmoDragStartBasePos.y),
        _gizmoDragStartInversePreviewPos.z + (obj.position.z - _gizmoDragStartBasePos.z)
      );
    }
  } else if (obj === currentMesh) {
    emblemGizmoEuler.copy(obj.rotation);
    emblemGizmoScale.copy(obj.scale);
    if (transformControls.mode === "translate") {
      const ux = clampNumber(obj.position.x - lastEmblemCanonicalPosition.x, -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
      const uy = clampNumber(obj.position.y - lastEmblemCanonicalPosition.y, -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
      const uz = clampNumber(obj.position.z - lastEmblemCanonicalPosition.z, -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
      emblemOffsetXInput.value = `${ux.toFixed(1)}`;
      emblemOffsetYInput.value = `${uy.toFixed(1)}`;
      emblemOffsetZInput.value = `${uz.toFixed(1)}`;
    }
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

const FLOAT_PANEL_TOP = 44;
const FLOAT_PANEL_BOTTOM_GAP = 16;

function getFloatingPanelHeight() {
  return Math.max(360, window.innerHeight - FLOAT_PANEL_TOP - FLOAT_PANEL_BOTTOM_GAP);
}

/** Keep Model / Base / Batch winboxes tall (viewport-filled) without inner scrollbars. */
function syncFloatingWindowHeights() {
  const h = getFloatingPanelHeight();
  for (const wb of [modelWindow, baseWindow, batchWindow]) {
    if (!wb) continue;
    wb.height = h;
    wb.resize();
  }
}

function createFloatingWindows() {
  if (typeof WinBox === "undefined" || !modelWindowContent || !baseWindowContent || !batchWindowContent) return;
  const h = getFloatingPanelHeight();
  modelWindow = new WinBox({
    title: t("modelSection"),
    class: "sg-window",
    x: 276,
    y: FLOAT_PANEL_TOP,
    width: 236,
    height: h,
    mount: modelWindowContent,
  });
  baseWindow = new WinBox({
    title: t("baseSection"),
    class: "sg-window",
    x: 520,
    y: FLOAT_PANEL_TOP,
    width: 236,
    height: h,
    mount: baseWindowContent,
  });
  batchWindow = new WinBox({
    title: t("batchSection"),
    class: "sg-window",
    x: 764,
    y: FLOAT_PANEL_TOP,
    width: 236,
    height: h,
    mount: batchWindowContent,
  });
  window.addEventListener("resize", syncFloatingWindowHeights);
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

function makeVirtualBatchFile(name, svgTextContent, key = null) {
  return {
    key,
    name,
    text: async () => svgTextContent,
  };
}

function renderBatchSelectionList() {
  batchSelectionList.innerHTML = "";
  if (batchFiles.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "-";
    batchSelectionList.appendChild(empty);
    return;
  }
  batchFiles.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "batch-selection-item";
    row.innerHTML = `<span>${item.name}</span><button type="button">Remove</button>`;
    row.querySelector("button").addEventListener("click", () => {
      if (item.key) batchLibrarySelectedPaths.delete(item.key);
      batchFiles.splice(idx, 1);
      updateBatchButtonState();
      renderBatchSelectionList();
      setStatus(`${t("statusBatch")}: ${batchFiles.length}`);
    });
    batchSelectionList.appendChild(row);
  });
}

function updateBatchButtonState() {
  batchExportBtn.disabled = batchFiles.length === 0;
  renderBatchSelectionList();
}

function updateLibraryItemLists() {
  const category = libraryCategoryInput.value;
  const filtered = libraryManifest.filter((item) => item.category === category);
  librarySingleInput.innerHTML = "";
  for (const item of filtered) {
    const optSingle = document.createElement("option");
    optSingle.value = item.path;
    optSingle.textContent = item.name;
    librarySingleInput.appendChild(optSingle);
  }
}

function closeLibraryPreview() {
  libraryPreviewModal.classList.add("hidden");
  hideHoverPreview();
}

function hideHoverPreview() {
  if (hoverPreviewTimer) {
    clearTimeout(hoverPreviewTimer);
    hoverPreviewTimer = null;
  }
  libraryHoverPreview.classList.add("hidden");
}

function scheduleHoverPreview(item, mouseEvent) {
  hideHoverPreview();
  const clientX = mouseEvent?.clientX ?? 0;
  const clientY = mouseEvent?.clientY ?? 0;
  const delayMs = clampNumber(Number(libraryHoverDelayInput.value || 1000), 100, 3000);
  hoverPreviewTimer = setTimeout(() => {
    libraryHoverPreviewImg.src = item.path;
    libraryHoverPreviewName.textContent = item.name;
    const x = Math.min(clientX + 18, window.innerWidth - 340);
    const y = Math.min(clientY + 18, window.innerHeight - 300);
    libraryHoverPreview.style.left = `${Math.max(10, x)}px`;
    libraryHoverPreview.style.top = `${Math.max(10, y)}px`;
    libraryHoverPreview.classList.remove("hidden");
    hoverPreviewTimer = null;
  }, delayMs);
}

function renderLibraryBrowser() {
  const categories = [...new Set(libraryManifest.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
  if (!libraryBrowserCategory && categories.length) libraryBrowserCategory = categories[0];
  if (libraryBrowserMode === "batch") {
    libraryPreviewMeta.textContent = `${t("libraryBrowserCategory")} (${batchLibrarySelectedPaths.size})`;
  } else {
    libraryPreviewMeta.textContent = t("libraryBrowserCategory");
  }
  libraryCategoryList.innerHTML = "";
  for (const category of categories) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `library-cat-btn${category === libraryBrowserCategory ? " active" : ""}`;
    btn.textContent = category;
    btn.addEventListener("click", () => {
      libraryBrowserCategory = category;
      if (libraryBrowserMode === "single") libraryBrowserSelectedPath = "";
      renderLibraryBrowser();
    });
    libraryCategoryList.appendChild(btn);
  }
  const filtered = libraryManifest.filter((x) => x.category === libraryBrowserCategory);
  librarySvgGrid.innerHTML = "";
  for (const item of filtered) {
    const card = document.createElement("button");
    card.type = "button";
    const isActive = libraryBrowserSelectedPath === item.path;
    const isBatchPicked = batchLibrarySelectedPaths.has(item.path);
    card.className = `library-card${isActive ? " active" : ""}${isBatchPicked ? " batch-picked" : ""}`;
    card.innerHTML = `
      <div class="library-thumb"><img src="${item.path}" alt="${item.name}"></div>
      <div class="library-name">${item.name}</div>
    `;
    card.addEventListener("click", () => {
      if (libraryBrowserMode === "batch") {
        if (batchLibrarySelectedPaths.has(item.path)) batchLibrarySelectedPaths.delete(item.path);
        else batchLibrarySelectedPaths.add(item.path);
      } else {
        libraryBrowserSelectedPath = item.path;
      }
      renderLibraryBrowser();
    });
    card.addEventListener("mouseenter", (e) => scheduleHoverPreview(item, e));
    card.addEventListener("mouseleave", hideHoverPreview);
    card.addEventListener("mousemove", (e) => {
      if (libraryHoverPreview.classList.contains("hidden")) return;
      const x = Math.min(e.clientX + 18, window.innerWidth - 340);
      const y = Math.min(e.clientY + 18, window.innerHeight - 300);
      libraryHoverPreview.style.left = `${Math.max(10, x)}px`;
      libraryHoverPreview.style.top = `${Math.max(10, y)}px`;
    });
    librarySvgGrid.appendChild(card);
  }
}

function openLibraryPreview(mode) {
  libraryBrowserMode = mode;
  libraryPreviewTitle.textContent = t("libraryBrowserTitle");
  libraryPreviewPrimaryBtn.textContent = mode === "single" ? t("libraryBrowserLoad") : t("libraryBrowserAdd");
  libraryPreviewCancelBtn.textContent = t("cancel");
  if (mode === "batch") {
    batchLibrarySelectedPaths = new Set(batchFiles.map((x) => x.key).filter(Boolean));
  }
  libraryBrowserSelectedPath = mode === "single" ? librarySingleInput.value : libraryBrowserSelectedPath;
  libraryBrowserCategory = libraryManifest.find((x) => x.path === libraryBrowserSelectedPath)?.category || libraryCategoryInput.value;
  renderLibraryBrowser();
  libraryPreviewModal.classList.remove("hidden");
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
  document.getElementById("libraryHoverDelayLabel").textContent = t("libraryHoverDelay");
  document.getElementById("librarySingleLabel").textContent = t("librarySingle");
  document.getElementById("libraryPreviewBtn").textContent = t("previewSelected");
  document.getElementById("batchPreviewBtn").textContent = t("previewSelected");
  document.getElementById("libraryLoadSingleBtn").textContent = t("loadFromLibrary");
  document.getElementById("batchSelectionLabel").textContent = t("batchSelection");
  document.getElementById("batchClearSelectionBtn").textContent = t("batchClearSelection");
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
  document.getElementById("baseStlHint").textContent = t("baseStlHint");
  document.getElementById("stlAddonOffsetXLabel").textContent = t("stlAddonOffsetX");
  document.getElementById("stlAddonOffsetYLabel").textContent = t("stlAddonOffsetY");
  document.getElementById("stlAddonOffsetZLabel").textContent = t("stlAddonOffsetZ");
  document.getElementById("stlAddonScaleLabel").textContent = t("stlAddonScale");
  document.getElementById("generateBaseLabel").textContent = t("generateBase");
  document.getElementById("baseDiameterLabel").textContent = t("baseDiameter");
  document.getElementById("baseThicknessLabel").textContent = t("baseThickness");
  document.getElementById("sizeLabel").textContent = t("size");
  document.getElementById("thicknessLabel").textContent = t("thickness");
  document.getElementById("scaleXLabel").textContent = t("scaleX");
  document.getElementById("scaleYLabel").textContent = t("scaleY");
  document.getElementById("scaleZLabel").textContent = t("scaleZ");
  document.getElementById("liftLabel").textContent = t("lift");
  document.getElementById("fitInsetPctLabel").textContent = t("fitInsetPct");
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
    })
  );
}

/** Dispose geometries/materials owned by Object3D (Mesh or Group). */
function disposeObjectGeometryTree(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    child.geometry?.dispose?.();
    if (child.material) {
      const arr = Array.isArray(child.material) ? child.material : [child.material];
      arr.forEach((m) => m.dispose?.());
    }
  });
}

/** Non-indexed BufferGeometry with only `position` — mergeGeometries requires identical attributes and index vs non-index uniformity. */
function sanitizeGeometryForMerge(geom) {
  let g = geom;
  if (g.index) {
    const nonIndexed = g.toNonIndexed();
    g.dispose();
    g = nonIndexed;
  }
  const names = Object.keys(g.attributes || {});
  for (const name of names) {
    if (name !== "position") g.deleteAttribute(name);
  }
  g.clearGroups();
  return g;
}

/** Merge meshes under root into one world-space mesh for CSG / STL export path. Caller disposes returned mesh after use unless kept in scene. */
function flattenObject3DToSingleMesh(sourceRoot, materialFallback = null) {
  return flattenObject3DSubsetToSingleMesh(sourceRoot, () => true, materialFallback);
}

/** Same as flattenObject3DToSingleMesh but only includes meshes for which includeFn returns true. */
function flattenObject3DSubsetToSingleMesh(sourceRoot, includeFn, materialFallback = null) {
  sourceRoot?.updateMatrixWorld(true);
  const geoms = [];
  let pickedMat = materialFallback;
  sourceRoot?.traverse?.((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (!includeFn(child)) return;
    child.updateMatrixWorld(true);
    geoms.push(sanitizeGeometryForMerge(child.geometry.clone().applyMatrix4(child.matrixWorld)));
    if (!pickedMat && child.material) pickedMat = child.material.clone();
  });
  if (!geoms.length) return null;
  const merged = geoms.length === 1 ? geoms[0] : mergeGeometries(geoms, false);
  if (!merged) {
    geoms.forEach((g) => g.dispose());
    return null;
  }
  if (geoms.length > 1) {
    geoms.forEach((g) => g.dispose());
  }
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(
    merged,
    pickedMat ||
      new THREE.MeshStandardMaterial({
        color: 0x8b8b8b,
        metalness: 0.25,
        roughness: 0.75,
      })
  );
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.scale.set(1, 1, 1);
  return mesh;
}

/**
 * Compose scene base root: disk (optional) + extra STL under it (optional). Both can coexist.
 * Applies base offset sliders on returned Group root.
 */
function buildComposableBaseRoot(options = {}) {
  const omitBaseOffset = !!options.omitBaseOffset;
  const hasCyl = generateBaseInput.checked;
  const hasStl = !!uploadedBaseMesh;
  if (!hasCyl && !hasStl) return null;
  const group = new THREE.Group();
  group.name = "composedBase";
  /** @type {THREE.Mesh|null} */
  let cyl = null;
  /** @type {THREE.Mesh|null} */
  let stl = null;
  if (hasCyl) {
    cyl = makeGeneratedBaseMesh();
    cyl.userData.role = "cyl";
    group.add(cyl);
  }
  if (hasStl) {
    stl = uploadedBaseMesh.clone();
    stl.userData.role = "stlAddon";
    const s = clampNumber(Number(stlAddonScaleInput.value ?? 1), 0.05, 5);
    stl.scale.set(s, s, s);
    stl.updateMatrixWorld(true);
    if (hasCyl) {
      const cyBox = new THREE.Box3().setFromObject(cyl);
      const stBox = new THREE.Box3().setFromObject(stl);
      stl.position.z = cyBox.min.z - stBox.max.z;
    }
    const ox = clampNumber(Number(stlAddonOffsetXInput.value ?? 0), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
    const oy = clampNumber(Number(stlAddonOffsetYInput.value ?? 0), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
    const oz = clampNumber(Number(stlAddonOffsetZInput.value ?? 0), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
    stl.position.x += ox;
    stl.position.y += oy;
    stl.position.z += oz;
    group.add(stl);
  }
  if (omitBaseOffset) {
    group.position.set(0, 0, 0);
  } else {
    group.position.set(Number(baseOffsetXInput.value), Number(baseOffsetYInput.value), Number(baseOffsetZInput.value));
  }
  group.updateMatrixWorld(true);
  return group;
}

/** Predicate: only the disk part of the composed base is cuttable for inverse mode. STL addon is preserved as-is. */
function isCuttableBaseChild(child) {
  if (!child?.isMesh) return false;
  // STL addon: protected from CSG.
  if (child.userData?.role === "stlAddon") return false;
  return true;
}

function isStlAddonBaseChild(child) {
  return !!child?.isMesh && child.userData?.role === "stlAddon";
}

/** True when both disk and STL addon are present in the composed base — inverse needs to split them. */
function baseHasBothCylAndAddon(root) {
  if (!root) return false;
  let hasCyl = false;
  let hasStl = false;
  root.traverse((c) => {
    if (!c.isMesh) return;
    if (c.userData?.role === "cyl") hasCyl = true;
    else if (c.userData?.role === "stlAddon") hasStl = true;
  });
  return hasCyl && hasStl;
}

/** Force material fully opaque so CSG result and base previews don't ghost out. */
function forceMaterialOpaque(material) {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  for (const m of mats) {
    m.transparent = false;
    m.opacity = 1.0;
    m.depthWrite = true;
    m.needsUpdate = true;
  }
}

/** Fallback for batch / probing when compose returns null — single procedural disk at origin */
function proceduralDiskOnlyRoot() {
  const g = new THREE.Group();
  g.add(makeGeneratedBaseMesh());
  return g;
}

function applyBaseOpaqueVisual(root) {
  root?.traverse?.((child) => {
    if (!child.material) return;
    child.material.transparent = false;
    child.material.opacity = 0.95;
  });
}

/** Inverse mode: base group stays in graph (for gizmo) but invisible — CSG preview is the visible result. */
function applyInverseModeBaseReferenceVisual(root) {
  if (!root) return;
  root.visible = false;
}

/** Inverse mode preview rebuild failed — fall back to opaque base so something is rendered. */
function applyInverseModeBaseFallbackVisual(root) {
  if (!root) return;
  root.visible = true;
  applyBaseOpaqueVisual(root);
}

function setWireframe(mesh) {
  if (!mesh?.traverse) return;
  mesh.traverse((child) => {
    if (!child.material) return;
    child.material.wireframe = wireframeModeInput.checked;
  });
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
  /** Always manipulate the composed base group; inverse CSG preview is display-only for export/visual. */
  const baseTarget = currentBaseMesh;
  const target = isBaseTarget ? baseTarget : currentMesh;
  // Inverse mode: show the emblem-cutter only while it's the gizmo target (drag preview); CSG preview shows the carved result.
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
  lastEmblemCanonicalPosition.copy(emblemMesh.position);

  emblemMesh.position.x += Number(emblemOffsetXInput.value);
  emblemMesh.position.y += Number(emblemOffsetYInput.value);
  emblemMesh.position.z += Number(emblemOffsetZInput.value);
}

function buildCombinedMeshForExport(baseMesh, emblemMesh, inverseOverride = null, silentLogs = false) {
  const inverseMode = inverseOverride === null ? inverseModeInput.checked : !!inverseOverride;
  if (!silentLogs) {
    dlog("inverse.export.start", {
      inverse: inverseMode,
      baseBox: boxInfo(baseMesh),
      emblemBox: boxInfo(emblemMesh),
    });
  }
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
  if (!silentLogs) {
    dlog("inverse.export.normalized", {
      baseVerts: baseWorld.attributes?.position?.count || 0,
      cutVerts: cutWorldBase.attributes?.position?.count || 0,
      baseBox: boxInfo(baseWorld),
      cutBox: boxInfo(cutWorldBase),
    });
  }

  const attempt = (extraDepth) => {
    if (!silentLogs) dlog("inverse.export.attempt.begin", { extraDepth });
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
    if (!silentLogs) {
      dlog("inverse.export.attempt.result", {
        extraDepth,
        vertCount,
        unchanged: resultSig ? sameSignature(baseSig, resultSig) : null,
        resultBox: vertCount ? boxInfo(subtracted) : null,
      });
    }
    if (vertCount === 0) return null;
    if (resultSig && sameSignature(baseSig, resultSig)) return null;
    subtracted.material = baseMesh.material.clone();
    return subtracted;
  };

  try {
    // Keep fallback nudges shallow so exported cut matches user placement.
    const result = attempt(0) || attempt(0.02) || attempt(0.06);
    if (result) {
      if (!silentLogs) dlog("inverse.export.end", { success: true, method: "bvh-csg" });
      return result;
    }
  } catch (err) {
    if (!silentLogs) dlog("inverse.export.exception", { message: String(err), method: "bvh-csg" });
    // eslint-disable-next-line no-console
    console.error("[seal-generator] CSG SUBTRACTION threw", err);
  }

  if (!silentLogs) dlog("inverse.export.end", { success: false, method: "none" });
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

/** Max XY span of current base footprint (for STL-only / non-disk bases). Disk-on uses baseDiameter separately. */
function getEffectiveBaseDiameterXY() {
  const composite = buildComposableBaseRoot();
  const cylinderFallback = composite ? null : makeGeneratedBaseMesh();
  const probeObj = composite || cylinderFallback;
  const box = new THREE.Box3().setFromObject(probeObj);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (composite) disposeObjectGeometryTree(composite);
  if (cylinderFallback) {
    cylinderFallback.geometry.dispose();
    cylinderFallback.material.dispose();
  }
  return Math.max(size.x, size.y, 1e-6);
}

/**
 * Reference span (mm) for fitting emblem XY to base: inscribed square side (D / √2) on a round disk;
 * STL-only layouts use bbox XY footprint.
 */
function emblemFitReferenceSpanMm() {
  if (generateBaseInput.checked) {
    const d = clampNumber(Number(baseDiameterInput.value || 40), 10, 200);
    return d / Math.SQRT2;
  }
  return getEffectiveBaseDiameterXY();
}

/** 0–45 (%): inward margin subtracted once from usable diameter scale (default 10 => 90% of base-wide fit). */
function getFitInsetScaleFromUI() {
  const p = clampNumber(Number(fitInsetPctInput?.value ?? 10), 0, 45);
  return (100 - p) / 100;
}

/** Target emblem max XY dimension (mm) for fitting to base with configured edge margin. */
function getEmblemTargetSizeForCurrentBase(options = {}) {
  const insetScale = typeof options.insetScale === "number" ? options.insetScale : getFitInsetScaleFromUI();
  const span = emblemFitReferenceSpanMm();
  return clampNumber(Math.floor(span * insetScale), 10, 200);
}

function getBaseFitTargetSize() {
  return getEmblemTargetSizeForCurrentBase();
}

function disposeCurrentInversePreviewMesh() {
  if (!currentInversePreviewMesh) return;
  scene.remove(currentInversePreviewMesh);
  disposeObjectGeometryTree(currentInversePreviewMesh);
  currentInversePreviewMesh = null;
}

function disposeInversePreviewCutterMeshOnly() {
  if (!inversePreviewCutterMesh) return;
  inversePreviewCutterMesh.geometry?.dispose?.();
  inversePreviewCutterMesh.material?.dispose?.();
  inversePreviewCutterMesh = null;
}

function clearInversePreviewCutterState() {
  disposeInversePreviewCutterMeshOnly();
  inversePreviewCutterCacheKey = "";
}

/**
 * Build a capped-curveSegments emblem used only as the CSG cutter for fast inverse preview.
 * Export still uses the full-density currentMesh.
 */
function syncInversePreviewCutterTemplate(opts) {
  const cappedDensity = Math.min(INVERSE_PREVIEW_CURVE_SEGMENTS_CAP, opts.density);
  const key = [
    quickStringFingerprint(svgText),
    opts.targetSize,
    opts.thickness,
    opts.scaleX,
    opts.scaleY,
    opts.scaleZ,
    cappedDensity,
    opts.autoFix ? 1 : 0,
    opts.flipX ? 1 : 0,
    opts.flipY ? 1 : 0,
  ].join("|");

  if (key === inversePreviewCutterCacheKey) return;

  disposeInversePreviewCutterMeshOnly();
  inversePreviewCutterCacheKey = key;

  // No win caching when source already small enough; fall back to currentMesh in rebuildInverseCombinedMesh.
  if (opts.density <= INVERSE_PREVIEW_CURVE_SEGMENTS_CAP) return;

  try {
    const { mesh: previewCutter } = buildMesh(svgText, { ...opts, density: cappedDensity });
    inversePreviewCutterMesh = previewCutter;
  } catch (_e) {
    inversePreviewCutterMesh = null;
  }
}

/** Recompute inverse-mode CSG preview from live emblem/base meshes. */
function rebuildInverseCombinedMesh(options = {}) {
  const skipGizmoUpdate = !!options.skipGizmoUpdate;
  if (!inverseModeInput.checked || !currentMesh || !currentBaseMesh) return;
  transformControls.detach();
  disposeCurrentInversePreviewMesh();

  // Inverse cuts the disk only — STL addon stays whole and is reattached after CSG.
  const flatCuttable = flattenObject3DSubsetToSingleMesh(currentBaseMesh, isCuttableBaseChild);
  if (!flatCuttable) {
    applyInverseModeBaseFallbackVisual(currentBaseMesh);
    if (!skipGizmoUpdate) updateGizmoTarget();
    return;
  }
  forceMaterialOpaque(flatCuttable.material);

  const cutterTemplate = inversePreviewCutterMesh || currentMesh;
  const previewCutter = cutterTemplate === currentMesh ? currentMesh.clone() : cutterTemplate.clone(true);
  previewCutter.position.copy(currentMesh.position);
  previewCutter.rotation.copy(currentMesh.rotation);
  previewCutter.scale.copy(currentMesh.scale);
  previewCutter.updateMatrixWorld(true);

  let cutResult = null;
  try {
    cutResult = buildCombinedMeshForExport(flatCuttable, previewCutter, null, true);
  } finally {
    flatCuttable.geometry.dispose();
    flatCuttable.material.dispose();
    if (cutterTemplate === inversePreviewCutterMesh) {
      previewCutter.geometry.dispose?.();
      previewCutter.material?.dispose?.();
    }
  }

  if (!cutResult) {
    applyInverseModeBaseFallbackVisual(currentBaseMesh);
    if (!skipGizmoUpdate) updateGizmoTarget();
    return;
  }
  forceMaterialOpaque(cutResult.material);

  // Wrap CSG-cut disk + untouched STL addon clone into a single preview group.
  const previewRoot = new THREE.Group();
  previewRoot.name = "inversePreview";
  previewRoot.add(cutResult);
  const stlAddonClone = flattenObject3DSubsetToSingleMesh(currentBaseMesh, isStlAddonBaseChild);
  if (stlAddonClone) {
    forceMaterialOpaque(stlAddonClone.material);
    previewRoot.add(stlAddonClone);
  }

  applyInverseModeBaseReferenceVisual(currentBaseMesh);
  setWireframe(previewRoot);
  previewRoot.renderOrder = 10;
  scene.add(previewRoot);
  currentInversePreviewMesh = previewRoot;
  if (!skipGizmoUpdate) updateGizmoTarget();
}

function scheduleRebuildInverseCombinedMesh() {
  if (!inverseModeInput.checked || !currentMesh || !currentBaseMesh) return;
  if (inverseCombinedRafId) return;
  inverseCombinedRafId = requestAnimationFrame(() => {
    inverseCombinedRafId = 0;
    rebuildInverseCombinedMesh();
  });
}

function composePreview() {
  transformControls.detach();
  if (currentMesh) scene.remove(currentMesh);
  if (currentInversePreviewMesh) {
    scene.remove(currentInversePreviewMesh);
    disposeObjectGeometryTree(currentInversePreviewMesh);
    currentInversePreviewMesh = null;
  }
  if (currentBaseMesh) {
    scene.remove(currentBaseMesh);
    disposeObjectGeometryTree(currentBaseMesh);
    currentBaseMesh = null;
  }
  const base = buildComposableBaseRoot();
  if (!currentMesh) {
    if (base) {
      currentBaseMesh = base;
      applyBaseOpaqueVisual(currentBaseMesh);
      setWireframe(currentBaseMesh);
      scene.add(currentBaseMesh);
    }
    exportCombinedBtn.disabled = true;
    updateGizmoTarget();
    return;
  }

  if (base) {
    currentBaseMesh = base;
    placeEmblem(currentBaseMesh, currentMesh);
    setWireframe(currentBaseMesh);
    if (inverseModeInput.checked) {
      scene.add(currentBaseMesh);
      currentMesh.material.transparent = true;
      currentMesh.material.opacity = 0.55;
      currentMesh.material.color.setHex(0xff5a3c);
      currentMesh.material.emissive = new THREE.Color(0x401000);
      currentMesh.material.emissiveIntensity = 0.65;
      currentMesh.material.depthWrite = false;
      currentMesh.material.needsUpdate = true;
      currentMesh.renderOrder = 5;
      currentMesh.visible = false;
      // Build CSG preview now; it replaces the source base visually. Falls back to opaque base if it fails.
      rebuildInverseCombinedMesh({ skipGizmoUpdate: true });
    } else {
      currentMesh.material.transparent = false;
      currentMesh.material.opacity = 1.0;
      currentMesh.material.color.setHex(0x58a6ff);
      currentMesh.material.emissive = new THREE.Color(0x000000);
      currentMesh.material.emissiveIntensity = 0.0;
      currentMesh.material.depthWrite = true;
      currentMesh.material.needsUpdate = true;
      currentMesh.renderOrder = 0;
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
    lastEmblemCanonicalPosition.set(0, 0, 0);
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
    stlAddonOffsetX: stlAddonOffsetXInput.value,
    stlAddonOffsetY: stlAddonOffsetYInput.value,
    stlAddonOffsetZ: stlAddonOffsetZInput.value,
    stlAddonScale: stlAddonScaleInput.value,
    generateBase: generateBaseInput.checked,
    baseDiameter: baseDiameterInput.value,
    baseThickness: baseThicknessInput.value,
    fitInsetPct: fitInsetPctInput.value,
    emblemRotX: emblemGizmoEuler.x,
    emblemRotY: emblemGizmoEuler.y,
    emblemRotZ: emblemGizmoEuler.z,
    emblemScaleX: emblemGizmoScale.x,
    emblemScaleY: emblemGizmoScale.y,
    emblemScaleZ: emblemGizmoScale.z,
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
  stlAddonOffsetXInput.value = state.stlAddonOffsetX ?? stlAddonOffsetXInput.value ?? "0";
  stlAddonOffsetYInput.value = state.stlAddonOffsetY ?? stlAddonOffsetYInput.value ?? "0";
  stlAddonOffsetZInput.value = state.stlAddonOffsetZ ?? stlAddonOffsetZInput.value ?? "0";
  stlAddonScaleInput.value = state.stlAddonScale ?? stlAddonScaleInput.value ?? "1";
  generateBaseInput.checked = !!state.generateBase;
  baseDiameterInput.value = state.baseDiameter ?? baseDiameterInput.value;
  baseThicknessInput.value = state.baseThickness ?? baseThicknessInput.value;
  fitInsetPctInput.value = state.fitInsetPct ?? fitInsetPctInput.value ?? "10";
  if ([state.emblemRotX, state.emblemRotY, state.emblemRotZ].every((v) => typeof v === "number") && Number.isFinite(state.emblemRotX)) {
    emblemGizmoEuler.set(state.emblemRotX, state.emblemRotY, state.emblemRotZ, "XYZ");
  }
  if (
    [state.emblemScaleX, state.emblemScaleY, state.emblemScaleZ].every((v) => typeof v === "number" && Number.isFinite(v))
  ) {
    emblemGizmoScale.set(state.emblemScaleX, state.emblemScaleY, state.emblemScaleZ);
  }
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
  fitInsetPctInput.value = "10";
  emblemGizmoEuler.set(0, 0, 0, "XYZ");
  emblemGizmoScale.set(1, 1, 1);
  baseOffsetXInput.value = "0";
  baseOffsetYInput.value = "0";
  baseOffsetZInput.value = "0";
  emblemOffsetXInput.value = "0";
  emblemOffsetYInput.value = "0";
  emblemOffsetZInput.value = "0";
  stlAddonOffsetXInput.value = "0";
  stlAddonOffsetYInput.value = "0";
  stlAddonOffsetZInput.value = "0";
  stlAddonScaleInput.value = "1";
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

function isUnderBasePickRoot(obj) {
  let n = obj;
  while (n) {
    if (n === currentBaseMesh || n === currentInversePreviewMesh) return true;
    n = n.parent;
  }
  return false;
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  if (transformControls.dragging) return;
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const candidates = [currentMesh, currentBaseMesh, currentInversePreviewMesh].filter(Boolean);
  const hit = raycaster.intersectObjects(candidates, true)[0];
  if (!hit?.object) return;
  const pickedBase = isUnderBasePickRoot(hit.object);
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
  if (flipX !== flipY) {
    if (geometry.index) {
      const idx = geometry.index.array;
      for (let i = 0; i < idx.length; i += 3) {
        const t = idx[i + 1];
        idx[i + 1] = idx[i + 2];
        idx[i + 2] = t;
      }
      geometry.index.needsUpdate = true;
    } else if (geometry.attributes.position) {
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 9) {
        for (let c = 0; c < 3; c += 1) {
          const t = arr[i + 3 + c];
          arr[i + 3 + c] = arr[i + 6 + c];
          arr[i + 6 + c] = t;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    }
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

  const prepared = geometries.map((g) => sanitizeGeometryForMerge(g));
  const merged = mergeGeometries(prepared, false);
  prepared.forEach((g) => g.dispose());
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
  stlAddonOffsetXValueInput.value = `${Number(stlAddonOffsetXInput.value).toFixed(1)}`;
  stlAddonOffsetYValueInput.value = `${Number(stlAddonOffsetYInput.value).toFixed(1)}`;
  stlAddonOffsetZValueInput.value = `${Number(stlAddonOffsetZInput.value).toFixed(1)}`;
  stlAddonScaleValueInput.value = `${Number(stlAddonScaleInput.value).toFixed(2)}`;
  if (stlAddonTransformWrap) stlAddonTransformWrap.hidden = !uploadedBaseMesh;
  densityOut.textContent = `${Number(densityInput.value).toFixed(0)}`;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** Sampled fingerprint to pair with length and extrusion knobs for inverse preview cutter caching. */
function quickStringFingerprint(s) {
  if (!s?.length) return "0";
  let h = 0;
  const step = Math.max(1, Math.floor(s.length / 8192));
  for (let i = 0; i < s.length; i += step) {
    h = (h * 33 + s.charCodeAt(i)) | 0;
  }
  return `${s.length}_${h}`;
}

function rebuild() {
  refreshOutputs();
  transformControls.detach();
  if (!svgText) {
    clearInversePreviewCutterState();
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
    currentMesh.rotation.copy(emblemGizmoEuler);
    currentMesh.scale.copy(emblemGizmoScale);

    syncInversePreviewCutterTemplate(opts);

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
    clearInversePreviewCutterState();
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

for (const input of [generateBaseInput, baseDiameterInput, baseThicknessInput, stlAddonOffsetXInput, stlAddonOffsetYInput, stlAddonOffsetZInput, stlAddonScaleInput]) {
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
  const value = clampNumber(Number(baseOffsetXValueInput.value || baseOffsetXInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  baseOffsetXInput.value = `${value}`;
  rebuild();
});
baseOffsetXValueInput.addEventListener("change", commitHistory);

baseOffsetYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseOffsetYValueInput.value || baseOffsetYInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  baseOffsetYInput.value = `${value}`;
  rebuild();
});
baseOffsetYValueInput.addEventListener("change", commitHistory);

baseOffsetZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(baseOffsetZValueInput.value || baseOffsetZInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  baseOffsetZInput.value = `${value}`;
  rebuild();
});
baseOffsetZValueInput.addEventListener("change", commitHistory);

emblemOffsetXValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetXValueInput.value || emblemOffsetXInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  emblemOffsetXInput.value = `${value}`;
  rebuild();
});
emblemOffsetXValueInput.addEventListener("change", commitHistory);

emblemOffsetYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetYValueInput.value || emblemOffsetYInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  emblemOffsetYInput.value = `${value}`;
  rebuild();
});
emblemOffsetYValueInput.addEventListener("change", commitHistory);

emblemOffsetZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(emblemOffsetZValueInput.value || emblemOffsetZInput.value), -OFFSET_MM_LIMIT, OFFSET_MM_LIMIT);
  emblemOffsetZInput.value = `${value}`;
  rebuild();
});
emblemOffsetZValueInput.addEventListener("change", commitHistory);

stlAddonOffsetXValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(stlAddonOffsetXValueInput.value || stlAddonOffsetXInput.value), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
  stlAddonOffsetXInput.value = `${value}`;
  rebuild();
});
stlAddonOffsetXValueInput.addEventListener("change", commitHistory);

stlAddonOffsetYValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(stlAddonOffsetYValueInput.value || stlAddonOffsetYInput.value), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
  stlAddonOffsetYInput.value = `${value}`;
  rebuild();
});
stlAddonOffsetYValueInput.addEventListener("change", commitHistory);

stlAddonOffsetZValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(stlAddonOffsetZValueInput.value || stlAddonOffsetZInput.value), -STL_ADDON_OFFSET_MM, STL_ADDON_OFFSET_MM);
  stlAddonOffsetZInput.value = `${value}`;
  rebuild();
});
stlAddonOffsetZValueInput.addEventListener("change", commitHistory);

stlAddonScaleValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(stlAddonScaleValueInput.value || stlAddonScaleInput.value), 0.05, 5);
  stlAddonScaleInput.value = `${value}`;
  rebuild();
});
stlAddonScaleValueInput.addEventListener("change", commitHistory);

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
  const inverse = inverseModeInput.checked;
  /** Cuttable part = disk only (or whole base if there is no separate STL addon). STL addon stays whole. */
  let flatCuttable = null;
  let stlAddonClone = null;
  if (currentBaseMesh) {
    if (inverse && baseHasBothCylAndAddon(currentBaseMesh)) {
      flatCuttable = flattenObject3DSubsetToSingleMesh(currentBaseMesh, isCuttableBaseChild);
      stlAddonClone = flattenObject3DSubsetToSingleMesh(currentBaseMesh, isStlAddonBaseChild);
    } else {
      flatCuttable = flattenObject3DToSingleMesh(currentBaseMesh);
    }
  } else {
    const r = proceduralDiskOnlyRoot();
    flatCuttable = flattenObject3DToSingleMesh(r);
    disposeObjectGeometryTree(r);
  }
  if (!flatCuttable) return;
  dlog("export.combined.click", {
    hasMesh: !!currentMesh,
    hasBase: !!flatCuttable,
    inverse,
    offsets: {
      base: [baseOffsetXInput.value, baseOffsetYInput.value, baseOffsetZInput.value],
      emblem: [emblemOffsetXInput.value, emblemOffsetYInput.value, emblemOffsetZInput.value],
    },
    lift: liftInput.value,
    inset: insetInput.value,
  });
  const model = cloneMeshInWorldSpace(currentMesh) || currentMesh.clone();
  if (!currentBaseMesh) {
    flatCuttable.position.set(
      Number(baseOffsetXInput.value),
      Number(baseOffsetYInput.value),
      Number(baseOffsetZInput.value)
    );
    placeEmblem(flatCuttable, model);
  }
  // Inverse preview uses a coarse cutter mesh; combined export always runs full-density CSG.
  let result = null;
  try {
    result = buildCombinedMeshForExport(flatCuttable, model, null, false);
    if (!result) {
      dlog("export.combined.failed", {});
      setStatus(`${t("statusError")}: inverse subtraction failed for this geometry`);
      return;
    }
    dlog("export.combined.success", {
      resultBox: boxInfo(result),
    });
    // If we ran inverse-with-stl-addon, glue the untouched STL on top of the cut disk.
    let exportObject = result;
    if (inverse && stlAddonClone) {
      const exportRoot = new THREE.Group();
      exportRoot.add(result);
      exportRoot.add(stlAddonClone);
      stlAddonClone = null; // ownership handed to exportRoot
      exportObject = exportRoot;
    }
    const exporter = new STLExporter();
    const stl = exporter.parse(exportObject, { binary: false });
    const blob = new Blob([stl], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${svgName || "model"}_with_base.stl`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    flatCuttable.geometry.dispose();
    flatCuttable.material.dispose();
    if (stlAddonClone) {
      stlAddonClone.geometry?.dispose?.();
      stlAddonClone.material?.dispose?.();
    }
  }
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
  /** Per-file failure reasons surfaced to the status text and console. */
  const failures = [];

  setStatus(`${t("statusBatch")}: ${batchFiles.length}\nProcessing...`);

  for (const file of batchFiles) {
    let activeCuttable = null;
    let stlAddonClone = null;
    let mesh = null;
    try {
      const text = await file.text();
      mesh = buildMesh(text, opts).mesh;
      const baseRoot = buildComposableBaseRoot({ omitBaseOffset: true }) || proceduralDiskOnlyRoot();
      const splitForInverse = inverse && baseHasBothCylAndAddon(baseRoot);
      if (splitForInverse) {
        activeCuttable = flattenObject3DSubsetToSingleMesh(baseRoot, isCuttableBaseChild);
        stlAddonClone = flattenObject3DSubsetToSingleMesh(baseRoot, isStlAddonBaseChild);
      } else {
        activeCuttable = flattenObject3DToSingleMesh(baseRoot);
      }
      disposeObjectGeometryTree(baseRoot);
      if (!activeCuttable) throw new Error("Batch base build failed");
      activeCuttable.position.set(0, 0, 0);
      placeEmblem(activeCuttable, mesh, inverse, batchLift, batchInset);
      const combined = buildCombinedMeshForExport(activeCuttable, mesh, inverse);
      if (!combined) throw new Error("Batch combined export failed (CSG returned null)");

      let exportObject = combined;
      if (splitForInverse && stlAddonClone) {
        const exportRoot = new THREE.Group();
        exportRoot.add(combined);
        exportRoot.add(stlAddonClone);
        stlAddonClone = null;
        exportObject = exportRoot;
      }

      const stl = exporter.parse(exportObject, { binary: false });
      const name = file.name.replace(/\.svg$/i, "") || "model";
      zip.file(`${name}_with_base.stl`, stl);
      success += 1;
    } catch (err) {
      failures.push(`${file.name}: ${err?.message || err}`);
      // eslint-disable-next-line no-console
      console.error("[seal-generator] batch export failure", file.name, err);
    } finally {
      activeCuttable?.geometry?.dispose?.();
      activeCuttable?.material?.dispose?.();
      stlAddonClone?.geometry?.dispose?.();
      stlAddonClone?.material?.dispose?.();
      mesh?.geometry?.dispose?.();
      mesh?.material?.dispose?.();
    }
  }

  if (success === 0) {
    setStatus(
      [`${t("statusError")}: no files were converted`, ...failures.slice(0, 5)].join("\n")
    );
    return;
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seal-generator-batch.zip";
  a.click();
  URL.revokeObjectURL(url);

  setStatus(
    [
      `${t("statusBatch")}: ${batchFiles.length}`,
      `Converted: ${success}`,
      ...(failures.length ? [`Failed: ${failures.length}`, ...failures.slice(0, 5)] : []),
    ].join("\n")
  );
});

batchSvgFilesInput.addEventListener("change", (e) => {
  const incoming = Array.from(e.target.files || []);
  batchFiles = [...batchFiles, ...incoming];
  updateBatchButtonState();
});

batchExportBtn.addEventListener("click", () => exportZipBtn.click());

libraryCategoryInput.addEventListener("change", updateLibraryItemLists);

async function loadLibrarySvgToSingle(selectedPath) {
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
}

libraryLoadSingleBtn.addEventListener("click", async () => {
  await loadLibrarySvgToSingle(librarySingleInput.value);
});

libraryPreviewBtn.addEventListener("click", () => openLibraryPreview("single"));

batchPreviewBtn.addEventListener("click", () => {
  openLibraryPreview("batch");
});

libraryPreviewPrimaryBtn.addEventListener("click", async () => {
  if (libraryBrowserMode === "single") {
    if (!libraryBrowserSelectedPath) return;
    await loadLibrarySvgToSingle(libraryBrowserSelectedPath);
    closeLibraryPreview();
    return;
  }
  const selectedPaths = Array.from(batchLibrarySelectedPaths);
  const retainedLocals = batchFiles.filter((item) => !item.key);
  const added = [];
  for (const path of selectedPaths) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const text = await response.text();
      const name = path.split("/").pop();
      added.push(makeVirtualBatchFile(name, text, path));
    } catch (_err) {}
  }
  // Replace library-sourced rows with the current modal selection (no duplicate append on reopen).
  batchFiles = [...retainedLocals, ...added];
  updateBatchButtonState();
  setStatus(`${t("statusBatch")}: ${batchFiles.length}`);
  closeLibraryPreview();
});

batchClearSelectionBtn.addEventListener("click", () => {
  batchFiles = [];
  batchLibrarySelectedPaths.clear();
  updateBatchButtonState();
  setStatus(`${t("statusBatch")}: 0`);
});

libraryPreviewCancelBtn.addEventListener("click", closeLibraryPreview);
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
  sizeInput.value = `${getEmblemTargetSizeForCurrentBase()}`;
  rebuild();
  commitHistory();
});

fitInsetPctInput.addEventListener("change", commitHistory);

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
updateBatchButtonState();
commitHistory();
