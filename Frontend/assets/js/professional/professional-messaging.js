const ADMIN_USERNAME = 'admin';
let currentProfessionalId = null;
let currentChatStudentId = null;
let currentChatStudentName = '';
let isAdminChat = false;

// Global function for opening chat (called from onclick in HTML)
function openChat(studentId, studentName) {
    isAdminChat = false;
    currentChatStudentId = studentId;
    currentChatStudentName = studentName || 'Student';
    
    const chatHeader = document.getElementById('chatHeader');
    const chatPanel = document.getElementById('chatPanel');
    const emptyState = document.getElementById('emptyState');
    
    if (chatHeader) {
        chatHeader.textContent = 'Chat with ' + currentChatStudentName;
    }
    if (chatPanel) {
        chatPanel.style.display = 'flex';
    }
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    loadChatMessages();
}

document.addEventListener('DOMContentLoaded', async function () {

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.user_id;
    currentProfessionalId = userId || null;

    // Load conversations for professional (made global so it can be called after sending)
    window.loadMessages = async function() {
        try {
            const response = await fetch(`/api/professional/messages?user_id=${userId}`);
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load messages');
            }
            
            const conversations = data.data || [];
            
            // Display conversations in sidebar
            const conversationsList = document.getElementById('conversationsList');
            if (conversationsList) {
                if (conversations.length > 0) {
                    conversationsList.innerHTML = conversations.map(conv => `
                        <div class="conversation-item" onclick="openChat(${conv.StudentID}, '${conv.FullName}')">
                            <div class="conv-name">${conv.FullName}</div>
                            <div class="conv-time">${new Date(conv.last_message_time).toLocaleDateString()}</div>
                        </div>
                    `).join('');
                } else {
                    conversationsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No conversations yet</p>';
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            const errorMsg = document.createElement('p');
            errorMsg.style.cssText = 'color: red; margin: 20px; text-align: center;';
            errorMsg.textContent = 'Error loading messages: ' + error.message;
            document.body.appendChild(errorMsg);
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

    if (userId) {
        window.loadMessages();
    }
});

function openAdminChat() {
    isAdminChat = true;
    currentChatStudentId = null;
    
    const chatHeader = document.getElementById('chatHeader');
    const chatPanel = document.getElementById('chatPanel');
    const emptyState = document.getElementById('emptyState');
    
    if (chatHeader) {
        chatHeader.textContent = 'Chat with Admin';
    }
    if (chatPanel) {
        chatPanel.style.display = 'flex';
    }
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    loadAdminMessages();
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
        const isSelf = message.Sender === 'Professional';
        item.className = 'chat-message' + (isSelf ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !currentProfessionalId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    if (isAdminChat) {
        await sendAdminMessage(messageText);
    } else {
        if (!currentChatStudentId) return;
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
                window.loadMessages(); // Refresh conversation list
            } else {
                showError(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Chat send error:', error);
            showError('Error sending message');
        }
    }
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
    // Reuse the main render function
    renderChatMessages(messages, true);
}

async function sendAdminMessage(messageText) {
    if (!currentProfessionalId) {
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
            const input = document.getElementById('chatInput');
            if (input) input.value = '';
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
