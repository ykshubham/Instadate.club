/* ==========================================================================
   INSTADATE ACTIVE MEMBERS PORTAL LOGIC
   Features: Real-time Grids, Multi-Category Filters, Search Indexing,
             GPU-accelerated Canvas Particle Background, Custom Cursor Sparks,
             and Personalized WhatsApp Fast-Track Conversion Modals.
   ========================================================================== */

let activeCity = 'all-cities';
let activeVibe = 'all-vibes';
let testimonialTimer = null; // Unused but keeps Lucide or particle scripts consistent

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- STICKY NAV BACKGROUND ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.add('scrolled'); // Force sticky on portal page
        }
    });

    // --- INITIALIZE CANVAS BACKGROUND ---
    initParticlesCanvas();

    // --- INITIALIZE CUSTOM NEON CURSOR ---
    initCustomCursorTrail();

    // --- SETUP FILTER INTERACTIONS ---
    setupFilters();
    
    // --- INITIALIZE ELITE TOGGLE FOR FEMALE DATERS ---
    initEliteToggle();
    
    // Set initial display of profile cards with animations
    filterCards();

    // Give every active member a distinct generated profile picture.
    try {
        assignUniqueProfilePictures();
    } catch (err) {
        console.error('Profile picture generation failed:', err);
    }
    
    // --- SETUP PROFILE CARD CLICK TRIGGERS ---
    setupProfileCardClicks();
});

function assignUniqueProfilePictures() {
    const cards = document.querySelectorAll('.profile-card');
    const palettes = [
        ['#ff7abf', '#2a1020', '#f4b4a1', '#2b1630'],
        ['#38d9ff', '#071f2c', '#c68f6a', '#102a34'],
        ['#a982ff', '#1a1230', '#d6a06f', '#24143a'],
        ['#ffb15e', '#2b1608', '#efc2a2', '#2b1c12'],
        ['#58f0c2', '#082720', '#8f5f3f', '#132b25'],
        ['#ff5d7d', '#2a1017', '#7d4b35', '#2c131b'],
        ['#78a8ff', '#101a32', '#d9b28c', '#111f38'],
        ['#d56bff', '#24102f', '#b47b56', '#2a1534'],
        ['#ffe06b', '#2a240f', '#f0b889', '#30240e'],
        ['#69e2ff', '#092430', '#704327', '#102a35']
    ];
    const hairColors = ['#161014', '#2a1710', '#3a2419', '#0e1625', '#4a2a20', '#1e1234', '#32200f'];
    const accessoryColors = ['#ff2e93', '#00f5ff', '#9b30ff', '#25d366', '#ffc857'];

    cards.forEach((card, index) => {
        const avatar = card.querySelector('.profile-avatar');
        const name = card.querySelector('.profile-name')?.textContent?.trim() || `Member ${index + 1}`;
        if (!avatar) return;

        const palette = palettes[index % palettes.length];
        const initials = name
            .replace(/,\s*\d+.*/, '')
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0] || '')
            .join('')
            .toUpperCase();
        const skin = palette[2];
        const bgA = palette[0];
        const bgB = palette[1];
        const shirt = palette[3];
        const hair = hairColors[(index * 3) % hairColors.length];
        const accent = accessoryColors[(index * 5 + 2) % accessoryColors.length];
        const isFemale = card.getAttribute('data-gender') !== 'male';
        const hairPath = isFemale
            ? `<path d="M26 45c0-18 11-30 26-30s26 12 26 30c0 18-8 29-26 29S26 63 26 45z" fill="${hair}"/>`
            : `<path d="M29 39c2-15 12-23 25-23 12 0 21 7 24 20-11-8-31-9-49 3z" fill="${hair}"/>`;
        const accessory = index % 4 === 0
            ? `<circle cx="70" cy="38" r="5" fill="${accent}" opacity=".9"/>`
            : index % 4 === 1
                ? `<rect x="34" y="40" width="36" height="5" rx="2.5" fill="${accent}" opacity=".75"/>`
                : index % 4 === 2
                    ? `<path d="M64 62l7 7 9-15" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
                    : `<circle cx="31" cy="57" r="4" fill="${accent}" opacity=".85"/><circle cx="73" cy="57" r="4" fill="${accent}" opacity=".85"/>`;

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="${bgA}"/>
                        <stop offset="1" stop-color="${bgB}"/>
                    </linearGradient>
                    <radialGradient id="glow" cx="35%" cy="20%" r="70%">
                        <stop offset="0" stop-color="#fff" stop-opacity=".24"/>
                        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <rect width="100" height="100" rx="28" fill="url(#bg)"/>
                <rect width="100" height="100" rx="28" fill="url(#glow)"/>
                ${hairPath}
                <circle cx="52" cy="44" r="20" fill="${skin}"/>
                <path d="M24 92c5-19 17-29 28-29s23 10 28 29H24z" fill="${shirt}"/>
                <circle cx="44" cy="44" r="2.5" fill="#171017" opacity=".75"/>
                <circle cx="60" cy="44" r="2.5" fill="#171017" opacity=".75"/>
                <path d="M44 55c5 5 12 5 17 0" fill="none" stroke="#171017" stroke-width="3" stroke-linecap="round" opacity=".55"/>
                ${accessory}
                <circle cx="78" cy="22" r="8" fill="${accent}" opacity=".88"/>
                <text x="78" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#fff">${initials.slice(0, 1)}</text>
            </svg>
        `;

        avatar.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
    });
}

// --- MOBILE MENU TOGGLE ---
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const menuIcon = document.getElementById('menu-icon');
    if (!mobileNav || !menuIcon) return;
    
    mobileNav.classList.toggle('active');
    
    if (mobileNav.classList.contains('active')) {
        menuIcon.setAttribute('data-lucide', 'x');
    } else {
        menuIcon.setAttribute('data-lucide', 'menu');
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- GPU CANVAS BACKGROUND engine (Neon Sparks & Mini Hearts) ---
function initParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const maxParticles = 65;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height + canvas.height; // Spawn below screen
            this.size = Math.random() * 2 + 1;
            this.speedY = -(Math.random() * 0.8 + 0.4);
            this.speedX = Math.random() * 0.4 - 0.2;
            this.alpha = Math.random() * 0.5 + 0.2;
            this.colorType = Math.random() > 0.5 ? 'cyan' : 'pink'; // Neon pink or cyan sparks
            this.isHeart = Math.random() > 0.88;
        }
        
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.alpha -= 0.0008; // extremely slow fade
            
            if (this.y < -10 || this.alpha <= 0 || this.x < -10 || this.x > canvas.width + 10) {
                this.reset();
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            
            if (this.colorType === 'cyan') {
                ctx.fillStyle = '#00F5FF';
                ctx.shadowColor = '#00F5FF';
            } else {
                ctx.fillStyle = '#FF2E93';
                ctx.shadowColor = '#FF2E93';
            }
            
            ctx.shadowBlur = 8;
            
            if (this.isHeart) {
                // Draw a cute miniature floating heart
                const d = this.size * 2.5;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + d / 4);
                ctx.quadraticCurveTo(this.x, this.y, this.x - d / 2, this.y);
                ctx.quadraticCurveTo(this.x - d, this.y, this.x - d, this.y + d / 2);
                ctx.quadraticCurveTo(this.x - d, this.y + d * 0.8, this.x - d * 0.6, this.y + d * 1.1);
                ctx.lineTo(this.x, this.y + d * 1.5);
                ctx.lineTo(this.x + d * 0.6, this.y + d * 1.1);
                ctx.quadraticCurveTo(this.x + d, this.y + d * 0.8, this.x + d, this.y + d / 2);
                ctx.quadraticCurveTo(this.x + d, this.y, this.x + d / 2, this.y);
                ctx.quadraticCurveTo(this.x, this.y, this.x, this.y + d / 4);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// --- CUSTOM NEON MOUSE SPARK ENGING ---
function initCustomCursorTrail() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    
    // Hide default pointer completely on desktop viewports
    if (window.innerWidth > 768) {
        document.body.style.cursor = 'none';
    } else {
        return; // Disable on touch devices
    }
    
    // Position tracking variables
    let mouse = { x: -100, y: -100 };
    let pos = { x: -100, y: -100 };
    const lerpFactor = 0.22;
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Spawn small floating sparks dynamically
        if (Math.random() > 0.4) {
            spawnSpark(e.clientX, e.clientY);
        }
    });
    
    // Render loop for lagging active cursor ring
    function renderCursor() {
        pos.x += (mouse.x - pos.x) * lerpFactor;
        pos.y += (mouse.y - pos.y) * lerpFactor;
        
        cursor.style.left = `${pos.x}px`;
        cursor.style.top = `${pos.y}px`;
        
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
    
    // Trigger cursor expansion when hovering interactive tags
    const interactives = document.querySelectorAll('a, button, .filter-pill, .profile-card');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
    
    function spawnSpark(x, y) {
        const spark = document.createElement('div');
        spark.classList.add('cursor-particle');
        
        // Random offsets
        const size = Math.random() * 6 + 4;
        const color = Math.random() > 0.5 ? 'cyan' : 'pink';
        
        spark.style.width = `${size}px`;
        spark.style.height = `${size}px`;
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        
        if (color === 'cyan') {
            spark.style.background = 'var(--primary-cyan)';
            spark.style.boxShadow = '0 0 10px var(--primary-cyan)';
        } else {
            spark.style.background = 'var(--primary-pink)';
            spark.style.boxShadow = '0 0 10px var(--primary-pink)';
        }
        
        document.body.appendChild(spark);
        
        // Push slightly in random angle
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        let currentAlpha = 0.9;
        let scale = 1;
        let posX = x;
        let posY = y;
        
        const sparkInterval = setInterval(() => {
            posX += vx;
            posY += vy;
            currentAlpha -= 0.02;
            scale -= 0.02;
            
            spark.style.left = `${posX}px`;
            spark.style.top = `${posY}px`;
            spark.style.opacity = currentAlpha;
            spark.style.transform = `translate(-50%, -50%) scale(${scale})`;
            
            if (currentAlpha <= 0 || scale <= 0) {
                clearInterval(sparkInterval);
                spark.remove();
            }
        }, 16);
    }
}

