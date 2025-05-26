// baby_bet_cube.js

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// DOM Setup
const canvas = document.createElement('canvas');
canvas.id = 'baby-bet-cube';
document.body.appendChild(canvas);

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 30, 60);

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Set a bright background color for the scene
renderer.setClearColor(0xf5f5fa, 1);
scene.background = new THREE.Color(0xf5f5fa);

document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Cube Dimensions
const dateRange = 21; // Dec 1 - Dec 21
const weightSteps = 50; // 5.0 to 10.0 lbs by 0.1
const hours = 24;

const totalCubes = dateRange * weightSteps * hours;
const cubeSize = 0.5;

// Data structure for cube claims (placeholder data)
// Structure: { [id: number]: { claimed: boolean, user?: string } }
const cubeClaims: Record<number, { claimed: boolean; user?: string }> = {};

// Example: Mark some cubes as claimed
cubeClaims[0] = { claimed: true, user: 'Alice' };
cubeClaims[1234] = { claimed: true, user: 'Bob' };
cubeClaims[10] = { claimed: true, user: 'Ryan' };
cubeClaims[500] = { claimed: true, user: 'Mom' };
cubeClaims[999] = { claimed: true, user: 'Allison' };
cubeClaims[2021] = { claimed: true, user: 'Ryan' };
cubeClaims[3500] = { claimed: true, user: 'Mom' };
cubeClaims[4000] = { claimed: true, user: 'Allison' };

// Instanced Mesh
const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
// Remove texture, just use a slightly gray color for all cubes
const material = new THREE.MeshStandardMaterial({
  color: 0xbbbbbb, // Light gray
  transparent: true,
  opacity: 0.85, // Slightly less transparent for a solid look
  metalness: 0.05,
  roughness: 0.7,
});
const mesh = new THREE.InstancedMesh(geometry, material, totalCubes);

let id = 0;
const color = new THREE.Color();
// Update userColors to be more vibrant
const userColors = {
  Alice: 0x2196f3, // blue
  Bob: 0x43ea4a, // bright green
  Ryan: 0xffa500, // bright orange
  Mom: 0xff4081, // hot pink
  Allison: 0xba68c8, // bright purple
};
for (let x = 0; x < dateRange; x++) {
  for (let y = 0; y < weightSteps; y++) {
    for (let z = 0; z < hours; z++) {
      // Add more space between cubes (spacing = 1.2)
      const spacing = 1.2;
      const matrix = new THREE.Matrix4().makeTranslation(x * spacing, y * spacing, z * spacing);
      mesh.setMatrixAt(id, matrix);
      // Set color based on claim status and user
      if (cubeClaims[id]?.claimed && cubeClaims[id].user) {
        const user = cubeClaims[id].user as keyof typeof userColors;
        color.set(userColors[user] ?? 0x2196f3);
        mesh.setColorAt(id, color);
      } else {
        color.set(0xbbbbbb); // Light gray for unclaimed
        mesh.setColorAt(id, color);
      }
      id += 1;
    }
  }
}
mesh.instanceMatrix.needsUpdate = true;
if (mesh.instanceColor) {
  mesh.instanceColor.needsUpdate = true;
}
scene.add(mesh);

// Lights
// Strong ambient light for overall brightness
const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
scene.add(ambientLight);

// Multiple directional lights from different angles
const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
dirLight1.position.set(30, 60, 40);
dirLight1.castShadow = true;
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight2.position.set(-50, 40, -30);
scene.add(dirLight2);

// Hemisphere light for soft global illumination
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

// Fill point light for extra brightness
const fillLight = new THREE.PointLight(0xffffff, 1.2, 400);
fillLight.position.set(-40, 40, 60);
scene.add(fillLight);

// Update material for brighter, more vibrant cubes
material.opacity = 0.7; // Make unclaimed cubes less transparent
material.color.set(0xffffff); // Default to pure white
material.metalness = 0.0;
material.roughness = 0.3;

// Raycaster for hover interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Tooltip element
const tooltip = document.createElement('div');
tooltip.style.position = 'fixed';
tooltip.style.pointerEvents = 'none';
tooltip.style.background = 'rgba(0,0,0,0.7)';
tooltip.style.color = '#fff';
tooltip.style.padding = '4px 8px';
tooltip.style.borderRadius = '4px';
tooltip.style.fontSize = '12px';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

function getCubeInfo(id: number) {
  const x = Math.floor(id / (weightSteps * hours));
  const y = Math.floor((id % (weightSteps * hours)) / hours);
  const z = id % hours;
  const date = new Date(2025, 11, 1 + x); // Dec 1 + x
  const weight = 5.0 + y * 0.1;
  const hour = z;
  return { date, weight, hour };
}

function onPointerMove(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(mesh);
  if (intersects.length > 0) {
    const { instanceId } = intersects[0];
    if (instanceId !== undefined) {
      const info = getCubeInfo(instanceId);
      tooltip.style.display = 'block';
      tooltip.style.left = event.clientX + 10 + 'px';
      tooltip.style.top = event.clientY + 10 + 'px';
      tooltip.innerHTML =
        `Date: ${info.date.toDateString()}<br>` +
        `Weight: ${info.weight.toFixed(1)} lbs<br>` +
        `Hour: ${info.hour}:00<br>` +
        (cubeClaims[instanceId]?.claimed
          ? `<b>Claimed by: ${cubeClaims[instanceId].user}</b>`
          : '<i>Available</i>');
    }
  } else {
    tooltip.style.display = 'none';
  }
}
window.addEventListener('pointermove', onPointerMove);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
