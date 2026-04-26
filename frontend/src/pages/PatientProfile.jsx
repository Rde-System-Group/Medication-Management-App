import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Box, Card, Typography, Button, Divider, Stack, Grid, 
    Chip, Avatar, Sheet, Table, IconButton, Modal, ModalDialog, 
    ModalClose, Textarea, FormControl, FormLabel, Alert
} from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventIcon from '@mui/icons-material/Event';
import MedicationIcon from '@mui/icons-material/Medication';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { apiFetch } from '../lib/calls';
import AppointmentModal from '../components/AppointmentModal';
import PrescriptionModal from '../components/PrescriptionModal';
import { formatDate } from '../utils/formatDate';
import {getPatient, getAppointments, getPrescriptions} from "../services/api"

export default function PatientProfile({user}) {
  const [params] = useSearchParams();
  const currentPatId = params.get('id'); 
  const initialAction = params.get('action'); // 'appointment' | 'medication'
  
  const [patRecord, setPatRecord] = useState(null);
  const [futureAppts, setFutureAppts] = useState([]);
  const [medList, setMedList] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  
  const [showApptDiag, setShowApptDiag] = useState(false);
  const [showRxDiag, setShowRxDiag] = useState(false);
  const [rxToEdit, setRxToEdit] = useState(null);
  const [apptToEdit, setApptToEdit] = useState(null);
  
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelExplanation, setCancelExplanation] = useState('');

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => { loadData(); }, [currentPatId]);

  const loadData = async () => {
    setIsFetching(true);
    try {
      const [pRes, aRes, rRes] = await Promise.all([
        getPatient(currentPatId),
        getAppointments(currentPatId),
        getPrescriptions(currentPatId)
      ]);
      setPatient(pRes.patient);
      setAppointments(aRes.appointments || []);
      setPrescriptions(rRes.prescriptions || []);
    } catch (err) {
      console.error(err);
    }
    setIsFetching(false);
  };

  const handleEditPrescription = (rx) => {
    setEditingRx(rx);
    setShowRxModal(true);
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;
    try {
      console.log('Deleting prescription:', prescriptionId, 'for patient:', currentPatId);
      const result = await deletePrescription(id, prescriptionId);
      console.log('Delete result:', result);
      await loadData();
      console.log('Data reloaded');
    } catch (err) {
      console.error('Delete error:', err);
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

  if (isFetching) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading Profile...</Typography></Box>;
  
  if (loadErr) return (
    <Box sx={{ p: 4, maxWidth: '600px', margin: '0 auto' }}>
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>{loadErr}</Alert>
        <Button fullWidth onClick={gatherProfileInfo}>Retry</Button>
        <Button fullWidth variant="plain" 
        href={"/"}
        component="a" 
        sx={{ mt: 1 }}>Return to Search</Button>
    </Box>
  );

  if (!patRecord) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="danger">Record Not Found</Typography>
      <Button
        href={"/"}
        component="a" 
        >Go Back</Button></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: '0 auto' }}>
      <Button variant="plain" startDecorator={<ArrowBackIcon />} 
        href={"/"}
        component="a" 
        sx={{ mb: 3 }}>Return to Search</Button>

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
    </Box>
  );
}
