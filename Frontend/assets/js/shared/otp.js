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
        });
        const data = await response.json();

        if (response.ok) {
            // Always fetch the full user object after verification
            let userFetched = false;
            try {
                const userRes = await fetch(`/api/user?user_id=${encodeURIComponent(userId)}&user_type=${encodeURIComponent(userType)}`);
                const userData = await userRes.json();
                if (userRes.ok && userData.status === 'success' && userData.user) {
                    // Normalize user object for students: ensure both user_id and StudentID are present
                    let userObj = userData.user;
                    if (userType === 'student') {
                        // If StudentID exists, set user_id to StudentID for compatibility
                        if (userObj.StudentID) {
                            userObj.user_id = userObj.StudentID;
                        }
                    }
                    localStorage.setItem('user', JSON.stringify(userObj));
                    userFetched = true;
                } else {
                    alert('Could not fetch user details after verification. Please log in again.');
                    window.location.href = '/assets/pages/shared/login.html';
                    return;
                }
            } catch (err) {
                alert('Could not fetch user details after verification. Please log in again.');
                window.location.href = '/assets/pages/shared/login.html';
                return;
            }

            localStorage.removeItem('pending_user_id');
            localStorage.removeItem('pending_user_type');

            alert('Email verified successfully!');

            if (userType === 'professional') {
                window.location.href = '/assets/pages/professional/home.html';
            } else if (userType === 'admin') {
                window.location.href = '/assets/pages/admin/users.html';
            } else {
                window.location.href = '/assets/pages/student/home.html';
            }
        } else {
            alert('Invalid or expired OTP: ' + (data.message || 'Unknown error'));
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during verification. Please try again.');
    }
}
