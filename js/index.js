let scene, camera, raycaster, renderer, directionalLight, lightPosition4D, cubeArray;
let width = window.innerWidth;
let height = window.innerHeight;
let minSize = 5;
let maxSize = 80;
let maxVelocity = 1;
const cameraZ = 300;
const cubeQuantity = Math.floor(width / 15);

let spawnArea = {
  left: width / -2,
  right: width / 2,
  bottom: height / -2,
  top: height / 2,
  far: 50,
  near: 0
}

// WINDOW RESIZE
window.addEventListener('resize', function () {
  width = window.innerWidth;
  height = window.innerHeight;

  spawnArea.left = width / -2;
  spawnArea.right = width / 2;
  spawnArea.bottom = height / -2;
  spawnArea.top = height / 2;

  directionalLight.position.x = spawnArea.left;
  directionalLight.position.y = spawnArea.top;

  lightPosition4D.x = spawnArea.left;
  lightPosition4D.y = spawnArea.top;

  camera.left = spawnArea.left;
  camera.right = spawnArea.right;
  camera.top = spawnArea.top;
  camera.bottom = spawnArea.bottom;

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}, false);

// MOUSE CLICK
window.addEventListener('click', function () {
  if (INTERSECTED) {
    INTERSECTED.gravity = true
    INTERSECTED.reroll();
  }
}, false);

// MOUSE MOVE
document.addEventListener('mousemove', function (e) {
  e.preventDefault();
  mouse.x = (e.clientX / width) * 2 - 1;
  mouse.y = -(e.clientY / height) * 2 + 1;
}, false);


class Cube {
  constructor() {

    this.build = function (args) {
      args = args || {};
      this.size = args.size || this.getRandomIntFromRange(this.minSize, this.maxSize);
      // Cube mesh geometric properties
      this.cube.scale.x = this.size / 10;
      this.cube.scale.y = this.size / 10;
      this.cube.scale.z = this.size / 10;
      this.cube.position.x = args.posX || this.getRandomIntFromRange(spawnArea.left - maxSize, spawnArea.right + maxSize);
      this.cube.position.y = args.posY || this.getRandomIntFromRange(spawnArea.bottom - maxSize, spawnArea.top + maxSize);
      this.cube.position.z = args.posZ || this.getRandomIntFromRange(spawnArea.far, spawnArea.near);
      this.cube.rotation.x = args.rotX || this.getRandomIntFromRange(0, 360);
      this.cube.rotation.y = args.rotY || this.getRandomIntFromRange(0, 360);
      this.cube.rotation.z = args.rotZ || this.getRandomIntFromRange(0, 360);
      // Rotational velocity
      this.rx = args.rx || (this.getRandomIntFromRange(-100, 100) / 5000);
      this.ry = args.ry || (this.getRandomIntFromRange(-100, 100) / 5000);
      this.rz = args.rz || (this.getRandomIntFromRange(-100, 100) / 5000);
      // Translational velocity
      this.velocity = new THREE.Vector3(this.getRandomIntFromRange(-3, 3), this.getRandomIntFromRange(-3, 3), 0);
      // Larger cubes have higher friction and move slower
      this.friction = 1 + this.size / 50;
      this.cube.gravity = false;
    };

    this.init = function (args) {
      args = args || {};
      this.minSize = args.minSize || 10;
      this.maxSize = args.maxSize || 10;
      let scale = 0.2; // maxSize / 8;
      // this.geometry = new THREE.BoxBufferGeometry(10, 10, 10);
      // this.geometry = new THREE.IcosahedronBufferGeometry(maxSize / 8, 1); // radius, ?
      // this.geometry = createShapeGeometry(6, maxSize / 2); // n, circumradius

      // Next 12 geometries from https://threejs.org/examples/#webgl_geometries
      this.geometries = [];
      this.geometries.push(new THREE.SphereBufferGeometry(75 * scale / 2, 20, 10));
      // this.geometries.push(new THREE.IcosahedronBufferGeometry(75 * scale/2, 1));
      // this.geometries.push(new THREE.OctahedronBufferGeometry(75 * scale/2, 2));
      this.geometries.push(new THREE.TetrahedronBufferGeometry(75 * scale, 0));
      // this.geometries.push(new THREE.PlaneBufferGeometry(100 * scale, 100 * scale, 4, 4));
      this.geometries.push(new THREE.BoxBufferGeometry(100 * scale / 2, 100 * scale / 2, 100 * scale / 2, 4, 4, 4));
      // this.geometries.push(new THREE.CircleBufferGeometry(50 * scale, 20, 0, Math.PI * 2));
      this.geometries.push(new THREE.RingBufferGeometry(10 * scale, 50 * scale, 20, 5, 0, Math.PI * 2));
      this.geometries.push(new THREE.CylinderBufferGeometry(20 * scale, 20 * scale, 80 * scale, 40, 5));
      var points = [];
      for (var i = 0; i < 50; i++) {
        points.push(new THREE.Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 * scale + 50 * scale, (i - 5) * 2));
      }
      // this.geometries.push(new THREE.LatheBufferGeometry(points, 20));
      this.geometries.push(new THREE.TorusBufferGeometry(40 * scale, 15 * scale, 20, 20));
      this.geometries.push(new THREE.TorusKnotBufferGeometry(50 * scale, 10 * scale, 50, 20));

      let pick = this.getRandomIntFromRange(1, this.geometries.length);
      this.geometry = this.geometries[pick-1];

      const cubeColors = randomColor({
        count: 2,
        hue: 'random',
        luminosity: 'dark'
      });

      this.material = new THREE.MeshLambertMaterial({
        color: args.color || cubeColors[0],
        emissive: cubeColors[1]
      });

      this.cube = new THREE.Mesh(this.geometry, this.material);
      this.cube.stayInPlace = false;
      this.build(args);
      scene.add(this.cube);
    };

