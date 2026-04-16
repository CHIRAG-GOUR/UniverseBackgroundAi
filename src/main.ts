import * as THREE from 'three';
import './style.css';

// Scene Setup
const scene = new THREE.Scene();

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(new THREE.Color('#02040c'), 1);

const appContainer = document.querySelector('#app');
if (appContainer) {
    appContainer.appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}

// Create circular particle texture for stars
const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; // Increased resolution
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
        // Simple radial gradient for a "glow" look
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
};
const starTexture = createCircleTexture();

// Universe Starfield Generation
const starsGeometry = new THREE.BufferGeometry();
const starCount = 15000; // Slightly lower for better performance on all devices
const posArray = new Float32Array(starCount * 3);
const colorsArray = new Float32Array(starCount * 3);

const colorPalette = [
    new THREE.Color('#6b32a8'), // Deep Violet
    new THREE.Color('#2196F3'), // Light Blue
    new THREE.Color('#ffc107'), // Star Gold
    new THREE.Color('#ffffff'), // Pure White
    new THREE.Color('#9c27b0')  // Magenta
];

for (let i = 0; i < starCount; i++) {
    // Distribute stars in a very deep tunnel
    posArray[i * 3] = (Math.random() - 0.5) * 150;      // x
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 150;  // y
    posArray[i * 3 + 2] = -(Math.random() * 800);       // Start them all IN FRONT (negative Z)
    
    // Assign random color from palette
    const randColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colorsArray[i * 3] = randColor.r;
    colorsArray[i * 3 + 1] = randColor.g;
    colorsArray[i * 3 + 2] = randColor.b;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

// Particle Material
const starsMaterial = new THREE.PointsMaterial({
    size: 0.8,
    map: starTexture,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false, 
    sizeAttenuation: true
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
    targetX = mouseX * 0.0005; 
    targetY = mouseY * 0.0005;
    
    starMesh.rotation.y += 0.05 * (targetX - starMesh.rotation.y);
    starMesh.rotation.x += 0.05 * (targetY - starMesh.rotation.x);
    starMesh.rotation.z += 0.0002; // Very slow ambient rotation

    // Warp Speed effect: Fly through the stars
    const positions = starsGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        // Move stars towards camera (positive z-axis movement)
        positions[i3 + 2] += 1.5; // Constant forward speed
        
        // If star passes the camera (Z > 5), loop it back to the far distance
        if (positions[i3 + 2] > 10) {
            positions[i3 + 2] = -800;
        }
    }
    starsGeometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();
