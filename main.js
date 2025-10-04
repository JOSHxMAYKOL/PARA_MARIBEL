// Importamos los componentes necesarios de la librería Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. INICIALIZACIÓN BÁSICA
// =================================================================
// Escena: El contenedor de todos nuestros objetos 3D.
const scene = new THREE.Scene();

// Cámara: Define qué parte de la escena se ve.
// PerspectiveCamera(campo de visión, relación de aspecto, plano cercano, plano lejano)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20); // Posición inicial de la cámara

// Renderizador: Dibuja la escena en el canvas del HTML.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Añadimos el canvas al body del HTML.


// 2. CONTROLES DE LA CÁMARA (Para mover en 360°)
// =================================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Agrega una suave "inercia" al movimiento.
controls.dampingFactor = 0.05;
controls.minDistance = 5;      // Zoom mínimo
controls.maxDistance = 100;    // Zoom máximo
controls.autoRotate = true;    // Opcional: hace que la cámara gire sola.
controls.autoRotateSpeed = 0.5;


// 3. SKYBOX (El fondo de nebulosa)
// =================================================================
const textureLoader = new THREE.TextureLoader();
textureLoader.load('./assets/nebula_skybox_16k.jpg', (texture) => {
    // Configuramos la textura para que se mapee correctamente en una esfera.
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture; // Opcional: ilumina el modelo con el entorno.
    console.log("Skybox cargado correctamente.");
});


// 4. CARGAR EL MODELO 3D (.glb) DEL AGUJERO NEGRO
// =================================================================
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/black_hole.glb', (gltf) => {
    const blackHole = gltf.scene;
    blackHole.position.set(0, 0, 0); // Centramos el modelo en la escena.
    scene.add(blackHole);
    console.log("Modelo de agujero negro cargado.");
}, undefined, (error) => {
    console.error("Error al cargar el modelo:", error);
});


// 5. ILUMINACIÓN (Opcional pero recomendado)
// =================================================================
// Una luz ambiental ilumina todos los objetos de la escena de manera uniforme.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);


// 6. BUCLE DE ANIMACIÓN
// =================================================================
// Esta función se llama en un bucle constante para redibujar la escena.
function animate() {
    requestAnimationFrame(animate);

    // Actualizamos los controles para que el movimiento de la cámara sea suave.
    controls.update();

    // Renderizamos la escena desde el punto de vista de la cámara.
    renderer.render(scene, camera);
}

// Inicia el bucle de animación.
animate();


// 7. RESPONSIVIDAD
// =================================================================
// Ajusta la cámara y el renderizador si el usuario cambia el tamaño de la ventana.
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 3. CREAR LAS PARTÍCULAS (ESTRELLAS) AHORA MÁS LEJANAS ---
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000; // Incrementamos el número para llenar el espacio más grande
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    // Nuevo valor de dispersión: 3000 (antes era 2000)
    // Esto significa que las estrellas estarán entre -1500 y 1500 en cada eje.
    const spread = 3000; 

    for (let i = 0; i < starCount; i++) {
        // Posición aleatoria en un cubo mucho más grande
        const x = THREE.MathUtils.randFloatSpread(spread); 
        const y = THREE.MathUtils.randFloatSpread(spread);
        const z = THREE.MathUtils.randFloatSpread(spread);
        positions.push(x, y, z);

        // Colores para las estrellas
        color.setHSL(Math.random() * 0.2 + 0.5, 0.5, Math.random() * 0.5 + 0.5); 
        colors.push(color.r, color.g, color.b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 1.2, // Reducimos el tamaño de los puntos (antes era 2)
        vertexColors: true, 
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}
// El resto del código permanece igual.