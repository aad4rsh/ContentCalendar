/* ===== FAKRA Content Calendar — App Logic ===== */

(() => {
  'use strict';

  // ===== SUPABASE CONFIG =====
  // Loaded from config.js - DO NOT EDIT HERE
  // To update: edit .env file and run: node setup.js
  const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || 'https://your-project.supabase.co';
  const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || 'your-anon-key';
  let supabaseReady = false;
  let realtimeChannel = null;

  // Check if Supabase is configured
  function isSupabaseConfigured() {
    return SUPABASE_URL !== 'https://your-project.supabase.co' && SUPABASE_ANON_KEY !== 'your-anon-key';
  }

  // ===== CONFIG =====
  const STORAGE_KEY = 'fakra_events';
  const TYPE_CONFIG = {
    shoot:   { emoji: '🎥', label: 'Shoot',   color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    edit:    { emoji: '✂️', label: 'Edit',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    upload:  { emoji: '📤', label: 'Upload',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    idea:    { emoji: '💡', label: 'Idea',    color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
    promote: { emoji: '📣', label: 'Promote', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    review:  { emoji: '📊', label: 'Review',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MAX_CELL_EVENTS = 3;

  // ===== STATE =====
  let events = [];
  let currentYear, currentMonth; // 0-indexed month
  let currentView = 'grid'; // 'grid' | 'list'
  let editingEventId = null;
  let detailEventId = null;

  // Init to today
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  // ===== DOM REFS =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const calendarGrid = $('#calendarGrid');
  const calendarWrapper = $('#calendarWrapper');
  const listViewEl = $('#listView');
  const monthDisplay = $('#monthDisplay');
  const upcomingBanner = $('#upcomingBanner');
  const modalOverlay = $('#modalOverlay');
  const detailOverlay = $('#detailOverlay');
  const detailPanel = $('#detailPanel');
  const detailBody = $('#detailBody');

  // ===== PERSISTENCE =====
  async function loadEvents() {
    if (isSupabaseConfigured()) {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/fakra_events?select=*`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          return data || [];
        }
      } catch (err) {
        console.warn('Supabase fetch failed, using localStorage:', err);
      }
    }
    
    // Fallback to localStorage
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  async function saveEvents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    
    if (!isSupabaseConfigured()) return;
    
    try {
      // Sync each event to Supabase
      for (const event of events) {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/fakra_events`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify(event),
          }
        );
      }
    } catch (err) {
      console.warn('Failed to sync to Supabase:', err);
    }
  }

  async function deleteFromSupabase(eventId) {
    if (!isSupabaseConfigured()) return;
    
    try {
      await fetch(
        `${SUPABASE_URL}/rest/v1/fakra_events?id=eq.${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          }
        }
      );
    } catch (err) {
      console.warn('Failed to delete from Supabase:', err);
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ===== INIT SUPABASE REALTIME =====
  async function initSupabaseRealtime() {
    if (!isSupabaseConfigured()) return;
    
    try {
      // Simple polling-based sync every 5 seconds when tab is visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncFromSupabase();
      });
      
      // Initial sync
      await syncFromSupabase();
    } catch (err) {
      console.warn('Failed to init Supabase realtime:', err);
    }
  }

  async function syncFromSupabase() {
    if (!isSupabaseConfigured()) return;
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/fakra_events?select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (JSON.stringify(data) !== JSON.stringify(events)) {
          events = data || [];
          renderAll();
        }
      }
    } catch (err) {
      // Silent fail - just use local events
    }
  }

  // ===== HELPERS =====
  function dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }

  function todayKey() {
    const t = new Date();
    return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
  }

  function getEventsForDate(dk) {
    return events.filter(e => e.date === dk).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (a.time || '').localeCompare(b.time || '');
    });
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function formatDateLong(dk) {
    const { year, month, day } = parseDateKey(dk);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isToday(dk) { return dk === todayKey(); }

  function isFutureOrToday(dk) { return dk >= todayKey(); }

  // ===== RENDER: MONTH DISPLAY =====
  function renderMonthDisplay() {
    monthDisplay.innerHTML = `${MONTHS[currentMonth]} <span>${currentYear}</span>`;
  }

  // ===== RENDER: CALENDAR GRID =====
  function renderCalendarGrid() {
    calendarGrid.innerHTML = '';

    // Day headers
    DAYS.forEach(d => {
      const hdr = document.createElement('div');
      hdr.className = 'calendar-day-header';
      hdr.textContent = d;
      calendarGrid.appendChild(hdr);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const tk = todayKey();

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const pm = currentMonth === 0 ? 11 : currentMonth - 1;
      const py = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dk = dateKey(py, pm, day);
      calendarGrid.appendChild(createCell(day, dk, true));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = dateKey(currentYear, currentMonth, d);
      calendarGrid.appendChild(createCell(d, dk, false, dk === tk));
    }

    // Next month leading days
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nm = currentMonth === 11 ? 0 : currentMonth + 1;
      const ny = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dk = dateKey(ny, nm, d);
      calendarGrid.appendChild(createCell(d, dk, true));
    }
  }

  function createCell(dayNum, dk, isOther, isToday = false) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell' + (isOther ? ' other-month' : '') + (isToday ? ' today' : '');
    cell.dataset.date = dk;

    const dateEl = document.createElement('div');
    dateEl.className = 'cell-date';
    dateEl.textContent = dayNum;
    cell.appendChild(dateEl);

    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'cell-events';

    const dayEvents = getEventsForDate(dk);
    const showCount = Math.min(dayEvents.length, MAX_CELL_EVENTS);

    for (let i = 0; i < showCount; i++) {
      const ev = dayEvents[i];
      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.idea;
      const chip = document.createElement('div');
      chip.className = `cell-event event-${ev.type}` + (ev.pinned ? ' pinned' : '') + (ev.completed ? ' completed' : '');
      chip.innerHTML = `<span class="cell-event-dot" style="background:${ev.completed ? '#22c55e' : cfg.color}"></span>${ev.title}`;
      chip.title = `${cfg.emoji} ${ev.title}${ev.time ? ' @ ' + formatTime(ev.time) : ''}${ev.completed ? ' ✓ Done' : ''}`;
      chip.addEventListener('click', (e) => { e.stopPropagation(); openDetail(ev.id); });
      eventsContainer.appendChild(chip);
    }

    if (dayEvents.length > MAX_CELL_EVENTS) {
      const more = document.createElement('div');
      more.className = 'cell-more';
      more.textContent = `+${dayEvents.length - MAX_CELL_EVENTS} more`;
      eventsContainer.appendChild(more);
    }

    cell.appendChild(eventsContainer);

    // Add hint
    const hint = document.createElement('div');
    hint.className = 'cell-add-hint';
    hint.textContent = '+';
    cell.appendChild(hint);

    // Click to add
    cell.addEventListener('click', () => openModal(dk));

    return cell;
  }

  // ===== RENDER: LIST VIEW =====
  function renderListView() {
    listViewEl.innerHTML = '';

    // Gather all events for current month, sorted by date
    const monthEvents = events
      .filter(e => {
        const { year, month } = parseDateKey(e.date);
        return year === currentYear && month === currentMonth;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (a.time || '').localeCompare(b.time || '');
      });

    if (monthEvents.length === 0) {
      listViewEl.innerHTML = '<div class="list-empty">No events this month. Click <strong>"+ New Event"</strong> to get started!</div>';
      return;
    }

    // Group by date
    const grouped = {};
    monthEvents.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    Object.keys(grouped).sort().forEach(dk => {
      const group = document.createElement('div');
      group.className = 'list-date-group';

      const tk = todayKey();
      const header = document.createElement('div');
      header.className = 'list-date-header' + (dk === tk ? ' today-header' : '');
      header.innerHTML = `${formatDateLong(dk)}${dk === tk ? ' <span class="date-badge">Today</span>' : ''}`;
      group.appendChild(header);

      grouped[dk].forEach(ev => {
        const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.idea;
        const row = document.createElement('div');
        row.className = 'list-event-row' + (ev.completed ? ' completed' : '');
        row.innerHTML = `
          <div class="list-event-color" style="background:${ev.completed ? '#22c55e' : cfg.color}"></div>
          <div class="list-event-info">
            <div class="list-event-title">
              ${ev.pinned ? '📌 ' : ''}${ev.title}
            </div>
            <div class="list-event-meta">
              <span>${cfg.emoji} ${cfg.label}</span>
              ${ev.time ? `<span>🕐 ${formatTime(ev.time)}</span>` : ''}
            </div>
          </div>
          <div class="list-event-actions">
            <button class="btn btn-icon btn-sm" data-action="edit" data-id="${ev.id}" title="Edit">✏️</button>
            <button class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${ev.id}" title="Delete">🗑️</button>
          </div>
        `;
        row.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="edit"]')) {
            openModalForEdit(ev.id);
          } else if (e.target.closest('[data-action="delete"]')) {
            deleteEvent(ev.id);
          } else {
            openDetail(ev.id);
          }
        });
        group.appendChild(row);
      });

      listViewEl.appendChild(group);
    });
  }

  // ===== RENDER: UPCOMING BANNER =====
  function renderUpcoming() {
    const tk = todayKey();
    const upcoming = events
      .filter(e => e.date >= tk)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      })
      .slice(0, 6);

    const label = upcomingBanner.querySelector('.upcoming-banner-label');
    // Remove everything except the label
    upcomingBanner.innerHTML = '';
    upcomingBanner.appendChild(label);

    if (upcoming.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'upcoming-empty';
      empty.textContent = 'No upcoming events — time to plan!';
      upcomingBanner.appendChild(empty);
      return;
    }

    upcoming.forEach(ev => {
      const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.idea;
      const item = document.createElement('div');
      item.className = 'upcoming-item';
      item.innerHTML = `
        <span class="upcoming-dot" style="background:${cfg.color}"></span>
        <span class="upcoming-item-title">${ev.title}</span>
        <span class="upcoming-item-meta">${ev.date === tk ? 'Today' : formatDateLong(ev.date).split(',')[0]}${ev.time ? ' · ' + formatTime(ev.time) : ''}</span>
      `;
      item.addEventListener('click', () => openDetail(ev.id));
      upcomingBanner.appendChild(item);
    });
  }

  // ===== RENDER ALL =====
  function renderAll() {
    renderMonthDisplay();
    renderCalendarGrid();
    renderListView();
    renderUpcoming();
  }

  // ===== MODAL: ADD/EDIT =====
  let selectedType = 'shoot';
  let isPinned = false;

  function openModal(presetDate) {
    editingEventId = null;
    $('#modalTitle').textContent = 'New Event';
    $('#btnSaveEvent').textContent = 'Save Event';
    resetForm();
    if (presetDate) $('#eventDate').value = presetDate;
    selectedType = 'shoot';
    isPinned = false;
    updateTypeSelector();
    updatePriorityToggle();
    modalOverlay.classList.add('open');
    setTimeout(() => $('#eventTitle').focus(), 200);
  }

  function openModalForEdit(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    editingEventId = id;
    $('#modalTitle').textContent = 'Edit Event';
    $('#btnSaveEvent').textContent = 'Update Event';
    $('#eventTitle').value = ev.title;
    $('#eventDate').value = ev.date;
    $('#eventTime').value = ev.time || '';
    $('#eventNotes').value = ev.notes || '';
    selectedType = ev.type;
    isPinned = !!ev.pinned;
    updateTypeSelector();
    updatePriorityToggle();
    modalOverlay.classList.add('open');
    setTimeout(() => $('#eventTitle').focus(), 200);
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    editingEventId = null;
  }

  function resetForm() {
    $('#eventTitle').value = '';
    $('#eventDate').value = '';
    $('#eventTime').value = '';
    $('#eventNotes').value = '';
  }

  function updateTypeSelector() {
    $$('.type-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.type === selectedType);
    });
  }

  function updatePriorityToggle() {
    $('#priorityToggle').classList.toggle('active', isPinned);
  }

  function saveEvent() {
    const title = $('#eventTitle').value.trim();
    const date = $('#eventDate').value;
    const time = $('#eventTime').value;
    const notes = $('#eventNotes').value.trim();

    if (!title) { shakeEl($('#eventTitle')); return; }
    if (!date) { shakeEl($('#eventDate')); return; }

    if (editingEventId) {
      const idx = events.findIndex(e => e.id === editingEventId);
      if (idx !== -1) {
        events[idx] = { ...events[idx], title, type: selectedType, date, time, notes, pinned: isPinned };
      }
    } else {
      events.push({ id: generateId(), title, type: selectedType, date, time, notes, pinned: isPinned });
    }

    saveEvents();
    closeModal();
    renderAll();

    // If detail panel is open for this event, refresh it
    if (detailEventId === editingEventId) openDetail(editingEventId);
  }

  function shakeEl(el) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'shake 0.4s ease';
    el.style.borderColor = '#f43f5e';
    setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 600);
  }

  // ===== DETAIL PANEL =====
  function openDetail(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    detailEventId = id;
    const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.idea;

    detailBody.innerHTML = `
      <div class="detail-event-type event-${ev.type}">
        ${cfg.emoji} ${cfg.label}${ev.pinned ? ' · 📌 Priority' : ''}${ev.completed ? ' · ✅ Done' : ''}
      </div>
      <div class="detail-event-title">${ev.title}</div>
      <div class="detail-row">
        <div class="detail-row-icon">📅</div>
        <div class="detail-row-content">
          <div class="detail-row-label">Date</div>
          <div class="detail-row-value">${formatDateLong(ev.date)}</div>
        </div>
      </div>
      ${ev.time ? `
      <div class="detail-row">
        <div class="detail-row-icon">🕐</div>
        <div class="detail-row-content">
          <div class="detail-row-label">Time</div>
          <div class="detail-row-value">${formatTime(ev.time)}</div>
        </div>
      </div>` : ''}
      ${ev.notes ? `
      <div>
        <div class="detail-row-label" style="margin-bottom:8px">Notes</div>
        <div class="detail-notes">${ev.notes}</div>
      </div>` : ''}
    `;

    detailPanel.classList.add('open');
    detailOverlay.classList.add('open');
    
    // Update detail action buttons
    const btnDoneDetail = $('#btnDoneDetail');
    if (btnDoneDetail) {
      btnDoneDetail.textContent = ev.completed ? '↩️ Mark Incomplete' : '✅ Mark Done';
      btnDoneDetail.onclick = () => toggleEventComplete(ev.id);
    }
  }

  function toggleEventComplete(id) {
    const ev = events.find(e => e.id === id);
    if (!ev) return;
    ev.completed = !ev.completed;
    saveEvents();
    renderAll();
    openDetail(id);
  }

  function closeDetail() {
    detailPanel.classList.remove('open');
    detailOverlay.classList.remove('open');
    detailEventId = null;
  }

  // ===== DELETE EVENT =====
  async function deleteEvent(id) {
    events = events.filter(e => e.id !== id);
    await saveEvents();
    await deleteFromSupabase(id);
    closeDetail();
    renderAll();
  }

  // ===== VIEW TOGGLE =====
  function setView(view) {
    currentView = view;
    if (view === 'grid') {
      calendarWrapper.style.display = '';
      listViewEl.style.display = 'none';
      $('#btnGridView').classList.add('active');
      $('#btnListView').classList.remove('active');
    } else {
      calendarWrapper.style.display = 'none';
      listViewEl.style.display = '';
      $('#btnGridView').classList.remove('active');
      $('#btnListView').classList.add('active');
    }
  }

  // ===== NAVIGATION =====
  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderAll();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderAll();
  }

  function goToday() {
    const t = new Date();
    currentYear = t.getFullYear();
    currentMonth = t.getMonth();
    renderAll();
  }

  // ===== EVENT LISTENERS =====
  $('#btnAddEvent').addEventListener('click', () => openModal(todayKey()));
  $('#btnCloseModal').addEventListener('click', closeModal);
  $('#btnCancelModal').addEventListener('click', closeModal);
  $('#btnSaveEvent').addEventListener('click', saveEvent);
  $('#btnPrevMonth').addEventListener('click', prevMonth);
  $('#btnNextMonth').addEventListener('click', nextMonth);
  $('#btnToday').addEventListener('click', goToday);
  $('#btnGridView').addEventListener('click', () => setView('grid'));
  $('#btnListView').addEventListener('click', () => setView('list'));
  $('#btnCloseDetail').addEventListener('click', closeDetail);
  detailOverlay.addEventListener('click', closeDetail);
  $('#btnEditDetail').addEventListener('click', () => { if (detailEventId) { closeDetail(); openModalForEdit(detailEventId); }});
  $('#btnDeleteDetail').addEventListener('click', () => { if (detailEventId) deleteEvent(detailEventId); });
  $('#priorityToggle').addEventListener('click', () => { isPinned = !isPinned; updatePriorityToggle(); });

  // Type selector clicks
  $$('.type-option').forEach(opt => {
    opt.addEventListener('click', () => { selectedType = opt.dataset.type; updateTypeSelector(); });
  });

  // Close modal on overlay click
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeDetail(); }
  });

  // ===== INIT =====
  (async () => {
    events = await loadEvents();
    renderAll();
    await initSupabaseRealtime();
    
    // Periodic sync every 10 seconds
    setInterval(syncFromSupabase, 10000);
  })();

  // Add a CSS animation for shake (injected once)
  const style = document.createElement('style');
  style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`;
  document.head.appendChild(style);

})();
