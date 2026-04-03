import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const PassengerDashboard = () => {
  const [activeTab, setActiveTab] = useState('search');

  // Search state
  const [searchForm, setSearchForm] = useState({ from: '', to: '', date: '' });
  const [locations, setLocations] = useState({ from: [], to: [] });
  const [schedules, setSchedules] = useState([]);
  const [searchDone, setSearchDone] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Seat selection state
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seatLoading, setSeatLoading] = useState(false);

  // My bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else { setError(msg); setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  };

  // Load distinct locations for dropdowns
  useEffect(() => {
    api.get('/public/routes').then(res => {
      const froms = [...new Set(res.data.map(r => r.startLocation))].sort();
      const tos = [...new Set(res.data.map(r => r.endLocation))].sort();
      setLocations({ from: froms, to: tos });
    }).catch(() => {});
  }, []);

  // Fetch my bookings
  const fetchMyBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await api.get('/passenger/bookings');
      setMyBookings(res.data);
    } catch (err) {
      showMsg('error', 'Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'mybookings') fetchMyBookings();
  }, [activeTab, fetchMyBookings]);

  // Search schedules
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setError('');
    setSearchDone(false);
    setSelectedSchedule(null);
    setSeatMap([]);
    setSelectedSeat(null);
    try {
      const params = new URLSearchParams();
      if (searchForm.from) params.append('from', searchForm.from);
      if (searchForm.to) params.append('to', searchForm.to);
      if (searchForm.date) params.append('date', searchForm.date);
      const res = await api.get(`/public/schedules?${params}`);
      setSchedules(res.data);
      setSearchDone(true);
    } catch (err) {
      showMsg('error', 'Failed to search schedules');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a schedule → load seat map
  const handleSelectSchedule = async (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedSeat(null);
    setSeatLoading(true);
    setError('');
    try {
      const res = await api.get(`/passenger/bookings/schedule/${schedule._id}/seats`);
      const { bookedSeats, totalSeats } = res.data;
      const map = [];
      for (let i = 1; i <= totalSeats; i++) {
        map.push({ number: i, isBooked: bookedSeats.includes(i) });
      }
      setSeatMap(map);
    } catch (err) {
      showMsg('error', 'Failed to load seat map');
    } finally {
      setSeatLoading(false);
    }
  };

  // Book a seat
  const handleBook = async () => {
    if (!selectedSeat || !selectedSchedule) return;
    setSeatLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/passenger/bookings', {
        scheduleId: selectedSchedule._id,
        seatNumber: selectedSeat,
      });
      showMsg('success', `Seat ${selectedSeat} booked successfully! 🎉`);
      setSelectedSeat(null);
      const res = await api.get(`/passenger/bookings/schedule/${selectedSchedule._id}/seats`);
      const { bookedSeats, totalSeats } = res.data;
      const map = [];
      for (let i = 1; i <= totalSeats; i++) {
        map.push({ number: i, isBooked: bookedSeats.includes(i) });
      }
      setSeatMap(map);
      setSchedules(prev => prev.map(s =>
        s._id === selectedSchedule._id ? { ...s, availableSeats: s.availableSeats - 1 } : s
      ));
      setSelectedSchedule(prev => prev ? { ...prev, availableSeats: prev.availableSeats - 1 } : prev);
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Booking failed');
    } finally {
      setSeatLoading(false);
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/passenger/bookings/${bookingId}/cancel`);
      showMsg('success', 'Booking cancelled successfully.');
      fetchMyBookings();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Toggle booking detail expand
  const toggleExpand = (bookingId) => {
    setExpandedBookingId(prev => prev === bookingId ? null : bookingId);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ color: '#1a237e', marginBottom: '0.25rem' }}>Book Bus Tickets</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: '1.5rem' }}>
        Search routes, pick your seat, and confirm your ticket
      </p>

      {error && <div style={alertStyle('error')}>{error}</div>}
      {success && <div style={alertStyle('success')}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: '2rem', gap: '0.25rem' }}>
        {[['search', '🔍 Search & Book'], ['mybookings', '🎫 My Bookings']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={tabBtn(activeTab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── SEARCH TAB ─── */}
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} style={formCard}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={labelStyle}>From</label>
                <select value={searchForm.from}
                  onChange={e => setSearchForm(p => ({ ...p, from: e.target.value }))}
                  style={inputStyle}>
                  <option value="">Any location</option>
                  {locations.from.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={labelStyle}>To</label>
                <select value={searchForm.to}
                  onChange={e => setSearchForm(p => ({ ...p, to: e.target.value }))}
                  style={inputStyle}>
                  <option value="">Any location</option>
                  {locations.to.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={labelStyle}>Travel Date</label>
                <input type="date" value={searchForm.date}
                  onChange={e => setSearchForm(p => ({ ...p, date: e.target.value }))}
                  style={inputStyle} />
              </div>
              <button type="submit" disabled={searchLoading} style={searchBtn(searchLoading)}>
                {searchLoading ? 'Searching...' : '🔍 Search'}
              </button>
            </div>
          </form>

          {searchDone && (
            <div>
              <h2 style={{ fontSize: '1.1rem', color: '#333', marginBottom: '1rem' }}>
                {schedules.length === 0
                  ? 'No schedules found for your search.'
                  : `${schedules.length} schedule${schedules.length !== 1 ? 's' : ''} found`}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {schedules.map(sch => (
                  <div key={sch._id} onClick={() => handleSelectSchedule(sch)}
                    style={{
                      padding: '1rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                      border: selectedSchedule?._id === sch._id ? '2px solid #1a237e' : '1px solid #e0e0e0',
                      backgroundColor: selectedSchedule?._id === sch._id ? '#e8eaf6' : 'white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#1a237e' }}>{sch.busId?.busNumber || 'Bus'}</strong>
                      <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        Rs. {sch.pricePerSeat}
                      </span>
                    </div>
                    <p style={{ margin: '0.15rem 0', fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>
                      📍 {sch.routeId?.startLocation} → {sch.routeId?.endLocation}
                    </p>
                    {sch.routeId?.intermediateStops?.length > 0 && (
                      <p style={{ margin: '0.15rem 0', color: '#888', fontSize: '0.8rem' }}>
                        🛑 {sch.routeId.intermediateStops.join(' → ')}
                      </p>
                    )}
                    <p style={{ margin: '0.15rem 0', color: '#555', fontSize: '0.88rem' }}>
                      🕐 {new Date(sch.departureTime).toLocaleString()}
                    </p>
                    <p style={{ margin: '0.15rem 0', color: '#555', fontSize: '0.88rem' }}>
                      🏁 {new Date(sch.arrivalTime).toLocaleString()}
                    </p>
                    <p style={{ margin: '0.15rem 0', color: '#555', fontSize: '0.88rem' }}>
                      💺 {sch.availableSeats} seats available
                    </p>
                    {sch.availableSeats === 0 && (
                      <p style={{ color: '#e53935', fontWeight: 600, fontSize: '0.85rem', margin: '0.25rem 0 0' }}>FULLY BOOKED</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seat map */}
          {selectedSchedule && (
            <div style={{ marginTop: '2rem', backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '1.5rem' }}>
              <h2 style={{ color: '#1a237e', marginTop: 0 }}>Select Your Seat</h2>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div>
                  <p style={infoText}><strong>Bus:</strong> {selectedSchedule.busId?.busNumber}</p>
                  <p style={infoText}><strong>Route:</strong> {selectedSchedule.routeId?.startLocation} → {selectedSchedule.routeId?.endLocation}</p>
                  {selectedSchedule.routeId?.intermediateStops?.length > 0 && (
                    <p style={infoText}><strong>Stops:</strong> {selectedSchedule.routeId.intermediateStops.join(' → ')}</p>
                  )}
                </div>
                <div>
                  <p style={infoText}><strong>Departs:</strong> {new Date(selectedSchedule.departureTime).toLocaleString()}</p>
                  <p style={infoText}><strong>Arrives:</strong> {new Date(selectedSchedule.arrivalTime).toLocaleString()}</p>
                  <p style={infoText}><strong>Price:</strong> Rs. {selectedSchedule.pricePerSeat} per seat</p>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                  { color: '#f5f5f5', border: '#ccc', label: 'Available', textColor: '#333' },
                  { color: '#1a237e', border: '#1a237e', label: 'Selected', textColor: 'white' },
                  { color: '#e53935', border: '#e53935', label: 'Booked', textColor: 'white' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div style={{ width: '28px', height: '28px', backgroundColor: item.color, border: `2px solid ${item.border}`, borderRadius: '4px' }} />
                    {item.label}
                  </div>
                ))}
              </div>

              {seatLoading ? <p style={{ color: '#666' }}>Loading seat map...</p> : (
                <>
                  <div style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e0e0e0', maxWidth: '480px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#888' }}>🪟 DOOR | DRIVER</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 40px)', gap: '6px', justifyContent: 'center' }}>
                      {seatMap.map(seat => (
                        <button key={seat.number}
                          onClick={() => !seat.isBooked && setSelectedSeat(seat.number)}
                          disabled={seat.isBooked}
                          title={seat.isBooked ? 'Booked' : `Seat ${seat.number}`}
                          style={{
                            width: '40px', height: '40px',
                            border: `2px solid ${seat.isBooked ? '#e53935' : selectedSeat === seat.number ? '#1a237e' : '#ccc'}`,
                            borderRadius: '6px',
                            backgroundColor: seat.isBooked ? '#e53935' : selectedSeat === seat.number ? '#1a237e' : '#f5f5f5',
                            color: seat.isBooked || selectedSeat === seat.number ? 'white' : '#333',
                            fontSize: '0.8rem', fontWeight: 600,
                            cursor: seat.isBooked ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                          }}>
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSeat && (
                    <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#e8eaf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 500 }}>
                        ✅ Seat <strong>{selectedSeat}</strong> selected — Rs. {selectedSchedule.pricePerSeat}
                      </p>
                      <button onClick={handleBook} disabled={seatLoading} style={{
                        padding: '0.6rem 1.5rem', backgroundColor: seatLoading ? '#9e9e9e' : '#1a237e',
                        color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: seatLoading ? 'not-allowed' : 'pointer',
                      }}>
                        {seatLoading ? 'Booking...' : 'Confirm Booking'}
                      </button>
                      <button onClick={() => setSelectedSeat(null)} style={{
                        padding: '0.6rem 1rem', backgroundColor: 'transparent',
                        color: '#666', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer',
                      }}>Cancel</button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MY BOOKINGS TAB ─── */}
      {activeTab === 'mybookings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>My Bookings</h2>
            <button onClick={fetchMyBookings} style={refreshBtn}>↻ Refresh</button>
          </div>

          {bookingsLoading && <p style={{ color: '#666' }}>Loading bookings...</p>}

          {!bookingsLoading && myBookings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fafafa', border: '2px dashed #e0e0e0', borderRadius: '8px', color: '#999' }}>
              You have no bookings yet. Search for a route and book your first ticket!
            </div>
          )}

          {!bookingsLoading && myBookings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myBookings.map(booking => {
                const sch = booking.scheduleId;
                const isCancelled = booking.status === 'cancelled';
                const isExpanded = expandedBookingId === booking._id;

                return (
                  <div key={booking._id} style={{
                    backgroundColor: 'white',
                    border: `1px solid ${isCancelled ? '#ffcdd2' : '#e0e0e0'}`,
                    borderLeft: `4px solid ${isCancelled ? '#e53935' : '#1a237e'}`,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {/* ── Booking summary row ── */}
                    <div style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
                      opacity: isCancelled ? 0.85 : 1,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1rem', color: '#1a237e' }}>
                            Seat {booking.seatNumber}
                          </strong>
                          <span style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                            backgroundColor: isCancelled ? '#ffebee' : '#e8f5e9',
                            color: isCancelled ? '#c62828' : '#2e7d32',
                          }}>{booking.status.toUpperCase()}</span>
                          {isCancelled && booking.cancelledBy === 'agency' && (
                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 600 }}>
                              Cancelled by Operator
                            </span>
                          )}
                        </div>

                        {sch ? (
                          <p style={{ margin: '0.1rem 0', color: '#333', fontWeight: 500, fontSize: '0.95rem' }}>
                            📍 {sch.routeId?.startLocation} → {sch.routeId?.endLocation}
                          </p>
                        ) : (
                          <p style={{ color: '#999', fontSize: '0.9rem', margin: '0.1rem 0' }}>
                            ⚠️ Schedule removed by operator
                          </p>
                        )}

                        {sch && (
                          <p style={{ margin: '0.1rem 0', color: '#666', fontSize: '0.88rem' }}>
                            🕐 {new Date(sch.departureTime).toLocaleString()} &nbsp;|&nbsp; Rs. {sch.pricePerSeat}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => toggleExpand(booking._id)} style={detailBtn(isExpanded)}>
                          {isExpanded ? 'Hide Details ▲' : 'View Details ▼'}
                        </button>
                        {!isCancelled && sch && (
                          <button onClick={() => handleCancelBooking(booking._id)} style={cancelBtnStyle}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Expanded detail panel ── */}
                    {isExpanded && (
                      <div style={{
                        borderTop: '1px solid #f0f0f0',
                        backgroundColor: '#fafafa',
                        padding: '1.25rem 1.5rem',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>

                          {/* Trip Details */}
                          <div>
                            <h4 style={detailSectionTitle}>🗺️ Trip Details</h4>
                            {sch ? (
                              <>
                                <DetailRow label="From" value={sch.routeId?.startLocation || '—'} />
                                <DetailRow label="To" value={sch.routeId?.endLocation || '—'} />
                                {sch.routeId?.intermediateStops?.length > 0 && (
                                  <DetailRow label="Stops" value={sch.routeId.intermediateStops.join(' → ')} />
                                )}
                                <DetailRow label="Departure" value={new Date(sch.departureTime).toLocaleString()} />
                                <DetailRow label="Arrival" value={new Date(sch.arrivalTime).toLocaleString()} />
                                <DetailRow label="Bus" value={sch.busId?.busNumber || '—'} />
                                <DetailRow label="Seat" value={`Seat ${booking.seatNumber}`} />
                                <DetailRow label="Price Paid" value={`Rs. ${sch.pricePerSeat}`} />
                              </>
                            ) : (
                              <p style={{ color: '#999', fontSize: '0.88rem' }}>Schedule no longer available</p>
                            )}
                          </div>

                          {/* Booking Details */}
                          <div>
                            <h4 style={detailSectionTitle}>🎫 Booking Details</h4>
                            <DetailRow label="Booking ID" value={booking._id} mono />
                            <DetailRow label="Booked On" value={new Date(booking.bookingTime).toLocaleString()} />
                            <DetailRow label="Status" value={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)} />
                            <DetailRow label="Payment" value={booking.paymentStatus || 'paid'} />
                            {isCancelled && booking.cancelledBy && (
                              <DetailRow label="Cancelled By" value={booking.cancelledBy === 'agency' ? 'Operator' : 'You'} />
                            )}
                          </div>
                        </div>

                        {/* Cancellation reason */}
                        {isCancelled && booking.cancellationReason && (
                          <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem',
                            backgroundColor: '#fff8e1', borderRadius: '6px',
                            borderLeft: '3px solid #ffa000', fontSize: '0.88rem', color: '#5d4037'
                          }}>
                            <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const DetailRow = ({ label, value, mono }) => (
  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', alignItems: 'flex-start' }}>
    <span style={{ color: '#888', fontSize: '0.82rem', minWidth: '90px', flexShrink: 0 }}>{label}:</span>
    <span style={{ color: '#333', fontSize: '0.88rem', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
  </div>
);

// ── Shared styles ─────────────────────────────────────────────────────────────

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
  fontWeight: active ? 700 : 500, cursor: 'pointer', fontSize: '0.95rem',
});

const formCard = {
  backgroundColor: 'white', border: '1px solid #e0e0e0',
  borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem',
};

const labelStyle = { display: 'block', marginBottom: '0.35rem', fontWeight: 500, fontSize: '0.85rem', color: '#555' };

const inputStyle = {
  width: '100%', padding: '0.6rem 0.8rem',
  border: '1px solid #ccc', borderRadius: '5px', fontSize: '0.95rem',
};

const searchBtn = (loading) => ({
  padding: '0.6rem 1.4rem', backgroundColor: loading ? '#9e9e9e' : '#1a237e',
  color: 'white', border: 'none', borderRadius: '5px',
  cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
  height: 'fit-content',
});

const infoText = { margin: '0 0 0.25rem', color: '#555', fontSize: '0.88rem' };

const refreshBtn = {
  padding: '0.4rem 0.9rem', backgroundColor: 'white',
  border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem',
};

const detailBtn = (active) => ({
  padding: '0.4rem 0.9rem', fontSize: '0.82rem', fontWeight: 500,
  backgroundColor: active ? '#e8eaf6' : 'white',
  color: active ? '#1a237e' : '#555',
  border: `1px solid ${active ? '#1a237e' : '#ccc'}`,
  borderRadius: '5px', cursor: 'pointer',
});

const cancelBtnStyle = {
  padding: '0.4rem 0.9rem', backgroundColor: '#ffebee',
  color: '#c62828', border: '1px solid #ffcdd2',
  borderRadius: '5px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
};

const detailSectionTitle = {
  margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#444'
};

export default PassengerDashboard;
