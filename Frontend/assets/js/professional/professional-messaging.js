const ADMIN_USERNAME = 'admin';
let currentProfessionalId = null;
let currentChatStudentId = null;
let currentChatStudentName = '';

document.addEventListener('DOMContentLoaded', async function () {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;
    currentProfessionalId = userId || null;

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
                if (conversations.length > 0) {
                    messageContainer.innerHTML = conversations.map(conv => `
                        <div class="msg-card" style="background-color: #e8e6d5; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;" onclick="openChat(${conv.StudentID}, '${conv.FullName}')">
                            <div class="msg-name" style="font-weight: bold; color: #1a4d3e;">${conv.FullName}</div>
                            <div class="msg-dashes" style="color: #999;">........................</div>
                            <div class="msg-time" style="color: #666; font-size: 0.9em;">${new Date(conv.last_message_time).toLocaleDateString()}</div>
                        </div>
                    `).join('');
                } else {
                    messageContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No conversations yet</p>';
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
            window.location.href = '../shared/index.html';
        });
    }

    const messageAdminBtn = document.getElementById('messageAdminBtn');
    if (messageAdminBtn) {
        messageAdminBtn.addEventListener('click', function () {
            openAdminChat();
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

    if (userId) {
        loadMessages();
    }
});

function openChat(studentId, studentName) {
    currentChatStudentId = studentId;
    currentChatStudentName = studentName || 'Student';
    const modal = document.getElementById('chatModal');
    const title = document.getElementById('chatTitle');
    if (!modal) {
        return;
    }
    if (title) {
        title.textContent = 'Chat with ' + currentChatStudentName;
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
    if (!currentChatStudentId || !currentProfessionalId) {
        return;
    }

    try {
        const response = await fetch(`/api/messages?student_id=${currentChatStudentId}&professional_id=${currentProfessionalId}`);
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
        item.className = 'chat-message' + (message.Sender === 'Professional' ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !currentChatStudentId || !currentProfessionalId) {
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
                student_id: currentChatStudentId,
                professional_id: currentProfessionalId,
                sender: 'Professional',
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            input.value = '';
            loadChatMessages();
            loadMessages();
        } else {
            alert(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Chat send error:', error);
        alert('Error sending message');
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
    if (!currentProfessionalId) {
        return;
    }

    try {
        const response = await fetch(`/api/professional/admin-messages?user_id=${currentProfessionalId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`);
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
        item.className = 'admin-chat-message' + (message.Sender === 'Professional' ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendAdminMessage() {
    const input = document.getElementById('adminChatInput');
    if (!input || !currentProfessionalId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    try {
        const response = await fetch('/api/professional/admin-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                professional_id: currentProfessionalId,
                admin_username: ADMIN_USERNAME,
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            input.value = '';
            loadAdminMessages();
            location.reload();
        } else {
            alert(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Send error:', error);
        alert('Error sending message');
    }
}
