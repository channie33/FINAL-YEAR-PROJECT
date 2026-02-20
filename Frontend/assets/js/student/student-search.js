
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

    // Live search — re-render filtered list on every keystroke
    searchInput.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        var filtered = q
            ? results.filter(function (r) {
                  return r.name.toLowerCase().includes(q) ||
                         r.category.toLowerCase().includes(q);
              })
            : results;
        render(filtered);
    });


    // Fetch 
    async function fetchResults() {
        try {
            var res = await fetch('/api/professionals');
            if (res.ok) {
                var data = await res.json();
                if (data.status === 'success' && data.data && data.data.length > 0) {
                    return data.data.map(function (p) {
                        return {
                            id:       p.ProfessionalID,
                            name:     p.FullName,
                            email:    p.Email || '',
                            category: p.Category || 'General Counseling'
                        };
                    });
                }
            }
            return [];
        } catch (_) {
            return [];
        }
    }

    //Render
    function render(list) {
        listEl.innerHTML = '';

        if (!list || list.length === 0) {
            listEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No professionals found</p>';
            return;
        }

        list.forEach(function (item, idx) {
            // ── result card ──
            var card = document.createElement('div');
            card.className = 'result-card';
            card.setAttribute('data-idx', idx);
            card.innerHTML = '<div class="result-label">' + item.name + '</div>';

            // detail popup (hidden until card is clicked)
            var popup = document.createElement('div');
            popup.className = 'detail-popup';
            popup.id = 'popup-' + idx;
            popup.innerHTML =
                '<div class="detail-row">' + item.name     + '</div>' +
                '<div class="detail-row">' + item.email    + '</div>' +
                '<div class="detail-row">' + item.category + '</div>' +
                '<button class="send-btn" data-id="' + item.id + '">SEND MESSAGE</button>';

            card.addEventListener('click', function () {
                toggleCard(card, popup);
            });

            listEl.appendChild(card);
            listEl.appendChild(popup);
        });

        // Wire SEND MESSAGE buttons (event delegation)
        listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.send-btn');
            if (!btn) return;
            e.stopPropagation();                     // don't also toggle the card
            sendMessage(btn.getAttribute('data-id'));
        });
    }

    //Toggle selected state 
    function toggleCard(card, popup) {
        var isOpen = card.classList.contains('selected');

        // Close everything first
        listEl.querySelectorAll('.result-card').forEach(function (c) {
            c.classList.remove('selected');
        });
        listEl.querySelectorAll('.detail-popup').forEach(function (p) {
            p.style.display = 'none';
        });

        // If this card wasn't already open, open it and hide siblings
        if (!isOpen) {
            card.classList.add('selected');
            popup.style.display = 'block';

            // Hide all other cards (only selected + its popup stay)
            listEl.querySelectorAll('.result-card').forEach(function (c) {
                if (c !== card) c.style.display = 'none';
            });
        } else {
            // Re-show all cards
            listEl.querySelectorAll('.result-card').forEach(function (c) {
                c.style.display = '';
            });
        }
    }

    //Send message - initiate conversation by sending a greeting
    async function sendMessage(professionalId) {
        // Get current student ID from localStorage
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
