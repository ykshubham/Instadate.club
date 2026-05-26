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
    
    // Set initial display of profile cards with animations
    filterCards();
    
});

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

// --- CORE REAL-TIME FILTER LOGIC WITH SMOOTH FADES ---
function filterCards() {
    const cards = document.querySelectorAll('.profile-card');
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    const zeroState = document.getElementById('zero-results');
    
    let visibleCount = 0;
    
    cards.forEach(card => {
        const city = card.getAttribute('data-city');
        const vibe = card.getAttribute('data-vibe');
        const keywords = card.getAttribute('data-keywords').toLowerCase();
        
        // Multi-layered match check
        const cityMatch = (activeCity === 'all-cities' || city === activeCity);
        const vibeMatch = (activeVibe === 'all-vibes' || vibe === activeVibe);
        const searchMatch = (searchVal === '' || keywords.includes(searchVal));
        
        if (cityMatch && vibeMatch && searchMatch) {
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
        zeroState.style.display = 'block';
        setTimeout(() => {
            zeroState.style.opacity = '1';
            zeroState.style.transform = 'scale(1)';
        }, 50);
    } else {
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


