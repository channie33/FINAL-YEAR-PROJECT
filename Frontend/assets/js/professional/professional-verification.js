let selectedFile = null;

// File upload handling
document.getElementById('document-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        document.getElementById('fileName').textContent = file.name;
    }//saves and displays the file name
});

// Form submission
document.getElementById('verificationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const category = document.getElementById('category').value;
    
    if (!selectedFile) {
        alert('Please upload your qualification documents');
        return;
    }
    
    if (!category) {
        alert('Please select a category of care');
        return;
    }
    
    // Resolve professional ID: prefer pending registration session to avoid stale logged-in IDs
    const user = JSON.parse(localStorage.getItem('user_info') || localStorage.getItem('user') || '{}');
    const pendingUserId = localStorage.getItem('pending_user_id');
    const pendingUserType = localStorage.getItem('pending_user_type');

    let submissionUserId = null;

    if (pendingUserId && pendingUserType === 'professional') {
        submissionUserId = pendingUserId;
    } else if (user.user_id && user.user_type === 'professional') {
        submissionUserId = user.user_id;
    }

    if (!submissionUserId) {
        alert('Session expired. Please register or log in again.');
        window.location.href = '/assets/pages/shared/login.html';
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('user_id', submissionUserId);
    formData.append('specialization', category);
    
    try {
        const response = await fetch('/api/professional/submit-verification', {
            method: 'POST',
            body: formData
        }); //sends the form data to the server
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Documents submitted successfully! Your account will be verified by our admin team.');
            window.location.href = '/assets/pages/shared/login.html';
        } else {
            alert('Submission failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during submission. Please try again.');
    }
});
