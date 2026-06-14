// Load student messaging conversations
const ADMIN_USERNAME = 'admin';
const STUDENT_CONVERSATION_SEEN_KEY = 'betterspace_student_conversation_seen_v2';
const STUDENT_ADMIN_SEEN_KEY = 'betterspace_student_admin_seen_v2';

function getAdminSeenMs() {
    const stored = localStorage.getItem(STUDENT_ADMIN_SEEN_KEY);
    return stored === null ? null : Number(stored);
}

function markAdminRead(latestMs) {
    const current = getAdminSeenMs() || 0;
    localStorage.setItem(STUDENT_ADMIN_SEEN_KEY, String(Math.max(current, latestMs)));
}

function getLatestAdminSenderMs(messages) {
    return (messages || []).reduce((max, message) => {
        if (message.Sender !== 'Admin') {
            return max;
        }
        return Math.max(max, toMillis(message.SentAt));
    }, 0);
}

function setAdminBtnDot(visible) {
    const btn = document.getElementById('messageAdminBtn');
    if (!btn) return;
    let dot = btn.querySelector('.admin-unread-dot');
    if (visible) {
        if (!dot) {
            dot = document.createElement('span');
            dot.className = 'admin-unread-dot';
            btn.appendChild(dot);
        }
        dot.style.display = 'inline-block';
    } else if (dot) {
        dot.style.display = 'none';
    }
}
let currentUserId = null;
let currentChatProfessionalId = null;
let currentChatProfessionalName = '';
let isAdminChat = false;
let studentConversationSeenMap = loadConversationSeenMap();

