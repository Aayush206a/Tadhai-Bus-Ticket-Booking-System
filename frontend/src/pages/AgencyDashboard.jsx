import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AgencyDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('buses');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bookings state
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [scheduleBookings, setScheduleBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Delete reason modal
  const [deleteModal, setDeleteModal] = useState({ open: false, scheduleId: null, reason: '' });

  // Full edit schedule modal
  const [editModal, setEditModal] = useState({
    open: false, schedule: null,
    busId: '', routeId: '',
    departureTime: '', arrivalTime: '',
    pricePerSeat: '', status: 'active'
  });

  // Form states
  const [busForm, setBusForm] = useState({ busNumber: '', totalSeats: '' });
  const [routeForm, setRouteForm] = useState({
    startLocation: '', endLocation: '', intermediateStops: '', distanceKm: '', durationHours: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    busId: '', routeId: '', departureTime: '', arrivalTime: '', pricePerSeat: ''
  });

  const showMessage = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [busRes, routeRes, scheduleRes] = await Promise.all([
        api.get('/agency/buses'),
        api.get('/agency/routes'),
        api.get('/agency/schedules'),
      ]);
      setBuses(busRes.data);
      setRoutes(routeRes.data);
      setSchedules(scheduleRes.data);
    } catch (err) {
      showMessage('error', 'Failed to load data. Please refresh.');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Bus handlers ──────────────────────────────────────────────────────────
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/agency/buses', busForm);
      setBusForm({ busNumber: '', totalSeats: '' });
      fetchData();
      showMessage('success', 'Bus added successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add bus');
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Delete this bus?')) return;
    try {
      await api.delete(`/agency/buses/${id}`);
      fetchData();
      showMessage('success', 'Bus deleted.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete bus');
    }
  };

  // ── Route handlers ────────────────────────────────────────────────────────
  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/agency/routes', routeForm);
      setRouteForm({ startLocation: '', endLocation: '', intermediateStops: '', distanceKm: '', durationHours: '' });
      fetchData();
      showMessage('success', 'Route added successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to add route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await api.delete(`/agency/routes/${id}`);
      fetchData();
      showMessage('success', 'Route deleted.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete route');
    }
  };

  // ── Schedule handlers ─────────────────────────────────────────────────────
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/agency/schedules', scheduleForm);
      setScheduleForm({ busId: '', routeId: '', departureTime: '', arrivalTime: '', pricePerSeat: '' });
      fetchData();
      showMessage('success', 'Schedule created successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to create schedule');
    }
  };

  // Delete with reason
  const handleDeleteSchedule = async () => {
    if (!deleteModal.reason.trim()) {
      showMessage('error', 'Please provide a reason for removing this schedule');
      return;
    }
    try {
      await api.delete(`/agency/schedules/${deleteModal.scheduleId}`, {
        data: { reason: deleteModal.reason.trim() }
      });
      setDeleteModal({ open: false, scheduleId: null, reason: '' });
      fetchData();
      showMessage('success', 'Schedule removed. All affected passenger bookings have been cancelled.');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  // Open full edit modal
  const openEditModal = (sch) => {
    const toLocal = (isoStr) => {
      const d = new Date(isoStr);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditModal({
      open: true,
      schedule: sch,
      busId: sch.busId?._id || sch.busId,
      routeId: sch.routeId?._id || sch.routeId,
      departureTime: toLocal(sch.departureTime),
      arrivalTime: toLocal(sch.arrivalTime),
      pricePerSeat: sch.pricePerSeat,
      status: sch.status
    });
  };

  const closeEditModal = () => setEditModal({
    open: false, schedule: null, busId: '', routeId: '',
    departureTime: '', arrivalTime: '', pricePerSeat: '', status: 'active'
  });

  // Save full edit
  const handleSaveEdit = async () => {
    if (!editModal.departureTime || !editModal.arrivalTime) {
      showMessage('error', 'Departure and arrival times are required');
      return;
    }
    if (new Date(editModal.departureTime) >= new Date(editModal.arrivalTime)) {
      showMessage('error', 'Arrival time must be after departure time');
      return;
    }
    if (!editModal.pricePerSeat || Number(editModal.pricePerSeat) < 0) {
      showMessage('error', 'Please enter a valid price');
      return;
    }
    try {
      await api.put(`/agency/schedules/${editModal.schedule._id}`, {
        busId: editModal.busId,
        routeId: editModal.routeId,
        departureTime: editModal.departureTime,
        arrivalTime: editModal.arrivalTime,
        pricePerSeat: Number(editModal.pricePerSeat),
        status: editModal.status
      });
      closeEditModal();
      fetchData();
      showMessage('success', 'Schedule updated successfully!');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update schedule');
    }
  };

  // Bookings
  const handleLoadBookings = async (scheduleId) => {
    if (!scheduleId) { setScheduleBookings([]); return; }
    setBookingsLoading(true);
    try {
      const res = await api.get(`/public/agency/schedules/${scheduleId}/bookings`);
      setScheduleBookings(res.data);
    } catch (err) {
      showMessage('error', 'Failed to load bookings');
      setScheduleBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const tabs = ['buses', 'routes', 'schedules', 'bookings'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ color: '#1a237e', marginBottom: '0.25rem' }}>Agency Dashboard</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Manage your buses, routes, schedules and bookings
      </p>

      {error && <div style={alertStyle('error')}>{error}</div>}
      {success && <div style={alertStyle('success')}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '2rem', gap: '0.25rem' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(activeTab === tab)}>
            {tab === 'buses' && '🚌 '}
            {tab === 'routes' && '🗺️ '}
            {tab === 'schedules' && '📅 '}
            {tab === 'bookings' && '🎫 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── BUSES TAB ─── */}
      {activeTab === 'buses' && (
        <div>
          <h2 style={sectionTitle}>Add New Bus</h2>
          <form onSubmit={handleBusSubmit} style={formCard}>
            <div style={formRow}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Bus Number / Registration</label>
                <input type="text" value={busForm.busNumber}
                  onChange={e => setBusForm(p => ({ ...p, busNumber: e.target.value }))}
                  required placeholder="BA-1-KH-1234" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Total Seats</label>
                <input type="number" value={busForm.totalSeats}
                  onChange={e => setBusForm(p => ({ ...p, totalSeats: e.target.value }))}
                  required min="1" max="100" placeholder="40" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" style={addBtn}>+ Add Bus</button>
              </div>
            </div>
          </form>

          <h2 style={sectionTitle}>Your Buses ({buses.length})</h2>
          {buses.length === 0 ? <EmptyState msg="No buses added yet. Add your first bus above." /> : (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr style={thRow}>
                    <th style={th}>Bus Number</th>
                    <th style={th}>Total Seats</th>
                    <th style={th}>Added</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(bus => (
                    <tr key={bus._id} style={trStyle}>
                      <td style={td}><strong>{bus.busNumber}</strong></td>
                      <td style={td}>{bus.totalSeats} seats</td>
                      <td style={td}>{new Date(bus.createdAt).toLocaleDateString()}</td>
                      <td style={td}>
                        <button onClick={() => handleDeleteBus(bus._id)} style={deleteBtn}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ROUTES TAB ─── */}
      {activeTab === 'routes' && (
        <div>
          <h2 style={sectionTitle}>Add New Route</h2>
          <form onSubmit={handleRouteSubmit} style={formCard}>
            <div style={formRow}>
              <div style={fieldWrap}>
                <label style={labelStyle}>From (Start Location)</label>
                <input type="text" value={routeForm.startLocation}
                  onChange={e => setRouteForm(p => ({ ...p, startLocation: e.target.value }))}
                  required placeholder="Kathmandu" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>To (End Location)</label>
                <input type="text" value={routeForm.endLocation}
                  onChange={e => setRouteForm(p => ({ ...p, endLocation: e.target.value }))}
                  required placeholder="Pokhara" style={inputStyle} />
              </div>
            </div>
            <div style={formRow}>
              <div style={{ ...fieldWrap, flex: 2 }}>
                <label style={labelStyle}>Intermediate Stops (comma separated)</label>
                <input type="text" value={routeForm.intermediateStops}
                  onChange={e => setRouteForm(p => ({ ...p, intermediateStops: e.target.value }))}
                  placeholder="Mugling, Dumre" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Distance (km)</label>
                <input type="number" value={routeForm.distanceKm}
                  onChange={e => setRouteForm(p => ({ ...p, distanceKm: e.target.value }))}
                  placeholder="200" min="1" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Duration (hrs)</label>
                <input type="number" value={routeForm.durationHours}
                  onChange={e => setRouteForm(p => ({ ...p, durationHours: e.target.value }))}
                  placeholder="6" min="0.5" step="0.5" style={inputStyle} />
              </div>
            </div>
            <button type="submit" style={addBtn}>+ Add Route</button>
          </form>

          <h2 style={sectionTitle}>Your Routes ({routes.length})</h2>
          {routes.length === 0 ? <EmptyState msg="No routes added yet." /> : (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr style={thRow}>
                    <th style={th}>From</th><th style={th}>To</th>
                    <th style={th}>Stops</th><th style={th}>Distance</th>
                    <th style={th}>Duration</th><th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(route => (
                    <tr key={route._id} style={trStyle}>
                      <td style={td}><strong>{route.startLocation}</strong></td>
                      <td style={td}><strong>{route.endLocation}</strong></td>
                      <td style={td}>{route.intermediateStops?.join(', ') || '—'}</td>
                      <td style={td}>{route.distanceKm ? `${route.distanceKm} km` : '—'}</td>
                      <td style={td}>{route.durationHours ? `${route.durationHours} hrs` : '—'}</td>
                      <td style={td}>
                        <button onClick={() => handleDeleteRoute(route._id)} style={deleteBtn}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── SCHEDULES TAB ─── */}
      {activeTab === 'schedules' && (
        <div>
          <h2 style={sectionTitle}>Create Schedule</h2>
          {buses.length === 0 || routes.length === 0 ? (
            <div style={alertStyle('error')}>
              You need at least one bus and one route before creating a schedule.
            </div>
          ) : (
            <form onSubmit={handleScheduleSubmit} style={formCard}>
              <div style={formRow}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Bus</label>
                  <select value={scheduleForm.busId}
                    onChange={e => setScheduleForm(p => ({ ...p, busId: e.target.value }))}
                    required style={inputStyle}>
                    <option value="">Select a bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>{bus.busNumber} ({bus.totalSeats} seats)</option>
                    ))}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Route</label>
                  <select value={scheduleForm.routeId}
                    onChange={e => setScheduleForm(p => ({ ...p, routeId: e.target.value }))}
                    required style={inputStyle}>
                    <option value="">Select a route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>{route.startLocation} → {route.endLocation}</option>
                    ))}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Price per Seat (Rs.)</label>
                  <input type="number" value={scheduleForm.pricePerSeat}
                    onChange={e => setScheduleForm(p => ({ ...p, pricePerSeat: e.target.value }))}
                    required min="0" step="0.01" placeholder="800" style={inputStyle} />
                </div>
              </div>
              <div style={formRow}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Departure Time</label>
                  <input type="datetime-local" value={scheduleForm.departureTime}
                    onChange={e => setScheduleForm(p => ({ ...p, departureTime: e.target.value }))}
                    required style={inputStyle} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Arrival Time</label>
                  <input type="datetime-local" value={scheduleForm.arrivalTime}
                    onChange={e => setScheduleForm(p => ({ ...p, arrivalTime: e.target.value }))}
                    required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" style={addBtn}>+ Create Schedule</button>
                </div>
              </div>
            </form>
          )}

          <h2 style={sectionTitle}>Your Schedules ({schedules.length})</h2>
          {schedules.length === 0 ? <EmptyState msg="No schedules yet. Create your first schedule above." /> : (
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr style={thRow}>
                    <th style={th}>Bus</th>
                    <th style={th}>Route</th>
                    <th style={th}>Departure</th>
                    <th style={th}>Arrival</th>
                    <th style={th}>Price</th>
                    <th style={th}>Seats Left</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(sch => (
                    <tr key={sch._id} style={trStyle}>
                      <td style={td}>{sch.busId?.busNumber || '—'}</td>
                      <td style={td}>{sch.routeId ? `${sch.routeId.startLocation} → ${sch.routeId.endLocation}` : '—'}</td>
                      <td style={td}>{sch.departureTime ? new Date(sch.departureTime).toLocaleString() : '—'}</td>
                      <td style={td}>{sch.arrivalTime ? new Date(sch.arrivalTime).toLocaleString() : '—'}</td>
                      <td style={td}>Rs. {sch.pricePerSeat}</td>
                      <td style={td}>{sch.availableSeats}</td>
                      <td style={td}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                          backgroundColor: sch.status === 'active' ? '#e8f5e9' : '#ffebee',
                          color: sch.status === 'active' ? '#2e7d32' : '#c62828', fontWeight: 600,
                        }}>{sch.status}</span>
                      </td>
                      <td style={{ ...td, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button onClick={() => openEditModal(sch)}
                          style={{ ...deleteBtn, backgroundColor: '#1565c0' }}>
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, scheduleId: sch._id, reason: '' })}
                          style={deleteBtn}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── BOOKINGS TAB ─── */}
      {activeTab === 'bookings' && (
        <div>
          <h2 style={sectionTitle}>View Bookings by Schedule</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Select a schedule:</label>
            <select value={selectedScheduleId}
              onChange={e => { setSelectedScheduleId(e.target.value); handleLoadBookings(e.target.value); }}
              style={{ ...inputStyle, maxWidth: '500px' }}>
              <option value="">— Choose a schedule —</option>
              {schedules.map(sch => (
                <option key={sch._id} value={sch._id}>
                  {sch.busId?.busNumber} | {sch.routeId?.startLocation} → {sch.routeId?.endLocation} | {sch.departureTime ? new Date(sch.departureTime).toLocaleString() : ''}
                </option>
              ))}
            </select>
          </div>

          {bookingsLoading && <p style={{ color: '#666' }}>Loading bookings...</p>}

          {!bookingsLoading && selectedScheduleId && (
            scheduleBookings.length === 0 ? (
              <EmptyState msg="No confirmed bookings for this schedule." />
            ) : (
              <>
                <p style={{ color: '#666', marginBottom: '0.75rem' }}>
                  {scheduleBookings.length} confirmed booking{scheduleBookings.length !== 1 ? 's' : ''}
                </p>
                <div style={tableWrap}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={thRow}>
                        <th style={th}>Passenger Name</th>
                        <th style={th}>Email</th>
                        <th style={th}>Phone</th>
                        <th style={th}>Seat #</th>
                        <th style={th}>Booked At</th>
                        <th style={th}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleBookings.map(b => (
                        <tr key={b._id} style={trStyle}>
                          <td style={td}><strong>{b.passengerId?.name || '—'}</strong></td>
                          <td style={td}>
                            <a href={`mailto:${b.passengerId?.email}`} style={{ color: '#1a237e', textDecoration: 'none' }}>
                              {b.passengerId?.email || '—'}
                            </a>
                          </td>
                          <td style={td}>
                            <a href={`tel:${b.passengerId?.phone}`} style={{ color: '#1a237e', textDecoration: 'none' }}>
                              {b.passengerId?.phone || '—'}
                            </a>
                          </td>
                          <td style={td}><strong>Seat {b.seatNumber}</strong></td>
                          <td style={td}>{new Date(b.bookingTime).toLocaleString()}</td>
                          <td style={td}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem',
                              backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600
                            }}>{b.paymentStatus || 'paid'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* ─── DELETE REASON MODAL ─── */}
      {deleteModal.open && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#c62828' }}>🗑️ Remove Schedule</h3>
            <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '1rem' }}>
              All passengers with confirmed bookings on this schedule will have their bookings
              automatically cancelled with the reason you provide below.
            </p>
            <label style={labelStyle}>Reason for removal *</label>
            <textarea
              value={deleteModal.reason}
              onChange={e => setDeleteModal(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Natural disaster on route, Vehicle breakdown, Route discontinued..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal({ open: false, scheduleId: null, reason: '' })} style={cancelModalBtn}>
                Cancel
              </button>
              <button onClick={handleDeleteSchedule} style={{ ...addBtn, backgroundColor: '#e53935' }}>
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FULL EDIT SCHEDULE MODAL ─── */}
      {editModal.open && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: '640px' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#1a237e' }}>✏️ Edit Schedule</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Update any details below — bus, route, times, price, or status.
            </p>

            <div style={formRow}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Bus</label>
                <select value={editModal.busId}
                  onChange={e => setEditModal(p => ({ ...p, busId: e.target.value }))}
                  style={inputStyle}>
                  {buses.map(bus => (
                    <option key={bus._id} value={bus._id}>{bus.busNumber} ({bus.totalSeats} seats)</option>
                  ))}
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Route</label>
                <select value={editModal.routeId}
                  onChange={e => setEditModal(p => ({ ...p, routeId: e.target.value }))}
                  style={inputStyle}>
                  {routes.map(route => (
                    <option key={route._id} value={route._id}>{route.startLocation} → {route.endLocation}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={formRow}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Departure Time</label>
                <input type="datetime-local" value={editModal.departureTime}
                  onChange={e => setEditModal(p => ({ ...p, departureTime: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Arrival Time</label>
                <input type="datetime-local" value={editModal.arrivalTime}
                  onChange={e => setEditModal(p => ({ ...p, arrivalTime: e.target.value }))}
                  style={inputStyle} />
              </div>
            </div>

            <div style={formRow}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Price per Seat (Rs.)</label>
                <input type="number" value={editModal.pricePerSeat} min="0" step="0.01"
                  onChange={e => setEditModal(p => ({ ...p, pricePerSeat: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Status</label>
                <select value={editModal.status}
                  onChange={e => setEditModal(p => ({ ...p, status: e.target.value }))}
                  style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={closeEditModal} style={cancelModalBtn}>Cancel</button>
              <button onClick={handleSaveEdit} style={addBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Shared components & styles ────────────────────────────────────────────────

const EmptyState = ({ msg }) => (
  <div style={{
    textAlign: 'center', padding: '3rem', backgroundColor: '#fafafa',
    border: '2px dashed #e0e0e0', borderRadius: '8px', color: '#999',
  }}>{msg}</div>
);

const alertStyle = (type) => ({
  padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem',
  backgroundColor: type === 'success' ? '#e8f5e9' : '#ffebee',
  color: type === 'success' ? '#2e7d32' : '#c62828',
  border: `1px solid ${type === 'success' ? '#c8e6c9' : '#ffcdd2'}`,
});

const tabBtn = (active) => ({
  padding: '0.6rem 1.2rem', border: 'none',
  borderBottom: active ? '2px solid #1a237e' : '2px solid transparent',
  backgroundColor: 'transparent', color: active ? '#1a237e' : '#666',
  fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.15s',
});

const sectionTitle = { color: '#333', fontSize: '1.1rem', margin: '0 0 1rem' };
const formCard = { backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' };
const formRow = { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' };
const fieldWrap = { flex: 1, minWidth: '160px' };
const labelStyle = { display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.85rem', color: '#555' };
const inputStyle = { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem' };
const addBtn = { padding: '0.6rem 1.2rem', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' };
const deleteBtn = { padding: '0.3rem 0.75rem', backgroundColor: '#e53935', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' };
const cancelModalBtn = { padding: '0.6rem 1.2rem', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', backgroundColor: 'white', color: '#333' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalBox = { backgroundColor: 'white', borderRadius: '10px', padding: '1.75rem', width: '100%', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' };
const tableWrap = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' };
const thRow = { backgroundColor: '#f5f5f5' };
const th = { textAlign: 'left', padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: '#555', borderBottom: '2px solid #e0e0e0' };
const trStyle = { borderBottom: '1px solid #f0f0f0' };
const td = { padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#333' };

export default AgencyDashboard;
