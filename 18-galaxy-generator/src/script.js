import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

const gui = new GUI();
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

/**
 * ============================================
 * GALAXY GENERATOR
 * ============================================
 * This creates a procedural spiral galaxy with customizable parameters.
 * The galaxy is made up of particles distributed along spiral branches.
 */

/**
 * GALAXY PARAMETERS
 * These control how the galaxy looks and behaves
 */
const parameters = {};

// Number of particles (stars) in the galaxy
// More particles = more detailed galaxy, but lower performance
parameters.count = 100000;

// Size of each particle in the scene
// Smaller values make stars look more realistic
parameters.size = 0.01;

// Distance from center to the edge of the galaxy
// This defines how spread out the galaxy is
parameters.radius = 5;

// Number of spiral arms the galaxy has
// Real galaxies typically have 2-4 arms (e.g., Milky Way has 4)
parameters.branches = 3;

// How much the arms spiral/twist
// Positive = clockwise spin, Negative = counter-clockwise
// Higher absolute values = tighter spiral
parameters.spin = 1;

// How much particles scatter away from the perfect spiral path
// 0 = perfect spiral, higher values = more scattered/realistic
parameters.randomness = 0.2;

// Controls the distribution curve of the randomness
// Higher values = particles cluster more toward the spiral arms
// This creates a more realistic galaxy shape
parameters.randomnessPower = 3;

// Color of particles at the center of the galaxy
// Typically warmer/brighter colors (like young hot stars)
parameters.insideColor = "#ff6030";

// Color of particles at the edge of the galaxy
// Typically cooler/darker colors (like older cooler stars)
parameters.outsideColor = "#1b3984";

// These will hold our galaxy geometry, material, and points object
// We need to track them so we can properly dispose and recreate the galaxy
let geometry = null;
let material = null;
let points = null;

/**
 * GENERATE GALAXY FUNCTION
 * This function creates the galaxy from scratch
 * It can be called multiple times to regenerate with new parameters
 */
const generateGalaxy = () => {
  /**
   * CLEANUP PREVIOUS GALAXY
   * Important: When creating BufferGeometry and Materials in Three.js,
   * we must manually dispose of them to prevent memory leaks.
   * We also remove the old points object from the scene.
   */
  if (points !== null) {
    geometry.dispose(); // Free geometry memory
    material.dispose(); // Free material memory
    scene.remove(points); // Remove from scene
  }

  /**
   * CREATE GALAXY GEOMETRY
   * BufferGeometry stores vertex data (positions, colors) efficiently
   */
  geometry = new THREE.BufferGeometry();

  /**
   * TYPED ARRAYS FOR PERFORMANCE
   * Float32Array is more efficient than regular JavaScript arrays
   * We need 3 values per particle (x, y, z) for both position and color (r, g, b)
   */
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  /**
   * COLOR OBJECTS
   * Three.js Color objects help us work with and interpolate colors
   */
  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  /**
   * PARTICLE GENERATION LOOP
   * For each particle, we calculate its position and color
   */
  for (let i = 0; i < parameters.count; i++) {
    /**
     * ARRAY INDEX
     * Since each particle needs 3 values (x,y,z), we multiply by 3
     * Particle 0: indices 0, 1, 2
     * Particle 1: indices 3, 4, 5, etc.
     */
    const i3 = i * 3;

    /**
     * CALCULATE RADIUS
     * Random distance from center (0 to max radius)
     * This spreads particles throughout the galaxy disk
     */
    const radius = Math.random() * parameters.radius;

    /**
     * CALCULATE SPIN ANGLE
     * Particles farther from center spin more
     * This creates the spiral effect
     * spinAngle increases linearly with radius
     */
    const spinAngle = radius * parameters.spin;

    /**
     * CALCULATE BRANCH ANGLE
     * Determines which spiral arm this particle belongs to
     *
     * How it works:
     * 1. (i % parameters.branches) gives us a value from 0 to (branches - 1)
     * 2. Dividing by parameters.branches gives us a fraction (0, 1/3, 2/3 for 3 branches)
     * 3. Multiplying by Math.PI * 2 (360 degrees) evenly distributes the arms
     *
     * Example with 3 branches:
     * - Particle 0: (0/3) * 2π = 0° (first arm)
     * - Particle 1: (1/3) * 2π = 120° (second arm)
     * - Particle 2: (2/3) * 2π = 240° (third arm)
     * - Particle 3: (0/3) * 2π = 0° (back to first arm)
     */
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    /**
     * CALCULATE RANDOMNESS OFFSETS
     * These add natural variation so particles don't sit perfectly on spiral lines
     *
     * Math.pow(Math.random(), randomnessPower):
     * - Creates a power curve distribution
     * - randomnessPower > 1 means most particles stay close to the spiral
     * - randomnessPower = 1 would be uniform distribution
     *
     * (Math.random() < 0.5 ? 1 : -1):
     * - Randomly chooses positive or negative direction
     * - This scatters particles on both sides of the spiral arm
     *
     * parameters.randomness * radius:
     * - Scales randomness with distance from center
     * - Particles farther out are more scattered (like real galaxies)
     */
    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    /**
     * SET PARTICLE POSITION
     * We use polar to cartesian coordinate conversion:
     *
     * X position:
     * - Math.cos(branchAngle + spinAngle) gives the X component of the spiral
     * - Multiply by radius to position along the arm
     * - Add randomX for natural variation
     *
     * Y position:
     * - Only uses randomY (no calculation)
     * - This keeps the galaxy mostly flat (like a disk)
     * - The randomness creates some vertical thickness
     *
     * Z position:
     * - Math.sin(branchAngle + spinAngle) gives the Z component of the spiral
     * - With cos for X and sin for Z, we create circular motion
     * - Add randomZ for natural variation
     */
    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    /**
     * CALCULATE PARTICLE COLOR
     * Colors transition from inside to outside of galaxy
     *
     * .clone() creates a copy so we don't modify the original color
     *
     * .lerp() (linear interpolation) blends two colors
     * - Second parameter (radius / parameters.radius) is the mix factor (0 to 1)
     * - 0 = fully insideColor (at center)
     * - 1 = fully outsideColor (at edge)
     * - Values in between create a smooth gradient
     *
     * This creates the effect of hot bright stars in the center
     * and cooler dim stars at the edges (like real galaxies)
     */
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);

    /**
     * SET COLOR VALUES
     * Store RGB components in the colors array
     */
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  /**
   * ATTACH ATTRIBUTES TO GEOMETRY
   * BufferAttribute wraps our typed arrays and tells Three.js:
   * - What the data represents (position/color)
   * - How many values per vertex (3 for x,y,z or r,g,b)
   */
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  /**
   * CREATE MATERIAL
   * PointsMaterial is specifically designed for particle systems
   */
  material = new THREE.PointsMaterial({
    // Size of each particle in world units
    size: parameters.size,

    // sizeAttenuation: particles get smaller with distance (perspective)
    // true = realistic depth, false = same size regardless of distance
    sizeAttenuation: true,

    // depthWrite: should particles write to the depth buffer?
    // false prevents rendering artifacts when particles overlap
    depthWrite: false,

    // blending: how particles blend with what's behind them
    // AdditiveBlending: adds colors together (creates glowing effect)
    // Perfect for stars/galaxies because overlapping particles get brighter
    blending: THREE.AdditiveBlending,

    // vertexColors: use the color attribute we defined above
    // Each particle can have its own color
    vertexColors: true,
  });

  /**
   * CREATE POINTS OBJECT
   * Points is a Three.js object that renders particles
   * It combines the geometry (positions) and material (appearance)
   */
  points = new THREE.Points(geometry, material);

  // Add the galaxy to the scene so it renders
  scene.add(points);
};

