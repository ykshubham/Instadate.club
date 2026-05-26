/* ==========================================================================
   INSTADATE INTERACTIVE APPLICATION LOGIC
   Features: Canvas Particles, Glass Modal, Form Validations, Dynamic WhatsApp 
             Conversions, Pricing Toggles, Smooth Scroll Reveal
   ========================================================================== */

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
            header.classList.remove('scrolled');
        }
    });

    // --- INTERACTIVE BACKGROUND PARTICLES (CANVAS) ---
    initParticlesCanvas();

    // --- SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER) ---
    initScrollReveal();
    
    // --- CUSTOM NEON CURSOR TRAILS ---
    initCustomCursorTrail();
    
    // --- INITIALIZE GLASS SELECT DROPDOWNS ---
    initCustomSelects();
    
    // --- INITIALIZE INTERACTIVE MAP ---
    initInteractiveMap();
    
    // --- INITIALIZE TESTIMONIAL SWIPE SUPPORT ---
    setupTestimonialSwipe();
    
    // --- CHECK AUTH STATE & UPDATE NAV ---
    updateNavProfile();

    // --- PARSE URL REDIRECT ACTIONS FROM STANDALONE PAGES ---
    parseRedirectActions();
});

// --- MOBILE MENU TOGGLE ---
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const menuIcon = document.getElementById('menu-icon');
    
    mobileNav.classList.toggle('active');
    document.body.classList.toggle('mobile-menu-open');
    
    if (mobileNav.classList.contains('active')) {
        menuIcon.setAttribute('data-lucide', 'x');
    } else {
        menuIcon.setAttribute('data-lucide', 'menu');
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- HIGH PERFORMANCE CANVAS PARTICLES ---
function initParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particlesArray = [];
    const maxParticles = window.innerWidth < 768 ? 20 : 40; // Fewer particles on mobile for speed
    
    // Set Canvas Dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 3 + 1; // size of sparks
            this.speedX = Math.random() * 0.8 - 0.4;
            this.speedY = -(Math.random() * 0.6 + 0.3); // Drifts upwards
            this.opacity = Math.random() * 0.5 + 0.15;
            this.isHeart = Math.random() < 0.25; // 25% are heart shapes
            this.colorType = Math.random(); // Pink, Purple, or Cyan
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Re-spawn if particle moves off-screen
            if (this.y < -20) {
                this.y = canvas.height + 20;
                this.x = Math.random() * canvas.width;
                this.speedY = -(Math.random() * 0.6 + 0.3);
                this.opacity = Math.random() * 0.5 + 0.15;
            }
            
            // Subtle horizontal floating oscillation
            this.speedX += Math.sin(this.y * 0.01) * 0.01;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            // Select luxury theme colors
            let color = '#FF2E93'; // Default Pink
            if (this.colorType > 0.35 && this.colorType <= 0.7) {
                color = '#9B30FF'; // Purple
            } else if (this.colorType > 0.7) {
                color = '#00F5FF'; // Cyan
            }
            
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            if (this.isHeart) {
                // Draw a simple floating heart
                drawHeart(ctx, this.x, this.y, this.size * 2);
            } else {
                // Draw a standard floating glow spark
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
    // Draw Heart shape
    function drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.quadraticCurveTo(x, y, x + size / 2, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
        ctx.quadraticCurveTo(x + size, y + size * 0.66, x, y + size * 1.1);
        ctx.quadraticCurveTo(x - size, y + size * 0.66, x - size, y + size / 3);
        ctx.quadraticCurveTo(x - size, y, x - size / 2, y);
        ctx.quadraticCurveTo(x, y, x, y + size / 4);
        ctx.closePath();
        ctx.fill();
    }
    
    // Init Particles
    function init() {
        particlesArray = [];
        for (let i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();
    
    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}

// --- INTERSECTION OBSERVER FOR SCROLL REVEALS ---
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-slide-up');
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve once revealed to save CPU power
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // triggers slightly before entering the screen fully
    });
    
    revealElements.forEach(element => {
        observer.observe(element);
    });
}

// --- MEMBERSHIP PRICING MONTHLY/ANNUAL TOGGLE ---
function togglePricing() {
    const toggleBtn = document.getElementById('price-toggle');
    const labelMonthly = document.getElementById('label-monthly');
    const labelYearly = document.getElementById('label-yearly');
    const priceAmounts = document.querySelectorAll('.price-amount');
    
    toggleBtn.classList.toggle('toggled');
    
    const isYearly = toggleBtn.classList.contains('toggled');
    
    if (isYearly) {
        labelMonthly.classList.remove('active');
        labelYearly.classList.add('active');
    } else {
        labelMonthly.classList.add('active');
        labelYearly.classList.remove('active');
    }
    
    priceAmounts.forEach(amount => {
        const monthlyPrice = amount.getAttribute('data-monthly');
        const yearlyPrice = amount.getAttribute('data-yearly');
        
        // Visual fade out
        amount.style.opacity = '0';
        amount.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            amount.textContent = isYearly ? yearlyPrice : monthlyPrice;
            // Visual fade back in
            amount.style.opacity = '1';
            amount.style.transform = 'translateY(0)';
        }, 150);
    });
}

// --- FAQ ACCORDION ---
function toggleFaq(button) {
    const faqItem = button.parentElement;
    const faqContent = button.nextElementSibling;
    const allFaqItems = document.querySelectorAll('.faq-item');
    
    // Close other open FAQ items for a clean experience
    allFaqItems.forEach(item => {
        if (item !== faqItem && item.classList.contains('active')) {
            item.classList.remove('active');
            item.querySelector('.faq-content').style.maxHeight = '0';
        }
    });
    
    // Toggle active state
    faqItem.classList.toggle('active');
    
    if (faqItem.classList.contains('active')) {
        // Set dynamic height transition based on content height
        faqContent.style.maxHeight = faqContent.scrollHeight + 'px';
    } else {
        faqContent.style.maxHeight = '0';
    }
}

// --- TESTIMONIALS SLIDER MECHANICS ---
let currentTestimonialIndex = 0;

function jumpToTestimonial(index) {
    const testimonialsWrapper = document.querySelector('.testimonials-wrapper');
    const dots = document.querySelectorAll('.test-dot');
    
    currentTestimonialIndex = index;
    
    // Slide transition
    testimonialsWrapper.style.transform = `translateX(-${index * 100}%)`;
    
    // Update dots
    dots.forEach((dot, idx) => {
        if (idx === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Auto scroll testimonials every 6 seconds
let testimonialTimer = setInterval(() => {
    let nextIndex = (currentTestimonialIndex + 1) % 3;
    jumpToTestimonial(nextIndex);
}, 6500);

// Reset timer on manual dot interactions to prevent jumping
document.querySelectorAll('.test-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        clearInterval(testimonialTimer);
    });
});

// --- TOUCH & MOUSE SWIPE SUPPORT FOR TESTIMONIALS ---
function setupTestimonialSwipe() {
    const container = document.querySelector('.testimonials-container');
    const wrapper = document.querySelector('.testimonials-wrapper');
    if (!container || !wrapper) return;

    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let containerWidth = container.offsetWidth;
    const threshold = 80; // Min pixels to trigger slide change
    
    // Update container width on window resize to ensure calculations remain pixel-perfect
    window.addEventListener('resize', () => {
        containerWidth = container.offsetWidth;
    });

    // Helper functions
    const getPositionX = (event) => {
        return event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
    };

    const dragStart = (event) => {
        isDragging = true;
        startX = getPositionX(event);
        currentX = startX;
        
        // Temporarily disable transition during drag for real-time response
        wrapper.style.transition = 'none';
        
        // Clear auto-scroll
        clearInterval(testimonialTimer);
        
        container.style.cursor = 'grabbing';
    };

    const dragging = (event) => {
        if (!isDragging) return;
        
        // Prevent default touch scrolling when swiping horizontally
        if (event.type.includes('touch')) {
            currentX = getPositionX(event);
            const diffX = currentX - startX;
            if (Math.abs(diffX) > 10) {
                event.preventDefault();
            }
        } else {
            currentX = getPositionX(event);
        }
        
        const diffX = currentX - startX;
        const baseTranslate = -currentTestimonialIndex * containerWidth;
        let finalTranslate = baseTranslate + diffX;
        
        // Apply rubberband resistance at boundaries (first slide swiped right, or last slide swiped left)
        const totalSlides = 3;
        if (currentTestimonialIndex === 0 && diffX > 0) {
            finalTranslate = baseTranslate + (diffX * 0.35); // resistance
        } else if (currentTestimonialIndex === totalSlides - 1 && diffX < 0) {
            finalTranslate = baseTranslate + (diffX * 0.35); // resistance
        }
        
        wrapper.style.transform = `translateX(${finalTranslate}px)`;
    };

    const dragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = 'grab';
        
        // Restore smooth transition
        wrapper.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        const diffX = currentX - startX;
        const totalSlides = 3;
        
        if (diffX < -threshold && currentTestimonialIndex < totalSlides - 1) {
            // Swipe Left -> Next slide
            currentTestimonialIndex++;
        } else if (diffX > threshold && currentTestimonialIndex > 0) {
            // Swipe Right -> Prev slide
            currentTestimonialIndex--;
        }
        
        // Snap to slide
        jumpToTestimonial(currentTestimonialIndex);
    };

    // Mouse Listeners
    container.addEventListener('mousedown', dragStart);
    container.addEventListener('mousemove', dragging);
    window.addEventListener('mouseup', dragEnd); // Catch mouse releases outside the container boundaries

    // Touch Listeners
    container.addEventListener('touchstart', dragStart, { passive: true });
    container.addEventListener('touchmove', dragging, { passive: false });
    container.addEventListener('touchend', dragEnd);

    // Initial grab style
    container.style.cursor = 'grab';
}

// --- GLASSMORPHIC APPLICATION FORM MODAL ---
// Global State to track vibe selection
let currentVibeSelection = '';

const vibeQuestions = {
    "Find a Date": {
        question: "What does your ideal, romantic Sunday date look like?",
        placeholder: "E.g., A cozy sunset walk at Marine Drive, followed by pizza and a deep conversation..."
    },
    "Cafe Partner": {
        question: "What is your absolute go-to coffee order and favorite cafe vibe?",
        placeholder: "E.g., Iced Spanish Latte in a minimalist cafe with warm lighting and chill jazz..."
    },
    "Pickleball Group": {
        question: "Are you a casual beginner or a competitive pickleball player?",
        placeholder: "E.g., Casual beginner looking to play double matches and grab drinks after..."
    },
    "White Flea Buddy": {
        question: "What is your favorite aesthetic find or flea market treasure?",
        placeholder: "E.g., Vintage cameras, oversized thrift hoodies, or hand-painted ceramic mugs..."
    },
    "Concert Partner": {
        question: "Which artist or music genre are you dying to see live next?",
        placeholder: "E.g., Diljit Dosanjh, Fred again.., or techno clubs in Bangalore..."
    },
    "Late Night Drive": {
        question: "What is your ultimate late-night drive playlist song?",
        placeholder: "E.g., 'Starboy' by The Weeknd or 90s Bollywood retro, cruising at 1 AM..."
    },
    "Photoshoot Buddy": {
        question: "What is your preferred aesthetic (e.g., retro, street, minimal) for shoots?",
        placeholder: "E.g., 90s vintage film aesthetic, street portraits around Bandra..."
    },
    "Travel Buddy": {
        question: "What is the next destination on your travel bucket list?",
        placeholder: "E.g., A weekend trekking trip to Kasol or exploring quiet cafes in Goa..."
    },
    "Startup Networking": {
        question: "What exciting project or startup idea are you working on right now?",
        placeholder: "E.g., Building a sustainable Gen Z streetwear brand or an AI travel guide..."
    },
    "House Party Circle": {
        question: "Are you the aux player, the deep talker, or the dancer at a house party?",
        placeholder: "E.g., 100% the deep talker in the balcony, but I'll play some tech-house if given the aux..."
    }
};

