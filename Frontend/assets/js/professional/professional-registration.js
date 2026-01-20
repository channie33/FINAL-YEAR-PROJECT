
document.getElementById('professionalForm').addEventListener('submit', async function(e) {
    e.preventDefault(); //stops the page from reloading
    
    const name = document.getElementById('professional-name').value;
    const email = document.getElementById('professional-email').value;
    const password = document.getElementById('professional-password').value;
    const confirmPassword = document.getElementById('professional-confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Validate password complexity
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        alert('Password must contain at least one uppercase letter');
        return;
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        alert('Password must contain at least one lowercase letter');
        return;
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
        alert('Password must contain at least one number');
        return;
    }
    
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        alert('Password must contain at least one special character (!@#$%^&*)');
        return;
    }
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    // Prepare data for API
    const userData = {
        email: email,
        password: password,
        user_type: 'professional',
        first_name: firstName,
        last_name: lastName
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Your account is pending verification.');
            // Store user info for OTP verification
            localStorage.setItem('pending_user_id', data.user_id);
            localStorage.setItem('pending_user_type', data.user_type);
            // Redirect to professional verification page
            window.location.href = '/pages/professional/verification.html';
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration. Please try again.');
    }
});
