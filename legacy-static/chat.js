/* ==========================================================================
   INSTADATE STANDALONE CHAT & INBOX LOGIC
   Features: Multi-Match Sidebar, HTML5 URL Params Sync, Distinct localStorage
             Message Pools, Voice Verification Walls, and Date Coordinators.
   ========================================================================== */

// --- GLOBAL CHAT CONTROLLER STATES ---
window._activeChatUser = null;
window._userChatSuccessiveCount = 0;
window._matchChatSteps = 0;
window._voiceIntroUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Sticky NAV Scroll behavior
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.add('scrolled'); // Keep scrolled active on dashboard
        }
    });

    // 3. Ambient Sparks canvas background
    initParticlesCanvas();

    // 4. Custom mouse trailing spark visualizer
    initCustomCursorTrail();

    // 5. Verify Auth State & Render Layout
    verifyInboxAuthAndRender();
});

// --- TOGGLE MOBILE NAV DRAWER ---
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobile-nav');
    const menuIcon = document.getElementById('menu-icon');
    if (!mobileNav || !menuIcon) return;
    
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

// --- VERIFY LOCAL STORAGE AUTH AND RENDER PROFILE CAPSULES ---
function verifyInboxAuthAndRender() {
    const userData = localStorage.getItem('instadate_user');
    const authGuard = document.getElementById('auth-guard-panel');
    const dashboard = document.getElementById('chat-inbox-dashboard');
    
    const navProfile = document.getElementById('nav-profile');
    const mobileNavProfile = document.getElementById('mobile-nav-profile');
    const guestNavCta = document.getElementById('guest-nav-cta');
    const mobileGuestCta = document.getElementById('mobile-guest-cta');

    if (!userData) {
        // Locked guest state
        if (authGuard) authGuard.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        if (navProfile) navProfile.style.display = 'none';
        if (mobileNavProfile) mobileNavProfile.style.display = 'none';
        if (guestNavCta) guestNavCta.style.display = 'inline-block';
        if (mobileGuestCta) mobileGuestCta.style.display = 'block';
        return;
    }

    // Unlocked Premium dashboard
    if (authGuard) authGuard.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    if (guestNavCta) guestNavCta.style.display = 'none';
    if (mobileGuestCta) mobileGuestCta.style.display = 'none';

    const user = JSON.parse(userData);
    
    if (user.tier === 'Free') {
        alert('Unlock premium high-vibe chat channels by upgrading today! 💬');
        window.location.href = 'index.html?action=upgrade-plan';
        return;
    }
    
    // Sync dropdown header parameters
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

    // Populate Dropdown Profile elements
    if (navProfile) {
        navProfile.style.display = 'block';
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
    }

    // Populate Mobile navigation Profile drawer parameters
    if (mobileNavProfile) {
        mobileNavProfile.style.display = 'block';
        const mName = document.getElementById('mobile-profile-name');
        if (mName) mName.textContent = displayName;
        const mAvatar = document.getElementById('mobile-avatar-img-container');
        if (mAvatar) {
            if (user.customPfp) {
                mAvatar.innerHTML = `<img src="${user.customPfp}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                mAvatar.innerHTML = `<span style="font-size: 1.3rem;">${avatarSymbol}</span>`;
            }
        }
        const mBadge = document.getElementById('mobile-tier-badge');
        if (mBadge) {
            mBadge.className = `tier-badge tier-badge-${user.tier.toLowerCase()}`;
            mBadge.textContent = user.tier;
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 6. Generate sidebar matches index
    generateSidebarMatches(user);

    // 7. Parse URL parameters to auto-load active conversation
    parseUrlAndLoadConversation();
}

function toggleProfileDropdown() {
    const btn = document.getElementById('nav-avatar-btn');
    const dropdown = document.getElementById('nav-profile-dropdown');
    if (!btn || !dropdown) return;
    btn.classList.toggle('active');
    dropdown.classList.toggle('active');
}

// Click outside drop closes dropdown
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
    window.location.href = 'index.html';
}

// --- GENERATE INBOX CONNECTIONS LIST DYNAMICALLY ---
const femaleMatches = [
    { name: 'Ananya Sen', age: 22, city: 'Mumbai', bio: 'Bandra indie musician, coffee collector, and techno lover 🎸☕', avatar: '✨', score: '98%', comp: 'Weekend Status: Bandra acoustic live gig & coffee runs 🎸' },
    { name: 'Riya Mehta', age: 24, city: 'Mumbai', bio: 'Product designer at a startup. Always up for secret food trails 🍣🎨', avatar: '💘', score: '95%', comp: 'Weekend Status: Secret food trails in South Bombay 🍣' },
    { name: 'Tara D’Souza', age: 23, city: 'Mumbai', bio: 'Weekend road-tripper, amateur astronomer, and pure ambivert ⚖️🌌', avatar: 'rose-symbol', score: '93%', comp: 'Weekend Status: Spontaneous stargazing & night beach walks 🕯️' }
];

const maleMatches = [
    { name: 'Kabir Kapoor', age: 23, city: 'Mumbai', bio: 'Jazz keyboardist, cafe reader, and coffee brewer 🎹☕', avatar: '✨', score: '98%', comp: 'Weekend Status: Jazz keyboard session & chill cafe reads 🎹' },
    { name: 'Aarav Mehta', age: 25, city: 'Mumbai', bio: 'Architectural photographer. High-energy techno enthusiast 🌃📸', avatar: '👑', score: '94%', comp: 'Weekend Status: Techno music Boiler Room & architectural shoots 🌃' },
    { name: 'Ishaan Verma', age: 22, city: 'Mumbai', bio: 'Hiking lover, spontaneous planner, and dog dad 🐾⛰️', avatar: '💎', score: '92%', comp: 'Weekend Status: Offbeat mountain trail hiking & late night driving 🐾' }
];


window._inboxConnections = [];

function generateSidebarMatches(user) {
    let matchedList = [];
    if (user.interest === 'Men') {
        matchedList = maleMatches;
    } else if (user.interest === 'Women') {
        matchedList = femaleMatches;
    } else {
        // Everyone/Fallback: merge
        matchedList = [...femaleMatches.slice(0, 2), maleMatches[0]];
    }

    // Normalize female third card emoji fallback
    matchedList = matchedList.map(m => {
        if (m.avatar === 'rose-symbol') {
            m.avatar = '🌹';
        }
        return m;
    });

    window._inboxConnections = matchedList;

    const listContainer = document.getElementById('sidebar-matches-list-container');
    const countLabel = document.getElementById('sidebar-count-label');
    if (!listContainer) return;

    if (matchedList.length === 0) {
        listContainer.innerHTML = `
            <div class="sidebar-empty-fallback">
                <p>No mutually accepted connections yet. Join circles or apply Vibe Checks in the active feed!</p>
            </div>
        `;
        if (countLabel) countLabel.textContent = "0 Active";
        return;
    }

    if (countLabel) countLabel.textContent = `${matchedList.length} Active`;

    let html = '';
    matchedList.forEach(m => {
        html += `
            <div class="sidebar-match-card" id="sidebar-card-${normalizeName(m.name)}" onclick="selectInboxConnection('${m.name}')">
                <div class="sidebar-card-avatar">${m.avatar}</div>
                <div class="sidebar-card-info">
                    <div class="sidebar-card-top-row">
                        <span class="sidebar-card-name">${m.name}</span>
                        <span class="sidebar-card-score">${m.score} Match</span>
                    </div>
                    <p class="sidebar-card-bio">${m.bio}</p>
                </div>
                <div class="sidebar-card-timer">⏳ 6d</div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// Helper to normalize names for selector strings (e.g. "Ananya Sen" -> "ananya_sen")
function normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// --- URL PARSING AND DYNAMIC COMPATIBILITY LOADING ---
function parseUrlAndLoadConversation() {
    const params = new URLSearchParams(window.location.search);
    const activeMatchName = params.get('match');

    if (!activeMatchName) {
        // Inbox Zero Welcome State
        document.getElementById('chat-empty-welcome-screen').style.display = 'flex';
        document.getElementById('chat-active-panel-frame').style.display = 'none';
        
        // Remove active class states on mobile viewports
        document.getElementById('chat-inbox-dashboard').classList.remove('chat-active');
        return;
    }

    // Look for matching connection
    let targetMatch = window._inboxConnections.find(m => m.name.toLowerCase() === activeMatchName.toLowerCase() || m.name.split(' ')[0].toLowerCase() === activeMatchName.toLowerCase());

    if (!targetMatch) {
        // Dynamically initialize connection for active members feed!
        const activeMembersPreset = {
            "kavya sharma": { name: 'Kavya Sharma', age: 22, city: 'Mumbai', bio: 'Balcony talker, minimalist cafe explorer, and tech-house aux selector ☕🎸', avatar: '💖', score: '98%', comp: 'Weekend Status: Balcony talk, cozy aesthetic cafes, and tech-house aux ☕' },
            "rohan malhotra": { name: 'Rohan Malhotra', age: 24, city: 'Delhi NCR', bio: 'Electronic music enthusiast chasing Fred again.. gig vibes 🎧🎹', avatar: '✨', score: '96%', comp: 'Weekend Status: Late-night Fred again.. concert gigs & cold brew 🎧' },
            "zara chen": { name: 'Zara Chen', age: 23, city: 'Bangalore', bio: 'Vintage film camera enthusiast & thrifted hoodie collector 📷📚', avatar: '👾', score: '94%', comp: 'Weekend Status: Indie bookstores, oversized thrift hoodies, film camera shoots 📷' },
            "siddharth roy": { name: 'Siddharth Roy', age: 25, city: 'Mumbai', bio: 'Building fintech startups, debating South Bombay food superiority 🚀🍕', avatar: '👑', score: '97%', comp: 'Weekend Status: Coding fintech ideas & Marine Drive drives at 2 AM 🚀' },
            "priya patel": { name: 'Priya Patel', age: 21, city: 'Delhi NCR', bio: 'Vintage books, warm amber lighting, and Saket cafe nooks 📖☕', avatar: '🌹', score: '95%', comp: 'Weekend Status: Warm amber lights, quiet Saket nooks, and lattes 📖' },
            "kabir sen": { name: 'Kabir Sen', age: 26, city: 'Bangalore', bio: 'Fast-paced badminton doubles partner, microbrewery hopper 🏸🍻', avatar: '⚡', score: '93%', comp: 'Weekend Status: Fast badminton doubles & microbrewery pints 🏸' },
            "ananya deshmukh": { name: 'Ananya Deshmukh', age: 23, city: 'Mumbai', bio: 'Unapologetic techno AUX DJ & Diljit Dosanjh super-fan 🎸🔊', avatar: '🎧', score: '98%', comp: 'Weekend Status: Techno Boiler Room lounges & AUX DJing sets 🔊' },
            "arjun mehta": { name: 'Arjun Mehta', age: 27, city: 'Bangalore', bio: 'VC analyst, filter coffee brewer, and product scaling 🚀☕', avatar: '💎', score: '95%', comp: 'Weekend Status: Coffee origin filter roasts & system architecture VC talks 🚀' },
            "ishan kapoor": { name: 'Ishan Kapoor', age: 24, city: 'Delhi NCR', bio: 'Mountain trekking, Himachal stargazing, Goa beach cabins ⛰️🏕️', avatar: '🏕️', score: '92%', comp: 'Weekend Status: Himachal mountain stargazing & quiet beach cabins ⛰️' },
            "riya sen": { name: 'Riya Sen', age: 22, city: 'Mumbai', bio: 'Heritage photographer capturing South Bombay, black coffee 📷🏛️', avatar: '🌟', score: '96%', comp: 'Weekend Status: Fort heritage architecture photography & black lattes 📷' }
        };

        const matchedKey = Object.keys(activeMembersPreset).find(key => key.includes(activeMatchName.toLowerCase()) || activeMatchName.toLowerCase().includes(key));
        if (matchedKey) {
            const memberObj = activeMembersPreset[matchedKey];
            // Push to matches list so it appears in the sidebar and loads correctly!
            window._inboxConnections.unshift(memberObj);
            
            // Re-render sidebar matches dynamically
            const listContainer = document.getElementById('sidebar-matches-list-container');
            const countLabel = document.getElementById('sidebar-count-label');
            if (listContainer) {
                if (countLabel) countLabel.textContent = `${window._inboxConnections.length} Active`;
                let html = '';
                window._inboxConnections.forEach(m => {
                    html += `
                        <div class="sidebar-match-card" id="sidebar-card-${normalizeName(m.name)}" onclick="selectInboxConnection('${m.name}')">
                            <div class="sidebar-card-avatar">${m.avatar}</div>
                            <div class="sidebar-card-info">
                                <div class="sidebar-card-top-row">
                                    <span class="sidebar-card-name">${m.name}</span>
                                    <span class="sidebar-card-score">${m.score} Match</span>
                                </div>
                                <p class="sidebar-card-bio">${m.bio}</p>
                            </div>
                            <div class="sidebar-card-timer">⏳ 6d</div>
                        </div>
                    `;
                });
                listContainer.innerHTML = html;
            }
            targetMatch = memberObj;
        }
    }

    if (!targetMatch) {
        // Unknown param, default back to Inbox welcome
        document.getElementById('chat-empty-welcome-screen').style.display = 'flex';
        document.getElementById('chat-active-panel-frame').style.display = 'none';
        document.getElementById('chat-inbox-dashboard').classList.remove('chat-active');
        return;
    }


    // Load connection frame!
    loadChatViewport(targetMatch);
}

// Toggle mobile columns (true = shows sidebar list, false = shows active chat viewport)
function toggleMobileSidebar(showSidebar) {
    const dashboard = document.getElementById('chat-inbox-dashboard');
    if (!dashboard) return;
    
    if (showSidebar) {
        dashboard.classList.remove('chat-active');
        // Clear params to prevent visual mismatch
        history.pushState(null, '', 'chat.html');
    } else {
        dashboard.classList.add('chat-active');
    }
}

// Change active thread via Sidebar click
function selectInboxConnection(name) {
    // Update URL parameter dynamically without refreshing page
    history.pushState(null, '', `chat.html?match=${encodeURIComponent(name)}`);
    parseUrlAndLoadConversation();
    
    // Switch column display active state on mobile viewports
    toggleMobileSidebar(false);
}

// --- RENDER DYNAMIC VIEWPORT THREAD PANEL ---
function loadChatViewport(match) {
    window._activeChatUser = match;
    window._userChatSuccessiveCount = 0;
    window._matchChatSteps = 0;
    
    // Toggles container frames
    document.getElementById('chat-empty-welcome-screen').style.display = 'none';
    document.getElementById('chat-active-panel-frame').style.display = 'flex';
    document.getElementById('chat-inbox-dashboard').classList.add('chat-active');

    // Highlight sidebar card
    document.querySelectorAll('.sidebar-match-card').forEach(el => el.classList.remove('active-match'));
    const card = document.getElementById(`sidebar-card-${normalizeName(match.name)}`);
    if (card) card.classList.add('active-match');

    // Headers binding
    document.getElementById('chat-header-name').textContent = match.name;
    document.getElementById('chat-header-meta').textContent = `${match.age} • ${match.city} • ${match.score} Vibe Match`;
    document.getElementById('chat-header-avatar').textContent = match.avatar;
    
    // Play triggers rename
    const playBtn = document.getElementById('btn-play-voice');
    if (playBtn) {
        playBtn.innerHTML = `<i data-lucide="play" class="mr-1 inline-block" style="width:12px; height:12px; vertical-align: middle;"></i> Play ${match.name.split(' ')[0]}'s Intro`;
        playBtn.className = "btn btn-outline btn-sm font-semibold text-xs";
        playBtn.setAttribute('onclick', 'simulatePlayVoiceIntro()');
    }
    
    const recBtn = document.getElementById('btn-record-voice');
    if (recBtn) {
        recBtn.innerHTML = `<i data-lucide="radio" class="mr-1 inline-block" style="width:12px; height:12px; vertical-align: middle;"></i> Record My Intro`;
        recBtn.className = "btn btn-outline btn-sm font-semibold text-xs text-cyan";
        recBtn.setAttribute('onclick', 'simulateRecordVoice()');
    }

    // Set Compatibility Banners (Replaces static shared vibe with user's weekend status if present)
    const activeUserData = localStorage.getItem('instadate_user');
    let weekendStatusText = '';
    if (activeUserData) {
        try {
            const userObj = JSON.parse(activeUserData);
            if (userObj && userObj.weekendStatus) {
                weekendStatusText = `Looking for this weekend: "${userObj.weekendStatus}"`;
            }
        } catch (e) {
            console.error("Error loading user weekend status:", e);
        }
    }

    const displayBannerText = weekendStatusText || match.comp;

    document.getElementById('chat-compatibility-banner-text').innerHTML = `
        <i data-lucide="sparkles" class="text-pink animate-pulse" style="width:14px; height:14px; flex-shrink: 0; display:inline-block; vertical-align: middle;"></i>
        <span>${displayBannerText}</span>
    `;

    // Load Chat History from Local Storage
    const cacheKey = `instadate_chat_history_${normalizeName(match.name)}`;
    const historyData = localStorage.getItem(cacheKey);

    const messagesContainer = document.getElementById('chat-messages-container');
    if (messagesContainer) messagesContainer.innerHTML = '';

    const locker = document.getElementById('voice-intro-locker');
    const aiPrompts = document.getElementById('chat-ai-prompts-container');
    const intentBtns = document.getElementById('chat-intent-buttons');
    const inputArea = document.getElementById('chat-input-area-box');
    const popup = document.getElementById('date-ready-popup');

    if (historyData) {
        // Found cached conversation. Render and unlock text inputs automatically
        window._voiceIntroUnlocked = true;
        locker.style.display = 'none';
        aiPrompts.style.display = 'block';
        intentBtns.style.display = 'flex';
        inputArea.style.display = 'block';
        popup.style.display = 'none';

        const history = JSON.parse(historyData);
        window._matchChatSteps = history.length;
        
        history.forEach(msg => {
            appendChatBubble(msg.sender, msg.text, msg.isSystem);
        });
    } else {
        // Pre-seeded voice-locked connection
        window._voiceIntroUnlocked = false;
        locker.style.display = 'block';
        aiPrompts.style.display = 'none';
        intentBtns.style.display = 'none';
        inputArea.style.display = 'none';
        popup.style.display = 'none';
        
        // Reset sidebar card timer indicators
        const timerLabel = document.getElementById('chat-header-timer-value');
        if (timerLabel) {
            timerLabel.textContent = '⏳ 6d 23h';
            timerLabel.style.color = 'var(--primary-pink)';
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- VOICE INTRO WALL UNLOCK SIMULATION ---
function simulatePlayVoiceIntro() {
    const wave = document.getElementById('voice-wave-container');
    const btnPlay = document.getElementById('btn-play-voice');
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    if (!wave || !btnPlay) return;
    
    wave.classList.add('active');
    btnPlay.innerHTML = `<i data-lucide="volume-2" class="mr-1 inline-block animate-pulse" style="width:12px; height:12px; vertical-align: middle;"></i> Playing...`;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
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
    
    // Request actual microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // Permission granted! Stop the stream tracks immediately since we only need authorization, not recording
                stream.getTracks().forEach(track => track.stop());
                
                // Proceed with the simulation
                startRecordingSimulation(wave, btnRec);
            })
            .catch(function(err) {
                console.error("Microphone access denied:", err);
                alert("Microphone access is required to record your voice intro and unlock the text chat!");
            });
    } else {
        // Fallback for older browsers or non-secure contexts
        alert("Your browser does not support standard microphone recording APIs. Proceeding with simulation.");
        startRecordingSimulation(wave, btnRec);
    }
}

function startRecordingSimulation(wave, btnRec) {
    wave.classList.add('active');
    btnRec.innerHTML = `<i data-lucide="circle-dot" class="mr-1 inline-block animate-ping text-pink" style="width:12px; height:12px; vertical-align: middle;"></i> Recording...`;
    btnRec.disabled = true;
    btnRec.style.pointerEvents = 'none';
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    setTimeout(() => {
        wave.classList.remove('active');
        btnRec.innerHTML = `<i data-lucide="check-circle" class="mr-1 inline-block text-cyan" style="width:12px; height:12px; vertical-align: middle;"></i> Voice Intro Saved`;
        btnRec.className = "btn btn-outline btn-sm font-semibold text-xs disabled";
        btnRec.setAttribute('onclick', 'event.preventDefault();');
        btnRec.disabled = true;
        btnRec.style.pointerEvents = 'none';
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
        unlockChatInputAfterVoiceCheck();
    }, 2500);
}

function unlockChatInputAfterVoiceCheck() {
    if (window._voiceIntroUnlocked) return;
    window._voiceIntroUnlocked = true;
    
    const name = window._activeChatUser ? window._activeChatUser.name.split(' ')[0] : 'Partner';
    
    setTimeout(() => {
        document.getElementById('voice-intro-locker').style.display = 'none';
        document.getElementById('chat-ai-prompts-container').style.display = 'block';
        document.getElementById('chat-intent-buttons').style.display = 'flex';
        document.getElementById('chat-input-area-box').style.display = 'block';
        
        // Populate initial incoming match text bubble & save history
        const greetText = `Hey! So glad we mutually accepted! Your compatibility score index is awesome. Btw, which spontaneous prompt caught your eye? Perfect Sunday or coffee drives? 🚗☕`;
        
        appendChatBubble('incoming', greetText);
        saveMessageToHistory('incoming', greetText);
        
        showVibeCheckToast('Voice Connection Verified! Text chat unlocked. 🔓');
    }, 400);
}

// --- RENDER BUBBLE HELPER ---
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
        // Retrieve current logged-in user avatar dynamically from localStorage
        let outgoingAvatar = '👤';
        const userData = localStorage.getItem('instadate_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.customPfp) {
                    outgoingAvatar = `<img src="${user.customPfp}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                } else {
                    const avatarPresets = {
                        'neon-cupid': '💘',
                        'mystic-dreamer': '✨',
                        'cyber-flirt': '👾',
                        'golden-glow': '👑',
                        'ruby-seduction': '🌹',
                        'silver-spark': '💎'
                    };
                    outgoingAvatar = avatarPresets[user.avatar] || '👤';
                }
            } catch (err) {
                console.error("Error parsing user data for chat avatar:", err);
            }
        }

        html = `
            <div class="chat-msg-bubble msg-outgoing">
                <div class="msg-avatar">${outgoingAvatar}</div>
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

// --- SAVE MESSAGE TO PERSISTENT STATE ---
function saveMessageToHistory(sender, text, isSystem = false) {
    if (!window._activeChatUser) return;
    
    const cacheKey = `instadate_chat_history_${normalizeName(window._activeChatUser.name)}`;
    const historyData = localStorage.getItem(cacheKey);
    
    let history = [];
    if (historyData) {
        history = JSON.parse(historyData);
    }
    
    history.push({ sender, text, isSystem });
    localStorage.setItem(cacheKey, JSON.stringify(history));
}

// AI Pill filler
function prefillAiPrompt(text) {
    const input = document.getElementById('chat-message-input');
    if (input) {
        input.value = text;
        input.focus();
    }
}

// --- CHAT SUBMIT SUBMISSION ---
function handleChatSubmit(event) {
    event.preventDefault();
    
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    // Anti-boring openers filter
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

    // Append and save outgoing text bubble
    appendChatBubble('outgoing', text);
    saveMessageToHistory('outgoing', text);
    
    input.value = '';
    
    window._userChatSuccessiveCount++;
    window._matchChatSteps++;
    
    // Slow Mode checking
    if (window._userChatSuccessiveCount >= 5) {
        lockSlowModeInput(true);
    }

    // Simulated Typing responses
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
    
    const replies = [
        `Spontaneous road trips represent my absolute perfect Sunday! Bandra routes at midnight are so therapeutic. What about your perfect Sunday? 🌌🚗`,
        `Hahaha, that spontaneous act sounds incredibly fun! Spontaneity keeps Gen Z dating active. Btw, what makes you a high-value club partner? 🌹✨`,
        `Bespoke cafes in Mumbai are beautiful! Coffee walks are definitely the perfect low-pressure icebreaker date idea. Let's make one happen! ☕🌸`,
        `Absolutely! Serious relationship intentions are so hard to find. Ambient dreamers who value active listening represent pure vibe chemistry! 🕯️💫`,
        `Hahaha, totally love dogs too! Spontaneous coffee drives represent 100% mutual vibe matches! 🐾☕`
    ];
    
    const index = Math.min(window._matchChatSteps - 1, replies.length - 1);
    const replyText = replies[index] || "That sounds so authentic and fun! Glad we share such matching vibe indexes. Let's coordinate our coffee date? ☕✨";
    
    setTimeout(() => {
        // Clear slow mode
        lockSlowModeInput(false);
        
        // Append incoming match response bubble & save
        appendChatBubble('incoming', replyText);
        saveMessageToHistory('incoming', replyText);
        
        // Trigger Date confirmation popup after 3 rounds
        if (window._matchChatSteps === 3) {
            setTimeout(() => {
                document.getElementById('date-ready-popup').style.display = 'block';
                const container = document.getElementById('chat-messages-container');
                if (container) container.scrollTop = container.scrollHeight;
            }, 1000);
        }
    }, 1800);
}

// --- DATE INTENTS ACTION SHORCUTS ---
function triggerIntentAction(actionKey) {
    if (!window._activeChatUser) return;
    const name = window._activeChatUser.name.split(' ')[0];
    
    if (actionKey === 'plan') {
        appendChatBubble('system', `Plan Date request sent! Coordinating mutual chemistry...`, true);
        saveMessageToHistory('system', `Plan Date request sent! Coordinating mutual chemistry...`, true);
        
        setTimeout(() => {
            document.getElementById('date-ready-popup').style.display = 'block';
            const container = document.getElementById('chat-messages-container');
            if (container) container.scrollTop = container.scrollHeight;
        }, 600);
    } else if (actionKey === 'insta') {
        const handle = `@${window._activeChatUser.name.toLowerCase().replace(' ', '_')}`;
        const sysMsg = `📸 Instagram Exchanged! ${name}'s handle is ${handle}. Your handle shared mutually!`;
        
        appendChatBubble('system', sysMsg, true);
        saveMessageToHistory('system', sysMsg, true);
        showVibeCheckToast('Instagram handles mutually shared! 📸');
    } else if (actionKey === 'later') {
        const sysMsg = `⏳ Conversation paused. Limited chat window extended by 7 days.`;
        appendChatBubble('system', sysMsg, true);
        saveMessageToHistory('system', sysMsg, true);
        
        const timerLabel = document.getElementById('chat-header-timer-value');
        if (timerLabel) {
            timerLabel.textContent = '⏳ 13d 23h';
            timerLabel.style.color = 'var(--primary-cyan)';
        }
        showVibeCheckToast('Conversation Window Extended! ⏳');
    } else if (actionKey === 'not') {
        const sysMsg = `💔 Conversation closed. Match successfully archived.`;
        appendChatBubble('system', sysMsg, true);
        saveMessageToHistory('system', sysMsg, true);
        
        setTimeout(() => {
            history.pushState(null, '', 'chat.html');
            parseUrlAndLoadConversation();
            showVibeCheckToast('Match archived successfully.');
        }, 1200);
    }
}

// --- DATE POPUP READY SYSTEM CONFIRMS ---
function confirmDateReady(choice) {
    const popup = document.getElementById('date-ready-popup');
    if (popup) popup.style.display = 'none';
    
    if (!window._activeChatUser) return;
    const name = window._activeChatUser.name.split(' ')[0];
    
    if (choice === 'yes') {
        const sysMsg = `🎉 MATCH CONFIRMED READY! Instadate Curation coordination unlocked. Our Curation board Concierge will WhatsApp coordinate your Sunday Coffee Date Mixer at Bandra shortly. Check your dashboard!`;
        
        appendChatBubble('system', sysMsg, true);
        saveMessageToHistory('system', sysMsg, true);
        
        const waText = `Hey Instadate Curation Concierge! 👋 Both ${name} and I have mutually pressed *Ready to Meet* in our chat! Please coordinate our Sunday Bandra Coffee Date shortly! ☕✨`;
        const waBaseUrl = "https://wa.me/919999999999";
        const waUrl = `${waBaseUrl}?text=${encodeURIComponent(waText)}`;
        
        setTimeout(() => {
            const partnerText = `Oh my gosh, YES! I just pressed 'let's meet' too! Can't wait for our Sunday Bandra coffee mixer! Let's fast-track it here! 👇`;
            appendChatBubble('incoming', partnerText);
            saveMessageToHistory('incoming', partnerText);
            
            // Render direct WhatsApp Button bubble
            const container = document.getElementById('chat-messages-container');
            if (container) {
                const btnHtml = `
                    <div style="align-self: center; margin-top: 10px; width: 90%; animation: slideInFade 0.4s ease;">
                        <a href="${waUrl}" target="_blank" class="btn btn-whatsapp w-full btn-sm btn-glow font-bold text-xs" style="padding: 10px 14px; text-decoration:none; display:block; text-align:center;">
                            <i class="wa-whatsapp-icon" style="margin-right:4px;"></i> Fast-Track Date Concierge WhatsApp
                        </a>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', btnHtml);
                container.scrollTop = container.scrollHeight;
                
                // Save WhatsApp bubble mock flag to localStorage thread list
                saveMessageToHistory('system_wa', waUrl);
            }
        }, 1200);
        
        showVibeCheckToast('Sunday Bandra Coffee date coordinated successfully! 🎉☕');
    } else {
        const sysMsg = `⏳ Date request paused. Spend more time getting to know each other. Expiry date extended by 3 days.`;
        appendChatBubble('system', sysMsg, true);
        saveMessageToHistory('system', sysMsg, true);
        
        const timerLabel = document.getElementById('chat-header-timer-value');
        if (timerLabel) {
            timerLabel.textContent = '⏳ 9d 23h';
            timerLabel.style.color = 'var(--primary-cyan)';
        }
    }
}

// --- SIDEBAR KEYBOARD CONNECTIONS SEARCH FILTER ---
function filterSidebarMatches() {
    const input = document.getElementById('connections-search-input');
    if (!input) return;
    const value = input.value.toLowerCase().trim();
    
    document.querySelectorAll('.sidebar-match-card').forEach(card => {
        const name = card.querySelector('.sidebar-card-name').textContent.toLowerCase();
        const bio = card.querySelector('.sidebar-card-bio').textContent.toLowerCase();
        
        if (name.includes(value) || bio.includes(value)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- MICRO TOAST ALERTS ---
function showVibeCheckToast(message) {
    const toast = document.getElementById('vibe-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================================================
// BACKGROUND CANVAS PARTICLES sparklers
// ==========================================================================
function initParticlesCanvas() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particlesArray = [];
    const maxParticles = window.innerWidth < 768 ? 20 : 40;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.8 - 0.4;
            this.speedY = -(Math.random() * 0.6 + 0.3);
            this.opacity = Math.random() * 0.5 + 0.15;
            this.isHeart = Math.random() < 0.25;
            this.colorType = Math.random();
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.y < -20) {
                this.y = canvas.height + 20;
                this.x = Math.random() * canvas.width;
                this.speedY = -(Math.random() * 0.6 + 0.3);
                this.opacity = Math.random() * 0.5 + 0.15;
            }
            this.speedX += Math.sin(this.y * 0.01) * 0.01;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            let color = '#FF2E93';
            if (this.colorType > 0.35 && this.colorType <= 0.7) {
                color = '#9B30FF';
            } else if (this.colorType > 0.7) {
                color = '#00F5FF';
            }
            
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            
            if (this.isHeart) {
                drawHeart(ctx, this.x, this.y, this.size * 2);
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    
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
    
    function init() {
        particlesArray = [];
        for (let i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    init();
    
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

// ==========================================================================
// MOUSE SPARK TRAILS Visualizer
// ==========================================================================
function initCustomCursorTrail() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    
    if (window.innerWidth > 768) {
        document.body.style.cursor = 'none';
    } else {
        return;
    }
    
    let mouse = { x: -100, y: -100 };
    let pos = { x: -100, y: -100 };
    const lerpFactor = 0.22;
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if (Math.random() > 0.4) {
            spawnSpark(e.clientX, e.clientY);
        }
    });
    
    function renderCursor() {
        pos.x += (mouse.x - pos.x) * lerpFactor;
        pos.y += (mouse.y - pos.y) * lerpFactor;
        
        cursor.style.left = `${pos.x}px`;
        cursor.style.top = `${pos.y}px`;
        
        requestAnimationFrame(renderCursor);
    }
    renderCursor();
    
    const interactives = document.querySelectorAll('a, button, .sidebar-match-card, .ai-prompt-pill, .chat-intent-pill');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
    
    function spawnSpark(x, y) {
        const spark = document.createElement('div');
        spark.classList.add('cursor-particle');
        
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

// ==========================================================================
// CHAT PARTNER PROFILE MODAL CONTROLLER
// ==========================================================================
function openPartnerProfileModal() {
    const match = window._activeChatUser;
    if (!match) return;

    // Populate modal elements
    const avatarEl = document.getElementById('partner-modal-avatar');
    const nameEl = document.getElementById('partner-modal-name');
    const locationEl = document.getElementById('partner-modal-location');
    const vibeEl = document.getElementById('partner-modal-vibe');
    const bioEl = document.getElementById('partner-modal-bio');
    const compEl = document.getElementById('partner-modal-comp');
    const scoreEl = document.getElementById('partner-modal-score');

    if (avatarEl) avatarEl.textContent = match.avatar || '👤';
    if (nameEl) nameEl.textContent = `${match.name}, ${match.age}`;
    if (locationEl) {
        locationEl.innerHTML = `<i data-lucide="map-pin" class="text-pink inline-block mr-1" style="width: 14px; height: 14px; vertical-align: middle;"></i> Bandra West, ${match.city}`;
    }
    
    if (vibeEl) {
        let vibeName = 'Cafe Partner Vibe';
        let iconName = 'coffee';
        if (match.bio.toLowerCase().includes('musician') || match.bio.toLowerCase().includes('techno')) {
            vibeName = 'Concert Circle Vibe';
            iconName = 'music';
        } else if (match.bio.toLowerCase().includes('road-tripper') || match.bio.toLowerCase().includes('hiking')) {
            vibeName = 'Travel Circle Vibe';
            iconName = 'compass';
        } else if (match.bio.toLowerCase().includes('photographer') || match.bio.toLowerCase().includes('designer')) {
            vibeName = 'Creative Vibe';
            iconName = 'palette';
        }
        vibeEl.innerHTML = `<i data-lucide="${iconName}" class="mr-1 inline-block" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${vibeName}`;
    }
    
    if (bioEl) bioEl.textContent = match.bio;
    if (compEl) compEl.textContent = match.comp;
    if (scoreEl) scoreEl.textContent = `${match.score} Match`;

    // Initialize Lucide icons inside modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Open Modal
    const modal = document.getElementById('partner-profile-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Allow rendering display flex before applying active transition class
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

function closePartnerProfileModal() {
    const modal = document.getElementById('partner-profile-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400); // Wait for transition duration
    }
}

function closePartnerProfileModalOnOverlay(event) {
    if (event.target === document.getElementById('partner-profile-modal')) {
        closePartnerProfileModal();
    }
}
