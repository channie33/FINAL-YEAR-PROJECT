
document.addEventListener('DOMContentLoaded', async function () {

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;
    // Debug output
    console.log('[DEBUG] localStorage user:', user);
    console.log('[DEBUG] userId used for API:', userId);

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

    let availableProfessionals = [];

    // Fetch and display student profile
    async function loadStudentProfile() {
        try {
            const response = await fetch(`/api/student/profile?student_id=${userId}`);
            const data = await response.json();
            // Debug output
            console.log('[DEBUG] /api/student/profile response:', data);

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load profile');
            }

            const profile = data.data.profile;
            const professionals = data.data.professionals;
            const reviews = data.data.reviews;

            availableProfessionals = professionals || [];
            populateReviewProfessionals(availableProfessionals);

            // Fill profile card
            const profileEmail = document.getElementById('profileEmail');
            const profileName = document.getElementById('profileName');
            if (profileEmail) profileEmail.textContent = profile.Email || '';
            if (profileName) profileName.textContent = profile.FullName || '';

            // Display professionals (your mental health professionals)
            const profContainer = document.querySelector('.professionals-list') || document.querySelector('.prof-list');
            if (profContainer) {
                if (professionals && professionals.length > 0) {
                    profContainer.innerHTML = professionals.map(prof => `
                        <div class="info-card" style="background-color: #e8e6d5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <div class="card-title" style="font-weight: bold; color: #1a4d3e;">${prof.FullName}</div>
                            <div class="field" style="color: #666; margin: 5px 0;">Category: ${prof.Category || 'N/A'}</div>
                            <div class="field" style="color: #666; margin: 5px 0;">Sessions: ${prof.session_count || 0}</div>
                        </div>
                    `).join('');
                } else {
                    profContainer.innerHTML = '<p style="color: #666; margin-top: 10px;">No professionals yet</p>';
                }
            }

            // Display reviews left
            const reviewContainer = document.querySelector('.reviews-list') || document.querySelector('.review-list');
            if (reviewContainer) {
                if (reviews && reviews.length > 0) {
                    reviewContainer.innerHTML = reviews.map(review => `
                        <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                            <div style="font-weight: bold; color: #1a4d3e;">${review.FullName}</div>
                            <div style="color: #ff9800;">* ${review.Rating}/5</div>
                            <div style="color: #666; margin-top: 5px;">${review.FeedbackText || 'No feedback text'}</div>
                        </div>
                    `).join('');
                } else {
                    reviewContainer.innerHTML = '<p style="color: #666; margin-top: 10px;">No reviews yet</p>';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading profile: ' + error.message + '</p>';
        }
    }

    function populateReviewProfessionals(professionals) {
        const select = document.getElementById('reviewProfessional');
        if (!select) {
            return;
        }

        // Filter to only include professionals with completed sessions
        const reviewableProfessionals = professionals.filter(prof => prof.session_count > 0);
        
        const options = ['<option value="">Select professional</option>'];
        if (reviewableProfessionals && reviewableProfessionals.length > 0) {
            reviewableProfessionals.forEach(prof => {
                options.push(`<option value="${prof.ProfessionalID}">${prof.FullName}</option>`);
            });
        } else {
            options.push('<option disabled>No completed sessions yet</option>');
        }
        select.innerHTML = options.join('');
        
        // Disable form if no reviewable professionals
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm && (!reviewableProfessionals || reviewableProfessionals.length === 0)) {
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            // Show helpful message
            const formContainer = reviewForm.parentElement;
            if (formContainer && !formContainer.querySelector('.review-notice')) {
                const notice = document.createElement('p');
                notice.className = 'review-notice';
                notice.textContent = 'Complete a session with a professional first to leave a review.';
                notice.style.color = '#ff9800';
                notice.style.fontSize = '13px';
                notice.style.marginTop = '10px';
                formContainer.insertBefore(notice, reviewForm);
            }
        }
    }

    async function submitReview(event) {
        event.preventDefault();

        const professionalSelect = document.getElementById('reviewProfessional');
        const ratingSelect = document.getElementById('reviewRating');
        const reviewText = document.getElementById('reviewText');

        if (!professionalSelect || !ratingSelect || !reviewText) {
            return;
        }

        const professionalId = professionalSelect.value;
        const rating = ratingSelect.value;
        const feedbackText = reviewText.value.trim();

        if (!professionalId || !rating) {
            alert('Please select a professional and rating.');
            return;
        }

        try {
            const response = await fetch('/api/student/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: userId,
                    professional_id: professionalId,
                    rating: parseInt(rating, 10),
                    feedback_text: feedbackText
                })
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                reviewText.value = '';
                ratingSelect.value = '';
                alert('Review submitted successfully.');
                loadStudentProfile();
            } else {
                alert(data.message || 'Failed to submit review.');
            }
        } catch (error) {
            console.error('Review error:', error);
            alert('Error submitting review.');
        }
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.clear();
            window.location.href = '/assets/pages/shared/index.html';
        });
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }

    // Load data on page load
    if (userId) {
        loadStudentProfile();
    } else {
        window.location.href = '/assets/pages/shared/login.html';
    }
});
