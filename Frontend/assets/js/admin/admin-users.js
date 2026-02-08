
// Auth guard — redirect to login if not authenticated
if (sessionStorage.getItem("betterspace_admin") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', function () {

    loadAllUsers();
    loadAdminMessages();

    const replyForm = document.getElementById('adminReplyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', handleAdminReplySubmit);
    }

    // Logout button
    document.querySelector('.sidebar-item.logout').addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.removeItem("betterspace_admin");
        window.location.href = "/assets/pages/shared/index.html";
    });

});

const ADMIN_USERNAME = 'admin';

async function loadAllUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (response.ok) {
            displayUsers(data.users);
        } else {
            console.error('Error:', data.error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading users: ' + data.error + '</p>';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.body.innerHTML += '<p style="color: red; margin: 20px;">Error connecting to server</p>';
    }
}

function displayUsers(users) {
    const usersTable = document.querySelector('.users-table tbody') || document.querySelector('table tbody');
    
    if (!usersTable) {
        console.warn('Users table tbody not found');
        return;
    }

    usersTable.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.FullName}</td>
            <td>${user.Email}</td>
            <td>${user.user_type}</td>
            <td>${user.CreatedAt}</td>
            <td>
                <button class="email-button" data-email="${user.Email}">Email</button>
            </td>
        `;
        usersTable.appendChild(row);

        // Add email button click handler
        row.querySelector('.email-button').addEventListener('click', function () {
            const email = this.getAttribute('data-email');
            if (email) {
                window.location.href = 'mailto:' + email;
            }
        });
    });
}

async function loadAdminMessages() {
    try {
        const response = await fetch(`/api/admin/messages?admin_username=${encodeURIComponent(ADMIN_USERNAME)}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            displayAdminMessages(data.data || []);
        } else {
            displayAdminMessages([]);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        displayAdminMessages([]);
    }
}

function displayAdminMessages(messages) {
    const container = document.getElementById('adminMessagesList');
    if (!container) {
        return;
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No messages yet</p>';
        return;
    }

    container.innerHTML = '';
    messages.forEach(message => {
        const card = document.createElement('div');
        card.className = 'admin-message-card';
        const senderLabel = message.sender_label || message.Sender || 'Unknown';
        const sentAt = message.SentAt ? new Date(message.SentAt).toLocaleString() : '';
        const replyTarget = message.StudentID ? 'student' : (message.ProfessionalID ? 'professional' : '');
        const replyTargetId = message.StudentID || message.ProfessionalID || '';
        card.innerHTML = `
            <div class="admin-message-meta">
                <span>${senderLabel}</span>
                <span>${sentAt}</span>
            </div>
            <div class="admin-message-text">${message.MessageText || ''}</div>
            ${replyTarget ? '<div class="admin-message-actions"><button class="admin-reply-btn" type="button">Reply</button></div>' : ''}
        `;
        container.appendChild(card);

        const replyBtn = card.querySelector('.admin-reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', function () {
                prefillAdminReply(replyTarget, replyTargetId);
            });
        }
    });
}

function prefillAdminReply(targetType, targetId) {
    const typeSelect = document.getElementById('adminReplyTargetType');
    const idInput = document.getElementById('adminReplyTargetId');
    const messageInput = document.getElementById('adminReplyMessage');

    if (typeSelect && targetType) {
        typeSelect.value = targetType;
    }
    if (idInput && targetId) {
        idInput.value = targetId;
    }
    if (messageInput) {
        messageInput.focus();
    }
}

async function handleAdminReplySubmit(event) {
    event.preventDefault();

    const typeSelect = document.getElementById('adminReplyTargetType');
    const idInput = document.getElementById('adminReplyTargetId');
    const messageInput = document.getElementById('adminReplyMessage');

    if (!typeSelect || !idInput || !messageInput) {
        return;
    }

    const targetType = typeSelect.value;
    const targetId = idInput.value.trim();
    const messageText = messageInput.value.trim();

    if (!targetId || !messageText) {
        alert('Recipient ID and message are required.');
        return;
    }

    try {
        const response = await fetch('/api/admin/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_username: ADMIN_USERNAME,
                target_type: targetType,
                target_id: targetId,
                message_text: messageText
            })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            messageInput.value = '';
            loadAdminMessages();
            alert('Reply sent.');
        } else {
            alert(data.message || 'Failed to send reply.');
        }
    } catch (error) {
        console.error('Send error:', error);
        alert('Error sending reply.');
    }
}