// --- MULTI-CATEGORY GRID FILTERS SETUP ---
function setupFilters() {
    const cityPills = document.querySelectorAll('#city-filters .filter-pill');
    const vibePills = document.querySelectorAll('#vibe-filters .filter-pill');
    
    cityPills.forEach(pill => {
        pill.addEventListener('click', () => {
            cityPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeCity = pill.getAttribute('data-filter');
            filterCards();
        });
    });

    vibePills.forEach(pill => {
        pill.addEventListener('click', () => {
            vibePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeVibe = pill.getAttribute('data-filter');
            filterCards();
        });
    });
}

// Initialize the dynamic premium Elite switch toggle for female daters
function initEliteToggle() {
    const isFemale = isFemaleDater();
    const hasElite = checkEliteAccess();
    
    // Default show only elite state to true for Elite female users
    window._showOnlyEliteMen = isFemale && hasElite;
    
    const wrapper = document.getElementById('elite-toggle-wrapper');
    const labelText = document.getElementById('elite-toggle-label-text');
    const switchBtn = document.getElementById('premium-switch-btn');
    
    if (!wrapper) return;
    
    if (isFemale) {
        wrapper.style.display = 'flex';
        
        if (hasElite) {
            // Unlocked state
            if (switchBtn) {
                switchBtn.className = 'premium-switch-button active';
                switchBtn.onclick = () => {
                    window._showOnlyEliteMen = !window._showOnlyEliteMen;
                    if (window._showOnlyEliteMen) {
                        switchBtn.className = 'premium-switch-button active';
                        if (labelText) labelText.textContent = 'Only Elite Men';
                    } else {
                        switchBtn.className = 'premium-switch-button';
                        if (labelText) labelText.textContent = 'All Verified Men';
                    }
                    filterCards();
                };
            }
            if (labelText) labelText.textContent = 'Only Elite Men';
        } else {
            // Locked state
            if (switchBtn) {
                switchBtn.className = 'premium-switch-button locked';
                switchBtn.onclick = () => {
                    // Open Elite required upgrade modal
                    openUpgradeEliteModal('Instadate Aura', 'active-av-2');
                };
            }
            if (labelText) labelText.innerHTML = 'All Verified Men <i data-lucide="lock" style="width: 12px; height: 12px; vertical-align: middle; margin-left: 4px; color: var(--text-muted);"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } else {
        wrapper.style.display = 'none';
    }
}

// --- CORE REAL-TIME FILTER LOGIC WITH SMOOTH FADES ---
function filterCards() {
    const cards = document.querySelectorAll('.profile-card');
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const zeroState = document.getElementById('zero-results');
    
    let visibleCount = 0;
    
    // Check logged in user's gender and tier
    const isFemale = isFemaleDater();
    const hasElite = checkEliteAccess();
    
    cards.forEach(card => {
        const city = card.getAttribute('data-city');
        const vibe = card.getAttribute('data-vibe');
        const keywords = card.getAttribute('data-keywords').toLowerCase();
        
        const cardGender = card.getAttribute('data-gender');
        const cardTier = card.getAttribute('data-tier');
        
        // Multi-layered match check
        const cityMatch = (activeCity === 'all-cities' || city === activeCity);
        const vibeMatch = (activeVibe === 'all-vibes' || vibe === activeVibe);
        const searchMatch = (searchVal === '' || keywords.includes(searchVal));
        
        // Show all verified active members by default. Only narrow when the Elite-only toggle is active.
        let demographicMatch = true;
        if (isFemale && window._showOnlyEliteMen && (cardGender !== 'male' || cardTier !== 'elite')) {
            demographicMatch = false;
        }
        
        if (cityMatch && vibeMatch && searchMatch && demographicMatch) {
            card.style.display = 'flex';
            visibleCount++;
            
            // Add subtle entry fade transition
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px) scale(0.96)';
            
            // Wait for transform animations to complete before applying display: none
            setTimeout(() => {
                if (card.style.opacity === '0') {
                    card.style.display = 'none';
                }
            }, 300);
        }
    });
    
    // Manage empty zero results card display
    if (visibleCount === 0) {
        if (!zeroState) return;
        zeroState.style.display = 'block';
        setTimeout(() => {
            zeroState.style.opacity = '1';
            zeroState.style.transform = 'scale(1)';
        }, 50);
    } else if (zeroState) {
        zeroState.style.opacity = '0';
        zeroState.style.transform = 'scale(0.96)';
        setTimeout(() => {
            if (zeroState.style.opacity === '0') {
                zeroState.style.display = 'none';
            }
        }, 300);
    }
}

// --- REAL-TIME LIVE KEYBOARD SEARCH ---
function filterProfilesRealtime() {
    filterCards();
}

// --- RESET FILTERS ACTION ---
function resetAllFilters() {
    document.getElementById('search-input').value = '';
    
    const cityPills = document.querySelectorAll('#city-filters .filter-pill');
    cityPills.forEach(p => p.classList.remove('active'));
    document.querySelector('#city-filters .filter-pill[data-filter="all-cities"]').classList.add('active');
    activeCity = 'all-cities';

    const vibePills = document.querySelectorAll('#vibe-filters .filter-pill');
    vibePills.forEach(p => p.classList.remove('active'));
    document.querySelector('#vibe-filters .filter-pill[data-filter="all-vibes"]').classList.add('active');
    activeVibe = 'all-vibes';
    
    filterCards();
}

