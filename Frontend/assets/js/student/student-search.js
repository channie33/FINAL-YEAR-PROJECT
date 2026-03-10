document.addEventListener('DOMContentLoaded', async function () {
    var listEl = document.getElementById('resultsList');
    var searchInput = document.getElementById('searchInput');
    var results = await fetchResults();

    // Get query parameter from URL
    var urlParams = new URLSearchParams(window.location.search);
    var initialQuery = urlParams.get('q') || '';

    // Set search input with initial query
    if (initialQuery) {
        searchInput.value = initialQuery;
    }

    // Initial render with filtered results if query exists
    var filtered = initialQuery
        ? results.filter(function (r) {
            return r.name.toLowerCase().includes(initialQuery.toLowerCase()) ||
                r.category.toLowerCase().includes(initialQuery.toLowerCase());
        })
        : results;
    render(filtered);

    // Wire SEND MESSAGE buttons once using event delegation
    listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.send-btn');
        if (!btn) return;
        sendMessage(btn.getAttribute('data-id'));
    });

    // Live search - re-render filtered list on every keystroke
    searchInput.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        var filteredList = q
            ? results.filter(function (r) {
                return r.name.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q);
            })
            : results;
        render(filteredList);
    });

    async function fetchResults() {
        try {
            var res = await fetch('/api/professionals');
            if (res.ok) {
                var data = await res.json();
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    return data.data.map(function (p) {
                        return {
                            id: p.ProfessionalID,
                            name: p.FullName,
                            email: p.Email || '',
                            category: p.Category || 'General Counseling',
                            averageRating: Number(p.average_rating || 0),
                            reviewCount: Number(p.review_count || 0),
                            reviews: Array.isArray(p.reviews) ? p.reviews : []
                        };
                    });
                }
            }
            return [];
        } catch (_) {
            return [];
        }
    }

    // Render professionals as tiles
    function render(list) {
        listEl.innerHTML = '';

        if (!list || list.length === 0) {
            listEl.innerHTML = '<div class="no-results">No professionals found</div>';
            return;
        }

        list.forEach(function (item) {
            var card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML =
                '<div class="result-label">' + escapeHtml(item.name) + '</div>' +
                '<div class="professional-info">' +
                '   <div class="info-row">' +
                '       <div class="info-label">Category</div>' +
                '       <div>' + escapeHtml(item.category) + '</div>' +
                '   </div>' +
                '   <div class="info-row rating-row">' +
                '       <div class="info-label">Rating</div>' +
                '       <div>' + renderRatingSummary(item.averageRating, item.reviewCount) + '</div>' +
                '   </div>' +
                '   <div class="info-row">' +
                '       <div class="info-label">Email</div>' +
                '       <div>' + escapeHtml(item.email) + '</div>' +
                '   </div>' +
                '   <div class="reviews-section">' +
                '       <div class="info-label">Student Reviews</div>' +
                renderReviews(item.reviews) +
                '   </div>' +
                '</div>' +
                '<button class="send-btn" data-id="' + item.id + '">SEND MESSAGE</button>';

            listEl.appendChild(card);
        });
    }

    function renderRatingSummary(average, count) {
        if (!count) {
            return 'No ratings yet';
        }

        return average.toFixed(1) + ' / 5 (' + count + ' review' + (count === 1 ? '' : 's') + ')';
    }

    function renderReviews(reviews) {
        if (!reviews || reviews.length === 0) {
            return '<div class="review-empty">No written reviews yet.</div>';
        }

        var reviewItems = reviews.slice(0, 3).map(function (review) {
            var rating = Number(review.rating || 0);
            var comment = (review.feedback_text || '').trim();
            var safeComment = comment ? escapeHtml(comment) : 'No comment provided.';

            return '<div class="review-item">' +
                '  <div class="review-rating">' + escapeHtml(stars(rating)) + ' (' + rating + '/5)</div>' +
                '  <div class="review-text">"' + safeComment + '"</div>' +
                '  <div class="review-author">By Anonymous Student</div>' +
                '</div>';
        }).join('');

        return '<div class="review-list">' + reviewItems + '</div>';
    }

    function stars(rating) {
        var safeRating = Math.max(0, Math.min(5, Math.round(rating)));
        return '*****'.slice(0, safeRating).replace(/\*/g, '\u2605') +
            '*****'.slice(0, 5 - safeRating).replace(/\*/g, '\u2606');
    }

    // Escape HTML special characters to avoid XSS in card text
    function escapeHtml(text) {
        text = String(text);
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    // Initiate conversation by sending a greeting
    async function sendMessage(professionalId) {
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        var studentId = user.user_id || user.id;

        if (!studentId) {
            alert('Please log in first');
            window.location.href = '/assets/pages/shared/login.html';
            return;
        }

        try {
            var res = await fetch('/api/messages', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: studentId,
                    professional_id: professionalId,
                    sender: 'Student',
                    message_text: 'Hello, I would like to connect with you.'
                })
            });
            if (res.ok) {
                window.location.href = 'messaging.html';
                return;
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }

        // If failed or backend offline, still navigate to messages page
        window.location.href = 'messaging.html';
    }
});