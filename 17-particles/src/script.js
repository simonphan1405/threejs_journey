import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/particles/2.png");

/**
 * Particles
 */
// Particles - Geometries
// const pariclesGeometry = new THREE.SphereGeometry(1, 32, 32);
const particlesGeometry = new THREE.BufferGeometry();

const count = 20000;
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 10;
  colors[i] = Math.random();
}
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

// Particles - Material
const particlesMaterial = new THREE.PointsMaterial();
particlesMaterial.size = 0.07;
particlesMaterial.sizeAttenuation = true;
particlesMaterial.color = new THREE.Color(0xff88cc);
// particlesMaterial.map = particleTexture;
particlesMaterial.transparent = true;
particlesMaterial.alphaMap = particleTexture;
particlesMaterial.vertexColors = true;

/**
 * Các cách để loại bỏ phần màu đen có trong ảnh particles
 */
// particlesMaterial.alphaTest = 0.001;
// particlesMaterial.depthTest = false;
particlesMaterial.depthWrite = false;

// Particles - Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);

scene.add(particles);

/**
 * Test cube
 */
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial()
);
scene.add(cube);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update particles
  for (let i = 0; i < count * 3; i++) {
    const i3 = i * 3;
    const x = particlesGeometry.attributes.position.array[i3 + 0];
    particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(
      elapsedTime - x
    );
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
