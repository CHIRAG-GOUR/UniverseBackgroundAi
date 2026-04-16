import * as THREE from 'three';
import './style.css';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#02040c', 0.0015);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Create circular particle texture for stars
const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
        context.beginPath();
        context.arc(16, 16, 14, 0, Math.PI * 2);
        context.fillStyle = '#ffffff';
        context.fill();
    }
    return new THREE.CanvasTexture(canvas);
};
const starTexture = createCircleTexture();

// Universe Starfield Generation
const starsGeometry = new THREE.BufferGeometry();
const starCount = 20000;
const posArray = new Float32Array(starCount * 3);
const colorsArray = new Float32Array(starCount * 3);
const sizesArray = new Float32Array(starCount);

const colorPalette = [
    new THREE.Color('#6b32a8'), // Deep Violet
    new THREE.Color('#2196F3'), // Light Blue
    new THREE.Color('#ffc107'), // Star Gold
    new THREE.Color('#ffffff')  // Pure White
];

for (let i = 0; i < starCount; i++) {
    // Spherical distribution mapped to cube for deep warp effect
    posArray[i * 3] = (Math.random() - 0.5) * 250;      // x
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 250;  // y
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 500;  // z depth is very deep

    // Assign random color from palette
    const randColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colorsArray[i * 3] = randColor.r;
    colorsArray[i * 3 + 1] = randColor.g;
    colorsArray[i * 3 + 2] = randColor.b;

    // Assign varying sizes based on index to create depth
    sizesArray[i] = Math.random() * 2;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
// Since PointsMaterial doesn't natively support size arrays without shaders easily, we will stick to one size attribute or use a ShaderMaterial later if needed. For now uniform size with texture works great.

// Particle Material
const starsMaterial = new THREE.PointsMaterial({
    size: 0.6,
    map: starTexture,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false, // Prevents black boundaries around particles
});

const starMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starMesh);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Mouse Parallax easing
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    
    starMesh.rotation.y += 0.05 * (targetX - starMesh.rotation.y);
    starMesh.rotation.x += 0.05 * (targetY - starMesh.rotation.x);
    starMesh.rotation.z += 0.0005; // Slow ambient rotation

    // Warp Speed effect: Fly through the stars
    const positions = starsGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Move stars towards camera (z-axis)
        positions[i3 + 2] += 0.8; 
        
        // If star goes behind camera, reset it far into the distance
        if (positions[i3 + 2] > 5) {
            positions[i3 + 2] = -500;
        }
    }
    starsGeometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();