// --- INITIATE VIBE CHECK MODAL OVERLAY ---
// --- INITIATE VIBE CHECK MODAL OVERLAY ---
function initiateVibeCheck(memberName, memberCity, memberVibe) {
    // 1. Find the avatar class of the tapped member dynamically
    let avatarClass = '';
    const cards = document.querySelectorAll('.profile-card');
    for (let card of cards) {
        const nameEl = card.querySelector('.profile-name');
        if (nameEl && nameEl.textContent.includes(memberName)) {
            const cardAvatar = card.querySelector('.profile-avatar');
            if (cardAvatar) {
                cardAvatar.classList.forEach(cls => {
                    if (cls.startsWith('active-av-')) {
                        avatarClass = cls;
                    }
                });
            }
            break;
        }
    }

    // Access Control: Strict Elite Circle check
    if (!checkEliteAccess()) {
        openUpgradeEliteModal(memberName, avatarClass);
        return;
    }

    // Elite User Success Path: Push directly into the inbox with that person!
    const cleanName = memberName ? memberName.split(',')[0].trim() : memberName;
    showEliteChatPushOverlay(cleanName);
    return;

    const modal = document.getElementById('vibe-modal');
    const formContent = document.getElementById('modal-form-content');
    const successContent = document.getElementById('modal-success-content');
    
    const targetNameInput = document.getElementById('target-member-name');
    const targetCityInput = document.getElementById('target-member-city');
    const targetVibeInput = document.getElementById('target-member-vibe');
    
    const dynamicTitle = document.getElementById('modal-dynamic-title');
    const dynamicSubtitle = document.getElementById('modal-dynamic-subtitle');
    const dynamicLabel = document.getElementById('intro-dynamic-label');
    const introTextarea = document.getElementById('user-intro');
    
    const memberSyncDiv = document.getElementById('vibe-check-member-sync');
    const inputName = document.getElementById('user-name');
    const inputAge = document.getElementById('user-age');
    const inputWhatsapp = document.getElementById('user-whatsapp');
    const inputInstagram = document.getElementById('user-instagram');
    
    if (!modal || !formContent || !successContent) return;

    // Reset modals display states
    formContent.style.display = 'block';
    successContent.style.display = 'none';
    
    // Set hidden targets
    targetNameInput.value = memberName;
    targetCityInput.value = memberCity;
    targetVibeInput.value = memberVibe;
    
    // Configure dynamic text based on chosen member
    dynamicTitle.textContent = `Vibe Check: ${memberName}`;
    dynamicSubtitle.textContent = `Get fast-tracked to connect with ${memberName.split(' ')[0]} by sending a curated Vibe Check intro directly to our concierge verification desk!`;
    dynamicLabel.textContent = `Craft your personalized introduction to ${memberName.split(' ')[0]}`;
    
    // Clear session sync banner
    if (memberSyncDiv) memberSyncDiv.innerHTML = "";
    
    // Clear and unlock
    if (inputName) { inputName.value = ""; inputName.readOnly = false; inputName.classList.remove('input-lock-overlay'); }
    if (inputAge) { inputAge.value = ""; inputAge.readOnly = false; inputAge.classList.remove('input-lock-overlay'); }
    if (inputWhatsapp) { inputWhatsapp.value = ""; inputWhatsapp.readOnly = false; inputWhatsapp.classList.remove('input-lock-overlay'); }
    if (inputInstagram) { inputInstagram.value = ""; inputInstagram.readOnly = false; inputInstagram.classList.remove('input-lock-overlay'); }
    
    // Personalized prompts
    if (memberVibe.includes('Cafe')) {
        introTextarea.placeholder = `E.g., Hey ${memberName.split(' ')[0]}, I love cozy aesthetic cafes and deep talks too. I'm based around ${memberCity === 'Mumbai' ? 'Bandra' : 'GK II'} and know the ultimate cafe spot. Let's grab coffee!`;
    } else if (memberVibe.includes('Concert')) {
        introTextarea.placeholder = `E.g., Hey ${memberName.split(' ')[0]}, Diljit Dosanjh or Fred again.. drop beats are my jam as well! Always down to explore underground techno lounges in ${memberCity}. Aux is yours!`;
    } else if (memberVibe.includes('Travel')) {
        introTextarea.placeholder = `E.g., Hey ${memberName.split(' ')[0]}, your हिमाचल trekking adventures sound incredible. I've been planning a quiet cabin retreat too. Always ready for a travel circle!`;
    } else if (memberVibe.includes('Startup')) {
        introTextarea.placeholder = `E.g., Hey ${memberName.split(' ')[0]}, building startups is high-energy! Would love to bounce off tech scaling ideas and founder experiences over some strong espresso.`;
    } else {
        introTextarea.placeholder = `Hey ${memberName.split(' ')[0]}, I vibed with your active profile. I share similar passion coordinates and value-first connection goals. Let's align!`;
    }
    
    // Display modal with scale animations
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
    }, 10);
    
    // Disable body scrolls when modal is active
    document.body.style.overflow = 'hidden';
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeVibeModal() {
    const modal = document.getElementById('vibe-modal');
    if (!modal) return;
    
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        if (window.innerWidth > 768) {
            document.body.style.cursor = 'none'; // Restore custom cursor pointer
        }
    }, 300);
}

// Close modal when clicking outside form bounds
window.addEventListener('click', (e) => {
    const modal = document.getElementById('vibe-modal');
    if (e.target === modal) {
        closeVibeModal();
    }
});