function toMillis(value) {
    if (!value) {
        return 0;
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
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

function getConversationKey(professionalId) {
    return String(professionalId);
}

function loadConversationSeenMap() {
    try {
        return JSON.parse(localStorage.getItem(STUDENT_CONVERSATION_SEEN_KEY) || '{}');
    } catch (error) {
        console.error('Failed to load student conversation seen map:', error);
        return {};
    }
}

function saveConversationSeenMap() {
    localStorage.setItem(STUDENT_CONVERSATION_SEEN_KEY, JSON.stringify(studentConversationSeenMap));
}

function markConversationRead(professionalId, latestTime) {
    const key = getConversationKey(professionalId);
    const latestMs = toMillis(latestTime);
    const currentSeen = Number(studentConversationSeenMap[key] || 0);
    studentConversationSeenMap[key] = Math.max(currentSeen, latestMs);
    saveConversationSeenMap();
}

function getLatestProfessionalSenderMs(messages) {
    return (messages || []).reduce((max, message) => {
        if (message.Sender !== 'Professional') {
            return max;
        }
        return Math.max(max, toMillis(message.SentAt));
    }, 0);
}

async function getUnreadCountForProfessional(professionalId) {
    if (!currentUserId) {
        return 0;
    }

    try {
        const response = await fetch(`/api/messages?student_id=${currentUserId}&professional_id=${professionalId}`, {
            headers: authHeaders()
        });
        const data = await response.json();

function safeMs(value) {
    const ms = Number(value);
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
}
        if (!response.ok || data.status !== 'success') {
            return 0;
        }
    return stored === null ? null : safeMs(stored);
        const key = getConversationKey(professionalId);
        const messages = data.data || [];
        const latestIncomingMs = getLatestProfessionalSenderMs(messages);

    localStorage.setItem(STUDENT_ADMIN_SEEN_KEY, String(Math.max(current, safeMs(latestMs))));
            studentConversationSeenMap[key] = latestIncomingMs;
            saveConversationSeenMap();
            return 0;
        }

    const currentSeen = safeMs(studentConversationSeenMap[key]);
        return messages.filter(msg => msg.Sender === 'Professional' && toMillis(msg.SentAt) > seenMs).length;
    } catch (error) {
        console.error('Unread count fetch error:', error);
        return 0;
    }
}

function authHeaders(extraHeaders = {}) {
    const token = localStorage.getItem('auth_token');
    return {
        'Authorization': 'Bearer ' + token,
        ...extraHeaders
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const userId = getLoggedInUserId();
    if (!userId) {
        window.location.href = '/assets/pages/shared/login.html';
        return;
    }

    currentUserId = userId;

    loadStudentMessages(userId);
    refreshAdminUnreadDot();
    window.setInterval(refreshAdminUnreadDot, 15000);

        const seenMs = safeMs(studentConversationSeenMap[key]);
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
        const response = await fetch(`/api/student/messages?user_id=${userId}`, {
            headers: authHeaders()
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            const conversations = data.data || [];

            const unreadCounts = await Promise.all(
                conversations.map(conv => getUnreadCountForProfessional(conv.ProfessionalID))
            );
            const enrichedConversations = conversations.map((conv, index) => ({
                ...conv,
                unreadCount: unreadCounts[index] || 0
            }));
            displayStudentMessages(enrichedConversations);
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
            const hasNew = Number(conversation.unreadCount || 0) > 0;
            const msgCard = document.createElement('div');
            msgCard.className = 'msg-card' + (hasNew ? ' new-chat' : '');
            msgCard.innerHTML = `
                <div class="msg-top-row">
                    <div class="msg-name">${escapeHtml(conversation.FullName)}</div>
                    ${hasNew ? '<span class="unread-dot" aria-label="Unread"></span>' : ''}
                </div>
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
        const response = await fetch(`/api/messages?student_id=${currentUserId}&professional_id=${currentChatProfessionalId}`, {
            headers: authHeaders()
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            const messages = data.data || [];
            const latestIncomingMs = getLatestProfessionalSenderMs(messages);
            if (latestIncomingMs > 0) {
                markConversationRead(currentChatProfessionalId, latestIncomingMs);
            }
            renderChatMessages(messages);
            loadStudentMessages(currentUserId);
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
            headers: authHeaders({ 'Content-Type': 'application/json' }),
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

    // Hide dot immediately; read state is finalized after latest messages load.
    setAdminBtnDot(false);

    // Remove active class from all conversation cards
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
        const response = await fetch(`/api/student/admin-messages?user_id=${currentUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`, {
            headers: authHeaders()
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            const messages = data.data.messages || [];

            // Update admin unread dot
            const latestMs = getLatestAdminSenderMs(messages);
            let seenMs = getAdminSeenMs();
            // Self-heal old bad state where seen time was saved with client Date.now().
            if (seenMs !== null && seenMs > latestMs) {
                markAdminRead(latestMs);
                seenMs = latestMs;
            }
            if (seenMs === null) {
                // First visit — show the dot if admin messages exist.
                setAdminBtnDot(latestMs > 0);
            } else if (isAdminChat) {
                markAdminRead(latestMs);
                setAdminBtnDot(false);
            } else {
                const hasUnread = latestMs > seenMs;
                setAdminBtnDot(hasUnread);
            }

            renderChatMessages(messages, true);
        } else {
            renderChatMessages([], true);
        }
    } catch (error) {
        console.error('Admin fetch error:', error);
        renderChatMessages([], true);
    }
}

async function refreshAdminUnreadDot() {
    if (!currentUserId) {
        return;
    }

    try {
        const response = await fetch(`/api/student/admin-messages?user_id=${currentUserId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`, {
            headers: authHeaders()
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'success') {
            return;
        }

        const messages = data.data.messages || [];
        const latestMs = getLatestAdminSenderMs(messages);
        let seenMs = getAdminSeenMs();

        // Self-heal old bad state where seen time was saved with client Date.now().
        if (seenMs !== null && seenMs > latestMs) {
            markAdminRead(latestMs);
            seenMs = latestMs;
        }

        if (seenMs === null) {
            setAdminBtnDot(latestMs > 0);
            return;
        }

        if (isAdminChat) {
            markAdminRead(latestMs);
            setAdminBtnDot(false);
            return;
        }

        const hasUnread = latestMs > seenMs;
        setAdminBtnDot(hasUnread);
    } catch (error) {
        console.error('Admin unread check error:', error);
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
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                student_id: currentUserId,
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
