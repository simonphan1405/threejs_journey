import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RectAreaLightHelper } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

const gui = new GUI();
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

/**
 * Lights
 * Three.js offers various types of lights, each with different behaviors and use cases
 */

// ============================================
// 1. AMBIENT LIGHT
// ============================================
// AmbientLight illuminates ALL objects in the scene EQUALLY from all directions
// It doesn't cast shadows and simulates indirect/bounced light
// Use case: Provides base lighting to prevent objects from being completely dark
// Performance: Very cheap (best for performance)
const ambidentLight = new THREE.AmbientLight();
ambidentLight.color = new THREE.Color(0xffffff); // White light
ambidentLight.intensity = 1; // Brightness level (0 = off, higher = brighter)
scene.add(ambidentLight);
gui.add(ambidentLight, "intensity").min(0).max(3).step(0.001);

// ============================================
// 2. DIRECTIONAL LIGHT
// ============================================
// DirectionalLight emits parallel rays in one direction (like the sun)
// All rays are parallel regardless of position - only direction matters
// Parameters: color, intensity
// Use case: Simulating sunlight or moonlight
// Performance: Moderate cost
const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.9);
directionalLight.position.set(1, 0.25, 0); // Position determines direction, not distance
scene.add(directionalLight);

// ============================================
// 3. HEMISPHERE LIGHT
// ============================================
// HemisphereLight simulates a gradient light from sky to ground
// It creates more realistic outdoor lighting with different colors from above and below
// Parameters: skyColor, groundColor, intensity
// Use case: Outdoor scenes, natural ambient lighting with color variation
// Performance: Cheap
const hemisphereLight = new THREE.HemisphereLight(
  0xff0000, // Sky color (top) - red in this example
  0x0000ff, // Ground color (bottom) - blue in this example
  0.9 // Intensity
);
scene.add(hemisphereLight);

// ============================================
// 4. POINT LIGHT
// ============================================
// PointLight emits light in ALL directions from a single point (like a light bulb)
// Light intensity diminishes with distance (uses distance decay)
// Parameters: color, intensity, distance, decay
// Use case: Light bulbs, candles, torches, lamps
// Performance: Moderate cost
const pointLight = new THREE.PointLight(
  0xff9000, // Color - orange in this example
  1.5, // Intensity - brightness of the light
  10, // Distance - maximum range of the light (0 = infinite)
  2 // Decay - how quickly light fades with distance (2 = physically accurate)
);
pointLight.position.set(1, -0.5, 1); // Position in 3D space where light originates
scene.add(pointLight);

// ============================================
// 5. RECT AREA LIGHT
// ============================================
// RectAreaLight emits light from a rectangular plane (like a TV screen or window)
// Only works with MeshStandardMaterial and MeshPhysicalMaterial
// Parameters: color, intensity, width, height
// Use case: Strip lights, TV screens, windows, studio lighting
// Performance: Expensive (use sparingly)
const rectAreaLight = new THREE.RectAreaLight(
  0x4e00ff, // Color - purple in this example
  6, // Intensity
  1, // Width of the rectangular light source
  1 // Height of the rectangular light source
);
rectAreaLight.position.set(-1.5, 0, 1.5); // Position in 3D space
rectAreaLight.lookAt(new THREE.Vector3()); // Point the light at the origin (0,0,0)
scene.add(rectAreaLight);

// ============================================
// 6. SPOT LIGHT
// ============================================
// SpotLight emits light in a cone shape from a point (like a flashlight or stage light)
// Has a direction, angle, and falloff
// Parameters: color, intensity, distance, angle, penumbra, decay
// Use case: Flashlights, stage spotlights, car headlights
// Performance: Expensive (use sparingly)
const spotLight = new THREE.SpotLight(
  0x78ff00, // Color - green-yellow in this example
  4.5, // Intensity - brightness of the light
  10, // Distance - maximum range of the light
  Math.PI * 0.05, // Angle - width of the spotlight cone (in radians)
  0.25, // Penumbra - softness of the edge (0 = hard edge, 1 = soft edge)
  1 // Decay - how quickly light fades with distance
);
spotLight.position.set(0, 2, 3); // Position of the spotlight in 3D space
scene.add(spotLight);

// SpotLight needs a target to point at (it doesn't use lookAt like other objects)
spotLight.target.position.x = -0.75; // Move the target to the left
scene.add(spotLight.target); // Must add target to the scene for it to work

// ============================================
// LIGHT HELPERS
// ============================================
// Helpers are visual aids that show the position, direction, and properties of lights
// They are extremely useful for debugging and understanding lighting setup
// Remove or hide helpers in production for better performance

// Hemisphere Light Helper
// Displays the sky color (top) and ground color (bottom) with a wireframe
const hemisphereLightHelper = new THREE.HemisphereLightHelper(
  hemisphereLight, // The light to visualize
  0.2 // Size of the helper
);
scene.add(hemisphereLightHelper);

// Directional Light Helper
// Shows a line indicating the direction of parallel light rays
// Also displays a plane representing the light source
const directionalLighttHelper = new THREE.DirectionalLightHelper(
  directionalLight, // The light to visualize
  0.2 // Size of the helper plane
);
scene.add(directionalLighttHelper);

// Point Light Helper
// Shows a wireframe sphere at the light's position
// The size represents the light's influence area
const pointLightHelper = new THREE.PointLightHelper(
  pointLight, // The light to visualize
  0.2 // Size of the helper sphere
);
scene.add(pointLightHelper);

// Spot Light Helper
// Displays a cone showing the spotlight's direction and spread
// Updates automatically when light properties change
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);

// SpotLightHelper needs to be updated after creation to show correctly
// requestAnimationFrame ensures this happens after the scene is rendered once
window.requestAnimationFrame(() => {
  spotLightHelper.update();
});

// Rect Area Light Helper
// Shows a rectangle representing the light-emitting surface
// Requires importing RectAreaLightHelper from three/examples/jsm/Addons.js
const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
scene.add(rectAreaLightHelper);

const material = new THREE.MeshStandardMaterial();
material.roughness = 0.4;

const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), material);
sphere.position.x = -1.5;

const cube = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), material);

const torus = new THREE.Mesh(
  new THREE.TorusGeometry(0.3, 0.2, 32, 64),
  material
);
torus.position.x = 1.5;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), material);
plane.rotation.x = -Math.PI * 0.5;
plane.position.y = -0.65;

scene.add(sphere, cube, torus, plane);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  sphere.rotation.y = 0.1 * elapsedTime;
  cube.rotation.y = 0.1 * elapsedTime;
  torus.rotation.y = 0.1 * elapsedTime;

  sphere.rotation.x = 0.15 * elapsedTime;
  cube.rotation.x = 0.15 * elapsedTime;
  torus.rotation.x = 0.15 * elapsedTime;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
