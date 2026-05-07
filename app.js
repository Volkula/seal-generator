import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
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
const csgEvaluator = new Evaluator();
const gizmoModes = ["translate", "rotate", "scale"];
let gizmoModeIndex = 0;
let selectedObjectType = "emblem";

const i18n = {
  en: {
    title: "Seal Generator",
    subtitle: "SVG -> STL with live 3D preview",
    theme: "Theme",
    language: "Language",
    sidebarSide: "Sidebar",
    svgFile: "SVG file",
    baseStl: "Base STL (optional)",
    generateBase: "Generate round base",
    baseDiameter: "Base diameter (mm)",
    baseThickness: "Base thickness (mm)",
    size: "Size (max dimension, mm)",
    thickness: "Thickness (mm)",
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
    viewSection: "View & Export",
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
    svgFile: "SVG файл",
    baseStl: "Основание STL (опционально)",
    generateBase: "Сгенерировать круглое основание",
    baseDiameter: "Диаметр основания (мм)",
    baseThickness: "Толщина основания (мм)",
    size: "Размер (макс. габарит, мм)",
    thickness: "Толщина (мм)",
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
    viewSection: "Вид и экспорт",
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
  if (obj === currentBaseMesh) {
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

function updateSelectedObjectUI() {
  const isBase = selectedObjectType === "base";
  baseOffsetGroup.style.display = isBase ? "block" : "none";
  emblemOffsetGroup.style.display = isBase ? "none" : "block";
  selectedObjectLabel.textContent = `${t("selectedPrefix")}: ${isBase ? t("objectBase") : t("objectEmblem")}`;
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
  document.getElementById("sidebarSideLabel").textContent = t("sidebarSide");
  document.getElementById("modelSectionLabel").textContent = t("modelSection");
  document.getElementById("baseSectionLabel").textContent = t("baseSection");
  document.getElementById("viewSectionLabel").textContent = t("viewSection");
  document.getElementById("box1Label").textContent = t("box1");
  document.getElementById("box2Label").textContent = t("box2");
  document.getElementById("svgFileLabel").textContent = t("svgFile");
  document.getElementById("baseStlLabel").textContent = t("baseStl");
  document.getElementById("generateBaseLabel").textContent = t("generateBase");
  document.getElementById("baseDiameterLabel").textContent = t("baseDiameter");
  document.getElementById("baseThicknessLabel").textContent = t("baseThickness");
  document.getElementById("sizeLabel").textContent = t("size");
  document.getElementById("thicknessLabel").textContent = t("thickness");
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
  document.getElementById("wireframeModeLabel").textContent = t("wireframeMode");
  document.getElementById("gizmoEnabledLabel").textContent = t("gizmoEnabled");
  document.getElementById("gizmoTargetLabel").textContent = t("gizmoTarget");
  updateGizmoModeButtonLabel();
  document.getElementById("exportBtn").textContent = t("export");
  document.getElementById("exportCombinedBtn").textContent = t("exportCombined");
  document.getElementById("exportZipBtn").textContent = t("exportZip");
  document.getElementById("fitBaseToEmblemBtn").textContent = t("fitBaseToEmblem");
  document.getElementById("fitEmblemToBaseBtn").textContent = t("fitEmblemToBase");
  document.getElementById("undoBtn").textContent = t("undo");
  document.getElementById("redoBtn").textContent = t("redo");
  document.getElementById("resetSettingsBtn").textContent = t("resetSettings");
  document.getElementById("clearCacheBtn").textContent = t("clearCache");
  document.getElementById("flatViewBtn").textContent = isFlatView ? t("perspectiveView") : t("flatView");
  document.getElementById("licenseNote").textContent = t("license");
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
  const target = gizmoTargetInput.value === "base" ? currentBaseMesh : currentMesh;
  if (target) {
    transformControls.visible = true;
    transformControls.attach(target);
  } else {
    transformControls.detach();
    transformControls.visible = false;
  }
}

function placeEmblem(baseMesh, emblemMesh) {
  const lift = Number(liftInput.value);
  const inset = Number(insetInput.value);
  const inverse = inverseModeInput.checked;
  emblemMesh.position.set(0, 0, 0);
  emblemMesh.scale.set(1, 1, 1);
  const baseBox = baseMesh ? new THREE.Box3().setFromObject(baseMesh) : null;
  const emblemBox = new THREE.Box3().setFromObject(emblemMesh);
  if (baseBox) {
    if (inverse) {
      emblemMesh.position.z = baseBox.max.z - inset - emblemBox.max.z;
    } else {
      emblemMesh.position.z = baseBox.max.z + lift - emblemBox.min.z;
    }
  }
  emblemMesh.position.x += Number(emblemOffsetXInput.value);
  emblemMesh.position.y += Number(emblemOffsetYInput.value);
  emblemMesh.position.z += Number(emblemOffsetZInput.value);
}

function buildCombinedMeshForExport(baseMesh, emblemMesh) {
  if (!inverseModeInput.checked) {
    const group = new THREE.Group();
    group.add(baseMesh);
    group.add(emblemMesh);
    return group;
  }
  // True inverse: subtract emblem volume from base.
  baseMesh.updateMatrixWorld(true);
  emblemMesh.updateMatrixWorld(true);
  const baseWorld = baseMesh.geometry.clone().applyMatrix4(baseMesh.matrixWorld);
  const cutWorld = emblemMesh.geometry.clone().applyMatrix4(emblemMesh.matrixWorld);
  const baseBrush = new Brush(baseWorld);
  baseBrush.updateMatrixWorld(true);
  const cutBrush = new Brush(cutWorld);
  cutBrush.updateMatrixWorld(true);
  const subtracted = csgEvaluator.evaluate(baseBrush, cutBrush, SUBTRACTION);
  subtracted.material = baseMesh.material.clone();
  return subtracted;
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
    currentBaseMesh.position.set(
      Number(baseOffsetXInput.value),
      Number(baseOffsetYInput.value),
      Number(baseOffsetZInput.value)
    );
    placeEmblem(currentBaseMesh, currentMesh);
    setWireframe(currentBaseMesh);
    if (inverseModeInput.checked) {
      const previewCombined = buildCombinedMeshForExport(currentBaseMesh.clone(), currentMesh.clone());
      setWireframe(previewCombined);
      scene.add(previewCombined);
      currentMesh.material.transparent = true;
      currentMesh.material.opacity = 0.82;
      currentMesh.material.color.setHex(0xff7a59);
      currentMesh.material.emissive = new THREE.Color(0x5a1f00);
      currentMesh.material.emissiveIntensity = 0.55;
      scene.add(currentMesh);
      scene.remove(currentBaseMesh);
      currentBaseMesh.geometry.dispose();
      currentBaseMesh.material.dispose();
      currentBaseMesh = previewCombined;
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
  const candidates = [currentMesh, currentBaseMesh].filter(Boolean);
  const hit = raycaster.intersectObjects(candidates, false)[0];
  if (!hit?.object) return;
  const pickedBase = hit.object === currentBaseMesh;
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

for (const input of [sizeInput, thicknessInput, liftInput, insetInput, densityInput, autoFixInput, flipYInput, flipXInput, inverseModeInput, baseOffsetXInput, baseOffsetYInput, baseOffsetZInput, emblemOffsetXInput, emblemOffsetYInput, emblemOffsetZInput, wireframeModeInput, gizmoEnabledInput]) {
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
  const activeBase = getActiveBaseMesh();
  if (!activeBase) return;
  activeBase.position.set(
    Number(baseOffsetXInput.value),
    Number(baseOffsetYInput.value),
    Number(baseOffsetZInput.value)
  );
  const model = currentMesh.clone();
  placeEmblem(activeBase, model);
  const result = buildCombinedMeshForExport(activeBase, model);
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
applyLocale();
loadFromCache();
commitHistory();
