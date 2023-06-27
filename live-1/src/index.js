import * as THREE from 'three';
import { TextureLoader } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

window.Webflow ||= [];
window.Webflow.push(() => {
  // console.log('hello');
  init3D();
});

// Init Function
function init3D() {
  // select container
  const viewport = document.querySelector('[data-3d="c"]');
  // console.log(viewport);

  // create scene, renderer, and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true }); // Pass { alpha: true } to enable transparency
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set background color to black with opacity 0
  renderer.setClearAlpha(0); // Set opacity of background color to 0
  renderer.autoClear = false; // Disable automatic clearing of the rendering buffer
  viewport.appendChild(renderer.domElement);

  // add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  // controls.autoRotate = true;
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.05;

  // declaring the bone outside the load
  let neckBone = null;

  // animation setup
  let clock = new THREE.Clock();
  let mixer = null;

  const mouse = {
    x: 0,
    y: 0,
  };

  // --- event listeners
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // console.log(mouse.x);
  });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (mixer !== null) {
      mixer.update(clock.getDelta());
    }

    if (neckBone !== null) {
      neckBone.rotation.y = mouse.x;
      neckBone.rotation.x = -mouse.y;
    }

    renderer.clear();
    renderer.render(scene, camera);
  }

  animate();

  // --- load 3d async
  const assets = load();
  assets.then((data) => {
    const robot = data.robot.scene;
    const { animations } = data.robot;

    robot.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial();
        //child.material.wireframe = true;
        child.material.map = data.texture;
      }
      console.log(child.name);
      if (child.isBone) {
        if (child.name === 'mixamorigHead') {
          neckBone = child;
        }
      }
    });

    // initialize mixer after robot is loaded
    mixer = new THREE.AnimationMixer(robot);
    const action = mixer.clipAction(animations[0]);
    action.play();

    robot.position.y = -1;
    scene.add(robot);
    console.log(robot);
    robot.children[0].children[2].children[0].material.color.setHex(0xca4639);
    robot.children[0].children[2].children[1].material.color.setHex(0xaabfe8);

    // Set linear gradient texture for the desired part
    robot.children[0].children[2].children[2].material.map = createLinearGradientTexture();

    robot.children[0].children[2].children[3].material.color.setHex(0x68ed4c);
    robot.children[0].children[2].children[4].material.color.setHex(0x68ed4c);
    robot.children[0].children[2].children[5].children[0].material.color.setHex(0xeada2d);
    robot.children[0].children[2].children[5].children[1].material.color.setHex(0xffffff);
    robot.children[0].children[2].children[6].material.color.setHex(0xeada2d);
    //robot.children[0].children[2].children[7].children[0].material.color.setHex(0xca4639);

    // Position camera in front of the model
    const modelBoundingBox = new THREE.Box3().setFromObject(robot);
    const modelSize = modelBoundingBox.getSize(new THREE.Vector3());
    const modelCenter = modelBoundingBox.getCenter(new THREE.Vector3());

    const modelDistance = Math.max(modelSize.x, modelSize.y, modelSize.z) * 1.5;
    const cameraPosition = modelCenter.clone().add(new THREE.Vector3(0, 0, modelDistance));

    camera.position.copy(cameraPosition);
    camera.lookAt(modelCenter);
  });
}

function createLinearGradientTexture() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#eaba2d');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.flipY = false;

  return texture;
}

/* Loader Functions */
async function load() {
  const robot = await loadModel(
    'https://uploads-ssl.webflow.com/648c93d1de00e945bb8365a3/649ade4a5da4e011fb64b2f3_scene.glb.txt'
  );

  const texture = await loadTexture(
    'https://uploads-ssl.webflow.com/648c93d1de00e945bb8365a3/649b1f46d3b1b2a04077a3af_Astronauta_Buono_4k-Paint-Brush_Normal.png'
  );

  return { robot, texture };
}

const textureLoader = new TextureLoader();
const modelLoader = new GLTFLoader();

function loadTexture(url) {
  return new Promise((resolve) => {
    textureLoader.load(url, (data) => {
      data.needsUpdate = true;
      data.flipY = false;

      resolve(data);
    });
  });
}

function loadModel(url, id) {
  return new Promise((resolve, reject) => {
    modelLoader.load(url, (gltf) => {
      console.log(gltf);
      const { scene } = gltf;
      const { animations } = gltf;
      resolve({ scene, animations });
    });
  });
}
