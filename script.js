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
// Attendance Table (Rows=Dates)
const attendanceTableBody = document.querySelector('#attendance-table tbody');
const attendanceTableHead = document.querySelector('#attendance-table thead tr');
// Participation Table (Rows=Students)
const participationTableBody = document.querySelector('#participation-table tbody');
const participationTableHead = document.querySelector('#participation-table thead tr');

const editControls = document.getElementById('edit-controls');
const partEditControls = document.getElementById('part-edit-controls'); // New
const participationWrapper = document.getElementById('participation-wrapper'); // New wrapper
const loadingScreen = document.getElementById('loading-screen');
const addDateBtn = document.getElementById('add-date-btn'); // May be removed from HTML, check if null
const addStudentBtn = document.getElementById('add-student-btn');
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

    // Adjust for mobile (smaller earth view)
    if (window.innerWidth < 768) {
        camera.position.z = 7; // Move camera back on mobile
    }

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
    
    // Check if mobile (width < 768px)
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        // Mobile: Continuous Scroll (No Pinning)
        // We still want background changes, but triggered by scroll position
        
        // Initial State: Show first background immediately on mobile (Hero)
        // Removed per user request (let it fade in on scroll)
        // if (bgSlides.length > 0) {
        //    gsap.set(bgSlides[0], { opacity: 1 });
        // }

        // 1. Ensure sections are static (CSS handles this via media query, but let's enforce)
        // Actually, let's rely on ScrollTrigger to toggle backgrounds based on which info-block is in view.
        
        // Fade out Hero early
        ScrollTrigger.create({
            trigger: '.hero-text',
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
                document.querySelector('.hero-text').style.opacity = 1 - self.progress;
                document.getElementById('earth-container').style.opacity = 1 - self.progress; // Fade earth too
            }
        });

        slides.forEach((slide, i) => {
            ScrollTrigger.create({
                trigger: slide,
                start: "top center", // When slide hits center of viewport
                end: "bottom center",
                onEnter: () => updateBackground(i),
                onEnterBack: () => updateBackground(i)
            });
            
            // Simple fade in for blocks
            gsap.fromTo(slide, 
                { opacity: 0, y: 50 },
                { 
                    opacity: 1, y: 0, duration: 0.5, 
                    scrollTrigger: {
                        trigger: slide,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
        
        function updateBackground(index) {
             bgSlides.forEach((bg, i) => {
                 gsap.to(bg, { opacity: i === index ? 1 : 0, duration: 0.5 });
             });
        }

    } else {
        // Desktop: Pinned Slides (Existing Logic)
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
        tl.to('#earth-container', { opacity: 0, duration: 0.5, pointerEvents: 'none' }, 0.2);

        slides.forEach((slide, i) => {
            tl.to(slide, { opacity: 1, duration: 0.5 }, i + 0.5);
            if (bgSlides[i]) {
                tl.to(bgSlides[i], { opacity: 1, duration: 0.5 }, i + 0.5);
            }
            if (i < slides.length - 1) {
                tl.to(slide, { opacity: 0, duration: 0.5 }, i + 1.2);
                if (bgSlides[i]) {
                    tl.to(bgSlides[i], { opacity: 0, duration: 0.5 }, i + 1.2);
                }
            }
        });
    }
}

    // --- NAVIGATION LOGIC ---
    // (Simpler now with multi-page)
    function setupNavigation() {
        // Mobile Menu Logic
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (hamburgerBtn && mobileMenu) {
            hamburgerBtn.addEventListener('click', () => {
                hamburgerBtn.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                
                // Stagger animation for links
                const links = mobileMenu.querySelectorAll('.mobile-menu-link');
                links.forEach((link, index) => {
                    if (mobileMenu.classList.contains('active')) {
                        link.style.transitionDelay = `${0.1 + index * 0.1}s`;
                    } else {
                        link.style.transitionDelay = '0s';
                    }
                });
            });
        }
        
        // Close menu function (global)
        window.closeMobileMenu = () => {
            if (hamburgerBtn && mobileMenu) {
                hamburgerBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
        };
    }
    setupNavigation();

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
        if (isEditMode) {
            if (editControls) editControls.classList.remove('hidden');
            if (partEditControls) partEditControls.classList.remove('hidden');
            if (participationWrapper) participationWrapper.classList.remove('hidden'); // Show part table in edit mode
        } else {
            if (participationWrapper) participationWrapper.classList.add('hidden'); // Hide if not logged in (or make read-only?)
            // User asked "Participation table is invisible when not logged in", implies it SHOULD be hidden.
        }
    } else {
        // Logged out
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        isEditMode = false;
        if (editControls) editControls.classList.add('hidden');
        if (partEditControls) partEditControls.classList.add('hidden');
        if (participationWrapper) participationWrapper.classList.add('hidden');
    }
    renderTables(); // Re-render to update editability
});

// Database
const dbRef = ref(db, 'icep-ntu');
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        studentData = data;
        renderTables();
        calculateAndRenderChart();
    }
});

