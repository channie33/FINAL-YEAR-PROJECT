// Robust auth check with redirect on unauthorized
function checkAdminAuth() {
    var adminToken = sessionStorage.getItem("betterspace_admin_token");
    if (!adminToken) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Auth guard on page load
if (!checkAdminAuth()) {
    throw new Error("Not authenticated");
}

const ADMIN_USERNAME = 'admin';
const ADMIN_CONVERSATION_SEEN_KEY = 'betterspace_admin_conversation_seen_v2';
let currentChatType = null; // 'student' or 'professional'
let currentChatUserId = null;
let currentChatUserName = '';
let conversations = []; // Store all conversations
let allAdminMessages = []; // Latest admin-visible messages cache
let conversationSeenMap = loadConversationSeenMap();

function toMillis(value) {
    if (!value) {
        return 0;
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
}

function safeMs(value) {
    const ms = Number(value);
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character];
    });
}

function getConversationKey(type, userId) {
    return `${type}_${userId}`;
}

function loadConversationSeenMap() {
    try {
        return JSON.parse(localStorage.getItem(ADMIN_CONVERSATION_SEEN_KEY) || '{}');
    } catch (error) {
        console.error('Failed to load admin seen map:', error);
        return {};
    }
}

function saveConversationSeenMap() {
    localStorage.setItem(ADMIN_CONVERSATION_SEEN_KEY, JSON.stringify(conversationSeenMap));
}

function getMessagesForConversation(type, userId) {
    return (allAdminMessages || []).filter(msg => {
        if (type === 'student') {
            return String(msg.StudentID) === String(userId);
        }
        return String(msg.ProfessionalID) === String(userId);
    });
}

function getConversationLatestMs(type, userId) {
    return getMessagesForConversation(type, userId)
        .reduce((maxMs, msg) => Math.max(maxMs, toMillis(msg.SentAt)), 0);
}

function getUnreadCount(type, userId) {
    const key = getConversationKey(type, userId);
    const latestMs = getConversationLatestMs(type, userId);
    let seenMs = conversationSeenMap[key];

    if (seenMs === undefined) {
        // First load: treat existing history as already seen.
        conversationSeenMap[key] = latestMs;
        saveConversationSeenMap();
        seenMs = latestMs;
    } else {
        seenMs = safeMs(seenMs);
        // Self-heal old bad state where seen time was saved with client Date.now().
        if (seenMs > latestMs) {
            conversationSeenMap[key] = latestMs;
            saveConversationSeenMap();
            seenMs = latestMs;
        }
    }

    return getMessagesForConversation(type, userId)
        .filter(msg => msg.Sender !== 'Admin' && toMillis(msg.SentAt) > seenMs)
        .length;
}

function markConversationRead(type, userId) {
    const key = getConversationKey(type, userId);
    const latestMs = getConversationLatestMs(type, userId);
    const currentSeenMs = safeMs(conversationSeenMap[key]);
    conversationSeenMap[key] = Math.max(currentSeenMs, latestMs);
    saveConversationSeenMap();
}

function renderConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) {
        return;
    }

    if (!conversations || conversations.length === 0) {
        conversationsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No conversations yet</p>';
        return;
    }

    conversationsList.innerHTML = '';
    conversations.forEach(conv => {
        const typeLabel = conv.type === 'student' ? 'Student' : 'Professional';
        const unreadCount = getUnreadCount(conv.type, conv.userId);
        const hasNew = unreadCount > 0;

        const item = document.createElement('div');
        item.className = 'conversation-item' + (hasNew ? ' new-chat' : '');

        const topRow = document.createElement('div');
        topRow.className = 'conv-top-row';

        const nameEl = document.createElement('div');
        nameEl.className = 'conv-name';
        nameEl.textContent = conv.name || 'User';
        topRow.appendChild(nameEl);

        if (hasNew) {
            const unreadDot = document.createElement('span');
            unreadDot.className = 'unread-dot';
            unreadDot.setAttribute('aria-label', 'Unread');
            topRow.appendChild(unreadDot);
        }

        const typeEl = document.createElement('div');
        typeEl.className = 'conv-type';
        typeEl.textContent = typeLabel;

        const timeEl = document.createElement('div');
        timeEl.className = 'conv-time';
        timeEl.textContent = new Date(conv.lastMessageTime).toLocaleDateString();

        item.appendChild(topRow);
        item.appendChild(typeEl);
        item.appendChild(timeEl);
        item.addEventListener('click', function () {
            openChat(conv.type, conv.userId, conv.name);
        });

        conversationsList.appendChild(item);
    });
}

// Global function for opening chat
function openChat(type, userId, userName) {
    currentChatType = type;
    currentChatUserId = userId;
    currentChatUserName = userName || 'User';

    markConversationRead(type, userId);
    renderConversationsList();
    
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
            sessionStorage.removeItem("betterspace_admin_token");
            window.location.href = "/assets/pages/shared/index.html";
        });
    }
});

async function loadConversations() {
    try {
        const response = await fetch(`/api/admin/messages?admin_username=${encodeURIComponent(ADMIN_USERNAME)}&limit=500`, {
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem("betterspace_admin_token")
            }
        });
        const data = await response.json();
        
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("betterspace_admin_token");
            window.location.href = "login.html";
            return;
        }
        
        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message || 'Failed to load conversations');
        }
        
        const messages = data.data || [];
        allAdminMessages = messages;
        
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

        // Initialize conversation seen state for existing threads so old history is not flagged as unread.
        let seenMapChanged = false;
        conversations.forEach(conv => {
            const key = getConversationKey(conv.type, conv.userId);
            const latestMs = toMillis(conv.lastMessageTime);
            if (conversationSeenMap[key] === undefined) {
                conversationSeenMap[key] = latestMs;
                seenMapChanged = true;
            } else if (Number(conversationSeenMap[key]) > latestMs) {
                conversationSeenMap[key] = latestMs;
                seenMapChanged = true;
            }
        });
        if (seenMapChanged) {
            saveConversationSeenMap();
        }

        renderConversationsList();
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
        // Ensure we have fresh data before filtering a specific thread.
        if (!allAdminMessages || allAdminMessages.length === 0) {
            await loadConversations();
        }

        const filteredMessages = getMessagesForConversation(currentChatType, currentChatUserId);

        filteredMessages.sort((a, b) => new Date(a.SentAt) - new Date(b.SentAt));
        renderChatMessages(filteredMessages);
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
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem("betterspace_admin_token")
            },
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
            await loadConversations(); // Refresh message cache + conversation list
            loadChatMessages();
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
