// Navbar search functionality for student pages
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.querySelector('.search-bar input');
        const searchIcon = document.querySelector('.search-bar svg');
        
        if (!searchInput) return;
        
        function performSearch() {
            const query = searchInput.value.trim();
            if (query) {
                // Redirect to search page with query parameter
                window.location.href = '/assets/pages/student/search.html?q=' + encodeURIComponent(query);
            }
        }
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        // Search on icon click
        if (searchIcon) {
            searchIcon.style.cursor = 'pointer';
            searchIcon.addEventListener('click', function() {
                performSearch();
            });
        }
    });
})();
