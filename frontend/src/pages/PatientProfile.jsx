import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, getAppointments, getPrescriptions, deletePrescription, cancelAppointment } from '../services/api';
import AppointmentModal from '../components/AppointmentModal';
import PrescriptionModal from '../components/PrescriptionModal';
import { formatDate } from '../utils/formatDate';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [editingRx, setEditingRx] = useState(null);
  const [editingAppt, setEditingAppt] = useState(null);
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, rRes] = await Promise.all([
        getPatient(id),
        getAppointments(id),
        getPrescriptions(id)
      ]);
      setPatient(pRes.patient);
      setAppointments(aRes.appointments || []);
      setPrescriptions(rRes.prescriptions || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleEditPrescription = (rx) => {
    setEditingRx(rx);
    setShowRxModal(true);
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    try {
      await deletePrescription(id, prescriptionId);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete prescription');
    }
  };

  const handleEditAppointment = (appt) => {
    setEditingAppt(appt);
    setShowApptModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }
    try {
      await cancelAppointment(cancellingAppt.appointment_id, cancelReason);
      setCancellingAppt(null);
      setCancelReason('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel appointment');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!patient) return <div className="error">Patient not found</div>;

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{marginBottom: '1rem'}}>
        ← Back to Search
      </button>

      <div className="card">
        <div className="profile-header">
          <div className="profile-avatar">👤</div>
          <div>
            <h1 style={{marginBottom: '0.25rem'}}>{patient.first_name} {patient.last_name}</h1>
            <span style={{color: '#64748b'}}>Patient ID: {patient.patient_id}</span>
          </div>
          <span className="badge badge-success" style={{marginLeft: 'auto'}}>Primary Care</span>
        </div>

        <div className="profile-details">
          <div className="detail"><label>Date of Birth</label><span>{formatDate(patient.date_of_birth)}</span></div>
          <div className="detail"><label>Gender</label><span>{patient.gender}</span></div>
          <div className="detail"><label>Sex</label><span>{patient.sex}</span></div>
          <div className="detail"><label>Ethnicity</label><span>{patient.ethnicity}</span></div>
          <div className="detail"><label>Race</label><span>{patient.races?.length > 0 ? patient.races.join(', ') : 'Not specified'}</span></div>
        </div>

        <div style={{marginBottom: '1.5rem', color: '#475569'}}>
          📧 {patient.email} &nbsp;&nbsp; 📞 {patient.phone_number}
        </div>

        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => { setEditingAppt(null); setShowApptModal(true); }}>📅 Set Appointment</button>
          <button className="btn btn-success" onClick={() => setShowRxModal(true)}>💊 Prescribe Medication</button>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>📅 Appointments</h3>
          <span className="section-count">{appointments.length} total</span>
        </div>
        {appointments.length === 0 ? (
          <div className="empty">No appointments scheduled</div>
        ) : (
          appointments.map(a => (
            <div key={a.appointment_id} className={`appt-item ${a.status === 'cancelled' ? 'appt-cancelled' : ''}`}>
              <div className="appt-icon">{a.status === 'cancelled' ? '❌' : '🕐'}</div>
              <div className="appt-info" style={{flex: 1}}>
                <div className="appt-type">
                  {a.reason}
                  {a.status === 'cancelled' && <span className="badge" style={{marginLeft: '0.5rem', background: '#fee2e2', color: '#dc2626'}}>Cancelled</span>}
                </div>
                <div className="appt-time">{formatDate(a.date)} · {a.scheduled_start} - {a.scheduled_end}</div>
                {a.status === 'cancelled' && a.cancellation_reason && (
                  <div className="appt-cancel-reason">Reason: {a.cancellation_reason}</div>
                )}
              </div>
              {a.status !== 'cancelled' && (
                <div className="appt-actions">
                  <button 
                    className="btn btn-secondary" 
                    style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                    onClick={() => handleEditAppointment(a)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn" 
                    style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', marginLeft: '0.25rem'}}
                    onClick={() => setCancellingAppt(a)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <h3>💊 Prescriptions</h3>
          <span className="section-count">{prescriptions.length} total</span>
        </div>
        {prescriptions.length === 0 ? (
          <div className="empty">No prescriptions</div>
        ) : (
          prescriptions.map((rx, idx) => (
            <div key={rx.prescription_id} className="rx-card">
              <div className="rx-header">
                <strong>Prescription #{idx + 1}</strong>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span>{formatDate(rx.prescription_date)}</span>
                  <span className={`badge ${rx.is_active ? 'badge-success' : ''}`}>
                    {rx.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}
                    onClick={() => handleEditPrescription(rx)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn" 
                    style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: 'white'}}
                    onClick={() => handleDeletePrescription(rx.prescription_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Supply</th><th>Refills</th></tr>
                </thead>
                <tbody>
                  {rx.medications.map((m, i) => (
                    <tr key={i}>
                      <td>{m.medication_name}</td>
                      <td>{m.dosage}</td>
                      <td>{m.freq_per_day}x {m.frequency_type === 1 ? 'daily' : m.frequency_type === 2 ? 'weekly' : m.frequency_type === 3 ? 'monthly' : 'as needed'}</td>
                      <td>{m.supply}</td>
                      <td>{m.refills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {showApptModal && (
        <AppointmentModal
          patientId={id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          editData={editingAppt}
          onClose={() => { setShowApptModal(false); setEditingAppt(null); }}
          onSuccess={() => { setShowApptModal(false); setEditingAppt(null); loadData(); }}
        />
      )}

      {showRxModal && (
        <PrescriptionModal
          patientId={id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          editData={editingRx}
          onClose={() => { setShowRxModal(false); setEditingRx(null); }}
          onSuccess={() => { setShowRxModal(false); setEditingRx(null); loadData(); }}
        />
      )}

      {/* Cancel Appointment Modal */}
      {cancellingAppt && (
        <div className="modal-overlay" onClick={() => { setCancellingAppt(null); setCancelReason(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{width: '400px'}}>
            <div className="modal-header">
              <h2>❌ Cancel Appointment</h2>
              <button className="modal-close" onClick={() => { setCancellingAppt(null); setCancelReason(''); }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{marginBottom: '1rem'}}>
                Are you sure you want to cancel the appointment on <strong>{formatDate(cancellingAppt.date)}</strong> at <strong>{cancellingAppt.scheduled_start}</strong>?
              </p>
              <div className="form-group">
                <label>Cancellation Reason *</label>
                <textarea 
                  value={cancelReason} 
                  onChange={e => setCancelReason(e.target.value)} 
                  placeholder="Please provide a reason for cancellation..."
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setCancellingAppt(null); setCancelReason(''); }}>Keep Appointment</button>
              <button className="btn" style={{background: '#ef4444', color: 'white'}} onClick={handleCancelAppointment}>Cancel Appointment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
