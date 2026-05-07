import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import JSZip from "https://esm.sh/jszip@3.10.1";

const viewport = document.getElementById("viewport");
const fileInput = document.getElementById("svgFile");
const themeSelect = document.getElementById("themeSelect");
const langSelect = document.getElementById("langSelect");
const sizeInput = document.getElementById("size");
const sizeValueInput = document.getElementById("sizeValue");
const thicknessInput = document.getElementById("thickness");
const thicknessValueInput = document.getElementById("thicknessValue");
const densityInput = document.getElementById("density");
const autoFixInput = document.getElementById("autoFix");
const flipYInput = document.getElementById("flipY");
const flipXInput = document.getElementById("flipX");
const exportBtn = document.getElementById("exportBtn");
const exportZipBtn = document.getElementById("exportZipBtn");
const statusEl = document.getElementById("status");

const densityOut = document.getElementById("densityOut");

let svgText = "";
let svgName = "model";
let currentMesh = null;
let currentLang = "en";
let uploadedFiles = [];

const i18n = {
  en: {
    title: "Seal Generator",
    subtitle: "SVG -> STL with live 3D preview",
    theme: "Theme",
    language: "Language",
    svgFile: "SVG file",
    size: "Size (max dimension, mm)",
    thickness: "Thickness (mm)",
    density: "Line density",
    autoFix: "Auto-fix unclosed faces",
    flipY: "Flip vertically (top-bottom)",
    flipX: "Flip horizontally (left-right)",
    export: "Export STL",
    exportZip: "Export ZIP (batch)",
    statusIdle: "Load an SVG to start.",
    statusError: "Error",
    statusFile: "File",
    statusShapes: "Shapes",
    statusSize: "Size",
    statusFix: "Auto-fix",
    statusFlip: "Flip Y",
    statusFlipX: "Flip X",
    statusBatch: "Batch files",
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
    size: "Размер (макс. габарит, мм)",
    thickness: "Толщина (мм)",
    density: "Плотность линий",
    autoFix: "Автоисправление незамкнутых контуров",
    flipY: "Отразить по вертикали (верх-низ)",
    flipX: "Отразить по горизонтали (лево-право)",
    export: "Экспорт STL",
    exportZip: "Экспорт ZIP (batch)",
    statusIdle: "Загрузите SVG для начала.",
    statusError: "Ошибка",
    statusFile: "Файл",
    statusShapes: "Фигуры",
    statusSize: "Размер",
    statusFix: "Автофикс",
    statusFlip: "Флип Y",
    statusFlipX: "Флип X",
    statusBatch: "Файлов в batch",
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
  document.getElementById("sizeLabel").textContent = t("size");
  document.getElementById("thicknessLabel").textContent = t("thickness");
  document.getElementById("densityLabel").textContent = t("density");
  document.getElementById("autoFixLabel").textContent = t("autoFix");
  document.getElementById("flipYLabel").textContent = t("flipY");
  document.getElementById("flipXLabel").textContent = t("flipX");
  document.getElementById("exportBtn").textContent = t("export");
  document.getElementById("exportZipBtn").textContent = t("exportZip");
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
    scene.add(currentMesh);
    exportBtn.disabled = false;
    exportZipBtn.disabled = uploadedFiles.length === 0;
    setStatus(
      [
        `${t("statusFile")}: ${svgName}`,
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
});

for (const input of [sizeInput, thicknessInput, densityInput, autoFixInput, flipYInput, flipXInput]) {
  input.addEventListener("input", rebuild);
  input.addEventListener("change", rebuild);
}

sizeValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(sizeValueInput.value || sizeInput.value), 10, 200);
  sizeInput.value = `${value}`;
  rebuild();
});

thicknessValueInput.addEventListener("input", () => {
  const value = clampNumber(Number(thicknessValueInput.value || thicknessInput.value), 0.5, 20);
  thicknessInput.value = `${value}`;
  rebuild();
});

themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
langSelect.addEventListener("change", () => {
  currentLang = langSelect.value;
  applyLocale();
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

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

refreshOutputs();
applyTheme("dark");
applyLocale();
