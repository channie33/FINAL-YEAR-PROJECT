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
                    sessionContainer.innerHTML = sessions.map(session => `
                        <div class="sess-card" style="background-color: #e8e6d5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <div class="sess-name" style="font-weight: bold; color: #1a4d3e;">${session.student_name || 'Unknown'}</div>
                            <div class="sess-date" style="color: #666; font-size: 0.9em;">${new Date(session.SessionDate).toLocaleDateString()} at ${session.TimeSlot || 'N/A'}</div>
                        </div>
                    `).join('');
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