// --- SUBMIT VIBE CHECK AND AUTO-GENERATE WHATSAPP REDIRECTS ---
function handleVibeCheckSubmit(event) {
    event.preventDefault();
    
    const userName = document.getElementById('user-name').value.trim();
    const userAge = parseInt(document.getElementById('user-age').value);
    const userWhatsapp = document.getElementById('user-whatsapp').value.trim();
    const userInstagram = document.getElementById('user-instagram').value.trim();
    const userIntro = document.getElementById('user-intro').value.trim();
    
    const targetName = document.getElementById('target-member-name').value;
    const targetCity = document.getElementById('target-member-city').value;
    const targetVibe = document.getElementById('target-member-vibe').value;
    
    // Perform age validation
    if (userAge < 18 || userAge > 28) {
        alert("Instadate is an exclusive social club strictly for Gen Z aged 18 to 28. Verification check failed.");
        return;
    }
    
    // Perform WhatsApp validation
    if (userWhatsapp.length < 10) {
        alert("Please provide a valid 10-digit WhatsApp number to fast-track your verification concierge.");
        return;
    }
    
    const formContent = document.getElementById('modal-form-content');
    const successContent = document.getElementById('modal-success-content');
    const successMessage = document.getElementById('success-dynamic-message');
    const whatsappBtn = document.getElementById('modal-whatsapp-btn');
    
    // Setup dynamic success descriptions
    successMessage.innerHTML = `Your Vibe Check intro has been successfully logged! We have fast-tracked your application to connect with <strong>${targetName.split(' ')[0]}</strong> in <strong>${targetCity}</strong>.<br><br>Our verification desk will cross-match handles and activate secure chats.`;
    
    // Auto-generate the high-converting personalized WhatsApp message
    const formattedMessage = `Hello Instadate Concierge! ⚡\n\nI just submitted a live Vibe Check on the Active Users Portal!\n\nMy Details:\n• Name: ${userName}\n• Age: ${userAge}\n• City: ${targetCity}\n• Instagram: ${userInstagram}\n• WhatsApp: ${userWhatsapp}\n\nI want to connect with:\n👉 Member: ${targetName} (${targetCity})\n👉 Circle: ${targetVibe}\n\nMy Vibe Check Statement:\n"${userIntro}"\n\nPlease fast-track my verification profile pass! 🎟️`;
    
    const encodedMessage = encodeURIComponent(formattedMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=919876543210&text=${encodedMessage}`;
    
    whatsappBtn.href = whatsappUrl;
    
    // Switch displays
    formContent.style.display = 'none';
    successContent.style.display = 'block';
    
    // Reset form
    document.getElementById('vibe-check-form').reset();
}

/* ==========================================================================
   PROFILE DETAIL MODAL POPULARITY & BRIDGE ENGINE
   ========================================================================== */

// Rich member-specific biographies and interest coordinates mapping
const memberDetails = {
    "kavya sharma": {
        about: "Balcony talker, minimalist cafe explorer, and tech-house aux selector. I believe the best conversations happen over a slow-drip coffee or an iced Americano in cozy, hidden alleys around Bandra.",
        interests: ["Minimalist Cafes", "Tech House", "South Bombay Walk", "Aesthetic Design", "Psychology"]
    },
    "rohan malhotra": {
        about: "Electronic music enthusiast always chasing the perfect drop. From late-night Fred again.. gigs to cozy acoustic mixers, my weekends are defined by beats, neon lights, and double-shot espressos at 1 AM.",
        interests: ["Indie Techno", "Electronic Music", "Gigs & Concerts", "Night Drives", "Cold Brews"]
    },
    "zara chen": {
        about: "Vintage film camera archivist, thrifted hoodie connoisseur, and weekend explorer. When I'm not digging through old books in Indiranagar, I'm trekking through green valleys or driving down offbeat routes.",
        interests: ["Vintage Cameras", "Thrift Shopping", "Bookstores", "Weekend Treks", "Road Trips"]
    },
    "siddharth roy": {
        about: "Fintech engineer, startup builder, and tech evangelist. I live for clean code, scaling systems, and debating which South Bombay street food stall reigns supreme, usually during Marine Drive drives at 2 AM.",
        interests: ["Fintech & Startups", "Software Engineering", "Venture Capital", "Marine Drive Walks", "Late Night Street Food"]
    },
    "priya patel": {
        about: "Lover of warm amber lighting, classic vintage literature, and quiet coffee nooks in Saket. Looking for meaningful, value-first conversations and sharing a quiet workspace over hot lattes.",
        interests: ["Quiet Cafes", "Vintage Books", "Amber Lighting", "Aesthetic Stationery", "Creative Writing"]
    },
    "kabir sen": {
        about: "High-energy badminton double partner, fitness lover, and tech recruiter. Off the court, you can find me microbrewery hopping in Indiranagar or vibing to late-night progressive tech-house sets.",
        interests: ["Badminton", "Microbreweries", "Fitness & Running", "Progressive House", "Sunday Brunch"]
    },
    "ananya deshmukh": {
        about: "Unapologetic AUX DJ, techno festival regular, and Diljit Dosanjh super-fan. I bring the high-vibe energy everywhere, seeking friends to explore underground Boiler Room sets and live gigs around Mumbai.",
        interests: ["Techno Beats", "Live Gigs", "Techno Lounges", "Boiler Room", "Dance Circles"]
    },
    "arjun mehta": {
        about: "Founder building interactive platforms and analyzing venture capital shifts. Deeply curious about coffee roasting techniques, system design architectures, and building products that make a dent.",
        interests: ["Startup Founding", "System Design", "Coffee Roasting", "Angel Investing", "Web3 Tech"]
    },
    "ishan kapoor": {
        about: "Mountain climber, nature enthusiast, and road trip planner. Whether it's backpacking through Himachal valleys or booking an off-grid beach cabin in Goa, I'm always looking for a travel circle.",
        interests: ["Mountain Trekking", "Himachal Trips", "Stargazing & Camping", "Off-grid Cabins", "Landscape Photography"]
    },
    "riya sen": {
        about: "Heritage architecture admirer and street photographer capturing South Bombay's soul. Known for exploring old book stalls near Fort, vintage lens collections, and strong hot black coffees.",
        interests: ["South Bombay Heritage", "Street Photography", "Vintage Lenses", "Book Stalls", "Black Coffee"]
    },
    "meera nair": {
        about: "Backwater kayaking, Munnar tea estate walks, and exploring coastal cafes in Kochi.",
        interests: ["Kayaking", "Tea Gardens", "Coastal Cafe", "Filter Coffee", "Road Trips"]
    },
    "sneha reddy": {
        about: "Specialty coffee lover, Jubilee Hills balcony talker, and modern art enthusiast.",
        interests: ["Specialty Coffee", "Modern Art", "Balcony Talks", "Sunset Gazing", "Indie Music"]
    },
    "natasha dsouza": {
        about: "Catamaran sailing enthusiast, hidden beach tracker, and classic literature collector.",
        interests: ["Sailing", "Beach Treks", "Book Reading", "Sunsets", "Acoustic Jams"]
    },
    "diya sen": {
        about: "SaaS developer, startup co-founder, and late-night tech designer in Gurgaon.",
        interests: ["SaaS Development", "Startup Pitching", "Midnight Chai", "Coding", "UI/UX Design"]
    },
    "shruti iyer": {
        about: "Carnatic fusion selector, deep house curator, and experimental cooking fan.",
        interests: ["Deep House", "Carnatic Fusion", "Adyar Walks", "Cooking", "Aesthetic Design"]
    },
    "riddhi bose": {
        about: "Film photographer capturing Kolkata's vintage soul, bookstore hopper, and black coffee lover.",
        interests: ["Film Photography", "Bookstores", "Yellow Taxis", "Black Coffee", "Retro Cinema"]
    },
    "simran kaur": {
        about: "Squash player, fitness advocate, marathon runner, and weekend hiker.",
        interests: ["Squash", "Marathons", "Fitness", "Smoothies", "Hiking"]
    },
    "ameya menon": {
        about: "Fort Kochi sketcher, architecture enthusiast, and seaside cafe explorer.",
        interests: ["Sketching", "Colonial History", "Seaside Cafes", "Sunset Walks", "Art Galleries"]
    },
    "pooja sharma": {
        about: "Heritage architecture lover, rose tea connoisseur, and photography enthusiast.",
        interests: ["Heritage Walks", "Rose Tea", "Block Print Art", "Photography", "Pottery"]
    },
    "neha deshmukh": {
        about: "Jazz club explorer, vinyl collector, and botanical mocktail crafter in Bandra.",
        interests: ["Jazz Clubs", "Vinyl Records", "Botanical Drinks", "Bandra Walks", "Acoustic Sessions"]
    },
    "kritika rawat": {
        about: "Tennis enthusiast, morning runner, healthy brunch explorer, and dog lover.",
        interests: ["Tennis", "Sunday Brunch", "Running", "Cold Brews", "Pet Friendly"]
    },
    "rhea verghese": {
        about: "Acoustic concert regular, Koramangala cafe hopper, and oversized fashion fan.",
        interests: ["Acoustic Music", "Cafe Hopping", "Thrift Fashion", "Late Night Talks", "Indie Pop"]
    },
    "kiara advani": {
        about: "Koregaon Park cafe explorer, philosophical reader, and organic tea collector.",
        interests: ["Koregaon Park", "Philosophy", "Organic Tea", "Minimalist Design", "Deep Conversations"]
    },
    "maya rao": {
        about: "Edtech builder, side hustle enthusiast, and Gachibowli filter coffee lover.",
        interests: ["Edtech", "Side Hustles", "Filter Coffee", "Sustainability", "Product Design"]
    },
    "aisha patel": {
        about: "Anjuna beach bonfire planner, surfer, organic farmer, and indie folk fan.",
        interests: ["Bonfire Circles", "Surfing", "Organic Farming", "Indie Folk", "Stargazing"]
    },
    "mira nair": {
        about: "Indiranagar bookstore reviewer, matcha latte lover, and aesthetic planner collector.",
        interests: ["Indie Bookstores", "Matcha Latte", "Vintage Paperbacks", "Aesthetic Design", "Creative Writing"]
    },
    "tara kapoor": {
        about: "Cycling enthusiast, Pune hills trekker, masala chai fan, and acoustic guitarist.",
        interests: ["Cycling", "Hilltop Treks", "Masala Chai", "Acoustic Guitar", "Nature Trails"]
    },
    "shalini joshi": {
        about: "Off-grid cottage explorer, coastal drive fan, and landscape photographer.",
        interests: ["Off-grid Living", "Coastal Drives", "Landscape Photography", "Sunsets", "Quiet Walks"]
    },
    "diya mehta": {
        about: "Fintech product manager, Juhu beach walker, and street food lover.",
        interests: ["Fintech", "Product Management", "Beachside Walks", "Street Food", "Startup Scaling"]
    },
    "tanya sen": {
        about: "Art museum guide, hot chocolate collector, and creative writer in Delhi.",
        interests: ["Museum Dates", "Hot Chocolate", "Art Cafes", "Creative Writing", "Quiet Walks"]
    },
    "natasha rao": {
        about: "Spontaneous road tripper, postcard collector, and HSR Layout cafe hopper.",
        interests: ["Road Trips", "Waterfalls", "Postcards", "HSR Cafes", "Indie Rock"]
    },
    "sanya gupta": {
        about: "Bouldering fan, fitness enthusiast, cold-pressed juice lover, and rock climber.",
        interests: ["Bouldering", "Rock Climbing", "Juice Bars", "Fitness", "Indie Music"]
    },
    "esha deol": {
        about: "90s retro enthusiast, deep house mixer, and Bandra West fashion blogger.",
        interests: ["Retro Bollywood", "Deep House", "Fashion Blogging", "Bandra West", "Music Festivals"]
    },
    "anjali sharma": {
        about: "Software developer, side-project builder, and Viman Nagar cafe worker.",
        interests: ["Software Dev", "Side Projects", "Viman Nagar", "Tech Talks", "Espresso Drinks"]
    },
    "aditi rao": {
        about: "Psychology graduate, dark chocolate connoisseur, and Banjara Hills resident.",
        interests: ["Psychology Talks", "Dark Chocolate", "Banjara Hills", "Balcony Chats", "Quiet Music"]
    },
    "kavya pillai": {
        about: "Badminton player, active runner, tender coconut fan, and Kochi explorer.",
        interests: ["Badminton", "Running", "Tender Coconut", "Active Lifestyle", "Kochi Trails"]
    },
    "rhea kapoor": {
        about: "Parvati Valley backpacker, mountain stream seeker, and Saket book reader.",
        interests: ["Parvati Valley", "Backpacking", "Saket Books", "Mountain Streams", "Travel Writing"]
    },
    "ishita roy": {
        about: "Synthwave selector, Park Street diner, and late-night drive lover.",
        interests: ["Synthwave", "Park Street", "Late Night Drives", "Indie Pop", "Vinyl Collecting"]
    },
    "suhana khan": {
        about: "South Bombay sailor, brunch lover, Marine Drive jogger, and design student.",
        interests: ["Sailing", "Brunch Dates", "Marine Drive", "Design Student", "Active Sports"]
    },
    "tanisha sen": {
        about: "Web3 researcher, Whitefield resident, filter coffee hooper, and early tech adapter.",
        interests: ["Web3", "Blockchain Scale", "Filter Coffee", "Whitefield", "Product Design"]
    },
    "divya nair": {
        about: "Lakeside cafe sketcher, bird watcher, warm latte collector in Kakkanad.",
        interests: ["Lakeside Cafes", "Sketching", "Warm Lattes", "Bird Watching", "Quiet Evenings"]
    },
    "zoya akhtar": {
        about: "Techno mixer curator, Vagator resident, sunset dancer, and electronic fan.",
        interests: ["Techno Mixers", "Vagator Beach", "Fred again..", "Sunset Dance", "Electronic Music"]
    },
    "avni malhotra": {
        about: "GK I map collector, heritage fort explorer, and vintage diary writer.",
        interests: ["Map Collecting", "Heritage Forts", "Vintage Diaries", "GK I Cafes", "Travel Sketching"]
    },
    "meghna reddy": {
        about: "Swimmer, fitness advocate, Begumpet resident, and progressive house fan.",
        interests: ["Swimming", "Organic Bowls", "Begumpet", "Progressive House", "Fitness Running"]
    },
    "kriti sanon": {
        about: "Creator economy builder, Bandra West resident, ice drip brew collector.",
        interests: ["Creator Economy", "Bandra West", "Ice Drip Brew", "Creator Scaling", "Aesthetic Design"]
    },
    "pooja hegde": {
        about: "Indiranagar bouldering regular, smoothie bowl lover, and fitness enthusiast.",
        interests: ["Bouldering", "Smoothie Bowls", "Indiranagar", "Fitness", "Chill Beats"]
    },
    "alia bhatt": {
        about: "Juhu resident, sunset beach walker, corn on the cob fan, and retro music lover.",
        interests: ["Juhu Beach", "Sunset Walks", "Roasted Corn", "Retro Music", "Aesthetic Cafes"]
    },
    "rashmika mandanna": {
        about: "Coorg backpacker, nature photographer, Koramangala resident, and indie fan.",
        interests: ["Coorg Backpacking", "Nature Photography", "Koramangala", "Indie Music", "Stargazing"]
    },
    "sara ali khan": {
        about: "Cardamom chai lover, Urdu poetry reciter, and Saket resident.",
        interests: ["Cardamom Chai", "Urdu Poetry", "Saket Cafes", "Balcony Talks", "Heritage Walks"]
    },
    "janhvi kapoor": {
        about: "Acoustic set regular, Bandra West resident, fairy lights fan, and apple cider lover.",
        interests: ["Acoustic Sets", "Fairy Lights", "Bandra West", "Warm Cider", "Live Jams"]
    },
    "khushi kapoor": {
        about: "Squash player, South Bombay resident, fitness enthusiast, and health shake fan.",
        interests: ["Squash", "South Bombay", "Fitness Talks", "Health Shakes", "Active Lifestyle"]
    },
    "ananya panday": {
        about: "Art gallery walker, Juhu resident, gelato collector, and aesthetic design seeker.",
        interests: ["Art Galleries", "Gelato Chats", "Juhu Alleys", "Aesthetic Design", "Creative Photography"]
    },
    "shanaya kapoor": {
        about: "Single-origin coffee collector, design enthusiast, and Bandra East resident.",
        interests: ["Single-origin Coffee", "Pour Overs", "Bandra East", "Design Design", "Startup Scaling"]
    },
    "navya nanda": {
        about: "Social entrepreneur, community builder, Juhu resident, and strong black coffee fan.",
        interests: ["Social Entrepreneur", "Community Building", "Juhu Coffee", "Black Coffee", "Startup Impact"]
    },
    "suhana sen": {
        about: "Off-grid backpacker, map journaler, Saket resident, and mountain trekker.",
        interests: ["Off-grid Travel", "Map Journaling", "Saket Cafes", "Mountain Treks", "Nature Paths"]
    },
    "devansh joshi": {
        about: "Fintech founder, high agency system builder, Koregaon Park resident, and espresso collector.",
        interests: ["Fintech Founder", "High Agency", "Koregaon Park", "Espresso", "System Architecture"]
    },
    "rishabh reddy": {
        about: "Proptech co-founder, venture capitalist, Jubilee Hills resident, and late-night driver.",
        interests: ["Proptech", "Venture Capital", "Jubilee Hills", "Late Night Drives", "Startup Scaling"]
    },
    "varun malhotra": {
        about: "AI builder, startup tech architect, Vasant Vihar resident, and single-origin coffee fan.",
        interests: ["AI Automation", "Tech Architect", "Vasant Vihar", "Pour Overs", "Coding Systems"]
    },
    "akhil sen": {
        about: "Techno selector, Bandra West resident, Fred again.. drop analyst, and cold brew fan.",
        interests: ["Techno Beats", "Bandra West", "Fred again..", "Cold Brews", "Electronic Gigs"]
    },
    "nikhil dev": {
        about: "Web3 developer, open-source scaling architect, Indiranagar filter coffee regular.",
        interests: ["Web3 Protocols", "Open Source", "Indiranagar", "Filter Coffee", "Startup Scaling"]
    },
    "aditya birla": {
        about: "Eco-stay reviewer, Parvati Valley trekker, Koregaon Park artist, and digital painter.",
        interests: ["Eco-stays", "Parvati Valley", "Koregaon Park", "Digital Painting", "Travel Diaries"]
    },
    "rahul hegde": {
        about: "Specialty coffee collector, system designer, Gachibowli balcony talker, and jazz fan.",
        interests: ["Specialty Coffee", "System Design", "Gachibowli", "Balcony Talks", "Jazz Music"]
    },
    "vikram singhal": {
        about: "Catamaran sailor, Vagator beach runner, philosophical reader, and acoustic designer.",
        interests: ["Catamaran Sailing", "Offshore Fishing", "Vagator Beach", "Philosophy", "Acoustic Jams"]
    },
    "rohit kapoor": {
        about: "SaaS builder, venture investor, DLF Phase 5 resident, and midnight coffee lover.",
        interests: ["SaaS Builder", "Venture Investing", "DLF Phase 5", "Black Coffee", "Product Strategy"]
    },
    "ashwin kumar": {
        about: "ECR road tripper, beachside camper, Carnatic guitar player, and stargazing fan.",
        interests: ["ECR Road Trips", "Beach Camping", "Carnatic Guitar", "Stargazing", "Nature Trails"]
    },
    "sarthak ghosh": {
        about: "Heritage architecture fan, Park Street vintage book hunter, and strong coffee lover.",
        interests: ["Heritage Walks", "Park Street Books", "Iced Coffee", "Aesthetic Design", "Vintage Camera"]
    },
    "gurpreet singh": {
        about: "Trail runner, triathlon trainee, Sector 8 resident, and fitness advocate.",
        interests: ["Trail Running", "Triathlon", "Sector 8", "Smoothies", "Active Lifestyle"]
    },
    "gautham pillai": {
        about: "Fort Kochi sketcher, heritage cafe lover, yacht sailing enthusiast.",
        interests: ["Fort Kochi", "Sketching", "Heritage Cafes", "Yacht Sailing", "Art History"]
    },
    "varun mehta": {
        about: "Heritage fort photographer, C-Scheme resident, vintage lens archivist.",
        interests: ["Fort Photography", "Vintage Lenses", "C-Scheme", "Heritage Tea", "Art Curation"]
    },
    "armaan roy": {
        about: "Colaba speakeasy lover, jazz record collector, retro cocktail fan, and designer.",
        interests: ["Jazz Speakeasies", "Colaba Walks", "Vinyl Jazz", "Retro Cocktails", "Design Design"]
    },
    "sameer saxena": {
        about: "Urdu ghazal reciter, Saket coffee dripper, dark chocolate lover.",
        interests: ["Urdu Ghazals", "Saket Cafes", "Pour Overs", "Dark Chocolate", "Balcony Talks"]
    },
    "sidharth khanna": {
        about: "Boiler room regular, synth-pop fan, Koramangala late driver, Fred again.. collector.",
        interests: ["Boiler Rooms", "Synth-pop", "Koramangala", "Fred again..", "Late Drives"]
    },
    "ishaan roy": {
        about: "Koregaon Park pour-over fan, startup system analyzer, minimalist thinker.",
        interests: ["Pour-overs", "Minimalist Design", "Koregaon Park", "Startup Systems", "Deep Talks"]
    },
    "vivek oberoi": {
        about: "Edtech SaaS co-founder, Banjara Hills resident, single-estate coffee drinker.",
        interests: ["Edtech SaaS", "Banjara Hills", "Pour Overs", "Coding Tech", "Venture Scale"]
    },
    "kabir grover": {
        about: "Anjuna beach bonfire regular, acoustic guitarist, organic farming advocate.",
        interests: ["Bonfire Circles", "Acoustic Guitar", "Anjuna Beach", "Stargazing", "Organic Living"]
    },
    "siddharth dev": {
        about: "Gurgaon SaaS builder, DLF Phase 4 resident, cold drip coffee lover.",
        interests: ["SaaS Product", "DLF Phase 4", "Cold Drip", "Side Projects", "Ambition Scale"]
    },
    "karthik raja": {
        about: "ECR road tripper, campfire planner, Carnatic fusion fan.",
        interests: ["ECR Drives", "Coastal Camping", "Carnatic Fusion", "Stargazing", "Acoustic Music"]
    },
    "rishi kothari": {
        about: "HSR Layout bookstore lover, specialty latte drinker, philosophy reader.",
        interests: ["HSR Layout", "Specialty Lattes", "Philosophy", "Indie Books", "Quiet Chats"]
    },
    "sahil salvi": {
        about: "Viman Nagar cyclist, hilltop trekker, strong masala chai lover.",
        interests: ["Cycling", "Hilltop Treks", "Viman Nagar", "Masala Chai", "Acoustic Jam"]
    },
    "karan kundra": {
        about: "Gachibowli designer, single-origin coffee lover, lakeside walker.",
        interests: ["Lakeside Cafe", "Pour Overs", "Gachibowli", "Design Talks", "Aesthetic Vibes"]
    },
    "abhimanyu sen": {
        about: "Vagator beach driver, sunset photographer, bonfire circle lover.",
        interests: ["Vagator Beach", "Sunset Photos", "Bonfires", "Stargazing", "Surf Lessons"]
    },
    "jatin verma": {
        about: "Sector 15 squash player, active trainer, fitness shake fan.",
        interests: ["Squash", "Active Fitness", "Sector 15", "Protein Shakes", "Tech Talks"]
    },
    "arjun reddy": {
        about: "Munnar tea trekker, Kakkanad resident, backwater photographer.",
        interests: ["Munnar Treks", "Backwater Photos", "Kakkanad", "Filter Coffee", "Coastal Drives"]
    },
    "kunal kapoor": {
        about: "Jaipur pottery fan, aesthetic cafe hopper, heritage fort explorer.",
        interests: ["Pottery Workshops", "Jaipur Forts", "Aesthetic Cafes", "Malviya Nagar", "Rose Tea"]
    },
    "rohan sen": {
        about: "Colaba sailor, Marine Drive runner, South Bombay brunch fan.",
        interests: ["Sailing", "Colaba Walks", "Brunch Dates", "Marine Drive", "Sports Fitness"]
    },
    "aman verma": {
        about: "Dwarka acoustic jam regular, fairy lights fan, guitar lover.",
        interests: ["Acoustic Jams", "Dwarka", "Fairy Lights", "Acoustic Guitar", "Dark Chocolate"]
    },
    "rishi sen": {
        about: "Whitefield bookstore regular, specialty matcha lover, film photography fan.",
        interests: ["Whitefield", "Bookstore Cafes", "Specialty Matcha", "Film Photo", "Quiet Walks"]
    },
    "jatin dev": {
        about: "Sector 35 badminton player, active jogger, smoothie fan.",
        interests: ["Badminton", "Sector 35", "Active Lifestyle", "Smoothies", "Tech Chats"]
    },
    "arjun sen": {
        about: "Kochi kayaker, beach camper, coastal food lover.",
        interests: ["Backwater Kayak", "Edapally", "Beachside Camping", "Coastal Food", "Road Trips"]
    },
    "kunal dev": {
        about: "Jaipur fort photographer, C-Scheme resident, vintage lens buyer.",
        interests: ["Jaipur Forts", "C-Scheme Cafes", "Vintage Lenses", "Fort Photo", "Specialty Tea"]
    },
    "dev malhotra": {
        about: "GK II tennis player, hot latte drinker, tech-house selector.",
        interests: ["Tennis Player", "GK II", "Hot Lattes", "Tech House", "Sports Fitness"]
    },
    "sahil grover": {
        about: "Koregaon Park cyclist, hilltop trekker, green tea lover.",
        interests: ["Cycling", "Koregaon Park", "Hilltop Trek", "Green Tea", "Acoustic Guitar"]
    },
    "karan dev": {
        about: "Banjara Hills builder, social entrepreneur, pour-over coffee fan.",
        interests: ["Social Tech", "Banjara Hills", "Pour Overs", "Community Scaling", "Design Design"]
    },
    "abhi kapoor": {
        about: "South Goa traveler, landscape photographer, bonfire regular.",
        interests: ["Coastal Drives", "South Goa", "Landscape Photo", "Bonfires", "Quiet Walks"]
    },
    "jatin roy": {
        about: "Kolkata synthwave lover, Park Street diner, late yellow taxi driver.",
        interests: ["Synthwave", "Park Street", "Late Drives", "Acoustic Mixers", "Retro Film"]
    },
    "arjun joshi": {
        about: "Fort Kochi sketcher, heritage cafe lover, coastal photo fan.",
        interests: ["Heritage Cafes", "Coastal Sketch", "Fort Kochi", "Amber Lights", "Quiet Walks"]
    },
    "kunal roy": {
        about: "Jaipur runner, Malviya Nagar resident, book reader.",
        interests: ["Morning Runs", "Central Park", "Dwarka Juices", "Malviya Nagar", "Book Reading"]
    },
    "dev roy": {
        about: "Kolkata SaaS builder, Salt Lake resident, yellow taxi fan.",
        interests: ["SaaS Builder", "Salt Lake", "Yellow Taxis", "Social Impact", "Startup Scaling"]
    },
    "sahil dev": {
        about: "Sahyadri trekker, Kothrud resident, campfire stargazing fan.",
        interests: ["Sahyadri Treks", "Kothrud", "Eco-stays", "Campfire Star", "Travel Diaries"]
    },
    "karan roy": {
        about: "Jubilee Hills badminton player, active runner, health shake lover.",
        interests: ["Badminton", "Jubilee Hills", "Fitness Talks", "Health Shakes", "Sports Lifestyle"]
    }
};

// Initialize event handlers for card clicks
function setupProfileCardClicks() {
    const cards = document.querySelectorAll('.profile-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Guard: If clicking the send vibe check button or inside it, bypass detail popup
            if (e.target.closest('button.btn-primary') || e.target.closest('button.btn-glow')) {
                return;
            }
            openProfileDetailModal(card);
        });
    });
}

// Populate and display the luxury profile details modal
function openProfileDetailModal(card) {
    const modal = document.getElementById('profile-detail-modal');
    if (!modal) return;

    // 1. Extract raw data from profile card
    const rawName = card.querySelector('.profile-name').textContent;
    const cleanName = rawName.split(',')[0].trim();
    
    const locationHTML = card.querySelector('.profile-city').innerHTML;
    const vibePill = card.querySelector('.profile-vibe-pill');
    const promptText = card.querySelector('.profile-prompt').textContent;
    const answerText = card.querySelector('.profile-answer').textContent;
    
    // Extract avatar classes or background
    const cardAvatar = card.querySelector('.profile-avatar');
    let avatarClass = '';
    if (cardAvatar) {
        // Find class starting with active-av-
        cardAvatar.classList.forEach(cls => {
            if (cls.startsWith('active-av-')) {
                avatarClass = cls;
            }
        });
    }

    // Determine HSL category color (pink, purple, cyan)
    let themeColor = 'pink'; // default
    if (vibePill) {
        if (vibePill.classList.contains('text-purple')) {
            themeColor = 'purple';
        } else if (vibePill.classList.contains('text-cyan')) {
            themeColor = 'cyan';
        }
    }

    // 2. Populate modal DOM items
    const detailAvatar = document.getElementById('detail-avatar');
    if (detailAvatar) {
        // Reset classes and assign new avatar class
        detailAvatar.className = 'profile-detail-avatar';
        if (avatarClass) {
            detailAvatar.classList.add(avatarClass);
        }
    }

    document.getElementById('detail-name').textContent = rawName;
    document.getElementById('detail-location').innerHTML = locationHTML;
    
    // Setup dynamic vibe badge
    const vibeBadge = document.getElementById('detail-vibe-badge');
    if (vibeBadge && vibePill) {
        vibeBadge.innerHTML = vibePill.innerHTML;
        vibeBadge.className = `profile-detail-vibe-badge ${themeColor}`;
    }

    // Setup dynamic backlight glow orb
    const glowOrb = document.getElementById('profile-detail-glow-orb');
    if (glowOrb) {
        glowOrb.className = `profile-detail-glow ${themeColor}`;
    }

    // Setup prompt question card styling
    const promptCard = modal.querySelector('.detail-prompt-card');
    if (promptCard) {
        promptCard.className = `detail-prompt-card glass-card ${themeColor}`;
    }
    
    document.getElementById('detail-prompt').textContent = promptText;
    document.getElementById('detail-answer').textContent = answerText;

    // Fetch biography from memberDetails mapper
    const nameKey = cleanName.toLowerCase();
    const detailObj = memberDetails[nameKey] || {
        about: `Hey there! I am passionate about conscious connections, exploring unique local coordinates, and engaging in value-first dialogues within the Instadate Social Club. Let's align!`,
        interests: ["Conscious Connecting", "Aesthetic Vibes", "Local Explorations"]
    };

    document.getElementById('detail-about').textContent = detailObj.about;

    // Generate dynamic interest capsules
    const interestsGrid = document.getElementById('detail-interests');
    if (interestsGrid) {
        interestsGrid.innerHTML = ''; // clear existing
        detailObj.interests.forEach(interest => {
            const pill = document.createElement('span');
            pill.className = 'interest-pill';
            pill.textContent = interest;
            interestsGrid.appendChild(pill);
        });
    }

    // Wire up connection CTA trigger
    const connectBtn = document.getElementById('detail-connect-btn');
    if (connectBtn) {
        // Extract raw city for initiateVibeCheck (e.g. from data-city)
        const cityData = card.getAttribute('data-city');
        let cleanCity = 'Mumbai';
        if (cityData === 'delhi') cleanCity = 'Delhi NCR';
        else if (cityData === 'bangalore') cleanCity = 'Bangalore';

        // Extract raw vibe category name
        let vibeName = 'Cafe Partner';
        if (themeColor === 'purple') {
            vibeName = vibePill.textContent.includes('Startup') ? 'Startup Networking' : 'Concert Buddy';
        } else if (themeColor === 'cyan') {
            vibeName = vibePill.textContent.includes('Sports') ? 'Sports Partner' : 'Travel Buddy';
        }

        connectBtn.onclick = () => {
            initiateVibeCheckFromDetail(rawName.split(',')[0], cleanCity, vibeName);
        };
    }

    // 3. Display modal with premium animations
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
    }, 15);

    document.body.style.overflow = 'hidden';

    // Refresh Lucide SVGs for new details content
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Close the luxury profile detail sheet
function closeProfileDetailModal() {
    const modal = document.getElementById('profile-detail-modal');
    if (!modal) return;

    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        if (window.innerWidth > 768) {
            document.body.style.cursor = 'none'; // Keep custom sparks cursor alive
        }
    }, 300);
}

