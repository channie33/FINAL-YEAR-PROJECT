
document.addEventListener('DOMContentLoaded', async function () {

    /* DOM refs*/
    var listEl          = document.getElementById('sessList');
    var bookBtn         = document.getElementById('bookBtn');
    var overlay         = document.getElementById('modalOverlay');
    var modalClose      = document.getElementById('modalClose');
    var profSelect      = document.getElementById('professionalSelect');
    var dateField       = document.getElementById('dateField');
    var dateLabel       = document.getElementById('dateLabel');
    var calTimeWrap     = document.getElementById('calTimeWrap');
    var calPrev         = document.getElementById('calPrev');
    var calNext         = document.getElementById('calNext');
    var calMonthEl      = document.getElementById('calMonth');
    var calDaysEl       = document.getElementById('calDays');
    var timeSlotsEl     = document.getElementById('timeSlots');
    var bookSessionBtn  = document.getElementById('bookSessionBtn');

    /* State*/
    var calYear, calMonth, selectedDate = null, selectedSlot = null;

    /* Professionals (populated from backend) */
    var professionals = [];

    var userId = getLoggedInUserId();
    if (!userId) {
        window.location.href = '/assets/pages/shared/login.html';
        return;
    }

    /* Render existing sessions */
    var sessions = await fetchSessions(userId);
    renderList(sessions);

    /* Wire + button*/
    bookBtn.addEventListener('click', openModal);

    /* Wire close / overlay-click*/
    modalClose.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    /*Wire date-field click (toggle calendar)*/
    dateField.addEventListener('click', function () {
        if (calTimeWrap.classList.contains('open')) {
            calTimeWrap.classList.remove('open');
        } else {
            calTimeWrap.classList.add('open');
            renderCalendar();
            renderTimeSlots();
        }
    });

    /*Wire calendar nav arrows*/
    calPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendar();
    });
    calNext.addEventListener('click', function (e) {
        e.stopPropagation();
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
    });

    /*Wire BOOK SESSION */
    bookSessionBtn.addEventListener('click', submitBooking);

    // FETCH helpers

    async function fetchSessions(userId) {
        try {
            var res = await fetch('/api/student/sessions?user_id=' + userId);
            if (res.ok) {
                var data = await res.json();
                if (data.status === 'success' && data.data) return data.data;
            }
            return [];
        } catch (_) { return []; }
    }

    async function fetchProfessionals() {
        try {
            var res = await fetch('/api/student/profile?user_id=' + userId);
            if (res.ok) {
                var data = await res.json();
                if (data.status === 'success' && data.data && data.data.professionals && data.data.professionals.length > 0) {
                    professionals = data.data.professionals.map(function (p) {
                        return { id: p.ProfessionalID, name: p.FullName, category: p.Category || '' };
                    });
                }
            }
        } catch (_) { /* keep empty list */ }
    }

    async function fetchSlotsForDate(dateStr) {
        try {
            var profId = profSelect.value;
            var res = await fetch('/api/sessions/slots?professional=' + profId + '&date=' + dateStr, { credentials: 'include' });
            if (res.ok) {
                var data = await res.json();
                if (data.slots) return data.slots;
            }
        } catch (_) { /* fall through */ }
        return [];
    }

    // RENDER — session list

    function renderList(list) {
        listEl.innerHTML = '';

        if (!list || list.length === 0) {
            listEl.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No sessions yet</p>';
            return;
        }

        list.forEach(function (sess) {
            var card = document.createElement('div');
            card.className = 'sess-card';
            var name    = (sess.FullName || sess.name || sess.student || sess.professional_name || 'UNKNOWN').toUpperCase();
            var dateStr = buildSessionDateTime(sess);
            card.innerHTML =
                '<div class="sess-name">' + name    + '</div>' +
                '<div class="sess-date">' + dateStr + '</div>';
            listEl.appendChild(card);
        });
    }

    // MODAL open / close

    async function openModal() {
        // seed professional dropdown
        await fetchProfessionals();
        profSelect.innerHTML = '<option value="" disabled selected>MENTAL HEALTH PROFESSIONAL</option>';
        if (professionals.length > 0) {
            professionals.forEach(function (p) {
                profSelect.innerHTML += '<option value="' + p.id + '">' + p.name + '</option>';
            });
        }

        // reset state
        selectedDate = null;
        selectedSlot = null;
        dateLabel.textContent = 'Select date and time';
        calTimeWrap.classList.remove('open');

        overlay.classList.add('open');
    }

    function closeModal() {
        overlay.classList.remove('open');
    }
    // MINI CALENDAR

    function renderCalendar() {
        // Initialise year/month if not set
        if (calYear === undefined) {
            var now = new Date();
            calYear  = now.getFullYear();
            calMonth = now.getMonth();
        }

        var months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
        calMonthEl.textContent = months[calMonth] + ' ' + calYear;

        var firstDay  = new Date(calYear, calMonth, 1).getDay();   // 0=Sun
        var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        var today     = new Date();

        calDaysEl.innerHTML = '';

        // empty cells before the 1st
        for (var i = 0; i < firstDay; i++) {
            var empty = document.createElement('div');
            empty.className = 'cal-day empty';
            calDaysEl.appendChild(empty);
        }

        // day cells
        for (var d = 1; d <= daysInMonth; d++) {
            var cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.textContent = d;

            var thisDate = new Date(calYear, calMonth, d);
            if (thisDate.toDateString() === today.toDateString()) cell.classList.add('today');

            // highlight if selected
            if (selectedDate && selectedDate.toDateString() === thisDate.toDateString()) {
                cell.classList.add('selected');
            }

            cell.addEventListener('click', (function (date) {
                return function (e) {
                    e.stopPropagation();
                    selectedDate = date;
                    selectedSlot = null;

                    // update label
                    dateLabel.textContent = date.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });

                    // re-render calendar (to move highlight) + time slots
                    renderCalendar();
                    renderTimeSlots();
                };
            })(thisDate));

            calDaysEl.appendChild(cell);
        }
    }

    // TIME SLOTS

    async function renderTimeSlots() {
        timeSlotsEl.innerHTML = '';

        var dateStr = selectedDate
            ? selectedDate.getFullYear() + '-' +
              String(selectedDate.getMonth()+1).padStart(2,'0') + '-' +
              String(selectedDate.getDate()).padStart(2,'0')
            : '';

        var slots = dateStr ? await fetchSlotsForDate(dateStr) : [];

        if (!slots || slots.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'time-slot-row';
            empty.textContent = 'No available slots';
            timeSlotsEl.appendChild(empty);
            return;
        }

        slots.forEach(function (slot) {
            var row = document.createElement('div');
            row.className = 'time-slot-row' + (selectedSlot === slot.time ? ' selected' : '');

            var btn = document.createElement('div');
            btn.className = 'time-slot-btn';
            btn.textContent = slot.time;

            var status = document.createElement('div');
            status.className = 'time-slot-status' + (slot.booked ? ' booked' : '');
            status.textContent = slot.booked ? 'BOOKED' : 'AVAILABLE';

            if (!slot.booked) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function () {
                    selectedSlot = slot.time;
                    // re-render to move the highlight
                    renderTimeSlots();
                });
            } else {
                row.style.opacity = '0.6';
            }

            row.appendChild(btn);
            row.appendChild(status);
            timeSlotsEl.appendChild(row);
        });
    }

    // SUBMIT

    async function submitBooking() {
        var profId = profSelect.value;
        if (!profId) { alert('Please select a mental health professional.'); return; }
        if (!selectedDate) { alert('Please select a date.'); return; }
        if (!selectedSlot) { alert('Please select an available time slot.'); return; }

        var payload = {
            professional_id: profId,
            date: selectedDate.getFullYear() + '-' +
                  String(selectedDate.getMonth()+1).padStart(2,'0') + '-' +
                  String(selectedDate.getDate()).padStart(2,'0'),
            time: selectedSlot
        };

        try {
            var res = await fetch('/api/sessions', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                closeModal();
                // refresh list
                var updated = await fetchSessions(userId);
                renderList(updated);
                return;
            }
        } catch (_) { /* fall through */ }

        alert('Could not book session. Please try again later.');
    }

    // UTILS

    function formatDateTime(raw) {
        try {
            var d = new Date(raw);
            var date = d.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
            var time = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', hour12:false });
            return date + ' ' + time;
        } catch (_) { return raw; }
    }

    function buildSessionDateTime(sess) {
        if (sess.SessionDate && sess.TimeSlot) {
            try {
                var d = new Date(sess.SessionDate);
                var date = d.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' });
                return date + ' ' + sess.TimeSlot;
            } catch (_) {
                return sess.SessionDate + ' ' + sess.TimeSlot;
            }
        }
        if (sess.SessionDate) return formatDateTime(sess.SessionDate);
        if (sess.scheduled_at) return formatDateTime(sess.scheduled_at);
        return 'No date/time';
    }

    function getLoggedInUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.user_id || user.id || null;
        } catch (_) {
            return null;
        }
    }
});
