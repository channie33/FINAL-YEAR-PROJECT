// Load student messaging conversations
const ADMIN_USERNAME = 'admin';
let currentUserId = null;
let currentChatProfessionalId = null;
let currentChatProfessionalName = '';
let isAdminChat = false;

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

    const chatSendBtn = document.getElementById('chatSend');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage);
    }

    // Enter key to send
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
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
    const messageList = document.querySelector('.conversations-list') || document.getElementById('msgList');

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
                <div class="msg-name">${conversation.FullName}</div>
                <div class="msg-time">${new Date(conversation.last_message_time).toLocaleDateString()}</div>
            `;
            
            msgCard.addEventListener('click', function () {
                // Remove active class from all cards
                document.querySelectorAll('.msg-card').forEach(c => c.classList.remove('active'));
                // Add active to clicked card
                msgCard.classList.add('active');
                openChat(conversation.ProfessionalID, conversation.FullName);
            });
            
            messageList.appendChild(msgCard);
        });
    }

    if (!conversations || conversations.length === 0) {
        messageList.innerHTML = '<p style=\"padding: 20px; text-align: center; color: #666;\">No messages yet</p>';
    }
}

function openChat(professionalId, professionalName) {
    isAdminChat = false;
    currentChatProfessionalId = professionalId;
    currentChatProfessionalName = professionalName || 'Professional';
    const title = document.getElementById('chatTitle');
    if (title) {
        title.textContent = 'Chat with ' + currentChatProfessionalName;
    }
    loadChatMessages();
}

function closeChat() {
    // Not needed in full-page layout
}

async function loadChatMessages() {
    if (isAdminChat) {
        loadAdminMessages();
        return;
    }
    
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
    if (!input || !currentUserId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    if (isAdminChat) {
        await sendAdminMessage(messageText);
        return;
    }

    if (!currentChatProfessionalId) {
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
    isAdminChat = true;
    currentChatProfessionalId = null;
    currentChatProfessionalName = '';
    
    // Remove active from all conversation cards
    document.querySelectorAll('.msg-card').forEach(c => c.classList.remove('active'));
    
    const title = document.getElementById('chatTitle');
    if (title) {
        title.textContent = 'Chat with Admin';
    }
    loadAdminMessages();
}

function closeAdminChat() {
    // Not needed in full-page layout
}

async function loadAdminMessages() {
    if (!currentUserId) {
        return;
    }

    try {
        const response = await fetch(`/api/student/admin-messages?user_id=${currentUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`);
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            renderChatMessages(data.data.messages || [], true);
        } else {
            renderChatMessages([], true);
        }
    } catch (error) {
        console.error('Admin fetch error:', error);
        renderChatMessages([], true);
    }
}

function renderChatMessages(messages, isAdmin = false) {
    const container = document.getElementById('chatMessages');
    if (!container) {
        return;
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No messages yet</p>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(message => {
        const item = document.createElement('div');
        const isSelf = message.Sender === 'Student';
        item.className = 'chat-message' + (isSelf ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

function renderAdminMessages(messages) {
    // Reuse the main render function
    renderChatMessages(messages, true);
}

async function sendAdminMessage(messageText) {
    if (!currentUserId) {
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
            loadAdminMessages();
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
    alert('Error: ' + message);
}