function renderTables() {
    renderAttendanceTable();
    renderParticipationTable();
}

function renderAttendanceTable() {
    if (!studentData || !attendanceTableHead || !attendanceTableBody) return;

    const attendance = studentData.attendance || {};
    // Get all students (union of keys) - These are COLUMNS
    const students = Object.keys(attendance).sort();

    // Get all dates from attendance - These are ROWS
    let dates = new Set();
    Object.values(attendance).forEach(record => {
        Object.keys(record).forEach(date => dates.add(date));
    });
    dates = Array.from(dates).sort();

    // Render Header (Date + Student Names)
    attendanceTableHead.innerHTML = '<th>Date</th>';
    students.forEach(student => {
        const th = document.createElement('th');
        th.textContent = student;
        attendanceTableHead.appendChild(th);
    });

    // Render Body (Rows = Dates)
    attendanceTableBody.innerHTML = '';
    dates.forEach(date => {
        const tr = document.createElement('tr');

        // Date Column
        const tdDate = document.createElement('td');
        tdDate.textContent = date.slice(5); // MM-DD
        tdDate.style.fontWeight = "bold";
        
        if (isEditMode) {
            tdDate.classList.add('editable');
            tdDate.onclick = () => renameDate(date); // Rename date logic applies here
            tdDate.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete attendance date ${date}?`)) {
                    deleteDate(date, 'attendance');
                }
            };
        }
        tr.appendChild(tdDate);

        // Student Columns (Checkboxes)
        students.forEach(student => {
            const td = document.createElement('td');
            const isPresent = attendance[student] && attendance[student][date];

            const cellDiv = document.createElement('div');
            cellDiv.className = 'checkbox-cell';

            const checkbox = document.createElement('div');
            checkbox.className = `custom-checkbox ${isPresent ? 'checked' : ''}`;
            cellDiv.appendChild(checkbox);
            td.appendChild(cellDiv);

            if (isEditMode) {
                td.classList.add('editable');
                td.onclick = (e) => {
                    e.preventDefault();
                    toggleAttendance(student, date, isPresent);
                };
            }
            tr.appendChild(td);
        });
        attendanceTableBody.appendChild(tr);
    });

    // Render Add Date Row (Footer) for Attendance
    if (isEditMode) {
        const trAdd = document.createElement('tr');
        const tdAdd = document.createElement('td');
        tdAdd.colSpan = students.length + 1;
        tdAdd.innerHTML = '<button class="glow-btn small" style="width: 100%;">+ Add Attendance Date</button>';
        tdAdd.style.padding = '10px';
        tdAdd.querySelector('button').onclick = () => addDate('attendance');
        trAdd.appendChild(tdAdd);
        attendanceTableBody.appendChild(trAdd);
    }
}

function renderParticipationTable() {
    if (!studentData || !participationTableHead || !participationTableBody) return;

    const participation = studentData.participation || {};
    // Students are ROWS
    const students = Object.keys(studentData.attendance || {}).sort(); // Use attendance list for consistent rows? Or part list?
    // Ideally union of both, but let's use attendance list as master roster
    
    // Dates are COLUMNS
    let dates = new Set();
    if (participation) {
        Object.values(participation).forEach(record => {
            Object.keys(record).forEach(date => dates.add(date));
        });
    }
    dates = Array.from(dates).sort();

    // Render Header (Name + Dates + Add)
    participationTableHead.innerHTML = '<th>Name</th>';
    dates.forEach(date => {
        const th = document.createElement('th');
        th.textContent = date.slice(5); // MM-DD
        if (isEditMode) {
            th.classList.add('editable');
            th.title = "Click to rename, Right-click to delete";
            
            // Add click listener for renaming
            th.onclick = () => renameDate(date);

            th.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete participation date ${date}?`)) {
                    deleteDate(date, 'participation');
                }
            };
        }
        participationTableHead.appendChild(th);
    });

    // Add Date Column (+)
    if (isEditMode) {
        const thAdd = document.createElement('th');
        thAdd.textContent = '+';
        thAdd.className = 'editable';
        thAdd.style.fontSize = '1.2rem';
        thAdd.style.color = 'var(--accent-color)';
        thAdd.onclick = () => addDate('participation');
        participationTableHead.appendChild(thAdd);
    }

    // Render Body (Rows = Students)
    participationTableBody.innerHTML = '';
    students.forEach(student => {
        const tr = document.createElement('tr');
        
        // Name Column
        const tdName = document.createElement('td');
        tdName.textContent = student;
        tdName.style.fontWeight = "bold";
        tr.appendChild(tdName);

        // Date Columns (Scores)
        dates.forEach(date => {
            const td = document.createElement('td');
            const score = (participation[student] && participation[student][date]) || 0;
            
            td.textContent = score > 0 ? score : '-';
            if (score === 0) td.style.color = '#ccc';

            if (isEditMode) {
                td.classList.add('editable');
                td.onclick = () => editParticipation(student, participation[student], date);
            }
            tr.appendChild(td);
        });

        // Empty cell for + column
        if (isEditMode) {
            const tdEmpty = document.createElement('td');
            tr.appendChild(tdEmpty);
        }

        participationTableBody.appendChild(tr);
    });
}


