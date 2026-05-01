document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();//stops the page from reloading
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {//to send log in request to the backend
        const data = await apiPost('/api/login', { email, password }, { includeAuth: false });
        
        if (data.status === 'success') {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('pending_user_id', data.user.user_id);
            localStorage.setItem('pending_user_type', data.user.user_type);
            
            // Redirect to OTP page
            window.location.href = '/assets/pages/shared/otp.html';
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login. Please try again.');
    }
});