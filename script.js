const ServiceFinder = (() => {
    const API_URL = '/api';

    // State Management
    const state = {
        currentUser: JSON.parse(localStorage.getItem('sfUser')) || null,
        allRequests: [],
        providers: []
    };

    // DOM Elements
    const elements = {
        navbar: document.querySelector('.navbar'),
        hamburger: document.getElementById('hamburger'),
        navMenu: document.getElementById('navMenu'),
        navLinks: document.querySelectorAll('.nav-link'),
        scrollTopBtn: document.getElementById('scrollTop'),
        categorySearch: document.getElementById('categorySearch'),
        categoryCards: document.querySelectorAll('.category-card'),
        taskModal: document.getElementById('taskModal'),
        openModalBtn: document.querySelector('.btn-post-task'),
        closeModalBtn: document.getElementById('closeModal'),
        modalOverlay: document.getElementById('modalOverlay'),
        taskForm: document.getElementById('taskForm'),

        // New Auth & Dashboard Elements
        userIcon: document.getElementById('userIcon'),
        userNameDisplay: document.getElementById('userNameDisplay'),
        logoutBtn: document.getElementById('logoutBtn'),
        authModal: document.getElementById('authModal'),
        closeAuthModal: document.getElementById('closeAuthModal'),
        authTabs: document.querySelectorAll('.auth-tab'),
        authForms: document.querySelectorAll('.auth-form'),
        userLoginForm: document.getElementById('userLoginForm'),
        userSignupForm: document.getElementById('userSignupForm'),
        providerLoginForm: document.getElementById('providerLoginForm'),
        showSignup: document.getElementById('showSignup'),
        showLogin: document.getElementById('showLogin'),
        dashboardModal: document.getElementById('dashboardModal'),
        closeDashboardModal: document.getElementById('closeDashboardModal'),
        requestList: document.getElementById('requestList'),
        dashboardTitle: document.getElementById('dashboardTitle'),
        dashboardStats: document.getElementById('dashboardStats'),
        providerDetailModal: document.getElementById('providerDetailModal'),
        closeDetailModal: document.getElementById('closeDetailModal'),
        providerDetailCard: document.getElementById('providerDetailCard')
    };

    // --- INITIALIZATION ---
    const init = async () => {
        // Redirection for providers already logged in
        if (state.currentUser && state.currentUser.role === 'provider') {
            window.location.href = 'provider.html';
            return;
        }

        setupEventListeners();
        setupIntersectionObserver();
        handlePageLoad();
        updateUIState();
        await fetchProviders();
    };

    // --- API CALLS ---
    const fetchProviders = async () => {
        try {
            const res = await fetch(`${API_URL}/providers`);
            state.providers = await res.json();
            console.log('Providers loaded from DB');
        } catch (err) {
            console.error('Failed to load providers:', err);
        }
    };

    const fetchRequests = async () => {
        if (!state.currentUser) return;
        try {
            const res = await fetch(`${API_URL}/requests?role=${state.currentUser.role}&name=${state.currentUser.name}`);
            state.allRequests = await res.json();
            renderRequests();
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    };

    // --- EVENT LISTENERS ---
    const setupEventListeners = () => {
        // ... (existing listeners preserved)
        elements.hamburger?.addEventListener('click', toggleMobileMenu);
        elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                elements.hamburger?.classList.remove('active');
                elements.navMenu?.classList.remove('active');
            });
        });
        window.addEventListener('scroll', handleScrollEvents);
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', handleSmoothScroll);
        });
        elements.categorySearch?.addEventListener('input', filterCategories);
        elements.openModalBtn?.addEventListener('click', openModal);
        elements.closeModalBtn?.addEventListener('click', closeModal);
        elements.modalOverlay?.addEventListener('click', closeModal);
        elements.taskForm?.addEventListener('submit', handleTaskSubmission);
        document.addEventListener('keydown', handleGlobalKeydown);
        window.addEventListener('resize', handleResize);

        // --- New Listeners ---
        elements.userIcon?.addEventListener('click', handleUserIconClick);
        elements.closeAuthModal?.addEventListener('click', () => closeAnyModal(elements.authModal));
        elements.closeDashboardModal?.addEventListener('click', () => closeAnyModal(elements.dashboardModal));
        elements.closeDetailModal?.addEventListener('click', () => closeAnyModal(elements.providerDetailModal));

        // Auth Tab Switching
        elements.authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                elements.authTabs.forEach(t => t.classList.toggle('active', t === tab));
                elements.authForms.forEach(f => f.classList.toggle('active', f.id === `${target}LoginForm`));
                // Ensure signup is hidden when switching tabs
                if (elements.userSignupForm) elements.userSignupForm.classList.remove('active');
            });
        });

        // Toggle between Login and Signup for User
        elements.showSignup?.addEventListener('click', (e) => {
            e.preventDefault();
            elements.userLoginForm.classList.remove('active');
            elements.userSignupForm.classList.add('active');
        });

        elements.showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            elements.userSignupForm.classList.remove('active');
            elements.userLoginForm.classList.add('active');
        });

        // Login Submissions
        elements.userLoginForm?.addEventListener('submit', (e) => handleLogin(e, 'user'));
        elements.userSignupForm?.addEventListener('submit', (e) => handleSignup(e));
        elements.providerLoginForm?.addEventListener('submit', (e) => handleLogin(e, 'provider'));

        // Logout
        elements.logoutBtn?.addEventListener('click', handleLogout);
    };

    // --- LOGIN & SIGNUP Logic ---
    const handleSignup = async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CREATING ACCOUNT...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (res.ok) {
                state.currentUser = { name: data.name, role: 'user' };
                localStorage.setItem('sfUser', JSON.stringify(state.currentUser));
                updateUIState();
                closeAnyModal(elements.authModal);
            } else {
                alert(data.error || 'Signup failed');
            }
        } catch (err) {
            console.error('Signup error:', err);
            alert('Server error. Is the backend running?');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    const handleUserIconClick = () => {
        if (state.currentUser) {
            openDashboard();
        } else {
            openAnyModal(elements.authModal);
        }
    };

    const handleLogin = async (e, role) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AUTHENTICATING...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (res.ok) {
                const user = await res.json();
                state.currentUser = user;
                localStorage.setItem('sfUser', JSON.stringify(user));

                if (user.role === 'provider') {
                    window.location.href = 'provider.html';
                } else {
                    updateUIState();
                    closeAnyModal(elements.authModal);
                }
            } else {
                alert('Invalid credentials');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('Server error. Is the backend running?');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    const updateUIState = () => {
        if (state.currentUser) {
            elements.userNameDisplay.textContent = state.currentUser.name;
            elements.userNameDisplay.style.color = 'var(--primary)';
            if (elements.logoutBtn) elements.logoutBtn.style.display = 'block';
        } else {
            elements.userNameDisplay.textContent = 'Login';
            elements.userNameDisplay.style.color = '';
            if (elements.logoutBtn) elements.logoutBtn.style.display = 'none';
        }
    };

    const handleLogout = (e) => {
        e.stopPropagation(); // Prevent triggering userIcon click
        state.currentUser = null;
        localStorage.removeItem('sfUser');
        updateUIState();
        console.log('User logged out');
    };

    const openAnyModal = (modal) => {
        modal?.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeAnyModal = (modal) => {
        modal?.classList.remove('active');
        if (!document.querySelector('.modal.active')) {
            document.body.style.overflow = 'auto';
        }
    };

    // --- DASHBOARD LOGIC ---
    const openDashboard = async () => {
        const isProvider = state.currentUser.role === 'provider';
        elements.dashboardTitle.textContent = isProvider ? 'Provider Dashboard' : 'My Service Requests';
        await fetchRequests();
        openAnyModal(elements.dashboardModal);
    };

    const renderRequests = () => {
        const isProvider = state.currentUser.role === 'provider';
        const filtered = state.allRequests;

        // Render Stats
        elements.dashboardStats.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${filtered.length}</span>
                <span class="stat-label">Total Jobs</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${filtered.filter(r => r.status === 'confirmed').length}</span>
                <span class="stat-label">Confirmed</span>
            </div>
        `;

        if (filtered.length === 0) {
            elements.requestList.innerHTML = '<div class="empty-state"><p>No requests found matching your profile.</p></div>';
            return;
        }

        elements.requestList.innerHTML = filtered.map(req => `
            <div class="request-card">
                <div class="request-info">
                    <h4>${req.title}</h4>
                    <p><i class="fa-regular fa-calendar"></i> ${req.date} | Budget: $${req.budget}</p>
                    <span class="request-status status-${req.status}">${req.status.toUpperCase()}</span>
                </div>
                <div class="request-actions">
                    ${isProvider && req.status === 'pending' ? `
                        <button class="btn-small btn-confirm" onclick="ServiceFinder.confirmBooking(${req.id})">CONFIRM BOOKING</button>
                    ` : ''}
                    ${!isProvider && req.status === 'confirmed' ? `
                        <button class="btn-small btn-details" onclick="ServiceFinder.viewProviderDetails('${req.provider_name}')">WHO IS COMING?</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    };

    const confirmBooking = async (id) => {
        try {
            const res = await fetch(`${API_URL}/requests/${id}/confirm`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider_name: state.currentUser.name })
            });

            if (res.ok) {
                await fetchRequests();
            }
        } catch (err) {
            console.error('Confirm error:', err);
        }
    };

    const viewProviderDetails = (providerName) => {
        const pro = state.providers.find(p => p.name === providerName) || state.providers[0]; // Fallback to first if not found
        elements.providerDetailCard.innerHTML = `
            <img src="${pro.img}" alt="${pro.name}" class="provider-img">
            <div class="detail-info">
                <h4>${pro.name}</h4>
                <p>Expert ${pro.specialty} coming to your location.</p>
                <div class="detail-meta">
                    <span class="detail-badge"><i class="fa-solid fa-star"></i> ${pro.rating}</span>
                    <span class="detail-badge"><i class="fa-solid fa-check"></i> ${pro.jobs}+ Jobs</span>
                </div>
            </div>
        `;
        openAnyModal(elements.providerDetailModal);
    };

    // --- NAVIGATION & MODAL LOGIC (Originals preserved/adapted) ---
    const toggleMobileMenu = () => {
        elements.hamburger?.classList.toggle('active');
        elements.navMenu?.classList.toggle('active');
    };

    const handleScrollEvents = () => {
        const scrolled = window.pageYOffset;
        if (scrolled > 50) elements.navbar?.classList.add('shrunk');
        else elements.navbar?.classList.remove('shrunk');

        if (scrolled > 500) elements.scrollTopBtn?.classList.add('visible');
        else elements.scrollTopBtn?.classList.remove('visible');
    };

    const handleSmoothScroll = function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const filterCategories = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        elements.categoryCards.forEach(card => {
            const categoryName = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const isMatch = categoryName.includes(searchTerm);
            card.style.display = isMatch ? 'block' : 'none';
        });
    };

    const openModal = () => openAnyModal(elements.taskModal);
    const closeModal = () => closeAnyModal(elements.taskModal);

    const handleTaskSubmission = async (e) => {
        e.preventDefault();
        if (!state.currentUser || state.currentUser.role !== 'user') {
            alert('Please login as a User to post tasks.');
            closeModal();
            openAnyModal(elements.authModal);
            return;
        }

        const newReq = {
            title: document.getElementById('taskTitle').value,
            category: 'Miscellaneous',
            date: document.getElementById('taskDate').value,
            budget: document.getElementById('taskBudget').value,
            status: 'pending',
            user_name: state.currentUser.name
        };

        const submitBtn = elements.taskForm.querySelector('.btn-submit-task');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> SUBMITTING...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReq)
            });

            if (res.ok) {
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> REQUEST SENT!';
                submitBtn.style.backgroundColor = '#10b981';

                setTimeout(async () => {
                    closeModal();
                    elements.taskForm.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.backgroundColor = '';
                    await openDashboard(); // Show them their request
                }, 1000);
            } else {
                alert('Failed to submit task.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to submit task. Is the backend running?');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    };

    const handleGlobalKeydown = (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(closeAnyModal);
            elements.hamburger?.classList.remove('active');
            elements.navMenu?.classList.remove('active');
        }
    };

    const handleResize = () => {
        if (window.innerWidth > 992) {
            elements.hamburger?.classList.remove('active');
            elements.navMenu?.classList.remove('active');
        }
    };

    const showCategoryDetails = (title, details) => {
        const modalTitle = elements.taskModal.querySelector('.modal-header h2');
        const modalPara = elements.taskModal.querySelector('.modal-header p');
        const taskTitleInput = document.getElementById('taskTitle');

        modalTitle.textContent = title;
        modalPara.textContent = details;

        // Auto-fill the task title with the selected category
        if (taskTitleInput) {
            taskTitleInput.value = title;
        }

        openModal();
    };

    // --- ANIMATIONS & UTILS ---
    const setupIntersectionObserver = () => {
        const options = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-active');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        const revealElements = document.querySelectorAll('.category-card, .step, .footer-column, .hero-content');
        revealElements.forEach(el => {
            el.classList.add('reveal-hidden');
            observer.observe(el);
        });
    };

    const handlePageLoad = () => {
        document.body.classList.add('loaded');
        handleScrollEvents();
    };


    return {
        init,
        showCategoryDetails,
        confirmBooking,
        viewProviderDetails
    };
})();

document.addEventListener('DOMContentLoaded', ServiceFinder.init);
