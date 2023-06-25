import * as THREE from 'three';
import { TextureLoader } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

  // create scened and renderer and camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  viewport.appendChild(renderer.domElement);

  // add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  // controls.autoRotate = true;
  // controls.enableDamping = true;
  // controls.dampingFactor = 0.05;

  camera.position.z = 3;

  // declaring the bone ouside the load
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

    renderer.render(scene, camera);
  }

  animate();

  // --- load 3d async
  const assets = load();
  assets.then((data) => {
    const robot = data.robot.scene;
    const { animations } = data.robot;

    // console.log(animations);

    robot.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial();
        //child.material.wireframe = true;
        child.material.map = data.texture;
      }

      if (child.isBone) {
        // console.log(child.name);
        if (child.name === 'bb_neck') {
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
  });
}

/* Loader Functions */
async function load() {
  const robot = await loadModel(
    'https://uploads-ssl.webflow.com/648c93d1de00e945bb8365a3/649849d0e789129d13692b36_robot.v3-live.glb.txt'
  );

  const texture = await loadTexture(
    'https://uploads-ssl.webflow.com/648c93d1de00e945bb8365a3/649811ff6a5e21b5fd717436_robot-texture.png'
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
