let scene, camera, raycaster, renderer, directionalLight, lightPosition4D, cubeArray;
let width = window.innerWidth;
let height = window.innerHeight;
let minSize = 50;
let maxSize = 50;
const cameraZ = 300;
const cubeQuantity = Math.floor(width / 75);

let spawnArea = {
  left: width / -2,
  right: width / 2,
  bottom: height / -2,
  top: height / 2,
  far: 50,
  near: 0
}

window.addEventListener('resize', function () {
  width = window.innerWidth;
  height = window.innerHeight;

  spawnArea.left = width / -2;
  spawnArea.right = width / 2;
  spawnArea.bottom = height / -2;
  spawnArea.top = height / 2;

  directionalLight.position.x = spawnArea.left;
  directionalLight.position.y = spawnArea.top;

  lightPosition4D.x = directionalLight.position.x;
  lightPosition4D.y = directionalLight.position.y;

  camera.left = spawnArea.left;
  camera.right = spawnArea.right;
  camera.top = spawnArea.top;
  camera.bottom = spawnArea.bottom;

  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}, false);

window.addEventListener('click', function () {
  if (INTERSECTED) {
    INTERSECTED.gravity = true
  }
}, false);

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
      this.cube.scale.x = this.size / 10;
      this.cube.scale.y = this.size / 10;
      this.cube.scale.z = this.size / 10;
      this.vy = args.vy || (this.getRandomIntFromRange(50, 250) / 750); //(this.getRandomIntFromRange(50, 150)/1000);
      this.rx = args.rx || (this.getRandomIntFromRange(-100, 100) / 100000);
      this.ry = args.ry || (this.getRandomIntFromRange(-100, 100) / 100000);
      this.rz = args.rz || (this.getRandomIntFromRange(-100, 100) / 100000);
      this.cube.position.x = args.posX || this.getRandomIntFromRange(spawnArea.left, spawnArea.right);
      this.cube.position.y = args.posY || this.getRandomIntFromRange(spawnArea.bottom - (maxSize * 1.5), spawnArea.top - (maxSize * 1.5));
      this.cube.position.z = args.posZ || this.getRandomIntFromRange(spawnArea.far, spawnArea.near);
      this.cube.rotation.x = args.rotX || this.getRandomIntFromRange(0, 360);
      this.cube.rotation.y = args.rotY || this.getRandomIntFromRange(0, 360);
      this.cube.rotation.z = args.rotZ || this.getRandomIntFromRange(0, 360);
      this.friction = 1 + this.size / 1000;
      this.cube.gravity = false;

      // TODO: This is basic movement detection only.
      // https://stackoverflow.com/questions/35495812/move-an-object-along-a-path-or-spline-in-threejs
      this.direction = new THREE.Vector3(0, 1, 0);
      this.vector = this.direction.clone().multiplyScalar(this.vy, this.vy, this.vy);
    };

    this.init = function (args) {
      args = args || {};
      this.minSize = args.minSize || 10;
      this.maxSize = args.maxSize || 10;
      this.geometry = new THREE.BoxBufferGeometry(10, 10, 10);

      const cubeColor = randomColor();
      const emissiveColor = randomColor();

      this.material = new THREE.MeshLambertMaterial({
        color: args.color || cubeColor,
        emissive: emissiveColor
      });

      this.cube = new THREE.Mesh(this.geometry, this.material);
      this.cube.stayInPlace = false;
      this.build(args);
      scene.add(this.cube);
    };

    this.animate = function () {
      // Rotation
      this.cube.rotation.x += this.rx;
      this.cube.rotation.y += this.ry;
      this.cube.rotation.z += this.rz;

      // Axis Movement
      if (this.cube.gravity) {
        this.vector.y = (this.vector.y >= 20) ? this.vector.y : this.vector.y * this.friction;
        this.cube.position.y -= this.vector.y;
      } else if (!this.cube.stayInPlace) {
        this.cube.position.y += this.vector.y;
      }

      // Respawn at Bottom of window
      if (this.cube.position.y >= spawnArea.top + (maxSize * 1.5) || this.cube.position.y < (spawnArea.bottom - maxSize)) {
        this.build({
          posY: spawnArea.bottom - (maxSize)
        });
      }
    };

    this.getRandomIntFromRange = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
  }
}

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
  let ambientLight = new THREE.AmbientLight('#ffffff', 0.2);
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

  //Add element
  document.body.appendChild(renderer.domElement);

}

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
        //INTERSECTED.stayInPlace = false;
      }
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
      INTERSECTED.material.color.setHex(0x913599);
      //INTERSECTED.stayInPlace = true;
      document.getElementById("cubeCanvas").style.cursor = "pointer";
    }
  }
  else {
    if (INTERSECTED) {
      INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
      //INTERSECTED.stayInPlace = false;
    }
    INTERSECTED = null;
    document.getElementById("cubeCanvas").style.cursor = "default";
  }

  // Render and loop the animation.
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initialize mouse detection.
let mouse = new THREE.Vector2(), INTERSECTED;
mouse.x = 0;
mouse.y = 0;

// Initialize the scene.
init();
animate();