function renameDate(oldDate) {
    if (!currentUser) return;
    showInputModal("Rename date (YYYY-MM-DD):", oldDate, (newDate) => {
        if (!newDate || newDate === oldDate) return;
        
        // Regex check
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            alert("Invalid format. Use YYYY-MM-DD");
            return;
        }

        const updates = {};
        // Move data for all students
        if (studentData.attendance) {
            Object.keys(studentData.attendance).forEach(student => {
                const val = studentData.attendance[student][oldDate];
                if (val !== undefined) {
                    updates[`icep-ntu/attendance/${student}/${newDate}`] = val;
                    updates[`icep-ntu/attendance/${student}/${oldDate}`] = null;
                }
            });
        }
        if (studentData.participation) {
            Object.keys(studentData.participation).forEach(student => {
                const val = studentData.participation[student][oldDate];
                if (val !== undefined) {
                    updates[`icep-ntu/participation/${student}/${newDate}`] = val;
                    updates[`icep-ntu/participation/${student}/${oldDate}`] = null;
                }
            });
        }
        
        update(ref(db), updates).catch(err => alert(err.message));
    });
}

function deleteDate(date, type) {
    if (!currentUser) return;
    const updates = {};
    
    if (type === 'attendance' && studentData.attendance) {
        Object.keys(studentData.attendance).forEach(student => {
            updates[`icep-ntu/attendance/${student}/${date}`] = null;
        });
    }
    
    if (type === 'participation' && studentData.participation) {
        Object.keys(studentData.participation).forEach(student => {
            updates[`icep-ntu/participation/${student}/${date}`] = null;
        });
    }
    
    update(ref(db), updates).catch(err => alert(err.message));
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

    const handleEdit = (date) => {
        const currentVal = (studentPartData && studentPartData[date]) || 0;
        showInputModal(`Enter participation count for ${student} on ${date}:`, currentVal, (newVal) => {
            if (newVal === null) return;

            const numVal = parseInt(newVal);
            if (isNaN(numVal)) {
                alert("Invalid number");
                return;
            }

            const updates = {};
            updates[`icep-ntu/participation/${student}/${date}`] = numVal;
            update(ref(db), updates).catch(err => alert(err.message));
        });
    };

    // If date is passed from right-click, use it. Otherwise ask.
    if (dateOverride) {
        handleEdit(dateOverride);
    } else {
        showInputModal("Enter date to edit (YYYY-MM-DD):", "2025-11-15", (date) => {
            if (!date) return;
            handleEdit(date);
        });
    }
}

