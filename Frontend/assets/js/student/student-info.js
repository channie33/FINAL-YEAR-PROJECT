
document.addEventListener('DOMContentLoaded', function () {

    var sections = document.querySelectorAll('.accordion-section');
    var searchInput = document.getElementById('infoSearch');

    // Accordion toggle
    sections.forEach(function (section) {
        var header = section.querySelector('.accordion-header');

        header.addEventListener('click', function () {
            var isOpen = section.classList.contains('open');

            // close every section
            sections.forEach(function (s) { s.classList.remove('open'); });

            // if this one was closed, open it
            if (!isOpen) section.classList.add('open');
        });
    });

    //Live search filter
    searchInput.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();

        sections.forEach(function (section) {
            if (!q) {
                // no query, show everything, close all
                section.style.display = '';
                section.classList.remove('open');
                return;
            }

            var title = section.querySelector('h2').textContent.toLowerCase();
            var body  = section.querySelector('.accordion-inner').textContent.toLowerCase();

            if (title.includes(q) || body.includes(q)) {
                section.style.display = '';   // visible
                section.classList.add('open'); // expand so match is readable
            } else {
                section.style.display = 'none';
            }
        });
    });
});