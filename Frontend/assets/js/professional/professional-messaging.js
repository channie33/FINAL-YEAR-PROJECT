document.addEventListener('DOMContentLoaded', async function () {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;

    // Load conversations for professional
    async function loadMessages() {
        try {
            const response = await fetch(`/api/professional/messages?user_id=${userId}`);
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load messages');
            }
            
            const conversations = data.data || [];
            
            // Display conversations
            const messageContainer = document.getElementById('msg-list') || document.querySelector('.msg-list');
            if (messageContainer) {
                if (conversations.length === 0) {
                    messageContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No conversations yet</p>';
                } else {
                    messageContainer.innerHTML = conversations.map(conv => `
                        <div class="msg-card" style="background-color: #e8e6d5; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" onclick="openChat(${conv.StudentID}, '${conv.FullName}')">
                            <div class="msg-name" style="font-weight: bold; color: #1a4d3e;">${conv.FullName}</div>
                            <div class="msg-dashes" style="color: #999;">........................</div>
                            <div class="msg-time" style="color: #666; font-size: 0.9em;">${new Date(conv.last_message_time).toLocaleDateString()}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading messages: ' + error.message + '</p>';
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

    if (userId) {
        loadMessages();
    }
});

function openChat(studentId, studentName) {
    // Navigate to chat or modal with this student
    console.log('Opening chat with student:', studentId, studentName);
    alert('Chat with ' + studentName + ' would open here');
}