// Add Student Function
if (addStudentBtn) {
    addStudentBtn.addEventListener('click', () => {
        if (!currentUser) return;
        showInputModal("Enter new student name:", "", (name) => {
            if (!name) return;
            
            // We need to add an entry for this student.
            // We can just add a dummy attendance record for the most recent date, or just let the render handle it if we update the data structure.
            // But currently data structure is attendance/Student/Date.
            // If we add a key under attendance/Student, they exist.
            // Let's pick the first available date or today.
            
            const today = new Date().toISOString().slice(0, 10);
            const updates = {};
            updates[`icep-ntu/attendance/${name}/${today}`] = false; // Initialize as absent
            
            update(ref(db), updates)
                .then(() => alert(`Student ${name} added!`))
                .catch(err => alert(err.message));
        });
    });
}

// Add Date Logic (Universal)
function addDate(type = 'attendance') {
    if (!currentUser) return;

    showInputModal(`Enter new ${type} date (YYYY-MM-DD):`, "", (dateStr) => {
        if (!dateStr) return;

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) {
            alert("Invalid format. Please use YYYY-MM-DD.");
            return;
        }

        if (!studentData) return;
        // Use attendance list as master student list
        const students = Object.keys(studentData.attendance || {});

        const updates = {};
        students.forEach(student => {
            if (type === 'attendance') {
                updates[`icep-ntu/attendance/${student}/${dateStr}`] = false;
            } else {
                updates[`icep-ntu/participation/${student}/${dateStr}`] = 0;
            }
        });

        update(ref(db), updates)
            .then(() => alert(`${type} Date ${dateStr} added!`))
            .catch(err => alert(err.message));
    });
}

// Helper for Custom Input Modal
function showInputModal(title, initialValue, callback) {
    // Create modal elements if not exist
    let modal = document.getElementById('custom-input-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-input-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;
        `;
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; width: 300px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h3 id="modal-title" style="margin-bottom: 20px; color: var(--accent-color); font-family: var(--font-display);"></h3>
                <input type="text" id="modal-input" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 5px; font-size: 1rem;">
                <div style="display: flex; justify-content: space-between;">
                    <button id="modal-cancel" class="glow-btn small" style="background: #95a5a6; border-color: #95a5a6; color: white;">Cancel</button>
                    <button id="modal-confirm" class="glow-btn small">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const titleEl = document.getElementById('modal-title');
    const inputEl = document.getElementById('modal-input');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');
    
    titleEl.textContent = title;
    inputEl.value = initialValue || '';
    modal.style.display = 'flex';
    inputEl.focus();
    
    const cleanup = () => {
        modal.style.display = 'none';
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
        inputEl.onkeydown = null;
    };

    cancelBtn.onclick = () => {
        cleanup();
        callback(null);
    };
    
    confirmBtn.onclick = () => {
        const val = inputEl.value;
        cleanup();
        callback(val);
    };
    
    inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') confirmBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    };
}
