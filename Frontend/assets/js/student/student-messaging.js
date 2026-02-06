// Load student messaging conversations
document.addEventListener('DOMContentLoaded', function () {
    const userId = getLoggedInUserId();
    if (!userId) {
        window.location.href = '/assets/pages/shared/login.html';
        return;
    }

    loadStudentMessages(userId);

    // Handle message sending
    const sendButton = document.getElementById('sendBtn') || document.querySelector('.send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', function () {
            const messageInput = document.getElementById('messageInput') || document.querySelector('textarea');
            if (messageInput && messageInput.value.trim()) {
                messageInput.value = '';
            }
        });
    }
});

function getLoggedInUserId() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.user_id || user.id || null;
    } catch (_) {
        return null;
    }
}

async function loadStudentMessages(userId) {
    try {
        const response = await fetch(`/api/student/messages?user_id=${userId}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            displayStudentMessages(data.data);
        } else {
            showError(data.message || 'Failed to load messages');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showError('Error connecting to server');
    }
}

function displayStudentMessages(conversations) {
    const messageList = document.querySelector('.message-list') ||
        document.querySelector('.conversations-container') ||
        document.getElementById('msgList');

    if (!messageList) {
        console.warn('Message list container not found');
        return;
    }

    messageList.innerHTML = '';

    if (!conversations || conversations.length === 0) {
        messageList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No messages yet</p>';
        return;
    }

    conversations.forEach(conversation => {
        const msgCard = document.createElement('div');
        msgCard.className = 'msg-card';
        msgCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 5px 0;">${conversation.FullName}</h4>
                    <p style="margin: 0; color: #666; font-size: 0.9em;">Last message: ${conversation.last_message_time || 'No messages'}</p>
                </div>
                <button class="open-chat-btn" data-prof-id="${conversation.ProfessionalID}" style="padding: 5px 15px; background-color: #1a4d3e; color: #f5f4e8; border: none; border-radius: 5px; cursor: pointer;">Open Chat</button>
            </div>
        `;
        messageList.appendChild(msgCard);

        msgCard.querySelector('.open-chat-btn').addEventListener('click', function () {
            const profId = this.getAttribute('data-prof-id');
            openChat(profId, conversation.FullName);
        });
    });
}

function openChat(professionalId, professionalName) {
    console.log('Opening chat with professional ID:', professionalId);
    alert('Chat with ' + professionalName + ' would open here');
}

function showError(message) {
    console.error('Error:', message);
    document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading messages: ' + message + '</p>';
}