// --- GLASSMORPHIC APPLICATION FORM MODAL ---
function openApplyModal(tier = 'Premium', vibe = '') {
    const modal = document.getElementById('apply-modal');
    if (!modal) return;
    
    // Reset stages
    document.getElementById('modal-form-stage').style.display = 'block';
    document.getElementById('modal-form-stage').style.opacity = '1';
    document.getElementById('modal-success-stage').style.display = 'none';
    
    // Reset form
    document.getElementById('instadate-application-form').reset();
    resetCustomSelects(document.getElementById('instadate-application-form'));
    
    // Set selected tier parameters
    const appliedTierInput = document.getElementById('applied-tier');
    const selectedTierPill = document.getElementById('selected-tier-pill');
    const selectedTierName = document.getElementById('selected-tier-name');
    
    if (appliedTierInput) appliedTierInput.value = tier;
    if (selectedTierName) selectedTierName.textContent = tier;
    if (selectedTierPill) {
        selectedTierPill.style.display = 'inline-block';
        if (tier === 'Elite') {
            selectedTierPill.style.borderColor = 'var(--primary-cyan)';
            selectedTierPill.style.color = 'var(--primary-cyan)';
            selectedTierPill.style.backgroundColor = 'rgba(0, 245, 255, 0.1)';
        } else {
            selectedTierPill.style.borderColor = 'var(--primary-pink)';
            selectedTierPill.style.color = 'var(--primary-pink)';
            selectedTierPill.style.backgroundColor = 'rgba(255, 46, 147, 0.1)';
        }
    }
    
    // Handle vibes parameters
    currentVibeSelection = vibe;
    const bioLabel = document.querySelector('label[for="form-bio"]');
    const bioTextarea = document.getElementById('form-bio');
    
    if (bioLabel && bioTextarea) {
        if (vibe && vibeQuestions[vibe]) {
            bioLabel.innerHTML = `${vibeQuestions[vibe].question} <span class="required">*</span>`;
            bioTextarea.placeholder = vibeQuestions[vibe].placeholder;
        } else {
            bioLabel.innerHTML = `What makes you a high-value partner? <span class="required">*</span>`;
            bioTextarea.placeholder = "Tell us about your passions, vibe, or values. Keep it real.";
        }
    }
    
    // Display Modal & Disable Scrolling
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeApplyModal() {
    const modal = document.getElementById('apply-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeApplyModalOnOverlay(event) {
    if (event.target === document.getElementById('apply-modal')) {
        closeApplyModal();
    }
}

// ==========================================================================
// NAV PROFILE STATE MANAGEMENT
// ==========================================================================

function updateNavProfile() {
    const userData = localStorage.getItem('instadate_user');
    const navProfile = document.getElementById('nav-profile');
    const mobileNavProfile = document.getElementById('mobile-nav-profile');
    
    // Bind custom selects
    const setupCustomSelects = () => {
        document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const options = wrapper.querySelectorAll('.custom-option');
            const input = wrapper.querySelector('input[type="hidden"]');
            
            if (trigger && !trigger.dataset.bound) {
                trigger.dataset.bound = "true";
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.custom-select-wrapper').forEach(o => {
                        if (o !== wrapper) o.classList.remove('active');
                    });
                    wrapper.classList.toggle('active');
                });
                
                options.forEach(opt => {
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        options.forEach(o => o.classList.remove('selected'));
                        opt.classList.add('selected');
                        if (input) input.value = opt.dataset.value;
                        const text = wrapper.querySelector('.selected-value-text');
                        if (text) text.textContent = opt.textContent;
                        wrapper.classList.remove('active');
                    });
                });
            }
        });
        
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('active'));
        });
    };
    setupCustomSelects();

    if (userData) {
        const user = JSON.parse(userData);
        
        // Defaults
        if (!user.tier) {
            user.tier = 'Free';
            localStorage.setItem('instadate_user', JSON.stringify(user));
        }
        if (!user.avatar) {
            user.avatar = 'neon-cupid';
            localStorage.setItem('instadate_user', JSON.stringify(user));
        }
        
        let displayName = user.name || 'Member';
        let displayEmail = 'Signed In';
        
        if (user.provider === 'google' && !user.name) {
            displayName = user.email ? user.email.split('@')[0] : 'Member';
            displayEmail = user.email || 'Google Account';
        } else if (user.provider === 'phone' && !user.name) {
            displayName = 'Member';
            displayEmail = '+91 ' + (user.phone || '').replace(/(\d{5})(\d{5})/, '$1 $2');
        } else {
            displayEmail = user.email || user.phone || 'Club Member';
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
        
        // Hide general CTAs or change their behaviors
        const heroCta = document.querySelector('.hero-actions .btn-primary');
        if (heroCta) {
            heroCta.textContent = 'Manage Membership';
            heroCta.setAttribute('onclick', 'openSubscriptionModal()');
            heroCta.innerHTML = 'Manage Membership <i data-lucide="gem" class="btn-arrow"></i>';
        }
        
        document.querySelectorAll('.pricing-action button').forEach(btn => {
            const card = btn.closest('.pricing-card');
            if (card) {
                const tierName = card.querySelector('.tier-name').textContent.trim();
                if (user.tier === tierName) {
                    btn.textContent = 'Active Plan';
                    btn.className = 'btn btn-outline w-full disabled';
                    btn.style.opacity = '0.7';
                    btn.setAttribute('onclick', 'event.preventDefault();');
                } else {
                    btn.textContent = `Switch to ${tierName}`;
                    btn.className = 'btn btn-primary w-full btn-glow';
                    btn.setAttribute('onclick', `selectUpgradeTier('${tierName}')`);
                }
            }
        });
        
        // Desktop nav update
        if (navProfile) {
            navProfile.style.display = 'block';
            const nameEl = document.getElementById('nav-profile-name');
            if (nameEl) nameEl.textContent = displayName;
            
            const avatarContainer = document.getElementById('nav-avatar-img-container');
            if (avatarContainer) {
                if (user.customPfp) {
                    avatarContainer.innerHTML = `<img src="${user.customPfp}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    avatarContainer.innerHTML = `<span style="font-size: 1.15rem;">${avatarSymbol}</span>`;
                }
            }
            
            const dropdownAvatar = document.getElementById('dropdown-avatar-img-container');
            if (dropdownAvatar) {
                if (user.customPfp) {
                    dropdownAvatar.innerHTML = `<img src="${user.customPfp}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    dropdownAvatar.innerHTML = `<span style="font-size: 1.35rem;">${avatarSymbol}</span>`;
                }
            }
            
            const dropdownName = document.getElementById('dropdown-display-name');
            if (dropdownName) dropdownName.textContent = displayName;
            const dropdownEmail = document.getElementById('dropdown-display-email');
            if (dropdownEmail) dropdownEmail.textContent = displayEmail;
            
            // Dropdown tier badge
            const tierBadge = document.getElementById('dropdown-tier-badge');
            if (tierBadge) {
                tierBadge.className = `tier-badge tier-badge-${user.tier.toLowerCase()}`;
                const tierLabels = {
                    'Free': 'Free Member',
                    'Basic': 'Basic Member',
                    'Premium': 'Premium Pass',
                    'Elite': 'Elite Circle'
                };
                const tierIcons = {
                    'Free': '👤',
                    'Basic': '🌸',
                    'Premium': '✨',
                    'Elite': '💎'
                };
                tierBadge.innerHTML = `${tierIcons[user.tier] || ''} ${tierLabels[user.tier] || user.tier}`;
            }
            
            const matchesBtn = document.getElementById('dropdown-btn-matches');
            if (matchesBtn) {
                if (user.tier === 'Free') {
                    matchesBtn.style.opacity = '0.5';
                    matchesBtn.setAttribute('onclick', "alert('Unlock your handpicked matches by upgrading today!'); openSubscriptionModal();");
                } else {
                    matchesBtn.style.opacity = '1';
                    matchesBtn.setAttribute('onclick', "openCuratedMatchesModal()");
                }
            }

            const chatBtn = document.getElementById('dropdown-btn-chat');
            if (chatBtn) {
                if (user.tier === 'Free') {
                    chatBtn.style.opacity = '0.5';
                    chatBtn.setAttribute('onclick', "event.preventDefault(); alert('Unlock premium high-vibe chat channels by upgrading today! 💬'); openSubscriptionModal();");
                } else {
                    chatBtn.style.opacity = '1';
                    chatBtn.removeAttribute('onclick');
                }
            }
        }
        
        // Mobile nav update
        if (mobileNavProfile) {
            mobileNavProfile.style.display = 'block';
            const mobileName = document.getElementById('mobile-profile-name');
            if (mobileName) mobileName.textContent = displayName;
            const mobileEmail = document.getElementById('mobile-profile-email');
            if (mobileEmail) mobileEmail.textContent = displayEmail;
            
            const mobileAvatar = document.getElementById('mobile-avatar-img-container');
            if (mobileAvatar) {
                if (user.customPfp) {
                    mobileAvatar.innerHTML = `<img src="${user.customPfp}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    mobileAvatar.innerHTML = `<span style="font-size: 1.3rem;">${avatarSymbol}</span>`;
                }
            }
            
            const mobBadge = document.getElementById('mobile-tier-badge');
            if (mobBadge) {
                mobBadge.className = `tier-badge tier-badge-${user.tier.toLowerCase()}`;
                const tierLabels = {
                    'Free': 'Free Member',
                    'Basic': 'Basic Member',
                    'Premium': 'Premium Pass',
                    'Elite': 'Elite Circle'
                };
                mobBadge.textContent = tierLabels[user.tier] || user.tier;
            }
            
            const mobMatchesBtn = document.getElementById('mobile-btn-matches');
            if (mobMatchesBtn) {
                if (user.tier === 'Free') {
                    mobMatchesBtn.setAttribute('onclick', "toggleMobileMenu(); alert('Upgrade to unlock matches!'); openSubscriptionModal();");
                } else {
                    mobMatchesBtn.setAttribute('onclick', "toggleMobileMenu(); openCuratedMatchesModal();");
                }
            }

            const mobChatBtn = document.getElementById('mobile-btn-chat');
            if (mobChatBtn) {
                if (user.tier === 'Free') {
                    mobChatBtn.setAttribute('onclick', "event.preventDefault(); toggleMobileMenu(); alert('Unlock premium high-vibe chat channels by upgrading today! 💬'); openSubscriptionModal();");
                } else {
                    mobChatBtn.setAttribute('onclick', "toggleMobileMenu();");
                }
            }
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } else {
        if (navProfile) navProfile.style.display = 'none';
        if (mobileNavProfile) mobileNavProfile.style.display = 'none';
        
        const heroCta = document.querySelector('.hero-actions .btn-primary');
        if (heroCta) {
            heroCta.textContent = 'Apply Now';
            heroCta.setAttribute('onclick', 'openApplyModal()');
            heroCta.innerHTML = 'Apply Now <i data-lucide="arrow-right" class="btn-arrow"></i>';
        }
        
        document.querySelectorAll('.pricing-action button').forEach(btn => {
            const card = btn.closest('.pricing-card');
            if (card) {
                const tierName = card.querySelector('.tier-name').textContent.trim();
                btn.textContent = `Apply for ${tierName}`;
                btn.className = `btn ${tierName === 'Premium' ? 'btn-primary' : 'btn-outline'} w-full`;
                btn.setAttribute('onclick', `openApplyModal('${tierName}')`);
            }
        });
    }
}

function parseRedirectActions() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (!action) return;

    // Clean URL parameters immediately to prevent modal reappearing on subsequent reloads
    history.replaceState(null, '', window.location.pathname);

    setTimeout(() => {
        if (action === 'edit-profile') {
            openEditProfileModal();
        } else if (action === 'upgrade-plan') {
            openSubscriptionModal();
        } else if (action === 'apply') {
            openApplyModal();
        }
    }, 400);
}

function toggleProfileDropdown() {
    const btn = document.getElementById('nav-avatar-btn');
    const dropdown = document.getElementById('nav-profile-dropdown');
    if (!btn || !dropdown) return;
    
    btn.classList.toggle('active');
    dropdown.classList.toggle('active');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const profileEl = document.getElementById('nav-profile');
    const dropdown = document.getElementById('nav-profile-dropdown');
    const btn = document.getElementById('nav-avatar-btn');
    if (profileEl && !profileEl.contains(e.target)) {
        if (dropdown) dropdown.classList.remove('active');
        if (btn) btn.classList.remove('active');
    }
});

function handleSignOut() {
    localStorage.removeItem('instadate_user');
    
    const dropdown = document.getElementById('nav-profile-dropdown');
    const btn = document.getElementById('nav-avatar-btn');
    if (dropdown) dropdown.classList.remove('active');
    if (btn) btn.classList.remove('active');
    
    updateNavProfile();
}

// ==========================================================================
// UNIFIED ONBOARDING STATE MACHINE
// ==========================================================================
window._selectedOnboardTier = 'Premium';
window._quizAnswers = {};

function openApplyModal(tier = 'Premium', vibe = '') {
    const modal = document.getElementById('apply-modal');
    if (!modal) return;
    
    window._selectedOnboardTier = tier;
    
    // Check if user is already signed in
    const userData = localStorage.getItem('instadate_user');
    
    modal.classList.add('active');
    
    if (userData) {
        // Already signed in! Skip auth and profile steps, jump directly to Compatibility Quiz (Stage 3)
        goToOnboardStage(3);
    } else {
        // Guest user. Start from Stage 1 (Auth)
        goToOnboardStage(1);
    }
}

function closeApplyModal() {
    const modal = document.getElementById('apply-modal');
    if (modal) modal.classList.remove('active');
}

function closeApplyModalOnOverlay(event) {
    if (event.target === document.getElementById('apply-modal')) {
        closeApplyModal();
    }
}

function goToOnboardStage(stageNum) {
    // Hide all panels
    const panels = [
        'onboard-stage-auth',
        'onboard-stage-otp',
        'onboard-stage-profile',
        'onboard-stage-compatibility',
        'onboard-stage-pitch',
        'onboard-stage-benefits',
        'onboard-stage-payment',
        'onboard-stage-review',
        'onboard-stage-approval'
    ];
    
    panels.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = 'none';
    });
    
    // Show tracker only for stages 1 to 6
    const tracker = document.getElementById('onboard-progress-container');
    if (tracker) {
        if (stageNum >= 1 && stageNum <= 6) {
            tracker.style.display = 'block';
        } else {
            tracker.style.display = 'none';
        }
    }

    // Dynamic setups per stage
    if (stageNum === 1) {
        document.getElementById('onboard-stage-auth').style.display = 'block';
        updateProgressBar(0, 1);
        const authPill = document.getElementById('auth-tier-pill');
        const authName = document.getElementById('auth-tier-name');
        if (authPill && authName) {
            authPill.style.display = 'inline-block';
            authName.textContent = window._selectedOnboardTier;
        }
    } else if (stageNum === 1.5) { // OTP stage
        if (tracker) tracker.style.display = 'block';
        document.getElementById('onboard-stage-otp').style.display = 'block';
        updateProgressBar(10, 1);
    } else if (stageNum === 2) {
        document.getElementById('onboard-stage-profile').style.display = 'block';
        updateProgressBar(20, 2);
        // Pre-fill phone if they signed in via OTP
        const phoneInput = document.getElementById('onboard-profile-whatsapp');
        if (phoneInput && window._signinPhone) {
            phoneInput.value = window._signinPhone;
        }
    } else if (stageNum === 3) {
        document.getElementById('onboard-stage-compatibility').style.display = 'block';
        updateProgressBar(40, 3);
        // Reset quiz question visibility
        document.querySelectorAll('.quiz-question-card').forEach(q => q.style.display = 'none');
        document.querySelector('.quiz-question-card[data-q-index="1"]').style.display = 'flex';
        document.getElementById('quiz-current-q').textContent = '1';
        document.querySelectorAll('.quiz-dot').forEach(d => d.classList.remove('active'));
        document.querySelector('.quiz-dot[data-q="1"]').classList.add('active');
        document.querySelectorAll('.quiz-option-item').forEach(opt => opt.classList.remove('selected'));
        window._quizAnswers = {};
    } else if (stageNum === 4) {
        document.getElementById('onboard-stage-pitch').style.display = 'block';
        updateProgressBar(60, 4);
        
        // Setup Pitch Card
        const pitchTitle = document.getElementById('pitch-tier-display');
        const pitchPrice = document.getElementById('pitch-price-display');
        if (pitchTitle && pitchPrice) {
            pitchTitle.textContent = `${window._selectedOnboardTier} Plan`;
            const prices = { 'Basic': '199', 'Premium': '399', 'Elite': '699' };
            pitchPrice.textContent = prices[window._selectedOnboardTier] || '399';
        }
    } else if (stageNum === 5) {
        document.getElementById('onboard-stage-benefits').style.display = 'block';
        updateProgressBar(80, 4);
        
        // Populate benefits dynamically
        const benefitsContainer = document.getElementById('onboard-benefits-list');
        if (benefitsContainer) {
            const tier = window._selectedOnboardTier;
            let html = '';
            
            if (tier === 'Basic') {
                html = `
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>100% ID-Verified Candidate Pool</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>3 Curated Vibe Matches per month</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>Secure In-App Chat and voice calling</span></div>
                `;
            } else if (tier === 'Elite') {
                html = `
                    <div class="feature-item"><i data-lucide="check" class="text-cyan"></i> <span>Bespoke VIP matchmaking concierge pool</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-cyan"></i> <span>Unlimited hand-guided matches</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-cyan"></i> <span>Invites to exclusive bespoke styling & dining events</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-cyan"></i> <span>24/7 direct Matchmaker concierge access</span></div>
                `;
            } else { // Premium (Default)
                html = `
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>8 Curated Vibe Matches per month</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>Dedicated Human Matchmaker support</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>Invites to Offline Social Mixers (Tier-2)</span></div>
                    <div class="feature-item"><i data-lucide="check" class="text-pink"></i> <span>Priority Verification badge indicator</span></div>
                `;
            }
            benefitsContainer.innerHTML = html;
        }
    } else if (stageNum === 6) {
        document.getElementById('onboard-stage-payment').style.display = 'block';
        updateProgressBar(100, 5);
        
        const priceLabel = document.getElementById('payment-amount-display');
        const prices = { 'Basic': '₹199 / month', 'Premium': '₹399 / month', 'Elite': '₹699 / month' };
        if (priceLabel) priceLabel.textContent = prices[window._selectedOnboardTier] || '₹399 / month';
        
        // Hide spinner overlay initially
        const spinner = document.getElementById('payment-processing-spinner');
        if (spinner) spinner.style.display = 'none';
    } else if (stageNum === 7) {
        document.getElementById('onboard-stage-review').style.display = 'block';
        runReviewTimelineAnimation();
    } else if (stageNum === 8) {
        document.getElementById('onboard-stage-approval').style.display = 'block';
        
        // Populate digital Hologram Card
        const userData = localStorage.getItem('instadate_user');
        if (userData) {
            const user = JSON.parse(userData);
            
            document.getElementById('card-display-name').textContent = user.name || 'Member';
            document.getElementById('card-display-age').textContent = user.age || '22';
            document.getElementById('card-display-city').textContent = user.city || 'Mumbai';
            document.getElementById('card-display-insta').textContent = user.instagram || '@member_insta';
            
            const randomId = 'IND-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);
            document.getElementById('card-display-id').textContent = randomId;
            
            const cardBadge = document.getElementById('card-tier-badge');
            const badges = { 'Free': 'Free Member', 'Basic': 'Basic Pass', 'Premium': 'Premium Pass', 'Elite': 'Elite Circle' };
            if (cardBadge) {
                cardBadge.textContent = badges[user.tier] || 'Free Member';
                if (user.tier === 'Elite') {
                    cardBadge.className = 'card-badge text-cyan';
                } else if (user.tier === 'Free') {
                    cardBadge.className = 'card-badge text-silver';
                } else {
                    cardBadge.className = 'card-badge text-pink';
                }
            }
            
            const presets = {
                'neon-cupid': '💘',
                'mystic-dreamer': '✨',
                'cyber-flirt': '👾',
                'golden-glow': '👑',
                'ruby-seduction': '🌹',
                'silver-spark': '💎'
            };
            const avatarBox = document.getElementById('card-avatar-box');
            if (avatarBox) {
                if (user.customPfp) {
                    avatarBox.innerHTML = `<img src="${user.customPfp}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    avatarBox.textContent = presets[user.avatar] || '👤';
                }
            }
            
            // Build dynamic concierge whatsapp url
            const waBaseUrl = "https://wa.me/919999999999";
            const waText = `Hey Instadate Curation! 👋 My name is ${user.name || 'Member'}. I've successfully upgraded my account to the *${user.tier} Tier*. My ID is *${randomId}*. Let's fast-track my club matches! ✨`;
            const waConciergeBtn = document.getElementById('whatsapp-concierge-btn');
            if (waConciergeBtn) waConciergeBtn.href = `${waBaseUrl}?text=${encodeURIComponent(waText)}`;
            
            // Sync navbar in real-time
            updateNavProfile();
            
            // Initialize 3D Card Hover shimmers
            initHologramTilt();
        }
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateProgressBar(percent, stepNum) {
    const fill = document.getElementById('onboard-progress-fill');
    if (fill) fill.style.width = `${percent}%`;
    
    // Reset steps active/completed states
    for (let i = 1; i <= 6; i++) {
        const stepLabel = document.getElementById(`step-label-${i}`);
        if (!stepLabel) continue;
        
        stepLabel.classList.remove('active', 'completed');
        if (i < stepNum) {
            stepLabel.classList.add('completed');
        } else if (i === stepNum) {
            stepLabel.classList.add('active');
        }
    }
}

// Stage 1 Auth methods
function handleOnboardGoogleSignIn() {
    const userData = {
        provider: 'google',
        email: 'user@gmail.com',
        tier: 'Free',
        signedInAt: new Date().toISOString()
    };
    
    localStorage.setItem('instadate_user', JSON.stringify(userData));
    goToOnboardStage(2);
}

function handleOnboardPhoneSignIn(event) {
    event.preventDefault();
    const phone = document.getElementById('onboard-signin-phone').value.trim();
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }
    
    window._signinPhone = phone;
    document.getElementById('onboard-otp-phone-display').textContent = '+91 ' + phone.replace(/(\d{5})(\d{5})/, '$1 $2');
    goToOnboardStage(1.5);
    
    // Focus first OTP box
    setTimeout(() => {
        const firstBox = document.querySelector('.onboard-otp-box[data-otp-index="0"]');
        if (firstBox) firstBox.focus();
    }, 100);
}

function handleOnboardOtpVerify(event) {
    event.preventDefault();
    const otpBoxes = document.querySelectorAll('.onboard-otp-box');
    let otp = '';
    otpBoxes.forEach(box => { otp += box.value; });
    
    if (otp.length !== 6) {
        alert('Please enter the full 6-digit OTP.');
        return;
    }
    
    const userData = {
        provider: 'phone',
        phone: window._signinPhone,
        tier: 'Free',
        signedInAt: new Date().toISOString()
    };
    
    localStorage.setItem('instadate_user', JSON.stringify(userData));
    goToOnboardStage(2);
}

function resendOnboardOtp() {
    document.querySelectorAll('.onboard-otp-box').forEach(box => {
        box.value = '';
        box.classList.remove('filled');
    });
    const firstBox = document.querySelector('.onboard-otp-box[data-otp-index="0"]');
    if (firstBox) firstBox.focus();
    
    const resendBtn = document.querySelector('.signin-resend-btn');
    if (resendBtn) {
        resendBtn.textContent = 'OTP Sent!';
        setTimeout(() => {
            resendBtn.textContent = 'Resend OTP';
        }, 2000);
    }
}

// Stage 2 Profile methods
function selectPresetAvatar(avatarKey) {
    document.querySelectorAll('.avatar-preset-card').forEach(card => {
        card.classList.remove('active');
    });
    const activeCard = document.querySelector(`.avatar-preset-card[data-avatar="${avatarKey}"]`);
    if (activeCard) activeCard.classList.add('active');
    
    const input = document.getElementById('onboard-profile-avatar');
    if (input) input.value = avatarKey;
}

function handleOnboardProfileSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('onboard-profile-name').value.trim();
    const age = parseInt(document.getElementById('onboard-profile-age').value);
    const instagram = document.getElementById('onboard-profile-instagram').value.trim();
    const city = document.getElementById('onboard-profile-city').value;
    const whatsapp = document.getElementById('onboard-profile-whatsapp').value.trim();
    const interest = document.getElementById('onboard-profile-interest').value;
    const bio = document.getElementById('onboard-profile-bio').value.trim();
    const avatar = document.getElementById('onboard-profile-avatar').value;
    
    if (age < 18 || age > 28) {
        alert("Instadate Club membership is strictly curated forconscious adults aged 18 to 28.");
        return;
    }
    
    if (!/^\d{10}$/.test(whatsapp)) {
        alert("Please enter a valid 10-digit WhatsApp number.");
        return;
    }
    
    let instaClean = instagram;
    if (!instaClean.startsWith('@')) {
        instaClean = '@' + instaClean;
    }
    
    // Save profile details to localStorage user
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        const user = JSON.parse(userData);
        user.name = name;
        user.age = age;
        user.instagram = instaClean;
        user.city = city || 'Mumbai';
        user.phone = whatsapp;
        user.interest = interest || 'Everyone';
        user.bio = bio;
        user.avatar = avatar;
        
        localStorage.setItem('instadate_user', JSON.stringify(user));
    }
    
    // Proceed to Stage 3 Vibe Check
    goToOnboardStage(3);
}

