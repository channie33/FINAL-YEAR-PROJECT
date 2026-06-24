const ADMIN_USERNAME = 'admin';
const PROFESSIONAL_CONVERSATION_SEEN_KEY = 'betterspace_professional_conversation_seen_v2';
const PROFESSIONAL_ADMIN_SEEN_KEY = 'betterspace_professional_admin_seen_v2';

function getAdminSeenMs() {
    const stored = localStorage.getItem(PROFESSIONAL_ADMIN_SEEN_KEY);
    return stored === null ? null : Number(stored);
}

function markAdminRead(latestMs) {
    const current = getAdminSeenMs() || 0;
    localStorage.setItem(PROFESSIONAL_ADMIN_SEEN_KEY, String(Math.max(current, latestMs)));
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
let currentProfessionalId = null;
let currentChatStudentId = null;
let currentChatStudentName = '';
let isAdminChat = false;
let professionalConversationSeenMap = loadConversationSeenMap();

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

function getConversationKey(studentId) {
    return String(studentId);
}

function loadConversationSeenMap() {
    try {
        return JSON.parse(localStorage.getItem(PROFESSIONAL_CONVERSATION_SEEN_KEY) || '{}');
    } catch (error) {
        console.error('Failed to load professional seen map:', error);
        return {};
    }
}

function saveConversationSeenMap() {
    localStorage.setItem(PROFESSIONAL_CONVERSATION_SEEN_KEY, JSON.stringify(professionalConversationSeenMap));
}

function markConversationRead(studentId, latestTime) {
    const key = getConversationKey(studentId);
    const latestMs = toMillis(latestTime);
    const currentSeen = Number(professionalConversationSeenMap[key] || 0);
    professionalConversationSeenMap[key] = Math.max(currentSeen, latestMs);
    saveConversationSeenMap();
}

function getLatestStudentSenderMs(messages) {
    return (messages || []).reduce((max, message) => {
        if (message.Sender !== 'Student') {
            return max;
        }
        return Math.max(max, toMillis(message.SentAt));
    }, 0);
}

async function getUnreadCountForStudent(studentId) {
    if (!currentProfessionalId) {
        return 0;
    }

    try {
        const response = await fetch(`/api/messages?student_id=${studentId}&professional_id=${currentProfessionalId}`, {
            headers: authHeaders()
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'success') {
            return 0;
        }

        const key = getConversationKey(studentId);
        const messages = data.data || [];
        const latestIncomingMs = getLatestStudentSenderMs(messages);

        if (professionalConversationSeenMap[key] === undefined) {
            professionalConversationSeenMap[key] = latestIncomingMs;
            saveConversationSeenMap();
        }

        const seenMs = safeMs(professionalConversationSeenMap[key]);
        return messages.filter(msg => msg.Sender === 'Student' && toMillis(msg.SentAt) > seenMs).length;
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
            const response = await fetch(`/api/professional/messages?user_id=${userId}`, {
                headers: authHeaders()
            });
            const data = await response.json();
            
            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to load messages');
            }
            
            const conversations = data.data || [];

            const unreadCounts = await Promise.all(
                conversations.map(conv => getUnreadCountForStudent(conv.StudentID))
            );
            const enrichedConversations = conversations.map((conv, index) => ({
                ...conv,
                unreadCount: unreadCounts[index] || 0
            }));
            
            // Display conversations in sidebar
            const conversationsList = document.getElementById('conversationsList');
            if (conversationsList) {
                if (enrichedConversations.length > 0) {
                    conversationsList.innerHTML = '';
                    enrichedConversations.forEach(conv => {
                        const hasNew = Number(conv.unreadCount || 0) > 0;
                        const item = document.createElement('div');
                        item.className = 'conversation-item' + (hasNew ? ' new-chat' : '');

                        const topRow = document.createElement('div');
                        topRow.className = 'conv-top-row';

                        const nameEl = document.createElement('div');
                        nameEl.className = 'conv-name';
                        nameEl.textContent = conv.FullName || 'Student';
                        topRow.appendChild(nameEl);

                        if (hasNew) {
                            const unreadDot = document.createElement('span');
                            unreadDot.className = 'unread-dot';
                            unreadDot.setAttribute('aria-label', 'Unread');
                            topRow.appendChild(unreadDot);
                        }

                        const timeEl = document.createElement('div');
                        timeEl.className = 'conv-time';
                        timeEl.textContent = new Date(conv.last_message_time).toLocaleDateString();

                        item.appendChild(topRow);
                        item.appendChild(timeEl);
                        item.addEventListener('click', function () {
                            openChat(conv.StudentID, conv.FullName);
                        });

                        conversationsList.appendChild(item);
                    });
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
        refreshAdminUnreadDot();
        window.setInterval(refreshAdminUnreadDot, 15000);
    }
});

function openAdminChat() {
    isAdminChat = true;
    currentChatStudentId = null;

    // Hide dot immediately; read state is finalized after latest messages load.
    setAdminBtnDot(false);

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
        const response = await fetch(`/api/messages?student_id=${currentChatStudentId}&professional_id=${currentProfessionalId}`, {
            headers: authHeaders()
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            const messages = data.data || [];
            const latestIncomingMs = getLatestStudentSenderMs(messages);
            if (latestIncomingMs > 0) {
                markConversationRead(currentChatStudentId, latestIncomingMs);
            }
            renderChatMessages(messages);
            if (typeof window.loadMessages === 'function') {
                window.loadMessages();
            }
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
                headers: authHeaders({ 'Content-Type': 'application/json' }),
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
        const response = await fetch(`/api/professional/admin-messages?user_id=${currentProfessionalId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`, {
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

            renderAdminMessages(messages);
        } else {
            renderAdminMessages([]);
        }
    } catch (error) {
        console.error('Admin fetch error:', error);
        renderAdminMessages([]);
    }
}

async function refreshAdminUnreadDot() {
    if (!currentProfessionalId) {
        return;
    }

    try {
        const response = await fetch(`/api/professional/admin-messages?user_id=${currentProfessionalId}&admin_username=${encodeURIComponent(ADMIN_USERNAME)}`, {
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
            headers: authHeaders({ 'Content-Type': 'application/json' }),
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
