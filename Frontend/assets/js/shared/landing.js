function navigateToRegister() {
    window.location.href = './pages/shared/registration.html';
}

function navigateToLogin() {
    window.location.href = './pages/shared/login.html';
}

// This adds a subtle animation on the loading
window.addEventListener('load', function() {
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.style.animation = 'fadeIn 1s ease-in';
    }
});
