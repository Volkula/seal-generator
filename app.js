import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { SVGLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/SVGLoader.js";
import { STLExporter } from "https://unpkg.com/three@0.165.0/examples/jsm/exporters/STLExporter.js";
import { mergeGeometries } from "https://unpkg.com/three@0.165.0/examples/jsm/utils/BufferGeometryUtils.js";

const viewport = document.getElementById("viewport");
const fileInput = document.getElementById("svgFile");
const sizeInput = document.getElementById("size");
const thicknessInput = document.getElementById("thickness");
const densityInput = document.getElementById("density");
const autoFixInput = document.getElementById("autoFix");
const flipYInput = document.getElementById("flipY");
const exportBtn = document.getElementById("exportBtn");
const statusEl = document.getElementById("status");

const sizeOut = document.getElementById("sizeOut");
const thicknessOut = document.getElementById("thicknessOut");
const densityOut = document.getElementById("densityOut");

let svgText = "";
let svgName = "model";
let currentMesh = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1116);

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

const grid = new THREE.GridHelper(400, 40, 0x3d444d, 0x2d333b);
scene.add(grid);

function setStatus(text) {
  statusEl.textContent = text;
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
    throw new Error("No closed shapes found. Try enabling auto-fix.");
  }

  const merged = mergeGeometries(geometries, false);
  if (!merged) {
    throw new Error("Could not merge geometry.");
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

  if (opts.flipY) {
    merged.scale(1, -1, 1);
    merged.computeVertexNormals();
  }

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
  sizeOut.textContent = `${Number(sizeInput.value).toFixed(0)}`;
  thicknessOut.textContent = `${Number(thicknessInput.value).toFixed(1)}`;
  densityOut.textContent = `${Number(densityInput.value).toFixed(0)}`;
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
    setStatus(
      [
        `File: ${svgName}`,
        `Shapes: ${shapeCount}`,
        `Size: ${bbox.x.toFixed(2)} x ${bbox.y.toFixed(2)} x ${bbox.z.toFixed(2)} mm`,
        `Auto-fix: ${opts.autoFix ? "on" : "off"}`,
        `Flip Y: ${opts.flipY ? "on" : "off"}`,
      ].join("\n")
    );
  } catch (err) {
    exportBtn.disabled = true;
    setStatus(`Error: ${err.message}`);
  }
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }
  svgName = file.name.replace(/\.svg$/i, "");
  svgText = await file.text();
  rebuild();
});

for (const input of [sizeInput, thicknessInput, densityInput, autoFixInput, flipYInput]) {
  input.addEventListener("input", rebuild);
  input.addEventListener("change", rebuild);
}

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

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

refreshOutputs();
