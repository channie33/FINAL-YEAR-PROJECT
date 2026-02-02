 
(function () {

    var ADMIN_USER = "admin";
    var ADMIN_PASS = "admin123";

    // If already logged in, skip straight to users page
    if (sessionStorage.getItem("betterspace_admin") === "true") {
        window.location.href = "/assets/pages/admin/users.html";
    }

    document.addEventListener('DOMContentLoaded', function () {

        var usernameInput = document.getElementById('username');
        var passwordInput = document.getElementById('password');
        var errorMsg       = document.getElementById('errorMsg');
        var loginBtn       = document.getElementById('loginBtn');

        function clearError() {
            errorMsg.textContent = '';
        }

        function attemptLogin() {
            clearError();

            var user = usernameInput.value.trim();
            var pass = passwordInput.value;

            if (!user || !pass) {
                errorMsg.textContent = 'Please fill in both fields.';
                return;
            }

            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                sessionStorage.setItem("betterspace_admin", "true");
                window.location.href = "/assets/pages/admin/users.html";
            } else {
                errorMsg.textContent = 'Invalid username or password.';
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