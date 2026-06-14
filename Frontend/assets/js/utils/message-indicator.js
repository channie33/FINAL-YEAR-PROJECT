(function () {
    const path = window.location.pathname.toLowerCase();
    const isStudentArea = path.includes('/assets/pages/student/');
    const isProfessionalArea = path.includes('/assets/pages/professional/');
    const isAdminArea = path.includes('/assets/pages/admin/');

    if (!isStudentArea && !isProfessionalArea && !isAdminArea) {
        return;
    }

    function readUserContext() {
        try {
            if (isAdminArea) {
                const token = sessionStorage.getItem('betterspace_admin_token');
                if (!token) {
                    return null;
                }
                return { userId: 'admin', token: token };
            }

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.user_id || user.id;
            const token = localStorage.getItem('auth_token');
            if (!userId || !token) {
                return null;
            }
            return { userId: String(userId), token: token };
        } catch (error) {
            console.error('Unable to read user context:', error);
            return null;
        }
    }

    function getStorageKeys(role, userId) {
        return {
            lastSeenKey: `betterspace_messages_last_seen_${role}_${userId}`,
            lastKnownKey: `betterspace_messages_last_known_${role}_${userId}`
        };
    }

    function ensureDotStyle() {
        if (document.getElementById('message-notification-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'message-notification-style';
        style.textContent = `
            .notification-badge {
                display: inline-block;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #d91e18;
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
            }

            .nav-links a[href*="/messaging.html"] {
                position: relative;
            }

            .nav-links a[href*="/messaging.html"] .notification-badge {
                position: absolute;
                top: -6px;
                right: 8px;
                margin-left: 0;
            }

            .sidebar a[href*="/assets/pages/admin/messaging.html"] {
                position: relative;
            }

            .sidebar a[href*="/assets/pages/admin/messaging.html"] .notification-badge {
                position: absolute;
                top: -6px;
                right: 8px;
                margin-left: 0;
            }
        `;

        document.head.appendChild(style);
    }

    function getMessagesNavLink() {
        if (isAdminArea) {
            return document.querySelector('.sidebar a[href*="/assets/pages/admin/messaging.html"]');
        }
        return document.querySelector('.nav-links a[href*="/messaging.html"]');
    }

    function getOrCreateBadge() {
        const messagesLink = getMessagesNavLink();
        if (!messagesLink) {
            return null;
        }

        let badge = messagesLink.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.display = 'none';
            messagesLink.appendChild(badge);
        }
        return badge;
    }

    function setBadgeVisible(visible) {
        const badge = getOrCreateBadge();
        if (!badge) {
            return;
        }

        badge.style.display = visible ? 'inline-block' : 'none';
    }

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

    async function fetchJson(url, token) {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    }

    async function getLatestStudentMessageMs(userId, token) {
        const conversations = await fetchJson(`/api/student/messages?user_id=${encodeURIComponent(userId)}`, token);
        const adminMessages = await fetchJson(`/api/student/admin-messages?user_id=${encodeURIComponent(userId)}&admin_username=admin`, token);

        let latest = 0;
        const convList = (conversations && conversations.data) || [];
        for (const conv of convList) {
            latest = Math.max(latest, toMillis(conv.last_message_time));
        }

        const adminList = (adminMessages && adminMessages.data && adminMessages.data.messages) || [];
        for (const message of adminList) {
            latest = Math.max(latest, toMillis(message.SentAt));
        }

        return latest;
    }

    async function getLatestProfessionalMessageMs(userId, token) {
        const conversations = await fetchJson(`/api/professional/messages?user_id=${encodeURIComponent(userId)}`, token);
        const adminMessages = await fetchJson(`/api/professional/admin-messages?user_id=${encodeURIComponent(userId)}&admin_username=admin`, token);

        let latest = 0;
        const convList = (conversations && conversations.data) || [];
        for (const conv of convList) {
            latest = Math.max(latest, toMillis(conv.last_message_time));
        }

        const adminList = (adminMessages && adminMessages.data && adminMessages.data.messages) || [];
        for (const message of adminList) {
            latest = Math.max(latest, toMillis(message.SentAt));
        }

        return latest;
    }

    async function getLatestAdminMessageMs(token) {
        const adminMessages = await fetchJson('/api/admin/messages?admin_username=admin&limit=500', token);

        let latest = 0;
        const list = (adminMessages && adminMessages.data) || [];
        for (const message of list) {
            latest = Math.max(latest, toMillis(message.SentAt));
        }

        return latest;
    }

    async function pollUnreadState() {
        const context = readUserContext();
        if (!context) {
            setBadgeVisible(false);
            return;
        }

        const role = isStudentArea ? 'student' : (isProfessionalArea ? 'professional' : 'admin');
        const keys = getStorageKeys(role, context.userId);

        let latestMs = 0;
        try {
            if (isStudentArea) {
                latestMs = await getLatestStudentMessageMs(context.userId, context.token);
            } else if (isProfessionalArea) {
                latestMs = await getLatestProfessionalMessageMs(context.userId, context.token);
            } else {
                latestMs = await getLatestAdminMessageMs(context.token);
            }
        } catch (error) {
            console.error('Message indicator poll failed:', error);
            return;
        }

        const currentLastKnown = safeMs(localStorage.getItem(keys.lastKnownKey));
        if (latestMs > currentLastKnown) {
            localStorage.setItem(keys.lastKnownKey, String(latestMs));
        }

        const onMessagesPage = path.endsWith('/messaging.html');
        if (onMessagesPage) {
            const seenValue = Math.max(latestMs, safeMs(localStorage.getItem(keys.lastSeenKey)));
            localStorage.setItem(keys.lastSeenKey, String(seenValue));
            setBadgeVisible(false);
            return;
        }

        const lastSeenRaw = localStorage.getItem(keys.lastSeenKey);
        if (lastSeenRaw === null) {
            // First visit: treat existing history as already seen.
            localStorage.setItem(keys.lastSeenKey, String(latestMs));
            setBadgeVisible(false);
            return;
        }

        const lastSeen = safeMs(lastSeenRaw);
        setBadgeVisible(latestMs > lastSeen);
    }

    document.addEventListener('DOMContentLoaded', function () {
        ensureDotStyle();
        pollUnreadState();
        window.setInterval(pollUnreadState, 15000);
    });
})();
