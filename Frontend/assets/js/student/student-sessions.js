// Load student sessions/appointments
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.id) {
        console.error('No user logged in');
        return;
    }

    loadStudentSessions(user.id);

    // Book button 
    const bookBtn = document.getElementById('bookBtn') || document.querySelector('.book-btn');
    if (bookBtn) {
        bookBtn.addEventListener('click', function () {
            alert('Booking form coming soon.');
        });
    }
});

async function loadStudentSessions(userId) {
    try {
        const response = await fetch(`/api/student/sessions?user_id=${userId}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            displayStudentSessions(data.data);
        } else {
            console.error('Error:', data.message || 'Failed to load sessions');
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading sessions: ' + (data.message || 'Unknown error') + '</p>';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.body.innerHTML += '<p style="color: red; margin: 20px;">Error connecting to server</p>';
    }
}

function displayStudentSessions(sessions) {
    const sessionContainer = document.querySelector('.sessions-container') || document.querySelector('.sessions-list') || document.getElementById('sessList');

    if (!sessionContainer) {
        console.warn('Sessions container not found');
        return;
    }

    sessionContainer.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        sessionContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No scheduled sessions</p>';
        return;
    }

    sessions.forEach(session => {
        const sessCard = document.createElement('div');
        sessCard.className = 'sess-card';
        
        const dateTime = session.SessionDate ? formatDateTime(session.SessionDate) : 'Pending';
        
        sessCard.innerHTML = `
            <div style="padding: 15px; background-color: #f5f4e8; border-radius: 8px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #1a4d3e;">${session.professional_name || 'Professional'}</h4>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Date/Time:</strong> ${dateTime}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Time Slot:</strong> ${session.TimeSlot || 'N/A'}
                </p>
                <button class="reschedule-btn" data-session-id="${session.AppointmentID}" style="margin-top: 10px; padding: 5px 15px; background-color: #1a4d3e; color: #f5f4e8; border: none; border-radius: 5px; cursor: pointer;">Reschedule</button>
            </div>
        `;
        sessionContainer.appendChild(sessCard);

        // Add reschedule button handler
        sessCard.querySelector('.reschedule-btn').addEventListener('click', function () {
            const sessionId = this.getAttribute('data-session-id');
            alert('Reschedule for session ' + sessionId + ' coming soon');
        });
    });
}

function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
        return dateString;
    }
                '<div class="sess-name">' + name    + '</div>' +
                '<div class="sess-date">' + dateStr + '</div>';

            container.appendChild(card);
        });
    }

    // Date/time formatter
    function formatDateTime(raw) {
        try {
            var d = new Date(raw);
            var date = d.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
            var time = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', hour12:false });
            return date + ' ' + time;
        } catch (_) { return raw; }
    }
});