// Bridge the profile detail view with the Whatsapp onboarding modal
function initiateVibeCheckFromDetail(memberName, memberCity, memberVibe) {
    // 1. Dismiss profile details sheet with smooth exit speed
    closeProfileDetailModal();
    
    // 2. Open vibe check fast-track modal after brief delay to prevent overlap conflicts
    setTimeout(() => {
        initiateVibeCheck(memberName, memberCity, memberVibe);
    }, 320);
}

// Bind overlay click dismissals for profile details modal
window.addEventListener('click', (e) => {
    const detailModal = document.getElementById('profile-detail-modal');
    if (e.target === detailModal) {
        closeProfileDetailModal();
    }
});

// Access Control: Strict check if user has Elite plan subscription
function checkEliteAccess() {
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user) {
                // For female daters, Instadate Aura (Premium or Elite) gives full Elite equivalent access
                const isFemale = (user.gender === 'Female' || user.interest === 'Men');
                if (isFemale && (user.tier === 'Premium' || user.tier === 'Elite')) {
                    return true;
                }
                if (!isFemale && user.tier === 'Elite') {
                    return true;
                }
            }
        } catch (e) {
            console.error("Error reading instadate_user:", e);
        }
    }
    return false;
}

// Modal control: Open the gorgeous glassmorphic Elite Upgrade modal
function openUpgradeEliteModal(memberName, avatarClass) {
    const modal = document.getElementById('upgrade-elite-modal');
    if (!modal) return;

    const isFemale = isFemaleDater();

    // Populate tapped member name and avatar class
    const targetNameEl = document.getElementById('upgrade-elite-target-name');
    const targetAvatarEl = document.getElementById('upgrade-elite-avatar');
    const subtitleEl = document.getElementById('upgrade-elite-subtitle');
    const titleEl = document.getElementById('upgrade-elite-title');

    const cleanName = memberName ? memberName.split(',')[0].trim() : 'this member';

    if (targetNameEl) {
        targetNameEl.textContent = `Connect with ${cleanName}`;
    }

    if (targetAvatarEl) {
        targetAvatarEl.className = 'upgrade-elite-target-avatar';
        if (avatarClass) {
            targetAvatarEl.classList.add(avatarClass);
        }
    }

    if (titleEl) {
        titleEl.textContent = isFemale ? 'Instadate Aura' : 'Instadate Elite';
    }

    if (subtitleEl) {
        subtitleEl.innerHTML = isFemale 
            ? `Unlock direct Vibe Checks with <strong>${cleanName}</strong> through <strong>Instadate Aura</strong>. Upgrade once, then connect instantly.`
            : `Unlock direct Vibe Checks with <strong>${cleanName}</strong> through <strong>Instadate Elite</strong>. Upgrade once, then connect instantly.`;
    }

    // Dynamic Perks list
    const perksContainer = modal.querySelector('.elite-perks-list');
    if (perksContainer) {
        if (isFemale) {
            perksContainer.innerHTML = `
                <div class="perk-item">
                    <i data-lucide="gem" class="text-cyan"></i>
                    <div>
                        <h4 class="font-outfit text-white">Elite Men Only</h4>
                        <p>Browse high-intent, verified Elite members only.</p>
                    </div>
                </div>
                <div class="perk-item">
                    <i data-lucide="shield-check" class="text-pink"></i>
                    <div>
                        <h4 class="font-outfit text-white">Better Privacy Controls</h4>
                        <p>Keep Ghost Mode, filters, and verification controls in one plan.</p>
                    </div>
                </div>
                <div class="perk-item">
                    <i data-lucide="sparkles" class="text-purple"></i>
                    <div>
                        <h4 class="font-outfit text-white">Priority Matching</h4>
                        <p>Move faster with concierge-backed introductions.</p>
                    </div>
                </div>
            `;
        } else {
            perksContainer.innerHTML = `
                <div class="perk-item">
                    <i data-lucide="sparkles" class="text-cyan"></i>
                    <div>
                        <h4 class="font-outfit text-white">Direct Vibe Checks</h4>
                        <p>Send intros to active verified members without waiting.</p>
                    </div>
                </div>
                <div class="perk-item">
                    <i data-lucide="shield-check" class="text-pink"></i>
                    <div>
                        <h4 class="font-outfit text-white">Curated Matching</h4>
                        <p>Get higher-signal introductions from the concierge desk.</p>
                    </div>
                </div>
                <div class="perk-item">
                    <i data-lucide="award" class="text-purple"></i>
                    <div>
                        <h4 class="font-outfit text-white">Mixer Priority</h4>
                        <p>Access invite-only offline events and member mixers.</p>
                    </div>
                </div>
            `;
        }
    }

    // Dynamic Pricing Box
    const priceLabel = modal.querySelector('.elite-pricing-box .price-label');
    const priceValue = modal.querySelector('.elite-pricing-box .price-value');
    if (priceLabel) {
        priceLabel.textContent = isFemale ? 'INSTADATE AURA PLAN' : 'INSTADATE ELITE PLAN';
    }
    if (priceValue) {
        priceValue.innerHTML = isFemale
            ? `₹199 <span class="price-period">/ month</span>`
            : `₹699 <span class="price-period">/ month</span>`;
    }

    // Dynamic Footer CTA Button
    const ctaBtn = modal.querySelector('.upgrade-elite-footer button.btn-primary');
    if (ctaBtn) {
        ctaBtn.innerHTML = isFemale 
            ? `Upgrade to Aura <i data-lucide="zap" class="btn-arrow"></i>`
            : `Upgrade to Elite <i data-lucide="zap" class="btn-arrow"></i>`;
    }

    // Dynamic Success Content
    const successTitle = modal.querySelector('#upgrade-elite-success-content .modal-title');
    const successSubtitle = modal.querySelector('#upgrade-elite-success-content .modal-subtitle');
    if (successTitle) {
        successTitle.textContent = isFemale ? 'Welcome to Instadate Aura!' : 'Welcome to Instadate Elite!';
    }

    if (successSubtitle) {
        successSubtitle.innerHTML = isFemale 
            ? `Your account has been upgraded to <strong>Instadate Aura</strong>. Direct Vibe Checks are now unlocked.`
            : `Your account has been upgraded to <strong>Instadate Elite</strong>. Direct Vibe Checks are now unlocked.`;
    }

    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
    }, 15);

    document.body.style.overflow = 'hidden';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Modal control: Close the Elite Upgrade modal
