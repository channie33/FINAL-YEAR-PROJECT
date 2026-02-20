document.addEventListener('DOMContentLoaded', async function () {

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;

    // Fetch and display professional profile
    async function loadProfessionalProfile() {
        try {
            const response = await fetch(`/api/professional/profile?user_id=${userId}`);
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load profile');
            }
            
            const profile = data.data.profile;
            const students = data.data.students;
            const reviews = data.data.reviews;
            const avgRating = data.data.average_rating;
            
            // Fill profile card
            const profileEmail = document.getElementById('profileEmail');
            const profileName = document.getElementById('profileName');
            const profileCategory = document.getElementById('profileCategory');
            
            if (profileEmail) profileEmail.textContent = profile.Email;
            if (profileName) profileName.textContent = profile.FullName;
            if (profileCategory) profileCategory.textContent = profile.Category || 'N/A';
            
            // Display students (your students)
            const studentContainer = document.querySelector('.students-list');
            if (students && students.length > 0) {
                studentContainer.innerHTML = students.map(student => `
                    <div class="student-info">
                        <p><strong>${student.FullName}</strong></p>
                        <p style="font-size: 12px; color: #bbb;">Sessions: ${student.session_count || 0}</p>
                    </div>
                `).join('');
            } else {
                studentContainer.innerHTML = '<p style="text-align: center; color: #aaa; font-size: 14px;">No students yet. Complete sessions to see them here.</p>';
            }
            
            // Display average rating
            const ratingDisplay = document.querySelector('.average-rating');
            if (ratingDisplay && avgRating > 0) {
                const stars = '⭐'.repeat(Math.round(avgRating));
                ratingDisplay.innerHTML = `<strong>Average Rating:</strong> ${stars} (${avgRating}/5)`;
            } else if (ratingDisplay) {
                ratingDisplay.innerHTML = '<span style="color: #aaa;">No ratings yet</span>';
            }
            
            // Display reviews (ratings from students)
            const reviewContainer = document.querySelector('.reviews-list');
            if (reviews && reviews.length > 0) {
                reviewContainer.innerHTML = reviews.map(review => `
                    <div class="review-info">
                        <p><strong>Anonymous Student</strong> - ${'⭐'.repeat(review.Rating)}</p>
                        <p>"${review.FeedbackText || 'No feedback provided'}"</p>
                    </div>
                `).join('');
            } else {
                reviewContainer.innerHTML = '<p style="text-align: center; color: #aaa; font-size: 14px;">No reviews yet. Once students leave reviews, they\'ll appear here.</p>';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            const errorMsg = '<p style="color: #ff6b6b; margin: 20px; text-align: center;">Error loading profile: ' + error.message + '</p>';
            document.querySelector('.home-right').innerHTML = errorMsg;
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
        loadProfessionalProfile();
    } else {
        window.location.href = '/assets/pages/shared/login.html';
    }
});
