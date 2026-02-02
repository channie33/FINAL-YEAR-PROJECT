// Load student messaging conversations
document.addEventListener('DOMContentLoaded', function () {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.id) {
        console.error('No user logged in');
        return;
    }

    loadStudentMessages(user.id);

    // Handle message sending
    const sendButton = document.getElementById('sendBtn') || document.querySelector('.send-btn');
    if (sendButton) {
        sendButton.addEventListener('click', function () {
            const messageInput = document.getElementById('messageInput') || document.querySelector('textarea');
            if (messageInput && messageInput.value.trim()) {
                // Message sending logic would go here
                messageInput.value = '';
            }
        });
    }
});

async function loadStudentMessages(userId) {
    try {
        const response = await fetch(`/api/student/messages?user_id=${userId}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            displayStudentMessages(data.data);
        } else {
            console.error('Error:', data.message || 'Failed to load messages');
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading messages: ' + (data.message || 'Unknown error') + '</p>';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.body.innerHTML += '<p style="color: red; margin: 20px;">Error connecting to server</p>';
    }
}

function displayStudentMessages(conversations) {
    const messageList = document.querySelector('.message-list') || document.querySelector('.conversations-container') || document.getElementById('msgList');

    if (!messageList) {
        console.warn('Message list container not found');
        return;
    }

    messageList.innerHTML = '';

    if (!conversations || conversations.length === 0) {
        messageList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No messages yet</p>';
        return;
    }

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

        // Add click handler to open conversation
        msgCard.querySelector('.open-chat-btn').addEventListener('click', function () {
            const profId = this.getAttribute('data-prof-id');
            openChat(profId, conversation.FullName);
        });
    });
}

function openChat(professionalId, professionalName) {
    // This would open a chat interface or navigate to message detail page
    console.log('Opening chat with professional ID:', professionalId);
    alert('Chat with ' + professionalName + ' would open here');
}
                }
            }
            return results.length > 0 ? results : demo();
        } catch (_) {
            return demo();
        }
    }

    //  Demo data 
    function demo() {
        return [
            { name: 'JOHN DOE', time: '13:00' },
            { name: 'JOHN DOE', time: '12/01/2026' },
            { name: 'JOHN DOE', time: '09/01/2026' }
        ];
    }

    // Render 
    function render(list) {
        container.innerHTML = '';
        list.forEach(function (conv) {
            var card = document.createElement('div');
            card.className = 'msg-card';
            card.innerHTML =
                '<div class="msg-name">'   + conv.name.toUpperCase() + '</div>' +
                '<div class="msg-dashes">— — — — — — — — — — — — — — — — —</div>' +
                '<div class="msg-time">'   + formatTime(conv.time)  + '</div>';
            container.appendChild(card);
        });
    }

    //  Time formatter 
    // Short strings (demo) pass through.  ISO timestamps get
    // formatted as HH:MM (today) or DD/MM/YYYY (older).
    function formatTime(raw) {
        if (!raw || raw.length <= 11) return raw || '';
        try {
            var d   = new Date(raw);
            var now = new Date();
            if (d.toDateString() === now.toDateString()) {
                return d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', hour12:false });
            }
            return d.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
        } catch (_) { return raw; }
    }
});