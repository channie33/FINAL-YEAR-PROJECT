
// Auth guard — redirect to login if not authenticated
if (sessionStorage.getItem("betterspace_admin") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', function () {

    loadAllUsers();

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