    this.reroll = function () {
      // Mulligan the shape (reroll geometry)
      let pick = this.getRandomIntFromRange(1, this.geometries.length);
      this.geometry = this.geometries[pick - 1];
    };

    this.animate = function () {
      // this.reroll();

      // Adjust rotation by rotational velocity
      this.cube.rotation.x += this.rx;
      this.cube.rotation.y += this.ry;
      this.cube.rotation.z += this.rz;

      // Randomly perturb velocity (gettin jiggy wit it) but clamp if too fast (don't get TOO jiggy)
      this.velocity.x += (this.velocity.x < maxVelocity ? this.getRandomFloatFromRange(-0.2, 0.2) : 0);
      this.velocity.y += (this.velocity.y < maxVelocity ? this.getRandomFloatFromRange(-0.2, 0.2) : 0);

      // Axis Movement
      if (this.cube.gravity) {
        // Apply velocity with friction to make larger cubes move slower
        this.cube.position.x -= this.velocity.x * this.friction;
        this.cube.position.y -= this.velocity.y * this.friction;
        this.cube.position.z -= this.velocity.z * this.friction;
      } else if (!this.cube.stayInPlace) {
        this.cube.position.x += this.velocity.x;
        this.cube.position.y += this.velocity.y;
        this.cube.position.z += this.velocity.z;
      }

      // If cube went out of bounds, move to opposite side of window
      if (this.cube.position.y >= spawnArea.top + maxSize) { // top
        this.cube.position.y = spawnArea.bottom - maxSize; // bottom
      } else if (this.cube.position.y < spawnArea.bottom - maxSize) { // bottom
        this.cube.position.y = spawnArea.top + maxSize; // top
      } else if (this.cube.position.x < spawnArea.left - maxSize) { // left
        this.cube.position.x = spawnArea.right + maxSize; // right
      } else if (this.cube.position.x >= spawnArea.right + maxSize) { // right
        this.cube.position.x = spawnArea.left - maxSize; // left
      }
    };

    this.getRandomFloatFromRange = function(min, max) {
      return Math.random() * (max - min) + min;
    }

    this.getRandomIntFromRange = function (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
  }
}

// Create a new shape for a regular n-gon-ahedron
// Source: https://stackoverflow.com/questions/18514423/generating-a-regular-polygon-with-three-js
function createShapeGeometry(n, circumradius) {

  var shape = new THREE.Shape(),
    vertices = [],
    x;

  // Calculate the vertices of the n-gon.
  for (x = 1; x <= sides; x++) {
    vertices.push([
      circumradius * Math.sin((Math.PI / n) + (x * ((2 * Math.PI) / n))),
      circumradius * Math.cos((Math.PI / n) + (x * ((2 * Math.PI) / n)))
    ]);
  }

  // Start at the last vertex.
  shape.moveTo.apply(shape, vertices[sides - 1]);

  // Connect each vertex to the next in sequential order.
  for (x = 0; x < n; x++) {
    shape.lineTo.apply(shape, vertices[x]);
  }

  // It's shape and bake... and I helped!
  return new THREE.ShapeGeometry(shape);
}

// INITIALIZE SCENE
function init() {
  scene = new THREE.Scene();
  cubeArray = [];

  // Generate cubes.
  for (let i = 0; i < cubeQuantity; i++) {
    cubeArray.push(new Cube());
    cubeArray[i].init({
      minSize: minSize,
      maxSize: maxSize
    });
  }

  // Add ambient and directional light to the scene.
  let ambientLight = new THREE.AmbientLight('#ffffff', 0.3);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight('#ffffff', 1);
  directionalLight.position.x = spawnArea.left;
  directionalLight.position.y = spawnArea.top;
  directionalLight.position.z = cameraZ;
  directionalLight.lookAt(scene.position);
  scene.add(directionalLight);

  // Set up the scene camera.
  camera = new THREE.OrthographicCamera(
    spawnArea.left,
    spawnArea.right,
    spawnArea.top,
    spawnArea.bottom,
    1,
    cameraZ * 2
  );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = cameraZ;
  camera.lookAt(scene.position);

  // Raycaster allows us to interact with the mouse.
  raycaster = new THREE.Raycaster();

  // Initialize the renderer.
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.domElement.id = "cubeCanvas";
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
}

// ANIMATE SCENE
function animate() {
  // Animate the cubes.
  for (let i = 0; i < cubeArray.length; i++) {
    cubeArray[i].animate();
  }

  // Look for mouse inteactions. See https://threejs.org/examples/#webgl_interactive_cubes.
  raycaster.setFromCamera(mouse, camera);
  let intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
        INTERSECTED.stayInPlace = false;
      }
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      INTERSECTED.material.color.setHex(0x913599);
      INTERSECTED.stayInPlace = true;
      document.getElementById("cubeCanvas").style.cursor = "pointer";
    }
  }
  else {
    if (INTERSECTED) {
      INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
      INTERSECTED.stayInPlace = false;
    }
    INTERSECTED = null;
    document.getElementById("cubeCanvas").style.cursor = "default";
  }

  // Render and loop the animation.
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize mouse detection.
let mouse = new THREE.Vector2();
let INTERSECTED;
mouse.x = 0;
mouse.y = 0;

// Initialize the scene.
init();
animate();
