
document.addEventListener('DOMContentLoaded', async function () {

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;

    // Handle search bar navigation
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    window.location.href = `/assets/pages/student/search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Fetch and display student profile
    async function loadStudentProfile() {
        try {
            const response = await fetch(`/api/student/profile?user_id=${userId}`);
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load profile');
            }
            
            const profile = data.data.profile;
            const professionals = data.data.professionals;
            const reviews = data.data.reviews;
            
            // Fill profile card
            const profileEmail = document.getElementById('profileEmail');
            const profileName = document.getElementById('profileName');
            if (profileEmail) profileEmail.textContent = profile.Email;
            if (profileName) profileName.textContent = profile.FullName;
            
            // Display professionals (your mental health professionals)
            if (professionals && professionals.length > 0) {
                const profContainer = document.querySelector('.professionals-list') || document.querySelector('.prof-list');
                if (profContainer) {
                    profContainer.innerHTML = professionals.map(prof => `
                        <div class="info-card" style="background-color: #e8e6d5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <div class="card-title" style="font-weight: bold; color: #1a4d3e;">${prof.FullName}</div>
                            <div class="field" style="color: #666; margin: 5px 0;">Category: ${prof.Category || 'N/A'}</div>
                            <div class="field" style="color: #666; margin: 5px 0;">Sessions: ${prof.session_count || 0}</div>
                        </div>
                    `).join('');
                }
            }
            
            // Display reviews left
            if (reviews && reviews.length > 0) {
                const reviewContainer = document.querySelector('.reviews-list') || document.querySelector('.review-list');
                if (reviewContainer) {
                    reviewContainer.innerHTML = reviews.map(review => `
                        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                            <div style="font-weight: bold; color: #1a4d3e;">${review.FullName}</div>
                            <div style="color: #ff9800;">★ ${review.Rating}/5</div>
                            <div style="color: #666; margin-top: 5px;">${review.FeedbackText || 'No feedback text'}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading profile: ' + error.message + '</p>';
        }
    }

    // Logout 
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.clear();
            window.location.href = '../shared/index.html';
        });
    }

    // Load data on page load
    if (userId) {
        loadStudentProfile();
    } else {
        window.location.href = '/assets/pages/shared/login.html';
    }
});