function closeUpgradeEliteModal() {
    const modal = document.getElementById('upgrade-elite-modal');
    if (!modal) return;

    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset contents back to main view for next time
        const mainContent = document.getElementById('upgrade-elite-main-content');
        const successContent = document.getElementById('upgrade-elite-success-content');
        if (mainContent && successContent) {
            mainContent.style.display = 'block';
            successContent.style.display = 'none';
        }

        if (window.innerWidth > 768) {
            document.body.style.cursor = 'none'; // Keep custom sparks cursor alive
        }
    }, 300);
}

// Simulated Upgrade flow: Update user session to Elite tier
function upgradeUserToEliteAndNotify() {
    const userData = localStorage.getItem('instadate_user');
    let user = {};
    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch (e) {
            console.error(e);
        }
    }
    user.tier = 'Elite';
    if (!user.name) user.name = 'Club Member';
    localStorage.setItem('instadate_user', JSON.stringify(user));

    // Show simulated checkout success screen inside modal
    const mainContent = document.getElementById('upgrade-elite-main-content');
    const successContent = document.getElementById('upgrade-elite-success-content');
    if (mainContent && successContent) {
        mainContent.style.display = 'none';
        successContent.style.display = 'block';
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Bind overlay click dismissals for Elite upgrade modal
window.addEventListener('click', (e) => {
    const upgradeModal = document.getElementById('upgrade-elite-modal');
    if (e.target === upgradeModal) {
        closeUpgradeEliteModal();
    }
});

// Premium slide-fade transition to the inbox for Elite users
function showEliteChatPushOverlay(memberName) {
    const isFemale = isFemaleDater();
    const tierName = isFemale ? 'Instadate Aura' : 'Elite Circle';

    // Create dynamic glassmorphic overlay element
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.style.zIndex = '9999';
    overlay.style.background = 'rgba(4, 3, 6, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease';

    overlay.innerHTML = `
        <div class="modal-container glass-card text-center py-6" style="max-width: 450px; border: 1px solid rgba(0, 245, 255, 0.25); box-shadow: 0 0 30px rgba(0, 245, 255, 0.15); background: rgba(10, 9, 14, 0.95);">
            <div class="success-icon-wrapper circle-glow-cyan" style="box-shadow: 0 0 20px rgba(0, 245, 255, 0.15); margin: 0 auto 1.5rem auto; width: 64px; height: 64px; border-radius: 50%; background: rgba(0, 245, 255, 0.08); display: flex; align-items: center; justify-content: center;">
                <i data-lucide="party-popper" class="text-cyan" style="width: 28px; height: 28px; color: var(--primary-cyan) !important;"></i>
            </div>
            <h2 class="modal-title font-outfit" style="font-size: 1.85rem; margin-top: 1rem; color: var(--text-white);">Match Active! 💎</h2>
            <p class="modal-subtitle max-w-sm mx-auto" style="margin-bottom: 1.5rem; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5;">
                As an <strong>${tierName}</strong> member, you are fast-tracked! Opening secure chat channels with <strong>${memberName}</strong>...
            </p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--primary-cyan); font-weight: bold; font-size: 0.85rem;">
                <span class="status-dot animate-pulse" style="background-color: var(--primary-cyan);"></span>
                Connecting to Matchmaking Desk...
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    
    // Trigger Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Disable scrolls
    document.body.style.overflow = 'hidden';

    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 15);

    // Redirect after brief delay
    setTimeout(() => {
        window.location.href = `chat.html?match=${encodeURIComponent(memberName)}`;
    }, 1500);
}

// Access Control helper: check if logged-in user is female or created a female profile
function isFemaleDater() {
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user && (user.gender === 'Female' || user.interest === 'Men')) {
                return true;
            }
        } catch (e) {
            console.error("Error reading user gender:", e);
        }
    }
    return false;
}


