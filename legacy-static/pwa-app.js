(function () {
    const routes = [
        { href: 'index.html', label: 'Home', icon: 'home', match: ['/', '/index.html'] },
        { href: 'active-users.html', label: 'Members', icon: 'users', match: ['/active-users.html'] },
        { href: 'chat.html', label: 'Inbox', icon: 'message-circle', match: ['/chat.html'] },
        { href: 'events.html', label: 'Events', icon: 'calendar', match: ['/events.html'] }
    ];

    const appStateKey = 'instadate_app_state';
    let deferredInstallPrompt = null;

    function getCurrentRoute() {
        const path = window.location.pathname.replace(/\\/g, '/');
        const normalized = path.endsWith('/') ? '/' : `/${path.split('/').pop()}`;
        return routes.find(route => route.match.includes(normalized)) || routes[0];
    }

    function readState() {
        try {
            return JSON.parse(localStorage.getItem(appStateKey) || '{}');
        } catch (error) {
            return {};
        }
    }

    function writeState(nextState) {
        const state = { ...readState(), ...nextState, updatedAt: new Date().toISOString() };
        localStorage.setItem(appStateKey, JSON.stringify(state));
    }

    function buildBottomNav() {
        if (document.querySelector('.app-bottom-nav')) return;

        const current = getCurrentRoute();
        const nav = document.createElement('nav');
        nav.className = 'app-bottom-nav';
        nav.setAttribute('aria-label', 'Instadate app navigation');

        nav.innerHTML = routes.map(route => {
            const active = route.href === current.href ? 'active' : '';
            return `
                <a class="app-bottom-link ${active}" href="${route.href}" data-app-route="${route.href}">
                    <i data-lucide="${route.icon}"></i>
                    <span>${route.label}</span>
                </a>
            `;
        }).join('');

        document.body.appendChild(nav);
        writeState({ lastRoute: current.href });
    }

    function buildInstallPrompt() {
        if (document.querySelector('.app-install-prompt')) return;

        const prompt = document.createElement('div');
        prompt.className = 'app-install-prompt';
        prompt.setAttribute('hidden', '');
        prompt.innerHTML = `
            <div>
                <strong class="font-outfit">Install Instadate</strong>
                <span>Open faster with a home-screen app.</span>
            </div>
            <button type="button" class="app-install-btn">Install</button>
            <button type="button" class="app-install-close" aria-label="Dismiss install prompt">
                <i data-lucide="x"></i>
            </button>
        `;

        document.body.appendChild(prompt);

        prompt.querySelector('.app-install-close')?.addEventListener('click', () => {
            prompt.setAttribute('hidden', '');
            writeState({ installDismissed: true });
        });

        prompt.querySelector('.app-install-btn')?.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            prompt.setAttribute('hidden', '');
            writeState({ installDismissed: true, installedPromptShown: true });
        });
    }

    function showInstallPrompt() {
        const state = readState();
        const prompt = document.querySelector('.app-install-prompt');
        if (!prompt || state.installDismissed) return;
        prompt.removeAttribute('hidden');
    }

    function watchConnectivity() {
        const toast = document.createElement('div');
        toast.className = 'app-connectivity-toast';
        toast.setAttribute('hidden', '');
        document.body.appendChild(toast);

        const render = () => {
            if (navigator.onLine) {
                toast.textContent = 'Back online. Fresh club data will load normally.';
                toast.classList.remove('offline');
                toast.removeAttribute('hidden');
                setTimeout(() => toast.setAttribute('hidden', ''), 2400);
            } else {
                toast.textContent = 'You are offline. Saved Instadate screens are still available.';
                toast.classList.add('offline');
                toast.removeAttribute('hidden');
            }
        };

        window.addEventListener('online', render);
        window.addEventListener('offline', render);
        if (!navigator.onLine) render();
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        if (!['http:', 'https:'].includes(window.location.protocol)) return;

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(error => {
                console.warn('Instadate service worker registration failed:', error);
            });
        });
    }

    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
        writeState({ installed: true, installDismissed: true });
        document.querySelector('.app-install-prompt')?.setAttribute('hidden', '');
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.classList.add('instadate-web-app');
        buildBottomNav();
        buildInstallPrompt();
        watchConnectivity();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

    registerServiceWorker();
})();
