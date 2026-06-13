

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

document.addEventListener('DOMContentLoaded', function () {

    loadVerificationRequests();

    // Logout button
    document.querySelector('.sidebar-item.logout').addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.removeItem("betterspace_admin_token");
        window.location.href = "/assets/pages/shared/index.html";
    });

});


async function loadVerificationRequests() {
    try {
        const response = await fetch('/api/admin/verifications', {
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
        const hasDocument = !!verification.FilePath;

        row.innerHTML = `
            <td>${verification.FullName}</td>
            <td>${verification.Email}</td>
            <td>${verification.Category}</td>
            <td>${verification.submission_date}</td>
            <td>
                ${hasDocument
                    ? `<button class="document-icon" data-prof-id="${verification.ProfessionalID}" title="View document">📄</button>`
                    : '<span title="No document uploaded">—</span>'}
            </td>
            <td>
                <button class="approve-btn" data-prof-id="${verification.ProfessionalID}">Approve</button>
                <button class="reject-btn" data-prof-id="${verification.ProfessionalID}">Reject</button>
            </td>
        `;
        verificationTable.appendChild(row);

        // Document icon click to view document
        const documentButton = row.querySelector('.document-icon');
        if (documentButton) {
            documentButton.addEventListener('click', function () {
                const profId = this.getAttribute('data-prof-id');
                const url = `/api/admin/verification-document?professional_id=${encodeURIComponent(profId)}`;
                const token = sessionStorage.getItem("betterspace_admin_token");
                // For file download, we need to use a different approach
                fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                .then(response => response.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'document';
                    a.click();
                    window.URL.revokeObjectURL(url);
                })
                .catch(err => console.error('Error downloading document:', err));
            });
        }

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
                'Authorization': 'Bearer ' + sessionStorage.getItem("betterspace_admin_token")
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


