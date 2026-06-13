/**
 * Reset Password Handler
 * Verifies OTP and resets user password
 */

const API_URL = 'https://localhost:8443';

// Check if we have the email from forgot-password page
window.addEventListener('DOMContentLoaded', () => {
    const email = sessionStorage.getItem('resetEmail');
    if (!email) {
        showMessage('Please use "Forgot Password" to start the reset process', 'error');
        setTimeout(() => {
            window.location.href = '/assets/pages/shared/login.html';
        }, 3000);
    }
});

document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = document.getElementById('otp').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!otp || !newPassword || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        showMessage('OTP must be 6 digits', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showMessage('Password must be at least 8 characters', 'error');
        return;
    }
    
    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = 'RESETTING...';
    
    try {
        const email = sessionStorage.getItem('resetEmail');
        const userType = sessionStorage.getItem('resetUserType');
        
        const response = await fetch(`${API_URL}/api/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                otp_code: otp,
                new_password: newPassword,
                user_type: userType
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showMessage('Password reset successfully! Redirecting to login...', 'success');
            
            // Clear session data
            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetUserId');
            sessionStorage.removeItem('resetUserType');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/assets/pages/shared/login.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Failed to reset password', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'RESET PASSWORD';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('An error occurred. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'RESET PASSWORD';
    }
});

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.style.color = type === 'success' ? '#28a745' : '#dc3545';
    messageDiv.style.fontWeight = 'bold';
}
