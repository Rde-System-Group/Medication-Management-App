import { useState } from 'react';
import { createAppointment } from '../services/api';

export default function AppointmentModal({ patientId, patientName, onClose, onSuccess }) {
  const [form, setForm] = useState({ date: '', start: '', end: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createAppointment({
        patientId: parseInt(patientId),
        date: form.date,
        scheduledStart: form.start,
        scheduledEnd: form.end,
        reason: form.reason
      });
      onSuccess();
    } catch (err) {
      setError('Failed to create appointment');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Set Appointment</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-info">Patient: {patientName} (ID: {patientId})</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error">{error}</div>}
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input type="time" value={form.start} onChange={e => setForm({...form, start: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input type="time" value={form.end} onChange={e => setForm({...form, end: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Reason *</label>
              <input type="text" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="e.g. Annual Checkup" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
