
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

    /* Demo professionals (populated from backend when online) */
    var professionals = [
        { id: 1, name: 'Dr. Sarah Mitchell',  category: 'Anxiety & Stress' },
        { id: 2, name: 'Dr. James Carter',    category: 'Depression' },
        { id: 3, name: 'Dr. Amina Okafor',    category: 'Trauma & PTSD' }
    ];

    /* Demo time slots – keyed by date string; backend replaces this */
    var slotData = {
        // '2026-02-10' : [ { time:'09:00', booked:true }, … ]
    };

    /* Render existing sessions */
    var sessions = await fetchSessions();
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


    async function fetchSessions() {
        try {
            var res = await fetch('/api/sessions/mine', { credentials: 'include' });
            if (res.ok) {
                var data = await res.json();
                if (data.sessions && data.sessions.length > 0) return data.sessions;
            }
            return demoSessions();
        } catch (_) { return demoSessions(); }
    }

    async function fetchProfessionals() {
        try {
            var res = await fetch('/api/users/professionals', { credentials: 'include' });
            if (res.ok) {
                var data = await res.json();
                if (data.professionals && data.professionals.length > 0) {
                    professionals = data.professionals.map(function (p) {
                        return { id: p.id, name: (p.first_name + ' ' + p.last_name).trim(), category: p.category || '' };
                    });
                }
            }
        } catch (_) { /* keep demo */ }
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
        // Demo: first slot booked, rest available
        return [
            { time: '09:00', booked: true  },
            { time: '11:00', booked: false },
            { time: '14:00', booked: false }
        ];
    }
    // DEMO DATA

    function demoSessions() {
        return [
            { name: 'JOHN DOE', scheduled_at: null },
            { name: 'JOHN DOE', scheduled_at: null },
            { name: 'JOHN DOE', scheduled_at: null }
        ];
    }

    // RENDER — session list

    function renderList(list) {
        listEl.innerHTML = '';
        list.forEach(function (sess) {
            var card = document.createElement('div');
            card.className = 'sess-card';
            var name    = (sess.name || sess.student || sess.professional_name || 'UNKNOWN').toUpperCase();
            var dateStr = sess.scheduled_at ? formatDateTime(sess.scheduled_at) : 'DATE AND TIME';
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
        professionals.forEach(function (p) {
            profSelect.innerHTML += '<option value="' + p.id + '">' + p.name + '</option>';
        });

        // reset state
        selectedDate = null;
        selectedSlot = null;
        dateLabel.textContent = 'DATE AND TIME';
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

        var slots = dateStr ? await fetchSlotsForDate(dateStr) : [
            { time: '09:00', booked: true  },
            { time: '11:00', booked: false },
            { time: '14:00', booked: false }
        ];

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
                var updated = await fetchSessions();
                renderList(updated);
                return;
            }
        } catch (_) { /* fall through */ }

        // Backend offline — just show confirmation and close
        alert('Session booked!\n' + professionals.find(function(p){ return p.id == profId; }).name +
              '\n' + payload.date + ' at ' + payload.time);
        closeModal();
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
});