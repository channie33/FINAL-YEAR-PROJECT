
// Auth guard — redirect to login if not authenticated
if (sessionStorage.getItem("betterspace_admin") !== "true") {
    window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', function () {

    loadVerificationRequests();

    // Logout button
    document.querySelector('.sidebar-item.logout').addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.removeItem("betterspace_admin");
        window.location.href = "/assets/pages/shared/index.html";
    });

});

async function loadVerificationRequests() {
    try {
        const response = await fetch('/api/admin/verifications');
        const data = await response.json();

        if (response.ok) {
            displayVerifications(data.pending_verifications);
        } else {
            console.error('Error:', data.error);
            document.body.innerHTML += '<p style="color: red; margin: 20px;">Error loading verification requests: ' + data.error + '</p>';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        document.body.innerHTML += '<p style="color: red; margin: 20px;">Error connecting to server</p>';
    }
}

function displayVerifications(verifications) {
    const verificationTable = document.querySelector('.verification-table tbody') || document.querySelector('table tbody');

    if (!verificationTable) {
        console.warn('Verification table tbody not found');
        return;
    }

    verificationTable.innerHTML = '';

    verifications.forEach(verification => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${verification.FullName}</td>
            <td>${verification.Email}</td>
            <td>${verification.Category}</td>
            <td>${verification.submission_date}</td>
            <td>
                <button class="document-icon" data-prof-id="${verification.ProfessionalID}">📄</button>
            </td>
            <td>
                <button class="approve-btn" data-prof-id="${verification.ProfessionalID}">Approve</button>
                <button class="reject-btn" data-prof-id="${verification.ProfessionalID}">Reject</button>
            </td>
        `;
        verificationTable.appendChild(row);

        // Document icon click to view document
        row.querySelector('.document-icon').addEventListener('click', function () {
            const profId = this.getAttribute('data-prof-id');
            alert('View document functionality for professional ID: ' + profId);
        });

        // Approve button
        row.querySelector('.approve-btn').addEventListener('click', function () {
            const profId = this.getAttribute('data-prof-id');
            verifyProfessional(profId, 'approved');
        });

        // Reject button
        row.querySelector('.reject-btn').addEventListener('click', function () {
            const profId = this.getAttribute('data-prof-id');
            verifyProfessional(profId, 'rejected');
        });
    });
}

async function verifyProfessional(profId, status) {
    try {
        const response = await fetch('/api/admin/verify-professional', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professional_id: profId,
                status: status
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Professional ' + status + ' successfully');
            loadVerificationRequests();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating verification status');
    }
}