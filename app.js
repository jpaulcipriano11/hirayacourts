// ==========================================
// API LAYER (Backend-Ready)
// TODO: Replace mock implementations with actual Supabase/backend calls
// ==========================================

const MOCK_DB_KEY = 'hiraya_bookings_mock';

function getMockDB() {
  const data = localStorage.getItem(MOCK_DB_KEY);
  if (data) return JSON.parse(data);
  
  const today = new Date().toISOString().split('T')[0];
  const initialData = [
    { id: 'TEMP-001', date: today, court: 'Court 1', time: '08:00 AM - 09:00 AM', name: 'Juan Dela Cruz', mobile: '09171234567' },
    { id: 'TEMP-002', date: today, court: 'Court 1', time: '08:00 PM - 09:00 PM', name: 'Maria Santos', mobile: '09181234567' },
    { id: 'TEMP-003', date: '2026-08-01', court: 'Court 3', time: '05:00 PM - 06:00 PM', name: 'Pedro Penduko', mobile: '09191234567' }
  ];
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(initialData));
  return initialData;
}

function saveMockDB(db) {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

async function fetchAvailability(date, court) {
  // TODO: connect to backend
  const db = getMockDB();
  return db.filter(b => b.date === date && b.court === court).map(b => b.time);
}

async function createBooking(payload) {
  // TODO: connect to backend
  const db = getMockDB();
  const newBooking = {
    id: 'TEMP-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    ...payload
  };
  db.push(newBooking);
  saveMockDB(db);
  return { success: true, bookingId: newBooking.id };
}

async function fetchBookings(filters = {}) {
  // TODO: connect to backend
  let db = getMockDB();
  if (filters.date) db = db.filter(b => b.date === filters.date);
  if (filters.court) db = db.filter(b => b.court === filters.court);
  db.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
  return db;
}

async function deleteBooking(id) {
  // TODO: connect to backend
  let db = getMockDB();
  db = db.filter(b => b.id !== id);
  saveMockDB(db);
  return { success: true };
}

// ==========================================
// CONSTANTS & UTILS
// ==========================================

const TIME_SLOTS = [
  "06:00 AM - 07:00 AM", "07:00 AM - 08:00 AM", "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM",
  "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM", "08:00 PM - 09:00 PM"
];

function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `message-area ${type}`;
}

