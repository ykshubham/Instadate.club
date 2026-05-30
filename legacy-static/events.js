/* ==========================================================================
   INSTADATE SECRET SOCIAL CLUB EVENTS CONTROLLER (JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Sticky Nav Scroll handler
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Initialize Particles Canvas
    initEventsParticlesCanvas();

    // 4. Initialize Custom Cursor Trail
    initEventsCursorTrail();

    // 5. Verify Auth Session & Populate Navbar Dropdowns
    verifyEventsAuthAndRender();

    // 6. Bind Category Filtering Tabs
    initCategoryFiltering();
});

// --- VERIFY AUTHENTICATION & SYNC PROFILE DROPDOWN ---
function verifyEventsAuthAndRender() {
    const userData = localStorage.getItem('instadate_user');
    const navProfile = document.getElementById('nav-profile');
    
    // Default dynamic concierge link binding
    const megaConcierge = document.getElementById('nav-mega-concierge-btn');
    const defaultConciergeMsg = "Hey Instadate Curation! 👋 I'm interested in joining the Instadate Social Club. Please guide me on fast-track membership onboarding! ✨";
    const waBaseUrl = "https://wa.me/919999999999";
    
    if (megaConcierge) {
        megaConcierge.href = `${waBaseUrl}?text=${encodeURIComponent(defaultConciergeMsg)}`;
        megaConcierge.target = "_blank";
    }

    if (!userData) {
        // Locked Guest Navbar: Profile dropdown remains hidden
        if (navProfile) navProfile.style.display = 'none';
        return;
    }

    // Unlocked Active Member Navbar
    try {
        const user = JSON.parse(userData);
        if (navProfile) navProfile.style.display = 'block';

        let displayName = user.name || 'Member';
        let displayEmail = user.email || user.phone || 'Club Member';
        
        if (user.provider === 'google' && !user.name) {
            displayName = user.email ? user.email.split('@')[0] : 'Member';
        } else if (user.provider === 'phone' && !user.name) {
            displayName = 'Member';
        }

        const avatarPresets = {
            'neon-cupid': '💘',
            'mystic-dreamer': '✨',
            'cyber-flirt': '👾',
            'golden-glow': '👑',
            'ruby-seduction': '🌹',
            'silver-spark': '💎'
        };
        const avatarSymbol = avatarPresets[user.avatar] || '👤';

        // 1. Sync header profile trigger
        const nameEl = document.getElementById('nav-profile-name');
        if (nameEl) nameEl.textContent = displayName;

        const avatarTrigger = document.getElementById('nav-avatar-img-container');
        if (avatarTrigger) {
            if (user.customPfp) {
                avatarTrigger.innerHTML = `<img src="${user.customPfp}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                avatarTrigger.innerHTML = `<span style="font-size: 1.15rem;">${avatarSymbol}</span>`;
            }
        }

        // 2. Sync inside profile dropdown
        const dropdownAvatar = document.getElementById('dropdown-avatar-img-container');
        if (dropdownAvatar) {
            if (user.customPfp) {
                dropdownAvatar.innerHTML = `<img src="${user.customPfp}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                dropdownAvatar.innerHTML = `<span style="font-size: 1.35rem;">${avatarSymbol}</span>`;
            }
        }

        const dropName = document.getElementById('dropdown-display-name');
        if (dropName) dropName.textContent = displayName;
        const dropEmail = document.getElementById('dropdown-display-email');
        if (dropEmail) dropEmail.textContent = displayEmail;

        const dropBadge = document.getElementById('dropdown-tier-badge');
        if (dropBadge) {
            dropBadge.className = `tier-badge tier-badge-${user.tier.toLowerCase()}`;
            const labels = { 'Free': 'Free Member', 'Basic': 'Basic Member', 'Premium': 'Premium Pass', 'Elite': 'Elite Circle' };
            const icons = { 'Free': '👤', 'Basic': '🌸', 'Premium': '✨', 'Elite': '💎' };
            dropBadge.innerHTML = `${icons[user.tier] || ''} ${labels[user.tier] || user.tier}`;
        }

        // 3. Sync dynamic concierge desk link based on user tier details
        if (megaConcierge) {
            const randomId = 'IND-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);
            const waAuthMsg = `Hey Instadate Curation! 👋 My name is ${displayName}. I've successfully registered my account with the *${user.tier} Tier*. My ID is *${randomId}*. Let's fast-track my club matches! ✨`;
            megaConcierge.href = `${waBaseUrl}?text=${encodeURIComponent(waAuthMsg)}`;
        }

    } catch (err) {
        console.error("Error updating events page nav:", err);
    }
}

// --- DYNAMIC PROFILE MENU DROPDOWN TOGGLE ---
function toggleProfileDropdown() {
    const dropdown = document.getElementById('nav-profile-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// Close profile dropdown on document click
document.addEventListener('click', (e) => {
    const profileEl = document.getElementById('nav-profile');
    const dropdown = document.getElementById('nav-profile-dropdown');
    if (profileEl && dropdown && !profileEl.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Handle Member Sign Out
function handleSignOut() {
    localStorage.removeItem('instadate_user');
    window.location.href = 'index.html';
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.toggle('active');
    
    const icon = document.querySelector('.mobile-toggle i');
    if (icon) {
        if (mobileNav.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// --- CATEGORY FILTERING CONTROLLER ---
function initCategoryFiltering() {
    const pills = document.querySelectorAll('.event-filter-pill');
    const cards = document.querySelectorAll('.event-card');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active pill styling states
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.dataset.filter;

            cards.forEach(card => {
                const category = card.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    // Reset animation effects smoothly
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                        card.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// --- DYNAMIC RSVP membership-level validation gates ---
function handleEventRSVP(btn, eventId, eventName) {
    const userData = localStorage.getItem('instadate_user');
    
    if (!userData) {
        alert("Please apply or sign in first to RSVP for secret Instadate events! 🔒");
        window.location.href = "index.html?action=apply";
        return;
    }

    try {
        const user = JSON.parse(userData);
        
        // 1. FREE TIER GATED SECURITY
        if (user.tier === 'Free') {
            alert(`RSVP Gated! 🔒\n\nExplore for Free accounts are view-only. Upgrade to any Premium or Basic membership plan to reserve your spot at the "${eventName}" mixer instantly!`);
            window.location.href = "index.html?action=upgrade-plan";
            return;
        }

        // 2. MEMBERSHIP TICKET CONFIRMED
        // Change button visual success state
        btn.disabled = true;
        btn.className = "btn btn-sm w-full rsvp-success";
        btn.innerHTML = `RSVP Confirmed <i data-lucide="check-circle-2"></i>`;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Fire custom glass toast notification
        showRSVPToast(`Your entry spot for "${eventName}" has been locked!`);

        // Redirect to whatsapp matchmaker coordinate desk
        setTimeout(() => {
            const randomId = 'IND-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);
            const waBaseUrl = "https://wa.me/919999999999";
            const waText = `Hey Instadate Curation! 🎫 I've successfully RSVP'd for the upcoming "${eventName}" social event. My registered ID is *${randomId}*. Please confirm my ticket and let's coordinate entry codes! ✨`;
            window.open(`${waBaseUrl}?text=${encodeURIComponent(waText)}`, '_blank');
        }, 1200);

    } catch (err) {
        console.error("RSVP validation error:", err);
    }
}

// Custom RSVP toast visual prompt
function showRSVPToast(text) {
    const toast = document.getElementById('events-toast-msg');
    const toastText = document.getElementById('events-toast-text');
    
    if (toast && toastText) {
        toastText.textContent = text;
        toast.style.display = 'block';
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// --- HIGH-TECH HTML5 CANVAS PARTICLES ---
function initEventsParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.radius = Math.random() * 1.5 + 0.5;
            this.color = Math.random() > 0.5 ? 'rgba(255, 46, 147, 0.25)' : 'rgba(0, 245, 255, 0.25)';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
    
    const initParticles = () => {
        particles = [];
        const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 75);
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    };
    initParticles();
    
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    };
    animate();
}

// --- Sleek Custom Neon Cursor physics ---
function initEventsCursorTrail() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    const updateCursor = () => {
        // Linear interpolation spring interpolation physics
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        cursorX += dx * 0.12;
        cursorY += dy * 0.12;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        requestAnimationFrame(updateCursor);
    };
    updateCursor();
    
    // Hover scale effects on anchors
    document.querySelectorAll('a, button, .event-filter-pill').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
}
