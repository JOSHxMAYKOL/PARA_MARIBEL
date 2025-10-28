import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";
import { FontLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/geometries/TextGeometry.js";

console.clear();

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1500);
camera.position.set(0, 25, 100);
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

// (Código de la galaxia y las estrellas - SIN CAMBIOS)
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

const PI2 = Math.PI * 2; // Esta variable se usará en el shader

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
      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // Se inyecta el valor de PI2 (definido en JS) dentro del string del shader GLSL
      `#include <begin_vertex>
        float t = time;
        const float PI2_GLSL = ${PI2}; // <-- Se define la constante en GLSL
        float moveT = mod(shift.x + shift.z * t, PI2_GLSL); // <-- Se usa la constante
        float moveS = mod(shift.y + shift.z * t, PI2_GLSL); // <-- Se usa la constante
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
p.rotation.z = 0; 
scene.add(p);

// --- OBJETOS DE TEXTO E IMÁGENES ---
const floatingContentGroup = new THREE.Group();
scene.add(floatingContentGroup);
const billboardObjects = [];

const halagos = [
  "Eres mi todo.", "Me encantas.", "Te adoro.", "Solo tú.", "Eres increíble.", "Eres hermosa.",
  "Eres maravillosa.", "Eres preciosa.", "Eres perfecta.", "Eres mi luz.", "Qué bella.", "Me fascinas.",
  "Sé mi novia.", "¿Quieres ser mi novia?", "¿Aceptas ser mi novia?",
  "Tu risa es mi favorita.", "Qué ojitos tienes.", "Me vuelves loco.", "Eres un sol.",
  "Qué suerte tenerte.", "Eres mi calma.", "Te admiro mucho.", "Qué bonita eres.", "Te quiero a mi lado.",
  "Me haces feliz.", "Pienso en ti siempre.", "Mi día eres tú.", "Eres mi razón.", "Cambiaste mi vida.",
  "Contigo, todo.", "Eres especial.", "Te necesito.", "Esto es real.", "Qué ojos mas hermosos.", "Estás radiante.",
  "Tu sonrisa me mata de amor", "Qué bien te ves hoy.", "Tu pelo es increíble.", "Eres divina.",
  "Eres arte.", "Qué labios.", "Perfecta.", "Mi reina.", "Mi chica ideal.", "Eres brillante.",
  "Qué inteligente.", "Eres la mejor.", "Qué dulce.", "Tu risa es magia.", "Qué valiente.",
  "Me inspiras.", "Eres admirable.", "Qué fuerza.", "Me diviertes.", "Qué gran corazón.",
  "Eres única.", "Me sorprendes.", "Qué energía.", "Te amo.", "Me enamoras.", "Pienso en ti.",
  "Mi vida eres tú.", "Mi otra mitad.", "Te necesito.", "Eres mi deseo.", "Eres mi sueño.", "Soy tuyo.",
  "Lo eres todo.", "Este amor es real.", "Eres mi paz.", "Mi lugar seguro.", "Me calmas.",
  "Qué suerte la mía.", "Eres mi hogar.", "Mi mejor momento.", "Mejor contigo.", "Me completas.",
  "Eres la razón.", "Qué conexión.", "Mi destino.", "Qué alegría.", "Eres mi favorita.", "Qué tierna.", "Me has ganado.", "Qué maravilla.", "Eres magia.",
  "Soy tu fan.", "Me encantas completa.", "Qué gran persona.", "Eres un regalo.", "Mi bendición.",
  "Eres mi meta.", "Increíble tú.", "Te quiero siempre.", "Quédate conmigo.", "Juntos, ¿sí?",
  "Mi futuro eres tú.", "Quiero una vida contigo.", "Eres mi elección.", "Te elijo a ti.",
  "Eres mi plan.", "Quiero cuidarte.", "Te veo en todo.", "Mi amor.", "Mi cielo.", "Mi corazón.",
  "Mi vida.", "Mi dueña.", "Eres un milagro.", "No hay otra igual.", "Mi adicción.", "Mi obsesión.",
  "La mejor del mundo.", "Qué suerte verte.", "Te mereces todo.", "Mi crush eterno.", "Contigo me quedo.",
  "Eres mi razón de ser."
];

const imageUrlsBase = './'; // Tus imágenes deben estar en la misma carpeta
const imageFiles = [];
for (let i = 1; i <= 100; i++) {
  imageFiles.push(`${imageUrlsBase}img-${i}.jpg`);
}

const allContent = [];
halagos.forEach(text => allContent.push({ type: 'text', value: text }));
imageFiles.forEach(url => allContent.push({ type: 'image', value: url }));

const fontLoader = new FontLoader();
const textureLoader = new THREE.TextureLoader();

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN 2! ---
// URL de la fuente más estable
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.136.0/examples/fonts/gentilis_regular.typeface.json';

fontLoader.load(fontURL, function (font) {
  
  const mainTextMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1493 });
  const floatingTextMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1493 });

  const mainTextGeometry = new TextGeometry('TE AMO MARIBEL', {
    font: font, size: 5, height: 0.5, curveSegments: 12, bevelEnabled: true,
    bevelThickness: 0.1, bevelSize: 0.1, bevelOffset: 0, bevelSegments: 5
  });
  mainTextGeometry.center();
  const mainTextMesh = new THREE.Mesh(mainTextGeometry, mainTextMaterial);
  mainTextMesh.position.y = 15;
  scene.add(mainTextMesh);
  billboardObjects.push(mainTextMesh);
  
  allContent.forEach((item) => {
    const pos = new THREE.Vector3().randomDirection();
    const randomRadius = 40 + Math.random() * 50;
    pos.multiplyScalar(randomRadius);
    
    if (item.type === 'text') {
      const textGeo = new TextGeometry(item.value, { font: font, size: 1.5, height: 0.1 });
      textGeo.center();
      const textMesh = new THREE.Mesh(textGeo, floatingTextMaterial);
      textMesh.position.copy(pos);
      floatingContentGroup.add(textMesh);
      billboardObjects.push(textMesh);
    } else if (item.type === 'image') {
      textureLoader.load(item.value, function(texture) {
        const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
        const planeGeometry = new THREE.PlaneGeometry(8, 8);
        const imageMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        imageMesh.position.copy(pos);
        floatingContentGroup.add(imageMesh);
        billboardObjects.push(imageMesh);
      });
    }
  });
});

// --- SISTEMA DE CORAZONES ALREDEDOR DE LA GALAXIA ---
let galaxyHearts;
const heartParticleCount = 1500;
const heartTextureUrl = './corazon.svg'; // Tu corazón debe estar en la misma carpeta

textureLoader.load(heartTextureUrl, (texture) => {
  const heartGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(heartParticleCount * 3);
  const colors = new Float32Array(heartParticleCount * 3);

  const color = new THREE.Color(0xFF69B4);

  for (let i = 0; i < heartParticleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // ¡CAMBIO AQUÍ! Hacer el anillo más ancho
    const radius = 15 + Math.random() * 90; // Ahora el radio varía entre 15 y 105 (ancho de 90)
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 100;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    color.setHSL(0.9 + Math.random() * 0.1, 1, 0.7 + Math.random() * 0.2);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  heartGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  heartGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const heartMaterial = new THREE.PointsMaterial({
    map: texture,
    size: 2.5,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  galaxyHearts = new THREE.Points(heartGeometry, heartMaterial);
  scene.add(galaxyHearts);
});

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

  billboardObjects.forEach(obj => {
    obj.lookAt(camera.position);
  });

  floatingContentGroup.rotation.y = t * -0.05;
  floatingContentGroup.rotation.x = t * 0.02;

  if (galaxyHearts) {
    galaxyHearts.rotation.y = t * 0.05;
  }

  renderer.render(scene , camera);
});