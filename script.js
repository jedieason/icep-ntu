import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyB3yTx8gruEk5MVK-VyplY5TxDFJ9ZiV8g",
    authDomain: "icep-ntu.firebaseapp.com",
    databaseURL: "https://icep-ntu-default-rtdb.firebaseio.com",
    projectId: "icep-ntu",
    storageBucket: "icep-ntu.firebasestorage.app",
    messagingSenderId: "769119810586",
    appId: "1:769119810586:web:5773324ac6d3cc27460da3",
    measurementId: "G-ZWSXGTMS3B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// --- STATE ---
let currentUser = null;
let studentData = null;
let isEditMode = false;

// --- DOM ELEMENTS ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userNameDisplay = document.getElementById('user-name');
const studentTableBody = document.querySelector('#student-table tbody');
const studentTableHead = document.querySelector('#student-table thead tr');
const editControls = document.getElementById('edit-controls');
const loadingScreen = document.getElementById('loading-screen');

// --- INITIALIZATION ---
window.addEventListener('load', () => {
    initEarth();
    // initChart(); // Removed game init

    // Hide loading screen
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
});

// --- THREE.JS: EARTH SCENE (INTERACTIVE & WIREFRAME) ---
function initEarth() {
    const container = document.getElementById('earth-container');
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // 1. Wireframe Sphere
    const geometry = new THREE.IcosahedronGeometry(2, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x2c3e50,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const earth = new THREE.Mesh(geometry, material);
    earthGroup.add(earth);

    // 2. Inner Sphere
    const innerGeo = new THREE.IcosahedronGeometry(1.98, 16);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    const innerEarth = new THREE.Mesh(innerGeo, innerMat);
    earthGroup.add(innerEarth);

    // 3. City Markers & Labels (Universities)
    // Data from user image
    const cities = [
        // North America
        { name: "Montreal", lat: 45.50, lon: -73.56 }, // McGill
        { name: "New York", lat: 40.71, lon: -74.00 }, // Columbia
        { name: "Boston", lat: 42.36, lon: -71.05 }, // Harvard
        { name: "San Francisco", lat: 37.77, lon: -122.41 }, // Stanford/UCSF
        { name: "New Haven", lat: 41.30, lon: -72.92 }, // Yale
        // Europe/Asia
        { name: "Istanbul", lat: 41.00, lon: 28.97 },
        { name: "Vienna", lat: 48.20, lon: 16.37 },
        { name: "Copenhagen", lat: 55.67, lon: 12.56 },
        { name: "Helsinki", lat: 60.16, lon: 24.93 },
        { name: "Paris", lat: 48.85, lon: 2.35 },
        { name: "Berlin", lat: 52.52, lon: 13.40 },
        { name: "Budapest", lat: 47.49, lon: 19.04 },
        { name: "Milan", lat: 45.46, lon: 9.19 },
        { name: "Madrid", lat: 40.41, lon: -3.70 },
        { name: "London", lat: 51.50, lon: -0.12 },
        // Asia
        { name: "Hong Kong", lat: 22.31, lon: 114.16 },
        { name: "Tel Aviv", lat: 32.08, lon: 34.78 },
        { name: "Tokyo", lat: 35.67, lon: 139.65 },
        { name: "Astana", lat: 51.16, lon: 71.47 }, // Kazakhstan
        { name: "Seoul", lat: 37.56, lon: 126.97 },
        { name: "Singapore", lat: 1.35, lon: 103.81 },
        { name: "Taipei", lat: 25.03, lon: 121.56, isTarget: true }, // NTU
        // Africa
        { name: "Lagos", lat: 6.52, lon: 3.37 },
        { name: "Nairobi", lat: -1.29, lon: 36.82 },
        { name: "Johannesburg", lat: -26.20, lon: 28.04 },
        { name: "Kampala", lat: 0.34, lon: 32.58 },
        // Oceania
        { name: "Sydney", lat: -33.86, lon: 151.20 }
    ];

    const markers = [];

    function latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));
        return new THREE.Vector3(x, y, z);
    }

    cities.forEach(city => {
        const pos = latLonToVector3(city.lat, city.lon, 2.02);

        // Dot (Small)
        const dotGeo = new THREE.SphereGeometry(city.isTarget ? 0.025 : 0.008, 8, 8); // Much smaller dots
        const dotMat = new THREE.MeshBasicMaterial({ color: city.isTarget ? 0xe74c3c : 0xbdc3c7 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        earthGroup.add(dot);

        // Pulsing Ring for Taipei
        if (city.isTarget) {
            const ringGeo = new THREE.RingGeometry(0.03, 0.04, 32); // Thinner ring
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide, transparent: true });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(pos);
            ring.lookAt(0, 0, 0);
            earthGroup.add(ring);
            markers.push({ mesh: ring, type: 'pulse', time: 0 });
        }

        // Text Label (Very Small)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.font = "Bold 20px Arial"; // Smaller font
        context.fillStyle = "#555555";
        context.textAlign = "center";
        context.fillText(city.name, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.7 });
        const label = new THREE.Sprite(labelMat);
        label.position.copy(pos);
        label.position.multiplyScalar(1.03); // Closer to surface
        label.scale.set(0.6, 0.15, 1); // Much smaller scale
        earthGroup.add(label);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update();

        // Pulse Animation
        markers.forEach(marker => {
            if (marker.type === 'pulse') {
                marker.time += 0.05;
                const scale = 1 + Math.sin(marker.time) * 0.3;
                marker.mesh.scale.set(scale, scale, 1);
                marker.mesh.material.opacity = 0.5 + Math.sin(marker.time) * 0.5;
            }
        });

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- SCROLL ANIMATIONS (GSAP) ---
    gsap.registerPlugin(ScrollTrigger);

    // Slide Scroll Logic
    const slides = gsap.utils.toArray('.info-block');
    const bgSlides = gsap.utils.toArray('.bg-slide');

    // Master Timeline
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "#about",
            start: "top top",
            end: "+=800%", // Much longer scroll distance
            pin: true,
            scrub: 1,
            snap: {
                snapTo: 1 / (slides.length),
                duration: { min: 0.2, max: 0.5 },
                delay: 0.1,
                ease: "power1.inOut"
            }
        }
    });

    // Hero Fade Out
    tl.to('.hero-text', { opacity: 0, duration: 0.5 }, 0);

    // Earth Fade Out (Hide when first slide appears)
    // Start fading out slightly before the first slide fully appears
    tl.to('#earth-container', { opacity: 0, duration: 0.5, pointerEvents: 'none' }, 0.2);

    // Slides & Backgrounds Animation
    // Timeline: 0 -> 4
    // 0-1: Hero out, Slide 1 in
    // 1-2: Slide 1 out, Slide 2 in
    // ...

    slides.forEach((slide, i) => {
        // Slide Enter
        // i=0 (Slide 1): Starts at 0.5 (after hero starts fading)
        tl.to(slide, { opacity: 1, duration: 1 }, i + 0.5);

        // Background Enter (Sync with slide)
        if (bgSlides[i]) {
            tl.to(bgSlides[i], { opacity: 1, duration: 1 }, i + 0.5);
        }

        // Slide Exit (except last)
        if (i < slides.length - 1) {
            tl.to(slide, { opacity: 0, duration: 1 }, i + 1.5);
            // Background Exit
            if (bgSlides[i]) {
                tl.to(bgSlides[i], { opacity: 0, duration: 1 }, i + 1.5);
            }
        }
    });
}

