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

// CSV download helper
function downloadTableAsCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    const csv = Array.from(rows).map(row =>
        Array.from(row.querySelectorAll('th, td'))
            .map(cell => '"' + cell.textContent.replace(/"/g, '""') + '"')
            .join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Tab switching
document.querySelectorAll('.report-tab').forEach(tab => {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.report-section').forEach(s => s.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('report-' + this.dataset.report).classList.add('active');
    });
});

function showError(msg) {
    const el = document.getElementById('report-error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function populateTable(tableId, rows, columns) {
    const tbody = document.querySelector('#' + tableId + ' tbody');
    tbody.innerHTML = '';
    if (!rows || rows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${columns.length}" style="text-align:center;color:#888;">No data available</td>`;
        tbody.appendChild(tr);
        return;
    }
    rows.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] !== null && row[col] !== undefined ? row[col] : '—';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// Helper function for authenticated fetch with auth check
function authenticatedFetch(url) {
    return fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem("betterspace_admin_token")
        }
    }).then(r => {
        // Check for unauthorized/forbidden
        if (r.status === 401 || r.status === 403) {
            sessionStorage.removeItem("betterspace_admin_token");
            window.location.href = "login.html";
            throw new Error('Unauthorized');
        }
        return r.json();
    });
}

// Load Report 1: User Registrations
authenticatedFetch('/api/admin/reports/registrations')
    .then(data => {
        if (data.status === 'success') {
            populateTable('table-registrations', data.data, ['month', 'user_type', 'count']);
        } else {
            showError('Failed to load registrations report.');
        }
    })
    .catch(() => showError('Error loading registrations report.'));

// Load Report 2: Sessions
authenticatedFetch('/api/admin/reports/sessions')
    .then(data => {
        if (data.status === 'success') {
            populateTable('table-sessions-professional', data.by_professional, ['professional_name', 'Category', 'total_sessions']);
            populateTable('table-sessions-category', data.by_category, ['Category', 'total_sessions']);
        } else {
            showError('Failed to load sessions report.');
        }
    })
    .catch(() => showError('Error loading sessions report.'));

// Load Report 3: Verification
authenticatedFetch('/api/admin/reports/verification')
    .then(data => {
        if (data.status === 'success') {
            populateTable('table-verification-status', data.by_status, ['VerificationStatus', 'count']);
            populateTable('table-verification-category', data.by_category, ['Category', 'VerificationStatus', 'count']);
        } else {
            showError('Failed to load verification report.');
        }
    })
    .catch(() => showError('Error loading verification report.'));

// Load Report 4: Feedback
authenticatedFetch('/api/admin/reports/feedback')
    .then(data => {
        if (data.status === 'success') {
            populateTable('table-feedback', data.data, ['professional_name', 'Category', 'avg_rating', 'total_reviews']);
        } else {
            showError('Failed to load feedback report.');
        }
    })
    .catch(() => showError('Error loading feedback report.'));

// Load Report 5: Messaging
authenticatedFetch('/api/admin/reports/messaging')
    .then(data => {
        if (data.status === 'success') {
            populateTable('table-messaging', data.data, ['month', 'total_messages', 'student_messages', 'professional_messages']);
        } else {
            showError('Failed to load messaging report.');
        }
    })
    .catch(() => showError('Error loading messaging report.'));