function hideMessage(elementId) {
  const el = document.getElementById(elementId);
  el.className = 'message-area hidden';
  el.textContent = '';
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function updateSummary() {
  const date = document.getElementById('bookingDate').value;
  const court = document.querySelector('.court-btn.active')?.dataset.court;
  const time = document.querySelector('.time-slot-btn.selected')?.textContent.trim();
  const price = time ? '₱300.00' : '₱0.00';

  const summaryDate = document.getElementById('summaryDate');
  const summaryCourt = document.getElementById('summaryCourt');
  const summaryTime = document.getElementById('summaryTime');
  const summaryPrice = document.getElementById('summaryPrice');

  if (summaryDate) summaryDate.textContent = formatDate(date);
  if (summaryCourt) summaryCourt.textContent = court || '--';
  if (summaryTime) summaryTime.textContent = time || '--';
  if (summaryPrice) summaryPrice.textContent = price;
}

// ==========================================
// UI LOGIC: BOOKING PAGE (index.html)
// ==========================================

function initBookingPage() {
  const dateInput = document.getElementById('bookingDate');
  const timeFilter = document.getElementById('timeFilter');
  const timeSlotsGrid = document.getElementById('timeSlotsGrid');
  const customerDetails = document.getElementById('customerDetails');
  const submitBtn = document.getElementById('submitBooking');

  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;

  let selectedTimeSlot = null;
  let selectedCourt = 'Court 1';

  // Court button handlers
  document.querySelectorAll('.court-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.court-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCourt = btn.dataset.court;
      selectedTimeSlot = null;
      customerDetails.classList.add('hidden');
      loadTimeSlots();
      updateSummary();
    });
  });

  async function loadTimeSlots() {
    const date = dateInput.value;
    const filter = timeFilter?.value || 'all';

    if (!date) {
      timeSlotsGrid.innerHTML = '<p class="placeholder-text">Select a date to view time slots</p>';
      customerDetails.classList.add('hidden');
      selectedTimeSlot = null;
      updateSummary();
      return;
    }

    timeSlotsGrid.innerHTML = '<p class="placeholder-text">Loading availability...</p>';
    
    try {
      const bookedSlots = await fetchAvailability(date, selectedCourt);
      timeSlotsGrid.innerHTML = '';

      let slotsToShow = TIME_SLOTS;
      if (filter === 'morning') {
        slotsToShow = TIME_SLOTS.filter(s => s.includes('AM'));
      } else if (filter === 'evening') {
        slotsToShow = TIME_SLOTS.filter(s => s.includes('PM'));
      }

      if (slotsToShow.length === 0) {
        timeSlotsGrid.innerHTML = '<p class="placeholder-text">No slots match this filter</p>';
        return;
      }

      slotsToShow.forEach(slot => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-slot-btn';
        btn.textContent = slot;

        if (bookedSlots.includes(slot)) {
          btn.classList.add('booked');
          btn.disabled = true;
          btn.title = 'Already booked';
        } else {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTimeSlot = slot;
            customerDetails.classList.remove('hidden');
            hideMessage('messageArea');
            updateSummary();
          });
        }
        timeSlotsGrid.appendChild(btn);
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      timeSlotsGrid.innerHTML = '<p class="placeholder-text" style="color: var(--danger);">Error loading time slots. Please try again.</p>';
    }
  }

  dateInput.addEventListener('change', () => {
    selectedTimeSlot = null;
    customerDetails.classList.add('hidden');
    loadTimeSlots();
    updateSummary();
  });

  if (timeFilter) {
    timeFilter.addEventListener('change', loadTimeSlots);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (!selectedTimeSlot) {
        showMessage('messageArea', 'Please select a time slot.', 'error');
        return;
      }

      const payload = {
        date: dateInput.value,
        court: selectedCourt,
        time: selectedTimeSlot,
        name: document.getElementById('customerName').value.trim(),
        mobile: document.getElementById('customerMobile').value.trim()
      };

      if (!payload.name || !payload.mobile) {
        showMessage('messageArea', 'Please fill in all customer details.', 'error');
        return;
      }

      try {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Processing...';
        submitBtn.disabled = true;

        const result = await createBooking(payload);

        if (result.success) {
          showMessage('messageArea', `✓ Booking successful! Your booking ID is ${result.bookingId}.`, 'success');
          document.getElementById('bookingForm')?.reset();
          dateInput.value = today;
          customerDetails.classList.add('hidden');
          selectedTimeSlot = null;
          loadTimeSlots();
          updateSummary();
        } else {
          showMessage('messageArea', 'Booking failed. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Booking error:', error);
        showMessage('messageArea', 'An unexpected error occurred. Please try again.', 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  loadTimeSlots();
  updateSummary();
}

// ==========================================
// UI LOGIC: ADMIN PAGE (admin.html)
// ==========================================

function initAdminPage() {
  const totalBookingsEl = document.getElementById('totalBookings');
  const todayBookingsEl = document.getElementById('todayBookings');
  const adminDateFilter = document.getElementById('adminDateFilter');
  const adminCourtFilter = document.getElementById('adminCourtFilter');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const tableBody = document.getElementById('bookingsTableBody');

  const today = new Date().toISOString().split('T')[0];

  async function renderDashboard() {
    const filters = {
      date: adminDateFilter.value || undefined,
      court: adminCourtFilter.value || undefined
    };

    try {
      const bookings = await fetchBookings(filters);
      const allBookings = await fetchBookings({});

      if (totalBookingsEl) totalBookingsEl.textContent = allBookings.length;
      if (todayBookingsEl) {
        const todayCount = allBookings.filter(b => b.date === today).length;
        todayBookingsEl.textContent = todayCount;
      }

      if (tableBody) {
        tableBody.innerHTML = '';
        if (bookings.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--gray-500);">No bookings found.</td></tr>';
          return;
        }

        bookings.forEach(booking => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td data-label="ID">${booking.id}</td>
            <td data-label="Date">${booking.date}</td>
            <td data-label="Court">${booking.court}</td>
            <td data-label="Time">${booking.time}</td>
            <td data-label="Name">${booking.name}</td>
            <td data-label="Mobile">${booking.mobile}</td>
            <td data-label="Actions">
              <button class="btn-danger delete-btn" data-id="${booking.id}">Delete</button>
            </td>
          `;
          tableBody.appendChild(tr);
        });
      }
    } catch (error) {
      console.error('Error rendering dashboard:', error);
    }
  }

  if (tableBody) {
    tableBody.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
          const result = await deleteBooking(id);
          if (result.success) renderDashboard();
        } catch (error) {
          console.error('Delete error:', error);
        }
      }
    });
  }

  if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', renderDashboard);
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (adminDateFilter) adminDateFilter.value = '';
      if (adminCourtFilter) adminCourtFilter.value = '';
      renderDashboard();
    });
  }

  renderDashboard();
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('bookingDate')) {
    initBookingPage();
  } else if (document.getElementById('adminDashboard')) {
    initAdminPage();
  }
});