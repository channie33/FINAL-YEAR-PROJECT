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
            if (students && students.length > 0) {
                const studentContainer = document.querySelector('.students-list') || document.querySelector('.student-list');
                if (studentContainer) {
                    studentContainer.innerHTML = students.map(student => `
                        <div class="student-info" style="background-color: #f5f4e8; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <p style="margin: 0; color: #1a4d3e;"><strong>${student.FullName}</strong> - ${student.session_count || 0} sessions</p>
                        </div>
                    `).join('');
                }
            }
            
            // Display reviews (ratings from students)
            if (reviews && reviews.length > 0) {
                const reviewContainer = document.querySelector('.reviews-list') || document.querySelector('.review-list');
                if (reviewContainer) {
                    reviewContainer.innerHTML = reviews.map(review => `
                        <div class="review-info" style="background-color: #e8e6d5; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <p style="margin: 0 0 5px 0; color: #1a4d3e;"><strong>${review.student_name}</strong> - Rating: ${'⭐'.repeat(review.Rating)}</p>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">"${review.FeedbackText || 'No feedback text'}"</p>
                        </div>
                    `).join('');
                }
            }
            
            // Display average rating
            const ratingDisplay = document.querySelector('.average-rating') || document.querySelector('.rating-display');
            if (ratingDisplay) {
                ratingDisplay.textContent = `Average Rating: ${'⭐'.repeat(Math.round(avgRating))} (${avgRating}/5)`;
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
        loadProfessionalProfile();
    } else {
        window.location.href = '/assets/pages/shared/login.html';
    }
});
