import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, getAppointments, getPrescriptions } from '../services/api';
import AppointmentModal from '../components/AppointmentModal';
import PrescriptionModal from '../components/PrescriptionModal';

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);

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
          <div className="detail"><label>Date of Birth</label><span>{patient.date_of_birth}</span></div>
          <div className="detail"><label>Gender</label><span>{patient.gender}</span></div>
          <div className="detail"><label>Sex</label><span>{patient.sex}</span></div>
          <div className="detail"><label>Ethnicity</label><span>{patient.ethnicity}</span></div>
        </div>

        <div style={{marginBottom: '1.5rem', color: '#475569'}}>
          📧 {patient.email} &nbsp;&nbsp; 📞 {patient.phone_number}
        </div>

        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => setShowApptModal(true)}>📅 Set Appointment</button>
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
            <div key={a.appointment_id} className="appt-item">
              <div className="appt-icon">🕐</div>
              <div className="appt-info">
                <div className="appt-type">{a.reason}</div>
                <div className="appt-time">{a.date} · {a.scheduled_start} - {a.scheduled_end}</div>
              </div>
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
          prescriptions.map(rx => (
            <div key={rx.prescription_id} className="rx-card">
              <div className="rx-header">
                <strong>Prescription #{rx.prescription_id}</strong>
                <div>
                  <span style={{marginRight: '0.5rem'}}>{rx.prescription_date}</span>
                  <span className={`badge ${rx.is_active ? 'badge-success' : ''}`}>
                    {rx.is_active ? 'Active' : 'Inactive'}
                  </span>
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
                      <td>{m.freq_per_day}x daily</td>
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
          onClose={() => setShowApptModal(false)}
          onSuccess={() => { setShowApptModal(false); loadData(); }}
        />
      )}

      {showRxModal && (
        <PrescriptionModal
          patientId={id}
          patientName={`${patient.first_name} ${patient.last_name}`}
          onClose={() => setShowRxModal(false)}
          onSuccess={() => { setShowRxModal(false); loadData(); }}
        />
      )}
    </div>
  );
}