/**
 * ============================================
 * GUI CONTROLS FOR GALAXY PARAMETERS
 * ============================================
 * These controls allow real-time manipulation of galaxy parameters
 * onFinishChange() regenerates the galaxy when you stop adjusting a slider
 */

// Control particle count (100 to 1,000,000)
// Try: 100,000 for balance of detail and performance
gui
  .add(parameters, "count")
  .min(100)
  .max(1000000)
  .step(100)
  .onFinishChange(generateGalaxy);

// Control particle size (0.001 to 0.1)
// Try: 0.01 for realistic stars, 0.05 for more visible particles
gui
  .add(parameters, "size")
  .min(0.001)
  .max(0.1)
  .step(0.001)
  .onFinishChange(generateGalaxy);

// Control galaxy radius (0.01 to 20)
// Try: 5 for medium galaxy, 10 for large spread-out galaxy
gui
  .add(parameters, "radius")
  .min(0.01)
  .max(20)
  .step(0.01)
  .onFinishChange(generateGalaxy);

// Control number of spiral arms (2 to 20)
// Try: 2-4 for realistic galaxy, 8+ for abstract patterns
gui
  .add(parameters, "branches")
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy);

// Control spiral tightness (-5 to 5)
// Try: 1 for gentle spiral, -3 for reverse spin, 5 for tight curl
gui
  .add(parameters, "spin")
  .min(-5)
  .max(5)
  .step(0.001)
  .onFinishChange(generateGalaxy);

// Control how scattered particles are (0 to 2)
// Try: 0.2 for defined arms, 1.5 for chaotic cloud
gui
  .add(parameters, "randomness")
  .min(0)
  .max(2)
  .step(0.001)
  .onFinishChange(generateGalaxy);

// Control randomness distribution curve (1 to 10)
// Try: 3 for balanced distribution, 10 for very concentrated arms
gui
  .add(parameters, "randomnessPower")
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(generateGalaxy);

// Control center color
// Try: warm colors (#ff6030, #ff0000) for hot young stars
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);

// Control edge color
// Try: cool colors (#1b3984, #0000ff) for old cool stars
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

// Generate the initial galaxy on page load
generateGalaxy();

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
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
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

  controls.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
