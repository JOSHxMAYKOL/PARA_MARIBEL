import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";
import { FontLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/TextGeometry.js";

console.clear();

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 15, 50);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
})

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// (El resto del código de la galaxia y las estrellas no cambia)
let gu = {
  time: {value: 0}
}

let sizes = [];
let shift = [];
let particleType = []; 

let pushShift = (isStar = false) => {
  shift.push(
    Math.random() * Math.PI, 
    Math.random() * Math.PI * 2, 
    (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
    isStar ? Math.random() * 0.1 : Math.random() * 0.9 + 0.1
  );
}

let pts = [];

let corePts = new Array(50000).fill().map(p => {
  sizes.push(Math.random() * 1.5 + 0.5);
  pushShift();
  particleType.push(0.0);
  return new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5);
});

let diskPts = [];
for(let i = 0; i < 100000; i++){
  let r = 10, R = 40;
  let rand = Math.pow(Math.random(), 1.5);
  let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
  diskPts.push(new THREE.Vector3().setFromCylindricalCoords(radius, Math.random() * 2 * Math.PI, (Math.random() - 0.5) * 2 ));
  sizes.push(Math.random() * 1.5 + 0.5);
  pushShift();
  particleType.push(0.0);
}

let starPts = [];
for (let i = 0; i < 80000; i++) {
    sizes.push(Math.random() * 1.0 + 0.2);
    pushShift(true);
    particleType.push(1.0);
    
    let distance = 0;
    if (Math.random() < 0.3) {
      distance = Math.random() * 70 + 30;
    } else {
      distance = Math.random() * 200 + 100;
    }
    starPts.push(new THREE.Vector3().randomDirection().multiplyScalar(distance));
}

pts = [...corePts, ...diskPts, ...starPts];

let g = new THREE.BufferGeometry().setFromPoints(pts);
g.setAttribute("sizes", new THREE.Float32Attribute(sizes, 1));
g.setAttribute("shift", new THREE.Float32Attribute(shift, 4));
g.setAttribute("isStar", new THREE.Float32Attribute(particleType, 1));

const PI2 = Math.PI * 2;

let m = new THREE.PointsMaterial({
  size: 0.125,
  transparent: true,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  onBeforeCompile: shader => {
    shader.uniforms.time = gu.time;
    shader.vertexShader = `
      uniform float time;
      attribute float sizes;
      attribute vec4 shift;
      attribute float isStar;
      varying vec3 vColor;
      ${shader.vertexShader}
    `.replace(
      `gl_PointSize = size;`,
      `gl_PointSize = size * sizes;`
    ).replace(
      `#include <color_vertex>`,
      `#include <color_vertex>
        if (isStar > 0.5) {
          vColor = vec3(1.0, 1.0, 1.0);
        } else {
          float d = length(abs(position) / vec3(40., 10., 40));
          d = clamp(d, 0., 1.);
          vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
        }
      `
    ).replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        float t = time;
        float moveT = mod(shift.x + shift.z * t, PI2);
        float moveS = mod(shift.y + shift.z * t, PI2);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
      `
    );
    shader.fragmentShader = `
      varying vec3 vColor;
      ${shader.fragmentShader}
    `.replace(
      `#include <clipping_planes_fragment>`,
      `#include <clipping_planes_fragment>
        float d = length(gl_PointCoord.xy - 0.5);
      `
    ).replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d) );`
    );
  }
});

let p = new THREE.Points(g,m);
p.rotation.order ="ZYX";
p.rotation.z = 0.2;
scene.add(p)

// --- AÑADIR TEXTO 3D ---
const fontLoader = new FontLoader();
// ¡CAMBIO DE FUENTE AQUÍ! Usamos "gentilis" en lugar de "helvetiker".
const fontURL = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/fonts/gentilis_regular.typeface.json';

fontLoader.load(fontURL, function (font) {
  const textGeometry = new TextGeometry('TE AMO MARIBEL', {
    font: font,
    size: 5,
    height: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 5
  });

  textGeometry.center();
  const textMaterial = new THREE.MeshPhongMaterial({ color: 0xFF69B4 }); // Rosado
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);

  textMesh.position.y = 15;
  textMesh.rotation.x = -Math.PI / 10;
  
  scene.add(textMesh);
});

// Añadir luces para el texto
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 20, 10);
scene.add(directionalLight);


let clock = new THREE.Clock();

renderer.setAnimationLoop(()=> {
  controls.update();
  let t = clock.getElapsedTime() * 0.5;
  gu.time.value = t * Math.PI;
  p.rotation.y = t * 0.05;
  renderer.render(scene , camera);
});