// Stage 3 Compatibility quiz methods
function selectQuizOption(qIdx, optionLetter, element) {
    const parentCard = element.closest('.quiz-question-card');
    parentCard.querySelectorAll('.quiz-option-item').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    
    window._quizAnswers[`q${qIdx}`] = optionLetter;
    
    // Transition to next question or stage
    setTimeout(() => {
        if (qIdx < 3) {
            parentCard.style.display = 'none';
            const nextCard = document.querySelector(`.quiz-question-card[data-q-index="${qIdx + 1}"]`);
            if (nextCard) nextCard.style.display = 'flex';
            
            document.getElementById('quiz-current-q').textContent = qIdx + 1;
            document.querySelectorAll('.quiz-dot').forEach(d => d.classList.remove('active'));
            document.querySelector(`.quiz-dot[data-q="${qIdx + 1}"]`).classList.add('active');
        } else {
            // Answered all questions. Move to Stage 4 (Upgrade Pitch)
            goToOnboardStage(4);
        }
    }, 600);
}

// Stage 6 Payment methods
function selectPaymentMethod(method) {
    document.querySelectorAll('.pay-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('payment-form-upi').style.display = 'none';
    document.getElementById('payment-form-card').style.display = 'none';
    
    if (method === 'upi') {
        const tab = document.querySelector('.pay-tab:nth-child(1)');
        if (tab) tab.classList.add('active');
        document.getElementById('payment-form-upi').style.display = 'block';
    } else {
        const tab = document.querySelector('.pay-tab:nth-child(2)');
        if (tab) tab.classList.add('active');
        document.getElementById('payment-form-card').style.display = 'block';
    }
}

function handleOnboardPaymentSubmit(event) {
    event.preventDefault();
    
    // Show spinner overlay
    const spinner = document.getElementById('payment-processing-spinner');
    if (spinner) spinner.style.display = 'flex';
    
    setTimeout(() => {
        // Upgrade tier in localStorage
        const userData = localStorage.getItem('instadate_user');
        if (userData) {
            const user = JSON.parse(userData);
            user.tier = window._selectedOnboardTier;
            localStorage.setItem('instadate_user', JSON.stringify(user));
        }
        
        if (spinner) spinner.style.display = 'none';
        goToOnboardStage(7);
    }, 2000);
}

// Stage 7 Review methods
function runReviewTimelineAnimation() {
    // Reset stages
    document.getElementById('rev-step-1').className = 'review-timeline-item completed';
    document.getElementById('rev-step-2').className = 'review-timeline-item completed';
    document.getElementById('rev-step-3').className = 'review-timeline-item completed';
    document.getElementById('rev-step-4').className = 'review-timeline-item active';
    
    const icon4 = document.querySelector('#rev-step-4 .rev-icon');
    if (icon4) {
        icon4.setAttribute('data-lucide', 'loader');
        icon4.className = 'rev-icon text-cyan spin';
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    setTimeout(() => {
        // Finish Step 4 curation check
        const step4 = document.getElementById('rev-step-4');
        if (step4) step4.className = 'review-timeline-item completed';
        
        const iconDone = document.querySelector('#rev-step-4 .rev-icon');
        if (iconDone) {
            iconDone.setAttribute('data-lucide', 'check-circle-2');
            iconDone.className = 'rev-icon text-green';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Go to Stage 8 (Approval)
        setTimeout(() => {
            goToOnboardStage(8);
        }, 600);
        
    }, 2500);
}

// Hologram 3D tilt effects
function initHologramTilt() {
    const card = document.getElementById('hologram-member-card');
    if (!card) return;
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        
        const sh = card.querySelector('.card-shimmer');
        if (sh) {
            const px = (x / rect.width) * 100;
            const py = (y / rect.height) * 100;
            sh.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`;
        }
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        const sh = card.querySelector('.card-shimmer');
        if (sh) sh.style.background = '';
    });
}

function navigateToMatchesIfWanted() {
    setTimeout(() => {
        openCuratedMatchesModal();
    }, 400);
}

// ==========================================================================
// SUB-MODAL 1: EDIT PROFILE MODAL LOGIC
// ==========================================================================
function openEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;
    
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        const user = JSON.parse(userData);
        
        document.getElementById('edit-profile-name').value = user.name || '';
        document.getElementById('edit-profile-age').value = user.age || '';
        document.getElementById('edit-profile-instagram').value = user.instagram || '';
        document.getElementById('edit-profile-whatsapp').value = user.phone || '';
        document.getElementById('edit-profile-bio').value = user.bio || '';
        
        // City preset select trigger
        const cityInput = document.getElementById('edit-profile-city');
        if (cityInput) {
            cityInput.value = user.city || 'Mumbai';
            const cityText = document.querySelector('#edit-profile-city-wrapper .selected-value-text');
            if (cityText) cityText.textContent = user.city || 'Mumbai';
        }
        
        // Interest preset select trigger
        const interestInput = document.getElementById('edit-profile-interest');
        if (interestInput) {
            interestInput.value = user.interest || 'Everyone';
            const interestText = document.querySelector('#edit-profile-interest-wrapper .selected-value-text');
            if (interestText) interestText.textContent = user.interest || 'Everyone';
        }
        
        // Highlight chosen preset avatar archetype
        selectEditPresetAvatar(user.avatar || 'neon-cupid');
        
        // Load custom profile picture in preview if present
        const customPfpInput = document.getElementById('edit-profile-custom-pfp');
        if (customPfpInput) {
            customPfpInput.value = user.customPfp || '';
            const preview = document.getElementById('edit-pfp-preview-circle');
            const badge = document.getElementById('edit-pfp-badge-label');
            
            if (user.customPfp) {
                if (preview) preview.innerHTML = `<img src="${user.customPfp}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                if (badge) {
                    badge.textContent = "Custom Photo";
                    badge.className = "edit-pfp-badge badge-custom";
                }
            } else {
                if (badge) {
                    badge.textContent = "Archetype Preset";
                    badge.className = "edit-pfp-badge badge-preset";
                }
            }
        }
    }
    
    modal.classList.add('active');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.remove('active');
}

