// Auto-focus next input on entry (the cursor)
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
    input.addEventListener('input', function() {
        if (this.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value === '' && index > 0) {
            otpInputs[index - 1].focus();
        }
    });//to move the cursor to the previous input on backspace

    input.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });//to allow only numbers
});

window.addEventListener('load', function() {
    otpInputs[0].focus();
});

async function verifyOTP() {
    let otp = '';
    otpInputs.forEach(input => {
        otp += input.value;//combines all the OTP digits into a single string
    });

    if (otp.length !== 6) {
        alert('Please enter all 6 digits');
        return;
    }

    const userId = localStorage.getItem('pending_user_id');
    const userType = localStorage.getItem('pending_user_type');

    if (!userId || !userType) {
        alert('Session expired. Please register again.');
        window.location.href = '/assets/pages/shared/registration.html';
        return;
    }

    try {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                user_type: userType,
                otp_code: otp
            })
        });//sends the OTP verification request to the backend

        const data = await response.json();

        if (response.ok) {//clears the pending user data and redirects to home page on success
            alert('Email verified successfully!');
            try {
                const userRes = await fetch(`/api/user?user_id=${encodeURIComponent(userId)}&user_type=${encodeURIComponent(userType)}`);
                const userData = await userRes.json();
                if (userRes.ok && userData.status === 'success') {
                    localStorage.setItem('user', JSON.stringify(userData.user));
                }
            } catch (_) {
                // If user fetch fails, keep going; user can re-login
            }

            localStorage.removeItem('pending_user_id');
            localStorage.removeItem('pending_user_type');

            if (userType === 'professional') {
                window.location.href = '/assets/pages/professional/home.html';
            } else if (userType === 'admin') {
                window.location.href = '/assets/pages/admin/users.html';
            } else {
                window.location.href = '/assets/pages/student/home.html';
            }
        } else {
            alert('Invalid or expired OTP: ' + data.message);
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during verification. Please try again.');
    }
}
