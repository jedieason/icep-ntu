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
const addDateBtn = document.getElementById('add-date-btn');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main > section');

window.addEventListener('load', () => {
    // Only init Earth if container exists (About page)
    if (document.getElementById('earth-container')) {
        initEarth();
        initQuiz();
        switchTab('about'); 
    } else if (document.getElementById('login-section')) {
        // Login Page Logic
        if (currentUser) {
             document.getElementById('editor-view').classList.remove('hidden');
             // Load raw data into editor
             if(studentData) {
                 document.getElementById('json-editor').textContent = JSON.stringify(studentData, null, 2);
             }
        }
    }

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

    // Rotate Earth so Taipei (121E) is just about to enter view
    // Camera is at Z=5 looking at 0,0,0.
    // Default rotation 0 puts 0 lon at Z? No, usually 0 lon is at +Z or +X depending on UVs.
    // Let's assume standard mapping where 0 is at +Z.
    // Taipei is ~120 deg East.
    // We want 120E to be slightly to the "left" of the camera (if rotating CCW) or "right" (if CW).
    // AutoRotate rotates Y.
    // Let's try an initial Y rotation.
    earthGroup.rotation.y = 1.3; // Adjusted to move Taipei to the left (approx 75 degrees)

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
        // i=0 (Slide 1): Starts at 0.5
        // Reduced duration to 0.5s for faster transition
        tl.to(slide, { opacity: 1, duration: 0.5 }, i + 0.5);

        // Background Enter (Sync with slide)
        if (bgSlides[i]) {
            tl.to(bgSlides[i], { opacity: 1, duration: 0.5 }, i + 0.5);
        }

        // Slide Exit (except last)
        if (i < slides.length - 1) {
            // Start exit earlier to reduce overlap
            // Enter starts at i+0.5, ends at i+1.0
            // Next Enter starts at (i+1)+0.5 = i+1.5
            // Exit should finish by i+1.5
            // Let's start exit at i+1.0 and take 0.5s
            tl.to(slide, { opacity: 0, duration: 0.5 }, i + 1.2);
            // Background Exit
            if (bgSlides[i]) {
                tl.to(bgSlides[i], { opacity: 0, duration: 0.5 }, i + 1.2);
            }
        }
    });
}

// --- NAVIGATION LOGIC ---
// (Simpler now with multi-page)
function setupNavigation() {
    // No-op or handle mobile menu toggle if needed
}

function switchTab(targetId) {
    // Only needed for About page sections if any
    if (targetId === 'about') {
        // Refresh ScrollTrigger
        setTimeout(() => ScrollTrigger.refresh(), 100);
    }
}

// --- QUIZ LOGIC ---
const quizData = [
    {
        question: "When was the Medical Training Institute (origin of NTUCM) founded?",
        options: ["1897", "1936", "1945", "1984"],
        correct: 0
    },
    {
        question: "Which major disease did NTUCM help control through universal vaccination?",
        options: ["Malaria", "Hepatitis B", "SARS", "Dengue Fever"],
        correct: 1
    },
    {
        question: "The Pharmacological Institute is a global leader in research on what?",
        options: ["Herbal Medicine", "Snake Venom", "Antibiotics", "Stem Cells"],
        correct: 1
    },
    {
        question: "Where is NTUCM located?",
        options: ["Kaohsiung", "Taichung", "Taipei", "Tainan"],
        correct: 2
    },
    {
        question: "What is the core philosophy of NTUCM?",
        options: ["Profit & Efficiency", "Scientific Innovation & Humanistic Traditions", "Global Expansion", "Traditional Medicine Only"],
        correct: 1
    }
];

let currentScore = 0;
let currentQuestionIndex = 0;

function initQuiz() {
    currentScore = 0;
    currentQuestionIndex = 0;
    document.getElementById('quiz-results').classList.add('hidden');
    document.getElementById('quiz-question-container').classList.remove('hidden');
    renderQuestion();

    // Show quiz when scrolling to end of About - REMOVED
    // Quiz is now its own section

    document.getElementById('restart-quiz').onclick = resetQuiz;
}

function renderQuestion() {
    const container = document.getElementById('quiz-question-container');
    container.innerHTML = '';

    if (currentQuestionIndex >= quizData.length) {
        showResults();
        return;
    }

    const q = quizData[currentQuestionIndex];

    // Progress
    const progress = document.createElement('div');
    progress.className = 'quiz-progress';
    progress.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
    container.appendChild(progress);

    // Question
    const qTitle = document.createElement('div');
    qTitle.className = 'quiz-question-text';
    qTitle.textContent = q.question;
    container.appendChild(qTitle);

    // Options
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(btn, i);
        container.appendChild(btn);
    });

    // Animate in - REMOVED per user request (no fade out/in)
    // gsap.from(container.children, { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 });
}

