document.addEventListener('DOMContentLoaded', async function () {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;

    // Load sessions/appointments for professional
    async function loadSessions() {
        try {
            const response = await fetch(`/api/professional/sessions?user_id=${userId}`);
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load sessions');
            }
            
            const sessions = data.data || [];
            
            // Display sessions
            const sessionContainer = document.getElementById('sessList') || document.querySelector('.sessions-list');
            if (sessionContainer) {
                if (sessions.length === 0) {
                    sessionContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No scheduled sessions</p>';
                } else {
                    sessionContainer.innerHTML = sessions.map(session => {
                        const appointmentId = session.AppointmentID || session.appointment_id || '';
                        const studentName = session.student_name || 'Unknown';
                        const sessionDate = new Date(session.SessionDate);
                        const dateStr = sessionDate.toLocaleDateString();
                        const timeSlot = session.TimeSlot || 'N/A';
                        
                        // Generate meeting room IDs
                        const meetingId = `session-${appointmentId}-${sessionDate.getTime()}`;
                        const googleMeetLink = `https://meet.google.com/new`;
                        const teamsLink = `https://teams.microsoft.com/l/meeting/new`;
                        const zoomLink = `https://zoom.us/start/videomeeting`;
                        
                        return `
                            <div class="sess-card">
                                <div class="sess-info">
                                    <div class="sess-name">${studentName}</div>
                                    <div class="sess-date">${dateStr} at ${timeSlot}</div>
                                </div>
                                <div class="meeting-platforms">
                                    <a href="${googleMeetLink}" target="_blank" class="meeting-btn google-meet" title="Start Google Meet">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm-3-5c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0-2c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7 3.134-7 7-7z"/>
                                        </svg>
                                    </a>
                                    <a href="${teamsLink}" target="_blank" class="meeting-btn microsoft-teams" title="Start Microsoft Teams Meeting">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M19.5 6h-4c-.827 0-1.5.673-1.5 1.5v9c0 .827.673 1.5 1.5 1.5h4c.827 0 1.5-.673 1.5-1.5v-9c0-.827-.673-1.5-1.5-1.5zM12 7.5c0-.827-.673-1.5-1.5-1.5h-6C3.673 6 3 6.673 3 7.5v9c0 .827.673 1.5 1.5 1.5h6c.827 0 1.5-.673 1.5-1.5v-9z"/>
                                        </svg>
                                    </a>
                                    <a href="${zoomLink}" target="_blank" class="meeting-btn zoom" title="Start Zoom Meeting">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M6 6h6v6H6zm8 0h4v12h-4zM6 14h6v6H6z"/>
                                        </svg>
                                    </a>
                                    <button class="meeting-btn message-student" onclick="messageStudent(${session.StudentID || session.student_id}, '${studentName}')" title="Message Student">
                                        <svg viewBox="0 0 24 24">
                                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading sessions: ' + error.message + '</p>';
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

    if (userId) {
        loadSessions();
    }
});

// Global function to message a student (called from onclick)
function messageStudent(studentId, studentName) {
    // Get current professional ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const professionalId = user.id || user.user_id;
    
    if (!professionalId) {
        alert('Please log in first');
        return;
    }
    
    // Send initial message to open conversation
    fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: studentId,
            professional_id: professionalId,
            sender: 'Professional',
            message_text: 'Hello, this is regarding our upcoming session.'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = '/assets/pages/professional/messaging.html';
        } else {
            // Even if message fails, navigate to messaging page
            window.location.href = '/assets/pages/professional/messaging.html';
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        // Navigate to messaging page anyway
        window.location.href = '/assets/pages/professional/messaging.html';
    });
}
