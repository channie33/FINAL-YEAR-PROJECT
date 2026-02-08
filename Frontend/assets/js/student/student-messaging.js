// Load student messaging conversations
const ADMIN_USERNAME = 'admin';
let currentUserId = null;
let currentChatProfessionalId = null;
let currentChatProfessionalName = '';

document.addEventListener('DOMContentLoaded', function () {
    const userId = getLoggedInUserId();
    if (!userId) {
        window.location.href = '/assets/pages/shared/login.html';
        return;
    }

    currentUserId = userId;

    loadStudentMessages(userId);

    const messageAdminBtn = document.getElementById('messageAdminBtn');
    if (messageAdminBtn) {
        messageAdminBtn.addEventListener('click', function () {
            openAdminChat();
        });
    }

    const messageProfessionalBtn = document.getElementById('messageProfessionalBtn');
    if (messageProfessionalBtn) {
        messageProfessionalBtn.addEventListener('click', function () {
            window.location.href = '/assets/pages/student/search.html';
        });
    }

    const adminCloseBtn = document.getElementById('adminChatClose');
    if (adminCloseBtn) {
        adminCloseBtn.addEventListener('click', closeAdminChat);
    }

    const adminSendBtn = document.getElementById('adminChatSend');
    if (adminSendBtn) {
        adminSendBtn.addEventListener('click', sendAdminMessage);
    }

    const chatCloseBtn = document.getElementById('chatClose');
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', closeChat);
    }

    const chatSendBtn = document.getElementById('chatSend');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }

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

    if (conversations && conversations.length > 0) {
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

    if (!conversations || conversations.length === 0) {
        messageList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No messages yet</p>';
    }
}

function openChat(professionalId, professionalName) {
    currentChatProfessionalId = professionalId;
    currentChatProfessionalName = professionalName || 'Professional';
    const modal = document.getElementById('chatModal');
    const title = document.getElementById('chatTitle');
    if (!modal) {
        return;
    }
    if (title) {
        title.textContent = 'Chat with ' + currentChatProfessionalName;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    loadChatMessages();
}

function closeChat() {
    const modal = document.getElementById('chatModal');
    if (!modal) {
        return;
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

async function loadChatMessages() {
    if (!currentUserId || !currentChatProfessionalId) {
        return;
    }

    try {
        const response = await fetch(`/api/messages?student_id=${currentUserId}&professional_id=${currentChatProfessionalId}`);
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            renderChatMessages(data.data || []);
        } else {
            renderChatMessages([]);
        }
    } catch (error) {
        console.error('Chat fetch error:', error);
        renderChatMessages([]);
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) {
        return;
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No messages yet</p>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(message => {
        const item = document.createElement('div');
        item.className = 'chat-message' + (message.Sender === 'Student' ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !currentUserId || !currentChatProfessionalId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentUserId,
                professional_id: currentChatProfessionalId,
                sender: 'Student',
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            input.value = '';
            loadChatMessages();
            loadStudentMessages(currentUserId);
        } else {
            showError(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Chat send error:', error);
        showError('Error sending message');
    }
}

function openAdminChat() {
    const modal = document.getElementById('adminChatModal');
    if (!modal) {
        return;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    loadAdminMessages();
}

function closeAdminChat() {
    const modal = document.getElementById('adminChatModal');
    if (!modal) {
        return;
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

async function loadAdminMessages() {
    if (!currentUserId) {
        return;
    }

    try {
        const response = await fetch(`/api/student/admin-messages?user_id=${currentUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`);
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            renderAdminMessages(data.data.messages || []);
        } else {
            renderAdminMessages([]);
        }
    } catch (error) {
        console.error('Admin fetch error:', error);
        renderAdminMessages([]);
    }
}

function renderAdminMessages(messages) {
    const container = document.getElementById('adminChatMessages');
    if (!container) {
        return;
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No messages yet</p>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(message => {
        const item = document.createElement('div');
        item.className = 'admin-chat-message' + (message.Sender === 'Student' ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    if (!input || !currentUserId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    try {
        const response = await fetch('/api/student/admin-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: currentUserId,
                admin_username: ADMIN_USERNAME,
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            input.value = '';
            loadAdminMessages();
            loadStudentMessages(currentUserId);
        } else {
            showError(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Send error:', error);
        showError('Error sending message');
    }
}

function showError(message) {
    console.error('Error:', message);
    document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading messages: ' + message + '</p>';
}
