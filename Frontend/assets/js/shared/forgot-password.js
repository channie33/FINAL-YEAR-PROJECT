/**
 * Forgot Password Handler
 * Sends OTP to user's email for password reset
 */

const API_URL = 'https://localhost:8443';

document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const messageDiv = document.getElementById('message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email) {
        showMessage('Please enter your email', 'error');
        return;
    }
    
    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';
    
    try {
        const response = await fetch(`${API_URL}/api/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            // Store email and user info for reset-password page
            sessionStorage.setItem('resetEmail', email);
            sessionStorage.setItem('resetUserId', data.user_id);
            sessionStorage.setItem('resetUserType', data.user_type);
            
            showMessage('OTP sent to your email! Redirecting...', 'success');
            
            // Redirect to reset password page after 2 seconds
            setTimeout(() => {
                window.location.href = '/assets/pages/shared/reset-password.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to send OTP', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'SEND OTP';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'SEND OTP';
    }
});

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = type === 'success' ? '#28a745' : '#dc3545';
    messageDiv.style.fontWeight = 'bold';
}
