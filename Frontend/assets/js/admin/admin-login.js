 
(function () {

    async function tryAutoLogin() {
        var token = sessionStorage.getItem("betterspace_admin_token");
        if (!token) {
            return;
        }

        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.ok) {
                window.location.href = "/assets/pages/admin/users.html";
                return;
            }
        } catch (_) {
            // Ignore network errors and fall back to manual login.
        }

        // Token is invalid/expired/unusable: remove it to force real login.
        sessionStorage.removeItem("betterspace_admin_token");
    }

    tryAutoLogin();

    document.addEventListener('DOMContentLoaded', function () {

        var usernameInput = document.getElementById('username');
        var passwordInput = document.getElementById('password');
        var errorMsg       = document.getElementById('errorMsg');
        var loginBtn       = document.getElementById('loginBtn');

        function clearError() {
            errorMsg.textContent = '';
        }

        async function attemptLogin() {
            clearError();

            var user = usernameInput.value.trim();
            var pass = passwordInput.value;

            if (!user || !pass) {
                errorMsg.textContent = 'Please fill in both fields.';
                return;
            }

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: user,
                        password: pass
                    })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    // Store the JWT token in sessionStorage
                    sessionStorage.setItem("betterspace_admin_token", data.token);
                    window.location.href = "/assets/pages/admin/users.html";
                } else {
                    errorMsg.textContent = data.error || 'Invalid username or password.';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                console.error('Login error:', error);
                errorMsg.textContent = 'Login failed. Please try again.';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        // Button click
        loginBtn.addEventListener('click', attemptLogin);

        // Enter key on either input
        usernameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') attemptLogin();
        });
        passwordInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') attemptLogin();
        });

        // Clear error when user starts typing again
        usernameInput.addEventListener('input', clearError);
        passwordInput.addEventListener('input', clearError);

        // Focus username on load
        usernameInput.focus();
    });

})();