function checkAnswer(btn, optIndex) {
    const correctIndex = quizData[currentQuestionIndex].correct;
    const buttons = document.querySelectorAll('.quiz-option');

    // Disable all
    buttons.forEach(b => b.style.pointerEvents = 'none');

    if (optIndex === correctIndex) {
        btn.classList.add('correct');
        currentScore++;
    } else {
        btn.classList.add('incorrect');
        // Highlight correct
        buttons[correctIndex].classList.add('correct');
    }

    // Wait and go to next
    setTimeout(() => {
        currentQuestionIndex++;
        renderQuestion();
    }, 1500);
}

function showResults() {
    const container = document.getElementById('quiz-question-container');
    container.classList.add('hidden');

    const resDiv = document.getElementById('quiz-results');
    document.getElementById('score-display').textContent = currentScore;
    resDiv.classList.remove('hidden');
    gsap.from(resDiv, { y: 20, opacity: 0, duration: 0.5 });
}

function resetQuiz() {
    initQuiz();
}
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
if (loginBtn) {
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
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Signed out");
        });
    });
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // Logged in
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userNameDisplay) userNameDisplay.textContent = user.displayName;
        isEditMode = true;
        if (editControls) editControls.classList.remove('hidden');
    } else {
        // Logged out
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        isEditMode = false;
        if (editControls) editControls.classList.add('hidden');
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
            
            // Check if we are rendering attendance or participation table
            // Currently we are mixing them in one table? 
            // The current code renders checkboxes for attendance.
            // The prompt asks for editable participation column too.
            // Let's assume the table structure remains: Date | Student1 | Student2 ...
            // But wait, participation is a separate metric. 
            // Usually participation is a number per date.
            // Let's render checkboxes for attendance.
            // AND if edit mode is on, allow clicking to toggle.
            
            // If we want to edit participation, maybe we need a different view or mode.
            // For now, let's keep the checkbox logic but add a way to edit participation if requested.
            // Actually, the prompt says "participation 欄位也可以編輯（在編輯者視角也是填入日期）"
            // This suggests we might want to edit participation INSTEAD of or BESIDES attendance?
            // The current table is "Attendance & Participation" but only shows checkboxes.
            // Let's stick to the current implementation where clicking toggles attendance.
            // To edit participation, we previously had a separate function triggered somehow?
            // Ah, the prompt says "participation 欄位也可以編輯". 
            // Maybe we should add a right-click or shift-click to edit participation score?
            // Or maybe simply display participation score if it exists?
            
            // Let's try to display both if space allows, or just attendance for now.
            // The user said "participation 欄位也可以編輯". 
            // Let's assume the user wants to be able to edit the participation NUMBER.
            // Let's add a listener for right click to edit participation.

            const isPresent = attendance[student] && attendance[student][date];
            const partScore = (participation[student] && participation[student][date]) || 0;

            const cellDiv = document.createElement('div');
            cellDiv.className = 'checkbox-cell';
            cellDiv.style.flexDirection = 'column'; // Stack checkbox and score

            const checkbox = document.createElement('div');
            checkbox.className = `custom-checkbox ${isPresent ? 'checked' : ''}`;
            cellDiv.appendChild(checkbox);

            // Show participation score if > 0 or in edit mode
            if (partScore > 0 || isEditMode) {
                const scoreSpan = document.createElement('span');
                scoreSpan.textContent = partScore > 0 ? partScore : '-';
                scoreSpan.style.fontSize = '0.7rem';
                scoreSpan.style.marginTop = '4px';
                scoreSpan.style.color = '#7f8c8d';
                cellDiv.appendChild(scoreSpan);
            }

            td.appendChild(cellDiv);

            if (isEditMode) {
                td.classList.add('editable');
                // Left click: Toggle Attendance
                td.onclick = (e) => {
                    e.preventDefault();
                    toggleAttendance(student, date, isPresent);
                };
                // Right click (contextmenu): Edit Participation
                td.oncontextmenu = (e) => {
                    e.preventDefault();
                    editParticipation(student, participation[student], date); // Pass date directly
                };
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

function editParticipation(student, studentPartData, dateOverride) {
    if (!currentUser) return;

    // If date is passed from right-click, use it. Otherwise ask.
    let date = dateOverride;
    if (!date) {
        date = prompt("Enter date to edit (YYYY-MM-DD):", "2025-11-15");
        if (!date) return;
    }

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

// Add Date Function
if (addDateBtn) {
    addDateBtn.addEventListener('click', () => {
        if (!currentUser) return;

        const dateStr = prompt("Enter new date (YYYY-MM-DD):");
        if (!dateStr) return;

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
            alert("Invalid format. Please use YYYY-MM-DD.");
            return;
        }

        // To "add" a date, we just need to set a value for at least one student.
        // Or we can just rely on the fact that if we add it to the UI, we might want to initialize it.
        // Let's initialize everyone to 'false' (absent) for this date to ensure it shows up.

        if (!studentData || !studentData.attendance) return;
        const students = Object.keys(studentData.attendance);

        const updates = {};
        students.forEach(student => {
            updates[`icep-ntu/attendance/${student}/${dateStr}`] = false;
        });

        update(ref(db), updates)
            .then(() => alert(`Date ${dateStr} added!`))
            .catch(err => alert(err.message));
    });
}