// --- CHART LOGIC (BAR CHART) ---
function renderParticipationChart(data) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // Clear existing

    const names = Object.keys(data);
    const counts = Object.values(data);
    const maxCount = Math.max(...counts, 10); // Ensure at least some height

    names.forEach((name, i) => {
        const count = counts[i];
        const percentage = (count / maxCount) * 100;

        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        const bar = document.createElement('div');
        bar.className = 'bar';
        // Set height via variable for animation or directly
        // We'll set a custom property for the target height, and animate to it
        bar.style.height = '0%'; // Start at 0
        bar.dataset.height = `${percentage}%`;

        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = count;
        bar.appendChild(value);

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = name;

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        container.appendChild(barContainer);
    });

    // Trigger animation if already in view, or set up observer
    setupChartObserver();
}

function setupChartObserver() {
    const section = document.querySelector('.chart-section');
    const bars = document.querySelectorAll('.bar');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                bars.forEach(bar => {
                    bar.style.height = bar.dataset.height;
                    bar.classList.add('expanded');
                });
                observer.unobserve(section); // Only animate once
            }
        });
    }, { threshold: 0.5 });

    observer.observe(section);
}


// --- FIREBASE LOGIC ---

// Auth
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            // User signed in
            console.log("Signed in:", result.user);
        }).catch((error) => {
            console.error("Auth Error:", error);
            alert("Login failed: " + error.message);
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Signed out");
    });
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Logged in
        loginBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userNameDisplay.textContent = user.displayName;
        isEditMode = true;
        editControls.classList.remove('hidden');
    } else {
        // Logged out
        loginBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        isEditMode = false;
        editControls.classList.add('hidden');
    }
    renderTable(); // Re-render to update editability
});

