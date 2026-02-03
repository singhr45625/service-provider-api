const ProviderApp = (() => {
    const API_URL = '/api';
    const state = {
        currentUser: JSON.parse(localStorage.getItem('sfUser')) || null,
        availableJobs: [],
        activeJobs: [],
        profile: null
    };

    const elements = {
        proName: document.getElementById('proNameDisplay'),
        logoutBtn: document.getElementById('logoutBtn'),
        earnings: document.getElementById('earningsCount'),
        jobs: document.getElementById('jobsCount'),
        rating: document.getElementById('ratingCount'),
        availableList: document.getElementById('availableJobsList'),
        activeList: document.getElementById('activeJobsList'),
        availableBadge: document.getElementById('availableBadge')
    };

    const init = async () => {
        if (!state.currentUser || state.currentUser.role !== 'provider') {
            window.location.href = 'index.html';
            return;
        }

        elements.proName.textContent = state.currentUser.name;
        await fetchProfile();
        await fetchJobs();
        setupEventListeners();
    };

    const setupEventListeners = () => {
        elements.logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('sfUser');
            window.location.href = 'index.html';
        });
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/providers`);
            const providers = await res.json();
            const myProfile = providers.find(p => p.name === state.currentUser.name);
            if (myProfile) {
                state.profile = myProfile;
                elements.earnings.textContent = `$${myProfile.jobs * 45}`; // Mock earnings
                elements.jobs.textContent = myProfile.jobs;
                elements.rating.textContent = myProfile.rating;
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await fetch(`${API_URL}/requests?role=provider&name=${state.currentUser.name}`);
            const allJobs = await res.json();

            state.availableJobs = allJobs.filter(j => j.status === 'pending');
            state.activeJobs = allJobs.filter(j => j.status === 'confirmed' && j.provider_name === state.currentUser.name);

            renderJobs();
        } catch (err) {
            console.error('Error fetching jobs:', err);
        }
    };

    const renderJobs = () => {
        // Render Available
        elements.availableBadge.textContent = `${state.availableJobs.length} New`;
        if (state.availableJobs.length === 0) {
            elements.availableList.innerHTML = '<div class="empty-state-pro">No new jobs available right now.</div>';
        } else {
            elements.availableList.innerHTML = state.availableJobs.map(job => `
                <div class="job-card">
                    <span class="job-badge badge-pending">PENDING</span>
                    <h3 style="margin: 0.5rem 0;">${job.title}</h3>
                    <p style="font-size: 0.85rem; color: #94a3b8;"><i class="fa-regular fa-calendar"></i> ${job.date}</p>
                    <div class="job-footer">
                        <span class="price">$${job.budget}</span>
                        <button class="btn-confirm-job" onclick="ProviderApp.confirmJob(${job.id})">ACCEPT JOB</button>
                    </div>
                </div>
            `).join('');
        }

        // Render My Tasks
        if (state.activeJobs.length === 0) {
            elements.activeList.innerHTML = '<div class="empty-state-pro">You haven\'t accepted any jobs yet.</div>';
        } else {
            elements.activeList.innerHTML = state.activeJobs.map(job => `
                <div class="job-card" style="border-left: 4px solid var(--primary);">
                    <span class="job-badge badge-confirmed">ACTIVE</span>
                    <h3 style="margin: 0.5rem 0;">${job.title}</h3>
                    <p style="font-size: 0.85rem; color: #94a3b8;"><i class="fa-regular fa-user"></i> Customer: ${job.user_name}</p>
                    <div class="job-footer">
                        <span class="price">$${job.budget}</span>
                        <span style="font-size: 0.8rem; color: #10b981;"><i class="fa-solid fa-check-double"></i> IN PROGRESS</span>
                    </div>
                </div>
            `).join('');
        }
    };

    const confirmJob = async (id) => {
        try {
            const res = await fetch(`${API_URL}/requests/${id}/confirm`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider_name: state.currentUser.name })
            });

            if (res.ok) {
                await fetchJobs();
            }
        } catch (err) {
            console.error('Error confirming job:', err);
        }
    };

    return { init, confirmJob };
})();

document.addEventListener('DOMContentLoaded', ProviderApp.init);