function closeEditProfileModalOnOverlay(event) {
    if (event.target === document.getElementById('edit-profile-modal')) {
        closeEditProfileModal();
    }
}

function selectEditPresetAvatar(avatarKey) {
    const container = document.getElementById('edit-avatar-presets');
    if (!container) return;
    
    container.querySelectorAll('.avatar-preset-card').forEach(card => {
        card.classList.remove('active');
    });
    const activeCard = container.querySelector(`.avatar-preset-card[data-avatar="${avatarKey}"]`);
    if (activeCard) activeCard.classList.add('active');
    
    const input = document.getElementById('edit-profile-avatar');
    if (input) input.value = avatarKey;
    
    const presets = {
        'neon-cupid': '💘',
        'mystic-dreamer': '✨',
        'cyber-flirt': '👾',
        'golden-glow': '👑',
        'ruby-seduction': '🌹',
        'silver-spark': '💎'
    };
    
    const preview = document.getElementById('edit-pfp-preview-circle');
    const badge = document.getElementById('edit-pfp-badge-label');
    const customPfpInput = document.getElementById('edit-profile-custom-pfp');
    
    // Clear custom photo if clicking a preset card
    const isClick = window.event && window.event.type === 'click';
    if (isClick && customPfpInput) {
        customPfpInput.value = "";
    }
    
    if (!customPfpInput || !customPfpInput.value) {
        if (preview) {
            preview.innerHTML = `<span style="font-size: 2.25rem;">${presets[avatarKey] || '👤'}</span>`;
        }
        if (badge) {
            badge.textContent = "Archetype Preset";
            badge.className = "edit-pfp-badge badge-preset";
        }
    }
}

function saveProfileChanges(event) {
    event.preventDefault();
    
    const name = document.getElementById('edit-profile-name').value.trim();
    const customPfp = document.getElementById('edit-profile-custom-pfp').value;
    const age = parseInt(document.getElementById('edit-profile-age').value);
    const instagram = document.getElementById('edit-profile-instagram').value.trim();
    const city = document.getElementById('edit-profile-city').value;
    const whatsapp = document.getElementById('edit-profile-whatsapp').value.trim();
    const interest = document.getElementById('edit-profile-interest').value;
    const bio = document.getElementById('edit-profile-bio').value.trim();
    const avatar = document.getElementById('edit-profile-avatar').value;
    
    if (age < 18 || age > 28) {
        alert("Verification check fails: Curation age limits must strictly be between 18 and 28.");
        return;
    }
    
    if (!/^\d{10}$/.test(whatsapp)) {
        alert("Please enter a valid 10-digit WhatsApp number.");
        return;
    }
    
    let instaClean = instagram;
    if (!instaClean.startsWith('@')) {
        instaClean = '@' + instaClean;
    }
    
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        const user = JSON.parse(userData);
        user.name = name;
        user.age = age;
        user.instagram = instaClean;
        user.city = city || 'Mumbai';
        user.phone = whatsapp;
        user.interest = interest || 'Everyone';
        user.bio = bio;
        user.avatar = avatar;
        user.customPfp = customPfp;
        
        localStorage.setItem('instadate_user', JSON.stringify(user));
    }
    
    closeEditProfileModal();
    updateNavProfile();
    
    // Quick micro success toast feedback
    showVibeCheckToast('Profile Saved Successfully! ✨');
}

