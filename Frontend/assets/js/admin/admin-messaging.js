// Auth guard — redirect to login if not authenticated
if (sessionStorage.getItem("betterspace_admin") !== "true") {
    window.location.href = "login.html";
}

const ADMIN_USERNAME = 'admin';
let currentChatType = null; // 'student' or 'professional'
let currentChatUserId = null;
let currentChatUserName = '';
let conversations = []; // Store all conversations

// Global function for opening chat
function openChat(type, userId, userName) {
    currentChatType = type;
    currentChatUserId = userId;
    currentChatUserName = userName || 'User';
    
    const chatHeader = document.getElementById('chatHeader');
    const chatPanel = document.getElementById('chatPanel');
    const emptyState = document.getElementById('emptyState');
    
    if (chatHeader) {
        const typeLabel = type === 'student' ? 'Student' : 'Professional';
        chatHeader.textContent = `Chat with ${typeLabel}: ${currentChatUserName}`;
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
    loadConversations();

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

    // Logout button
    const logoutBtn = document.querySelector('.sidebar-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            sessionStorage.removeItem("betterspace_admin");
            window.location.href = "/assets/pages/shared/index.html";
        });
    }
});

async function loadConversations() {
    try {
        const response = await fetch(`/api/admin/messages?admin_username=${encodeURIComponent(ADMIN_USERNAME)}&limit=100`);
        const data = await response.json();
        
        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message || 'Failed to load conversations');
        }
        
        const messages = data.data || [];
        
        // Group messages by participant
        const conversationMap = new Map();
        messages.forEach(msg => {
            let key, name, type;
            if (msg.StudentID) {
                key = `student_${msg.StudentID}`;
                name = msg.StudentName || `Student ${msg.StudentID}`;
                type = 'student';
            } else if (msg.ProfessionalID) {
                key = `professional_${msg.ProfessionalID}`;
                name = msg.ProfessionalName || `Professional ${msg.ProfessionalID}`;
                type = 'professional';
            } else {
                return; // Skip if neither student nor professional
            }
            
            if (!conversationMap.has(key)) {
                conversationMap.set(key, {
                    type: type,
                    userId: msg.StudentID || msg.ProfessionalID,
                    name: name,
                    lastMessage: msg.MessageText,
                    lastMessageTime: msg.SentAt
                });
            }
        });
        
        conversations = Array.from(conversationMap.values());
        
        // Display conversations in sidebar
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            if (conversations.length > 0) {
                conversationsList.innerHTML = conversations.map(conv => {
                    const typeLabel = conv.type === 'student' ? 'Student' : 'Professional';
                    return `
                        <div class="conversation-item" onclick="openChat('${conv.type}', ${conv.userId}, '${conv.name}')">
                            <div class="conv-name">${conv.name}</div>
                            <div class="conv-type">${typeLabel}</div>
                            <div class="conv-time">${new Date(conv.lastMessageTime).toLocaleDateString()}</div>
                        </div>
                    `;
                }).join('');
            } else {
                conversationsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No conversations yet</p>';
            }
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        const conversationsList = document.getElementById('conversationsList');
        if (conversationsList) {
            conversationsList.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Error loading conversations</p>';
        }
    }
}

async function loadChatMessages() {
    if (!currentChatType || !currentChatUserId) {
        return;
    }

    try {
        let apiUrl;
        if (currentChatType === 'student') {
            apiUrl = `/api/student/admin-messages?student_id=${currentChatUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`;
        } else {
            apiUrl = `/api/professional/admin-messages?user_id=${currentChatUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            const messages = data.data.messages || data.data || [];
            renderChatMessages(messages);
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
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No messages yet</p>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(message => {
        const item = document.createElement('div');
        const isSelf = message.Sender === 'Admin';
        item.className = 'chat-message' + (isSelf ? ' self' : '');
        item.textContent = message.MessageText;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !currentChatType || !currentChatUserId) {
        return;
    }
    const messageText = input.value.trim();
    if (!messageText) {
        return;
    }

    try {
        const response = await fetch('/api/admin/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_username: ADMIN_USERNAME,
                target_type: currentChatType,
                target_id: currentChatUserId,
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            input.value = '';
            loadChatMessages();
            loadConversations(); // Refresh conversation list
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
