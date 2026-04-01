import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAppointments } from '../services/api';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    getAppointments().then(data => {
      setAppointments(data.appointments || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Convert appointments to calendar events
  const calendarEvents = appointments.map(a => {
    const [startHour, startMin] = (a.scheduled_start || '09:00').split(':').map(Number);
    const [endHour, endMin] = (a.scheduled_end || '10:00').split(':').map(Number);
    const dateObj = new Date(a.date);
    
    return {
      id: a.appointment_id,
      title: `${a.patient_name} - ${a.reason}`,
      start: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), startHour, startMin),
      end: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), endHour, endMin),
      resource: a,
    };
  });

  const handleNavigate = useCallback((newDate) => {
    setCalendarDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setCalendarView(newView);
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Appointments</h1>
          <p className="subtitle" style={{ margin: 0 }}>All upcoming appointments for Dr. Sarah Smith</p>
        </div>
        <div className="view-toggle">
          <button 
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            style={{ borderRadius: '4px 0 0 4px' }}
          >
            📋 List
          </button>
          <button 
            className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('calendar')}
            style={{ borderRadius: '0 4px 4px 0', marginLeft: '-1px' }}
          >
            📅 Calendar
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="card">
          {appointments.length === 0 ? (
            <div className="empty">No appointments scheduled</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.appointment_id}>
                    <td>{a.date}</td>
                    <td>{a.scheduled_start} - {a.scheduled_end}</td>
                    <td>{a.patient_name}</td>
                    <td>{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={['month', 'week', 'day']}
            view={calendarView}
            date={calendarDate}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            eventPropGetter={() => ({
              style: {
                backgroundColor: '#3b82f6',
                borderRadius: '4px',
                border: 'none',
                color: 'white',
              }
            })}
            onSelectEvent={(event) => setSelectedEvent(event.resource)}
          />
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-header">
              <h2>📅 Appointment Details</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="appt-detail-grid">
                <div className="appt-detail-item">
                  <label>Patient</label>
                  <span>{selectedEvent.patient_name}</span>
                </div>
                <div className="appt-detail-item">
                  <label>Date</label>
                  <span>{selectedEvent.date}</span>
                </div>
                <div className="appt-detail-item">
                  <label>Time</label>
                  <span>{selectedEvent.scheduled_start} - {selectedEvent.scheduled_end}</span>
                </div>
                <div className="appt-detail-item">
                  <label>Reason</label>
                  <span>{selectedEvent.reason}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