// ==========================================================================
// SUB-MODAL 2: CURATED MATCHES MODAL LOGIC
// ==========================================================================
function openCuratedMatchesModal() {
    const modal = document.getElementById('curated-matches-modal');
    if (!modal) return;
    
    const list = document.getElementById('matches-list-container');
    if (list) {
        const userData = localStorage.getItem('instadate_user');
        if (userData) {
            const user = JSON.parse(userData);
            
            // Generate matches based on gender preference
            let html = '';
            
            const femaleMatches = [
                { name: 'Ananya Sen', age: 22, city: 'Mumbai', bio: 'Bandra indie musician, coffee collector, and techno lover 🎸☕', avatar: '✨', score: '98%' },
                { name: 'Riya Mehta', age: 24, city: 'Mumbai', bio: 'Product designer at a startup. Always up for secret food trails 🍣🎨', avatar: '💘', score: '95%' },
                { name: 'Tara D’Souza', age: 23, city: 'Mumbai', bio: 'Weekend road-tripper, amateur astronomer, and pure ambivert ⚖️🌌', avatar: '🌹', score: '93%' }
            ];
            
            const maleMatches = [
                { name: 'Kabir Kapoor', age: 23, city: 'Mumbai', bio: 'Jazz keyboardist, cafe reader, and coffee brewer 🎹☕', avatar: '✨', score: '98%' },
                { name: 'Aarav Mehta', age: 25, city: 'Mumbai', bio: 'Architectural photographer. High-energy techno enthusiast 🌃📸', avatar: '👑', score: '94%' },
                { name: 'Ishaan Verma', age: 22, city: 'Mumbai', bio: 'Hiking lover, spontaneous planner, and dog dad 🐾⛰️', avatar: '💎', score: '92%' }
            ];
            
            let matchedList = [];
            if (user.interest === 'Men') {
                matchedList = maleMatches;
            } else if (user.interest === 'Women') {
                matchedList = femaleMatches;
            } else {
                matchedList = [...femaleMatches.slice(0, 2), maleMatches[0]];
            }
            
            matchedList.forEach((m, idx) => {
                const randomId = 'IND-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900);
                const waBaseUrl = "https://wa.me/919999999999";
                const waText = `Hey Instadate Match Concierge! 👋 I've got a match with *${m.name}* (Compatibility score: ${m.score}). Please fast-track our curated connection! ✨`;
                const waUrl = `${waBaseUrl}?text=${encodeURIComponent(waText)}`;
                
                html += `
                    <div class="match-profile-card">
                        <div class="match-card-avatar">${m.avatar}</div>
                        <div class="match-card-details">
                            <div class="match-card-header">
                                <span class="match-card-name">${m.name}</span>
                                <span class="match-card-meta">${m.age} • ${m.city}</span>
                                <span class="match-badge-compatibility">${m.score} Match</span>
                            </div>
                            <p class="match-card-bio">"${m.bio}"</p>
                            <div class="match-card-actions mt-3" style="display: flex; gap: 8px;">
                                <button class="btn btn-primary btn-sm font-semibold w-full" style="font-size: 0.72rem; padding: 6px 12px; flex-grow: 1;" onclick="closeCuratedMatchesModal(); window.location.href='chat.html?match=' + encodeURIComponent('${m.name}');">
                                    Unlock Chat 💬
                                </button>
                                <a href="${waUrl}" target="_blank" class="btn btn-whatsapp btn-sm" style="font-size: 0.72rem; padding: 6px 12px; flex-shrink: 0;">
                                    <i class="wa-whatsapp-icon"></i> Concierge
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            list.innerHTML = html;
        }
    }
    
    modal.classList.add('active');
}

function closeCuratedMatchesModal() {
    const modal = document.getElementById('curated-matches-modal');
    if (modal) modal.classList.remove('active');
}

function closeCuratedMatchesModalOnOverlay(event) {
    if (event.target === document.getElementById('curated-matches-modal')) {
        closeCuratedMatchesModal();
    }
}

// ==========================================================================
// SUB-MODAL 3: MEMBERSHIP SUBSCRIPTION MODAL LOGIC
// ==========================================================================
function openSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    if (!modal) return;
    
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        const user = JSON.parse(userData);
        
        const label = document.getElementById('sub-active-tier-name');
        if (label) {
            const tiers = {
                'Free': 'Free Member',
                'Basic': 'Basic Member',
                'Premium': 'Premium Pass',
                'Elite': 'Elite Circle'
            };
            label.textContent = tiers[user.tier] || user.tier;
        }
        
        // Reset sub cards active styles
        document.querySelectorAll('.sub-plan-card').forEach(c => {
            c.classList.remove('active', 'active-elite');
        });
        document.querySelectorAll('.sub-plan-card button').forEach(btn => {
            btn.textContent = 'Upgrade Plan';
            btn.className = 'btn btn-outline w-full mt-4';
            btn.style.opacity = '1';
        });
        
        // Highlight active sub card
        const activeCard = document.getElementById(`sub-card-${user.tier}`);
        if (activeCard) {
            if (user.tier === 'Elite') {
                activeCard.classList.add('active-elite');
            } else {
                activeCard.classList.add('active');
            }
            
            const activeBtn = document.getElementById(`sub-btn-${user.tier}`);
            if (activeBtn) {
                activeBtn.textContent = 'Active Plan';
                activeBtn.className = 'btn btn-outline w-full mt-4 disabled';
                activeBtn.style.opacity = '0.6';
            }
        }
    }
    
    modal.classList.add('active');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    if (modal) modal.classList.remove('active');
}

function closeSubscriptionModalOnOverlay(event) {
    if (event.target === document.getElementById('subscription-modal')) {
        closeSubscriptionModal();
    }
}

function selectUpgradeTier(tier) {
    closeSubscriptionModal();
    
    // Save target tier globally
    window._selectedOnboardTier = tier;
    
    // Launch onboarding modal at Stage 3 Compatibility questions!
    const modal = document.getElementById('apply-modal');
    if (modal) {
        modal.classList.add('active');
        goToOnboardStage(3);
    }
}

// Quick micro-toast alert for settings
function showQuickSettingsToast() {
    showVibeCheckToast('Concierge Settings Loaded! Sliders active. 🎛️');
}

function showVibeCheckToast(msg) {
    // Generate a sleek micro toast dynamically
    const toast = document.createElement('div');
    toast.className = 'glass-card';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '12px';
    toast.style.background = 'rgba(13, 12, 18, 0.95)';
    toast.style.border = '1px solid var(--primary-pink)';
    toast.style.color = '#fff';
    toast.style.fontFamily = 'var(--font-outfit)';
    toast.style.fontSize = '0.88rem';
    toast.style.boxShadow = '0 0 20px rgba(255, 46, 147, 0.2)';
    toast.style.zIndex = '99999';
    toast.style.animation = 'slideInFade 0.35s ease';
    toast.textContent = msg;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}

// Auto OTP advancement for new unified onboarding
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', (e) => {
        if (!e.target.classList.contains('onboard-otp-box')) return;
        
        const val = e.target.value;
        e.target.value = val.replace(/[^0-9]/g, '');
        
        if (e.target.value) {
            e.target.classList.add('filled');
            const idx = parseInt(e.target.dataset.otpIndex);
            const nextBox = document.querySelector(`.onboard-otp-box[data-otp-index="${idx + 1}"]`);
            if (nextBox) nextBox.focus();
        } else {
            e.target.classList.remove('filled');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (!e.target.classList.contains('onboard-otp-box')) return;
        
        if (e.key === 'Backspace' && !e.target.value) {
            const idx = parseInt(e.target.dataset.otpIndex);
            const prevBox = document.querySelector(`.onboard-otp-box[data-otp-index="${idx - 1}"]`);
            if (prevBox) {
                prevBox.focus();
                prevBox.value = '';
                prevBox.classList.remove('filled');
            }
        }
    });
});

// --- CUSTOM CURSOR & INITIALIZATION CHECK ---
document.addEventListener('DOMContentLoaded', () => {
    updateNavProfile();
});




// ==========================================================================
// 1. NEON CURSOR & PARTICLE TRAILS ENGINE
// ==========================================================================
function initCustomCursorTrail() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    
    let cursorX = 0, cursorY = 0;
    let targetX = 0, targetY = 0;
    
    // Smooth lerping cursor updates
    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        
        // Spawn glow trails randomly to avoid DOM lag
        if (Math.random() < 0.2) {
            spawnCursorParticle(e.clientX, e.clientY);
        }
    });
    
    function animateCursor() {
        const lerpFactor = 0.22;
        cursorX += (targetX - cursorX) * lerpFactor;
        cursorY += (targetY - cursorY) * lerpFactor;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Highlight cursor scale on entering clickable targets
    function bindHoverables() {
        const hoverables = document.querySelectorAll('a, button, select, input, textarea, .pricing-toggle-btn, .vibe-card');
        hoverables.forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('active'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    }
    bindHoverables();
    
    // Periodically re-bind hoverable elements to account for dynamic DOM changes (e.g. calculator results)
    setInterval(bindHoverables, 2000);
}

function spawnCursorParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'cursor-particle';
    
    const colors = ['#FF2E93', '#9B30FF', '#00F5FF'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.color = randomColor;
    particle.style.backgroundColor = randomColor;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    document.body.appendChild(particle);
    
    // Fade out and shrink micro sparks
    setTimeout(() => {
        particle.style.width = '0px';
        particle.style.height = '0px';
        particle.style.opacity = '0';
        
        setTimeout(() => {
            particle.remove();
        }, 600);
    }, 40);
}

// ==========================================================================
// 2. VIBE SYNCHRONIZER CALCULATOR & MATCH GENERATOR
// ==========================================================================
const mockVibeMatches = {
    "Find a Date": {
        "Mumbai": { name: "Kavya, 22", bio: "Ideal romantic Sunday: A cozy sunset walk at Marine Drive, followed by firewood pizza and late-night deep talks about life. Let's skip matches and find chemistry.", avatar: "avatar-1" },
        "Delhi NCR": { name: "Tanvi, 21", bio: "Looking for an exclusive partner to explore Delhi's old monuments, share romantic momos plates, and have deep retro conversations.", avatar: "avatar-1" },
        "Bangalore": { name: "Simran, 23", bio: "Passionate about startup ideas and cozy date cafes. Let's grab filter coffee, visit bookshops, and build a genuine connection.", avatar: "avatar-1" },
        "Pune": { name: "Nisha, 22", bio: "Romantic at heart. Looking for someone to sit on hilltops in Pune, watch sunsets, and talk about music and books.", avatar: "avatar-1" },
        "Hyderabad": { name: "Pooja, 24", bio: "Let's explore Hyderabad food spots together. Looking for a high-value partner who values honesty and warm vibes.", avatar: "avatar-1" }
    },
    "Cafe Partner": {
        "Mumbai": { name: "Ishaan, 23", bio: "Go-to espresso order: Iced Spanish Latte. Vibe: minimalistic Bandra cafes with warm lighting, books, and deep chats.", avatar: "avatar-2" },
        "Delhi NCR": { name: "Arjun, 24", bio: "Minimalist cafe explorer. Let's hop cafes in Champa Gali, talk about design, and enjoy chill lo-fi playlists.", avatar: "avatar-2" },
        "Bangalore": { name: "Rahul, 22", bio: "Coffee snob and book lover. Always down for French press, Indiranagar aesthetics, and talk about sci-fi novels.", avatar: "avatar-2" },
        "Pune": { name: "Aman, 23", bio: "Down to explore cozy bakeries in KP, sip macchiatos, and talk about independent cinema and art.", avatar: "avatar-2" },
        "Hyderabad": { name: "Karan, 24", bio: "Let's check out new aesthetic spots in Jubilee Hills, talk about entrepreneurship, and share cinnamon rolls.", avatar: "avatar-2" }
    },
    "Pickleball Group": {
        "Mumbai": { name: "Siddharth, 24", bio: "Casual player looking for double matches on Bandra courts and grab fresh cold juices after. High energy and fun social sports vibes!", avatar: "avatar-2" },
        "Delhi NCR": { name: "Kabir, 23", bio: "Pickleball enthusiast! Down for competitive doubles matches and sharing street food and jokes afterwards.", avatar: "avatar-2" },
        "Bangalore": { name: "Rohan, 25", bio: "Casual beginner looking to master slice serves. Let's play on weekend mornings and get a nice brunch in Indiranagar.", avatar: "avatar-2" },
        "Pune": { name: "Varun, 22", bio: "Double games partner wanted! High-energy social sports and high-respect team vibes only.", avatar: "avatar-2" },
        "Hyderabad": { name: "Vikram, 24", bio: "Let's smash some pickleballs on Gachibowli courts and grab cold brews to celebrate our wins.", avatar: "avatar-2" }
    }
};

// Standard fallback matches for other choices to guarantee flawless, rich replies
const fallbackMatches = [
    { name: "Ananya, 22", bio: "Techno gig partner wanted! Down to share concert passes, listen to house music, and dance the night away.", avatar: "avatar-1" },
    { name: "Rohit, 24", bio: "Weekend roadtripper. Let's drive to hill stations, explore secret viewpoints, and curate aesthetic road playlists.", avatar: "avatar-2" },
    { name: "Tanya, 23", bio: "Photoshoot creator. Meet aesthetic people for streetwear content, retro film photography, and creative shoots.", avatar: "avatar-1" },
    { name: "Aditya, 25", bio: "Building the next big consumer app. Looking to connect with ambitious Gen Z founders, designers, and creators.", avatar: "avatar-2" }
];

function runVibeCalculator() {
    const style = document.getElementById('matcher-style').value;
    const soundtrack = document.getElementById('matcher-soundtrack').value;
    const city = document.getElementById('matcher-city').value;
    
    // Check validation
    if (!style || !soundtrack || !city) {
        alert("Please select your weekend style, music soundtrack, and city to synchronize frequencies!");
        return;
    }
    
    // Hide Form Controls and results
    const formGrid = document.querySelector('.matcher-form-grid');
    const checkBtn = document.getElementById('vibe-check-btn');
    const resultCard = document.getElementById('matcher-result');
    const loader = document.getElementById('scanning-loader');
    
    formGrid.style.display = 'none';
    checkBtn.style.display = 'none';
    resultCard.style.display = 'none';
    
    // Show Scanning Loader
    loader.style.display = 'flex';
    loader.style.opacity = '1';
    
    // Run Progress bar loader over 1.8 seconds
    const progressFill = document.getElementById('scanner-progress');
    let width = 0;
    progressFill.style.width = '0%';
    
    const interval = setInterval(() => {
        width += 5;
        progressFill.style.width = `${width}%`;
        
        if (width >= 100) {
            clearInterval(interval);
            
            // Loader fade out
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                revealVibeCheckResult(style, city);
            }, 300);
        }
    }, 90);
}

function revealVibeCheckResult(style, city) {
    const resultCard = document.getElementById('matcher-result');
    const scoreText = document.getElementById('result-score-text');
    const nameText = document.getElementById('result-match-name');
    const cityText = document.getElementById('result-match-city');
    const bioText = document.getElementById('result-match-bio');
    const avatar = document.getElementById('result-avatar');
    const claimBtn = document.getElementById('result-modal-btn');
    
    // Generate Random Score between 94% and 99%
    const score = Math.floor(Math.random() * 6) + 94;
    scoreText.textContent = `${score}%`;
    
    // Find Match details from mock datasets
    let match = null;
    if (mockVibeMatches[style] && mockVibeMatches[style][city]) {
        match = mockVibeMatches[style][city];
    } else {
        // Dynamic fallback matching
        match = fallbackMatches[Math.floor(Math.random() * fallbackMatches.length)];
    }
    
    // Populate Results
    nameText.textContent = match.name;
    cityText.innerHTML = `<i data-lucide="map-pin"></i> ${city}`;
    bioText.textContent = `"${match.bio}"`;
    
    // Reset avatar classes & background
    avatar.className = 'matched-avatar';
    avatar.style.backgroundImage = '';
    
    if (match.avatar === 'avatar-1') {
        avatar.style.backgroundImage = "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"%23FF2E93\"%3E%3Ccircle cx=\"50\" cy=\"50\" r=\"50\" opacity=\"0.1\"/%3E%3Cpath d=\"M50 30c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 30c-13.3 0-24 10.7-24 24h48c0-13.3-10.7-24-24-24z\"/%3E%3C/svg%3E')";
    } else {
        avatar.style.backgroundImage = "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" fill=\"%2300F5FF\"%3E%3Ccircle cx=\"50\" cy=\"50\" r=\"50\" opacity=\"0.1\"/%3E%3Cpath d=\"M50 30c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 30c-13.3 0-24 10.7-24 24h48c0-13.3-10.7-24-24-24z\"/%3E%3C/svg%3E')";
    }
    
    // Wire up "Claim Match & Apply" Modal CTA
    claimBtn.onclick = () => {
        closeVibeCalculatorResult();
        openApplyModal('Premium', style);
        
        // Auto select city inside modal form visually
        setCustomSelectValue('form-city-wrapper', city);
        
        // Auto prefill bio statement to match the user's specific matched avatar
        document.getElementById('form-bio').value = `I completed the Vibe Matcher and synchronized frequencies with ${match.name} in ${city}! I want to apply for the exclusive "${style}" circle to connect with them.`;
    };
    
    // Reveal Results card with smooth container stretch
    const container = document.querySelector('.matcher-container');
    resultCard.style.display = 'block';
    resultCard.style.opacity = '0';
    resultCard.style.transform = 'translateY(12px)';
    resultCard.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    
    // Stretch the container smoothly
    if (container) {
        container.classList.add('result-expanded');
    }
    
    setTimeout(() => {
        resultCard.style.opacity = '1';
        resultCard.style.transform = 'translateY(0)';
    }, 50);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function resetVibeCalculator() {
    resetCustomSelects(document.querySelector('.vibe-matcher-section'));
    closeVibeCalculatorResult();
}

function closeVibeCalculatorResult() {
    const formGrid = document.querySelector('.matcher-form-grid');
    const checkBtn = document.getElementById('vibe-check-btn');
    const resultCard = document.getElementById('matcher-result');
    const loader = document.getElementById('scanning-loader');
    
    const container = document.querySelector('.matcher-container');
    if (container) container.classList.remove('result-expanded');
    
    formGrid.style.display = 'grid';
    checkBtn.style.display = 'inline-flex';
    resultCard.style.display = 'none';
    loader.style.display = 'none';
}

// ==========================================================================
// 3. CORE CUSTOM SELECT WIDGET ENGINE
// ==========================================================================
function initCustomSelects() {
    const wrappers = document.querySelectorAll('.custom-select-wrapper');
    
    wrappers.forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const container = wrapper.querySelector('.custom-options-container');
        const options = wrapper.querySelectorAll('.custom-option');
        const hiddenInput = wrapper.querySelector('input[type="hidden"]');
        const valueText = wrapper.querySelector('.selected-value-text');
        
        // Toggle Dropdown List open state
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Close other custom dropdowns
            wrappers.forEach(otherWrapper => {
                if (otherWrapper !== wrapper) {
                    otherWrapper.classList.remove('open');
                }
            });
            
            wrapper.classList.toggle('open');
        });
        
        // Select Option Item click
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const val = option.getAttribute('data-value');
                const text = option.textContent;
                
                // Update active selected class
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Set values
                hiddenInput.value = val;
                valueText.textContent = text;
                
                // Close list
                wrapper.classList.remove('open');
                
                // Trigger any change listeners (if relevant)
                hiddenInput.dispatchEvent(new Event('change'));
            });
        });
    });
    
    // Global Close on clicking anywhere outside
    window.addEventListener('click', () => {
        wrappers.forEach(wrapper => wrapper.classList.remove('open'));
    });
}

function resetCustomSelects(parent = document) {
    const wrappers = parent.querySelectorAll('.custom-select-wrapper');
    wrappers.forEach(wrapper => {
        const defaultOption = wrapper.querySelector('.custom-option[data-value=""]');
        const hiddenInput = wrapper.querySelector('input[type="hidden"]');
        const valueText = wrapper.querySelector('.selected-value-text');
        const options = wrapper.querySelectorAll('.custom-option');
        
        options.forEach(opt => opt.classList.remove('selected'));
        
        if (defaultOption) {
            defaultOption.classList.add('selected');
            hiddenInput.value = "";
            valueText.textContent = defaultOption.textContent;
        } else {
            hiddenInput.value = "";
            valueText.textContent = "Select option";
        }
    });
}

function setCustomSelectValue(wrapperId, val) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const valueText = wrapper.querySelector('.selected-value-text');
    const options = wrapper.querySelectorAll('.custom-option');
    const targetOption = wrapper.querySelector(`.custom-option[data-value="${val}"]`);
    
    options.forEach(opt => opt.classList.remove('selected'));
    
    if (targetOption) {
        targetOption.classList.add('selected');
        hiddenInput.value = val;
        valueText.textContent = targetOption.textContent;
    }
}

// ==========================================================================
// 4. INTERACTIVE OPENSTREETMAP LEAFLET ENGINE (DARK CARTO THEME)
// ==========================================================================
let leafletMapInstance = null;
let liveEventMarker = null;
let liveEventCircle = null;
let coupleMarkers = [];
let memberMarkers = [];

const liveEventCoords = [19.0596, 72.8295];
const coupleMatchesData = [
    {
        name: "Riya & Ishan",
        coords: [28.5459, 77.2026],
        city: "Delhi NCR",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Riya & Ishan</h4>
                <p class="popup-subtitle">Hauz Khas Social, Delhi</p>
                <div class="popup-status" style="background: rgba(155, 48, 255, 0.15); color: var(--primary-purple); border-color: rgba(155, 48, 255, 0.25);">
                    <span class="popup-dot" style="background-color: var(--primary-purple); box-shadow: 0 0 8px var(--primary-purple);"></span> Couple Met
                </div>
            </div>
        `,
        color: '#9B30FF'
    },
    {
        name: "Ananya & Rohit",
        coords: [18.9220, 72.8346],
        city: "Mumbai",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Ananya & Rohit</h4>
                <p class="popup-subtitle">Rooftop Colaba, Mumbai</p>
                <div class="popup-status" style="background: rgba(255, 46, 147, 0.15); color: var(--primary-pink); border-color: rgba(255, 46, 147, 0.25);">
                    <span class="popup-dot" style="background-color: var(--primary-pink); box-shadow: 0 0 8px var(--primary-pink);"></span> Couple Met
                </div>
            </div>
        `,
        color: '#FF2E93'
    },
    {
        name: "Divya & Kabir",
        coords: [12.9719, 77.6412],
        city: "Bangalore",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Divya & Kabir</h4>
                <p class="popup-subtitle">The Lounge, Indiranagar</p>
                <div class="popup-status" style="background: rgba(0, 245, 255, 0.15); color: var(--primary-cyan); border-color: rgba(0, 245, 255, 0.25);">
                    <span class="popup-dot" style="background-color: var(--primary-cyan); box-shadow: 0 0 8px var(--primary-cyan);"></span> Couple Met
                </div>
            </div>
        `,
        color: '#00F5FF'
    }
];

const activeMembersData = [
    {
        name: "Kavya Sharma",
        coords: [19.0620, 72.8280],
        city: "Mumbai",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Kavya, 22</h4>
                <p class="popup-subtitle">Bandra West, Mumbai</p>
                <div class="popup-status" style="background: rgba(37, 211, 102, 0.15); color: var(--whatsapp-green); border-color: rgba(37, 211, 102, 0.25);">
                    <span class="popup-dot" style="background-color: var(--whatsapp-green); box-shadow: 0 0 8px var(--whatsapp-green);"></span> Online
                </div>
            </div>
        `,
        color: '#25D366'
    },
    {
        name: "Rohan Malhotra",
        coords: [28.5475, 77.2680],
        city: "Delhi NCR",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Rohan, 24</h4>
                <p class="popup-subtitle">GK II, Delhi NCR</p>
                <div class="popup-status" style="background: rgba(37, 211, 102, 0.15); color: var(--whatsapp-green); border-color: rgba(37, 211, 102, 0.25);">
                    <span class="popup-dot" style="background-color: var(--whatsapp-green); box-shadow: 0 0 8px var(--whatsapp-green);"></span> Online
                </div>
            </div>
        `,
        color: '#25D366'
    },
    {
        name: "Zara Chen",
        coords: [12.9785, 77.6400],
        city: "Bangalore",
        popupText: `
            <div class="map-popup-card">
                <h4 class="popup-title">Zara, 23</h4>
                <p class="popup-subtitle">Indiranagar, Bangalore</p>
                <div class="popup-status" style="background: rgba(37, 211, 102, 0.15); color: var(--whatsapp-green); border-color: rgba(37, 211, 102, 0.25);">
                    <span class="popup-dot" style="background-color: var(--whatsapp-green); box-shadow: 0 0 8px var(--whatsapp-green);"></span> Online
                </div>
            </div>
        `,
        color: '#25D366'
    }
];

function initInteractiveMap() {
    const mapElement = document.getElementById('interactive-leaflet-map');
    if (!mapElement || typeof L === 'undefined') return;
    
    // Initialize Leaflet map centered on Mumbai Live Event initially
    leafletMapInstance = L.map('interactive-leaflet-map', { 
        zoomControl: false,
        attributionControl: false
    }).setView(liveEventCoords, 15);
    
    // Load CartoDB Dark Matter tile set
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(leafletMapInstance);
    
    // Create live event marker (pulsing neon ring)
    liveEventMarker = L.circleMarker(liveEventCoords, {
        color: '#FF2E93',
        fillColor: '#FF2E93',
        fillOpacity: 0.9,
        radius: 8,
        weight: 3,
        className: 'leaflet-pulsing-marker'
    }).addTo(leafletMapInstance);
    
    // Create large radar circle on live event
    liveEventCircle = L.circle(liveEventCoords, {
        color: '#FF2E93',
        fillColor: '#FF2E93',
        fillOpacity: 0.06,
        radius: 280,
        weight: 1,
        dashArray: '5, 10'
    }).addTo(leafletMapInstance);

    // Bind event popup
    liveEventMarker.bindPopup(`
        <div class="map-popup-card">
            <h4 class="popup-title">CÉ LA VI Lounge</h4>
            <p class="popup-subtitle">Linking Road, Bandra West</p>
            <div class="popup-status"><span class="popup-dot"></span> Mixer Active</div>
        </div>
    `, {
        closeButton: false,
        autoClose: false,
        closeOnClick: false
    }).openPopup();

    // Initialize all couples markers (not added to map initially)
    coupleMarkers = coupleMatchesData.map(data => {
        const marker = L.circleMarker(data.coords, {
            color: data.color,
            fillColor: data.color,
            fillOpacity: 0.9,
            radius: 8,
            weight: 3,
            className: 'leaflet-pulsing-marker'
        });

        marker.bindPopup(data.popupText, {
            closeButton: false,
            autoClose: false,
            closeOnClick: false
        });

        return marker;
    });

    // Initialize all active member markers (not added to map initially)
    memberMarkers = activeMembersData.map(data => {
        const marker = L.circleMarker(data.coords, {
            color: data.color,
            fillColor: data.color,
            fillOpacity: 0.9,
            radius: 8,
            weight: 3,
            className: 'leaflet-pulsing-marker'
        });

        marker.bindPopup(data.popupText, {
            closeButton: false,
            autoClose: false,
            closeOnClick: false
        });

        return marker;
    });
}

// Switch map layer displays and views
function switchMapLayer(layer) {
    const btnEvent = document.getElementById('btn-tab-event');
    const btnCouples = document.getElementById('btn-tab-couples');
    const btnMembers = document.getElementById('btn-tab-members');
    
    const panelEvent = document.getElementById('map-event-panel');
    const panelCouples = document.getElementById('map-couples-panel');
    const panelMembers = document.getElementById('map-members-panel');
    
    const tabWrapper = document.getElementById('map-tab-wrapper');
    
    if (!leafletMapInstance) return;

    // Helper functions to show/hide layers dynamically
    const showLayer = (item) => {
        if (item && !leafletMapInstance.hasLayer(item)) {
            item.addTo(leafletMapInstance);
        }
    };
    const hideLayer = (item) => {
        if (item && leafletMapInstance.hasLayer(item)) {
            leafletMapInstance.removeLayer(item);
        }
    };

    if (layer === 'event') {
        // Toggle tab highlights
        btnEvent.classList.add('active');
        btnCouples.classList.remove('active');
        if (btnMembers) btnMembers.classList.remove('active');
        
        if (tabWrapper) {
            tabWrapper.classList.remove('couples-active');
            tabWrapper.classList.remove('members-active');
        }
        
        // Toggle sidebar panels
        panelEvent.style.display = 'block';
        panelCouples.style.display = 'none';
        if (panelMembers) panelMembers.style.display = 'none';
        
        // Show/Hide Markers
        showLayer(liveEventMarker);
        showLayer(liveEventCircle);
        coupleMarkers.forEach(m => hideLayer(m));
        memberMarkers.forEach(m => hideLayer(m));
        
        // Fly map back to Bandra West live coordinates
        leafletMapInstance.closePopup();
        leafletMapInstance.flyTo(liveEventCoords, 15, { duration: 1.5 });
        setTimeout(() => {
            if (leafletMapInstance.hasLayer(liveEventMarker)) {
                liveEventMarker.openPopup();
            }
        }, 1500);
    } else if (layer === 'couples') {
        // Toggle tab highlights
        btnEvent.classList.remove('active');
        btnCouples.classList.add('active');
        if (btnMembers) btnMembers.classList.remove('active');
        
        if (tabWrapper) {
            tabWrapper.classList.add('couples-active');
            tabWrapper.classList.remove('members-active');
        }
        
        // Toggle sidebar panels
        panelEvent.style.display = 'none';
        panelCouples.style.display = 'block';
        if (panelMembers) panelMembers.style.display = 'none';
        
        // Show/Hide Markers
        hideLayer(liveEventMarker);
        hideLayer(liveEventCircle);
        coupleMarkers.forEach(m => showLayer(m));
        memberMarkers.forEach(m => hideLayer(m));
        
        // Zoom out map to fit all couples met coordinates across India!
        leafletMapInstance.closePopup();
        leafletMapInstance.flyTo([21.0000, 78.0000], 5, { duration: 1.8 });
        
        // Reset active card highlights
        document.querySelectorAll('.couple-map-card').forEach(card => card.classList.remove('active'));
    } else if (layer === 'members') {
        // Toggle tab highlights
        btnEvent.classList.remove('active');
        btnCouples.classList.remove('active');
        if (btnMembers) btnMembers.classList.add('active');
        
        if (tabWrapper) {
            tabWrapper.classList.remove('couples-active');
            tabWrapper.classList.add('members-active');
        }
        
        // Toggle sidebar panels
        panelEvent.style.display = 'none';
        panelCouples.style.display = 'none';
        if (panelMembers) panelMembers.style.display = 'block';
        
        // Show/Hide Markers
        hideLayer(liveEventMarker);
        hideLayer(liveEventCircle);
        coupleMarkers.forEach(m => hideLayer(m));
        memberMarkers.forEach(m => showLayer(m));
        
        // Zoom out map to fit active members coordinates across India!
        leafletMapInstance.closePopup();
        leafletMapInstance.flyTo([21.0000, 78.0000], 5, { duration: 1.8 });
        
        // Reset active card highlights
        document.querySelectorAll('.couple-map-card').forEach(card => card.classList.remove('active'));
    }
}

// Focus on a specific couple when they click a sidebar card
function focusCoupleMatch(index) {
    if (!leafletMapInstance || !coupleMarkers[index]) return;
    
    const cardList = document.querySelectorAll('#map-couples-panel .couple-map-card');
    cardList.forEach((card, idx) => {
        if (idx === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    const targetCouple = coupleMatchesData[index];
    leafletMapInstance.closePopup();
    
    // Fly to couple coordinates
    leafletMapInstance.flyTo(targetCouple.coords, 14, { duration: 1.5 });
    
    setTimeout(() => {
        if (leafletMapInstance.hasLayer(coupleMarkers[index])) {
            coupleMarkers[index].openPopup();
        }
    }, 1500);
}

// Focus on a specific active member when they click a sidebar card
function focusActiveMember(index) {
    if (!leafletMapInstance || !memberMarkers[index]) return;
    
    const cardList = document.querySelectorAll('#map-members-panel .couple-map-card');
    cardList.forEach((card, idx) => {
        if (idx === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    const targetMember = activeMembersData[index];
    leafletMapInstance.closePopup();
    
    // Fly to member coordinates
    leafletMapInstance.flyTo(targetMember.coords, 14, { duration: 1.5 });
    
    setTimeout(() => {
        if (leafletMapInstance.hasLayer(memberMarkers[index])) {
            memberMarkers[index].openPopup();
        }
    }, 1500);
}

// Secondary explore for free tier option
function skipToFreeTierOnboard() {
    window._selectedOnboardTier = 'Free';
    
    // Upgrade tier in localStorage
    const userData = localStorage.getItem('instadate_user');
    if (userData) {
        const user = JSON.parse(userData);
        user.tier = 'Free';
        localStorage.setItem('instadate_user', JSON.stringify(user));
    }
    
    // Modify review step 3 description to make it fit standard free exploration
    const revStep3 = document.getElementById('rev-step-3');
    if (revStep3) {
        const h4 = revStep3.querySelector('h4');
        const p = revStep3.querySelector('p');
        if (h4) h4.textContent = 'Explore Free Tier Verified';
        if (p) p.textContent = 'Standard guest entry bypass successfully validated.';
    }
    
    // Smooth transition straight to verification scan (Stage 7)
    goToOnboardStage(7);
}

// Profile picture custom upload triggers & event listeners
function triggerPfpUpload() {
    const fileInput = document.getElementById('edit-pfp-file-input');
    if (fileInput) fileInput.click();
}

function handlePfpFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1.5 * 1024 * 1024) {
        alert("Verification check fails: Select a profile picture smaller than 1.5MB.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        
        const preview = document.getElementById('edit-pfp-preview-circle');
        if (preview) {
            preview.innerHTML = `<img src="${base64Data}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        }
        
        const badge = document.getElementById('edit-pfp-badge-label');
        if (badge) {
            badge.textContent = "Custom Photo";
            badge.className = "edit-pfp-badge badge-custom";
        }
        
        const customPfpInput = document.getElementById('edit-profile-custom-pfp');
        if (customPfpInput) customPfpInput.value = base64Data;
        
        showVibeCheckToast('Profile photo successfully uploaded! 📸');
    };
    reader.readAsDataURL(file);
}

function useArchetypePfp() {
    const customPfpInput = document.getElementById('edit-profile-custom-pfp');
    if (customPfpInput) customPfpInput.value = "";
    
    const avatarKey = document.getElementById('edit-profile-avatar').value || 'neon-cupid';
    
    const presets = {
        'neon-cupid': '💘',
        'mystic-dreamer': '✨',
        'cyber-flirt': '👾',
        'golden-glow': '👑',
        'ruby-seduction': '🌹',
        'silver-spark': '💎'
    };
    
    const preview = document.getElementById('edit-pfp-preview-circle');
    if (preview) {
        preview.innerHTML = `<span style="font-size: 2.25rem;">${presets[avatarKey] || '👤'}</span>`;
    }
    
    const badge = document.getElementById('edit-pfp-badge-label');
    if (badge) {
        badge.textContent = "Archetype Preset";
        badge.className = "edit-pfp-badge badge-preset";
    }
    
    showVibeCheckToast('Switched to Visual Archetype preset! ✨');
}

// ==========================================================================
// SUB-MODAL 5: INSTADATE HIGH-VIBE CHAT MODAL LOGIC
// ==========================================================================
window._activeChatUser = null;
window._activeChatMessages = [];
window._userChatSuccessiveCount = 0;
window._matchChatSteps = 0;
window._voiceIntroUnlocked = false;

function openInstadateChat(name, age, city, avatar, score) {
    const modal = document.getElementById('instadate-chat-modal');
    if (!modal) return;
    
    window._activeChatUser = { name, age, city, avatar, score };
    window._activeChatMessages = [];
    window._userChatSuccessiveCount = 0;
    window._matchChatSteps = 0;
    window._voiceIntroUnlocked = false;
    
    // Set Header
    document.getElementById('chat-header-name').textContent = name;
    document.getElementById('chat-header-meta').textContent = `${age} • ${city} • ${score} Match`;
    document.getElementById('chat-header-avatar').textContent = avatar;
    
    // Set Compatibility banner details
    const banner = document.getElementById('chat-compatibility-banner-text');
    const compPacks = [
        `Shared Interests: Both prefer serious relationships & spontaneous long drives 🚗`,
        `Shared Chemistry: Both love Bandra indie acoustics & weekend coffee runs ☕`,
        `Matching Vibes: Ambient dreamers who value active listening & slow dates 🕯️`,
        `Mutual Preferences: Techno enthusiasts who love midnight drives & local chats 🌃`
    ];
    const index = Math.floor(Math.random() * compPacks.length);
    if (banner) banner.innerHTML = `<i data-lucide="sparkles" class="text-pink animate-pulse" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> <span>${compPacks[index]}</span>`;
    
    // Expiry Clock reset
    document.getElementById('chat-header-timer-value').textContent = '⏳ 6d 23h';
    document.getElementById('chat-header-timer-value').style.color = 'var(--primary-pink)';
    
    // Clean and reset messages scroller
    const container = document.getElementById('chat-messages-container');
    if (container) container.innerHTML = '';
    
    // Show Voice Locker & hide Input Area
    document.getElementById('voice-intro-locker').style.display = 'block';
    document.getElementById('chat-ai-prompts-container').style.display = 'none';
    document.getElementById('chat-intent-buttons').style.display = 'none';
    document.getElementById('chat-input-area-box').style.display = 'none';
    document.getElementById('date-ready-popup').style.display = 'none';
    
    // Clear play/record buttons status
    const btnPlay = document.getElementById('btn-play-voice');
    const btnRec = document.getElementById('btn-record-voice');
    if (btnPlay) {
        btnPlay.innerHTML = `<i data-lucide="play" class="mr-1 inline-block" style="width:12px; height:12px; vertical-align: middle;"></i> Play ${name.split(' ')[0]}'s Intro`;
        btnPlay.className = "btn btn-outline btn-sm font-semibold text-xs";
    }
    if (btnRec) {
        btnRec.innerHTML = `<i data-lucide="radio" class="mr-1 inline-block" style="width:12px; height:12px; vertical-align: middle;"></i> Record My Intro`;
        btnRec.className = "btn btn-outline btn-sm font-semibold text-xs text-cyan";
    }
    
    modal.classList.add('active');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    showVibeCheckToast('Match Mutually Accepted! Chat connection locked! 🔐');
}

function closeChatModal() {
    const modal = document.getElementById('instadate-chat-modal');
    if (modal) modal.classList.remove('active');
}

function closeChatModalOnOverlay(event) {
    if (event.target === document.getElementById('instadate-chat-modal')) {
        closeChatModal();
    }
}

// Voice Intro unlock simulations
function simulatePlayVoiceIntro() {
    const wave = document.getElementById('voice-wave-container');
    const btnPlay = document.getElementById('btn-play-voice');
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    if (!wave || !btnPlay) return;
    
    wave.classList.add('active');
    btnPlay.innerHTML = `<i data-lucide="volume-2" class="mr-1 inline-block animate-pulse" style="width:12px; height:12px; vertical-align: middle;"></i> Playing...`;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 3 seconds simulated voice intro playback
    setTimeout(() => {
        wave.classList.remove('active');
        btnPlay.innerHTML = `<i data-lucide="check-circle" class="mr-1 inline-block" style="width:12px; height:12px; vertical-align: middle;"></i> ${name}'s Intro Listened`;
        btnPlay.className = "btn btn-outline btn-sm font-semibold text-xs disabled";
        btnPlay.setAttribute('onclick', 'event.preventDefault();');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        unlockChatInputAfterVoiceCheck();
    }, 2800);
}

function simulateRecordVoice() {
    const wave = document.getElementById('voice-wave-container');
    const btnRec = document.getElementById('btn-record-voice');
    if (!wave || !btnRec) return;
    
    wave.classList.add('active');
    btnRec.innerHTML = `<i data-lucide="circle-dot" class="mr-1 inline-block animate-ping text-pink" style="width:12px; height:12px; vertical-align: middle;"></i> Recording...`;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setTimeout(() => {
        wave.classList.remove('active');
        btnRec.innerHTML = `<i data-lucide="check-circle" class="mr-1 inline-block text-cyan" style="width:12px; height:12px; vertical-align: middle;"></i> Voice Intro Saved`;
        btnRec.className = "btn btn-outline btn-sm font-semibold text-xs disabled";
        btnRec.setAttribute('onclick', 'event.preventDefault();');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        unlockChatInputAfterVoiceCheck();
    }, 2500);
}

function unlockChatInputAfterVoiceCheck() {
    if (window._voiceIntroUnlocked) return;
    window._voiceIntroUnlocked = true;
    
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    
    setTimeout(() => {
        // Fade out voice locker, fade in inputs
        document.getElementById('voice-intro-locker').style.display = 'none';
        document.getElementById('chat-ai-prompts-container').style.display = 'block';
        document.getElementById('chat-intent-buttons').style.display = 'flex';
        document.getElementById('chat-input-area-box').style.display = 'block';
        
        // Append initial incoming greeter bubble
        appendChatBubble('incoming', `Hey! So glad we mutually accepted! Your compatibility score index is awesome. Btw, which spontaneous prompt caught your eye? Perfect Sunday or coffee drives? 🚗☕`);
        
        showVibeCheckToast('Voice Connection Verified! Text chat unlocked. 🔓');
    }, 400);
}

// AI Prefill Openers
function prefillAiPrompt(promptText) {
    const input = document.getElementById('chat-message-input');
    if (input) {
        input.value = promptText;
        input.focus();
    }
}

// Bubble rendering helper
function appendChatBubble(sender, text, isSystem = false) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    let html = '';
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isSystem) {
        html = `
            <div class="chat-system-card mt-2 mx-auto">
                <i data-lucide="info" style="width: 14px; height: 14px; flex-shrink:0;"></i>
                <span>${text}</span>
            </div>
        `;
    } else if (sender === 'incoming') {
        const char = window._activeChatUser ? window._activeChatUser.avatar : '👤';
        html = `
            <div class="chat-msg-bubble msg-incoming">
                <div class="msg-avatar">${char}</div>
                <div class="msg-body">
                    <div class="msg-text-wrapper">${text}</div>
                    <span class="msg-meta-label">${timeString}</span>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="chat-msg-bubble msg-outgoing">
                <div class="msg-avatar">👤</div>
                <div class="msg-body">
                    <div class="msg-text-wrapper">${text}</div>
                    <span class="msg-meta-label">${timeString}</span>
                </div>
            </div>
        `;
    }
    
    container.insertAdjacentHTML('beforeend', html);
    container.scrollTop = container.scrollHeight;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Low-effort word block & submits
function handleChatSubmit(event) {
    event.preventDefault();
    
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    // Check for low-effort matches
    const lowEffortRegex = /^(hi|hey|hello|wassup|sup|what's up|hlo|yoo|yo|heyy|heyyy|heyyyy|howdy|watsup)$/i;
    if (lowEffortRegex.test(text)) {
        const error = document.getElementById('chat-input-error');
        if (error) {
            error.style.display = 'block';
            input.style.borderColor = 'var(--primary-pink)';
            input.style.boxShadow = '0 0 10px rgba(255, 46, 147, 0.2)';
            
            setTimeout(() => {
                error.style.display = 'none';
                input.style.borderColor = '';
                input.style.boxShadow = '';
            }, 3500);
        }
        return;
    }
    
    // Append outgoing bubble
    appendChatBubble('outgoing', text);
    input.value = '';
    
    window._userChatSuccessiveCount++;
    window._matchChatSteps++;
    
    // Check Slow Mode (Lock if > 5 successive messages without response)
    if (window._userChatSuccessiveCount >= 5) {
        lockSlowModeInput(true);
    }
    
    // Simulate typing indicator & trigger high-vibe match response
    simulateMatchReply();
}

function lockSlowModeInput(lock) {
    const input = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!input || !sendBtn) return;
    
    if (lock) {
        input.disabled = true;
        input.placeholder = "Slow Mode: Wait for a response to keep vibes balanced...";
        input.classList.add('chat-slowmode-banner');
        sendBtn.disabled = true;
    } else {
        input.disabled = false;
        input.placeholder = "Type a premium conversation opener...";
        input.classList.remove('chat-slowmode-banner');
        sendBtn.disabled = false;
        window._userChatSuccessiveCount = 0;
    }
}

function simulateMatchReply() {
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    
    // Custom simulated high-vibe response database
    const replies = [
        `Spontaneous road trips represent my absolute perfect Sunday! Bandra routes at midnight are so therapeutic. What about your perfect Sunday? 🌌🚗`,
        `Hahaha, that spontaneous act sounds incredibly fun! Spontaneity keeps Gen Z dating active. Btw, what makes you a high-value club partner? 🌹✨`,
        `Bespoke cafes in Mumbai are beautiful! Coffee walks are definitely the perfect low-pressure icebreaker date idea. Let's make one happen! ☕🌸`,
        `Absolutely! Serious relationship intentions are so hard to find. Ambient dreamers who value active listening represent pure vibe chemistry! 🕯️💫`,
        `Hahaha, totally love dogs too! dog dad life is awesome. Spontaneous coffee drives represent 100% mutual vibe matches! 🐾☕`
    ];
    
    const index = Math.min(window._matchChatSteps - 1, replies.length - 1);
    const replyText = replies[index] || "That sounds so authentic and fun! Glad we share such matching vibe indexes. Let's coordinate our coffee date? ☕✨";
    
    setTimeout(() => {
        // Unlock Slow Mode first (simulating reply arrived)
        lockSlowModeInput(false);
        
        // Append incoming match response
        appendChatBubble('incoming', replyText);
        
        // Trigger Date Confirmation popup after 3 interaction rounds
        if (window._matchChatSteps === 3) {
            setTimeout(() => {
                document.getElementById('date-ready-popup').style.display = 'block';
                const messagesBox = document.getElementById('chat-messages-container');
                if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
            }, 1000);
        }
    }, 1800);
}

// Date Intent Shortcut Action Handler
function triggerIntentAction(actionKey) {
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    
    if (actionKey === 'plan') {
        appendChatBubble('system', `Plan Date request sent! Coordinating mutual chemistry...`, true);
        
        // Open the ready to meet coord popup immediately
        setTimeout(() => {
            document.getElementById('date-ready-popup').style.display = 'block';
            const messagesBox = document.getElementById('chat-messages-container');
            if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
        }, 600);
    } else if (actionKey === 'insta') {
        const handle = window._activeChatUser ? `@${window._activeChatUser.name.toLowerCase().replace(' ', '_')}` : '@curated_pass';
        appendChatBubble('system', `📸 Instagram Exchanged! ${name}'s handle is ${handle}. Your handle shared mutually!`, true);
        showVibeCheckToast('Instagram handles mutually shared! 📸');
    } else if (actionKey === 'later') {
        appendChatBubble('system', `⏳ Conversation paused. Limited chat window extended by 7 days.`, true);
        document.getElementById('chat-header-timer-value').textContent = '⏳ 13d 23h';
        document.getElementById('chat-header-timer-value').style.color = 'var(--primary-cyan)';
        showVibeCheckToast('Conversation Window Extended! ⏳');
    } else if (actionKey === 'not') {
        appendChatBubble('system', `💔 Conversation closed. Match successfully archived.`, true);
        setTimeout(() => {
            closeChatModal();
            showVibeCheckToast('Match archived successfully.');
        }, 1200);
    }
}

// Coordinate Popup Yes/No
function confirmDateReady(choice) {
    const popup = document.getElementById('date-ready-popup');
    if (popup) popup.style.display = 'none';
    
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    
    if (choice === 'yes') {
        // Confirmed! Coordination system unlocked!
        appendChatBubble('system', `🎉 MATCH CONFIRMED READY! Instadate Curation coordination unlocked. Our Curation board Concierge will WhatsApp coordinate your Sunday Coffee Date Mixer at Bandra shortly. Check your dashboard!`, true);
        
        // Dynamic whatsapp coordinates block unlock
        const waText = `Hey Instadate Curation Concierge! 👋 Both ${name} and I have mutually pressed *Ready to Meet* in our chat! Please coordinate our Sunday Bandra Coffee Date shortly! ☕✨`;
        const waBaseUrl = "https://wa.me/919999999999";
        const waUrl = `${waBaseUrl}?text=${encodeURIComponent(waText)}`;
        
        setTimeout(() => {
            appendChatBubble('incoming', `Oh my gosh, YES! I just pressed 'let's meet' too! Can't wait for our Sunday Bandra coffee mixer! Let's fast-track it here! 👇`);
            
            // Append CTA link button inside chat container
            const container = document.getElementById('chat-messages-container');
            if (container) {
                const btnHtml = `
                    <div style="align-self: center; margin-top: 10px; width: 90%; animation: slideInFade 0.4s ease;">
                        <a href="${waUrl}" target="_blank" class="btn btn-whatsapp w-full btn-sm btn-glow font-bold text-xs" style="padding: 10px 14px;">
                            <i class="wa-whatsapp-icon"></i> Fast-Track Date Concierge WhatsApp
                        </a>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', btnHtml);
                container.scrollTop = container.scrollHeight;
            }
        }, 1200);
        
        showVibeCheckToast('Sunday Bandra Coffee date coordinated successfully! 🎉☕');
    } else {
        appendChatBubble('system', `⏳ Date request paused. Spend more time getting to know each other. Expiry date extended by 3 days.`, true);
        document.getElementById('chat-header-timer-value').textContent = '⏳ 9d 23h';
        document.getElementById('chat-header-timer-value').style.color = 'var(--primary-cyan)';
    }
}