// Database
const dbRef = ref(db, 'icep-ntu');
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        studentData = data;
        renderTable();
        calculateAndRenderChart();
    }
});

function renderTable() {
    if (!studentData) return;

    const attendance = studentData.attendance || {};
    const participation = studentData.participation || {};

    // Get all students (union of keys)
    const students = [...new Set([...Object.keys(attendance), ...Object.keys(participation)])];

    // Get all dates from attendance (assuming consistent dates across students, but let's gather all unique dates)
    let dates = new Set();
    Object.values(attendance).forEach(record => {
        Object.keys(record).forEach(date => dates.add(date));
    });
    dates = Array.from(dates).sort();

    // Render Header
    // Transposed: Header = "Date" + Student Names
    studentTableHead.innerHTML = '<th>Date</th>';
    students.forEach(student => {
        const th = document.createElement('th');
        th.textContent = student;
        studentTableHead.appendChild(th);
    });

    // Render Body
    // Transposed: Rows = Dates
    studentTableBody.innerHTML = '';
    dates.forEach(date => {
        const tr = document.createElement('tr');

        // Date Column
        const tdDate = document.createElement('td');
        tdDate.textContent = date.slice(5); // MM-DD
        tdDate.style.fontWeight = "bold";
        tr.appendChild(tdDate);

        // Student Columns
        students.forEach(student => {
            const td = document.createElement('td');
            const isPresent = attendance[student] && attendance[student][date];

            const dot = document.createElement('span');
            dot.className = `dot ${isPresent ? 'present' : 'absent'}`;
            td.appendChild(dot);

            if (isEditMode) {
                td.classList.add('editable');
                td.onclick = () => toggleAttendance(student, date, isPresent);
            }

            tr.appendChild(td);
        });

        studentTableBody.appendChild(tr);
    });
}

function calculateAndRenderChart() {
    if (!studentData || !studentData.participation) return;

    const participation = studentData.participation;
    const chartData = {};

    Object.keys(participation).forEach(student => {
        let total = 0;
        Object.values(participation[student]).forEach(val => total += val);
        chartData[student] = total;
    });

    renderParticipationChart(chartData);
}

// --- EDIT FUNCTIONS ---
function toggleAttendance(student, date, currentStatus) {
    if (!currentUser) return;

    const newStatus = !currentStatus;
    const updates = {};
    updates[`icep-ntu/attendance/${student}/${date}`] = newStatus;

    update(ref(db), updates).catch(err => alert(err.message));
}

function editParticipation(student, studentPartData) {
    if (!currentUser) return;

    // Simple prompt for now. Ideally a modal.
    // We need to know WHICH date to edit. 
    // Since the table shows TOTAL, editing it is ambiguous.
    // Let's ask user for Date and Value.

    const date = prompt("Enter date to edit (YYYY-MM-DD):", "2025-11-15");
    if (!date) return;

    const currentVal = (studentPartData && studentPartData[date]) || 0;
    const newVal = prompt(`Enter participation count for ${student} on ${date}:`, currentVal);

    if (newVal === null) return;

    const numVal = parseInt(newVal);
    if (isNaN(numVal)) {
        alert("Invalid number");
        return;
    }

    const updates = {};
    updates[`icep-ntu/participation/${student}/${date}`] = numVal;
    update(ref(db), updates).catch(err => alert(err.message));
}
