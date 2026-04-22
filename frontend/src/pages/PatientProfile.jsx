import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

export default function PatientProfile({user}) {
  const [params] = useSearchParams();
  const currentPatId = params.get('id'); 
  const routeNav = useNavigate();
  
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

  useEffect(() => { 
    if (currentPatId && user && (user.doctor_id || user.DOCTOR_ID)) {
        gatherProfileInfo(); 
    }
  }, [currentPatId, user]);

  const gatherProfileInfo = async () => {
    setIsFetching(true);
    setLoadErr(null);
    const docIden = user?.doctor_id || user?.DOCTOR_ID;
    
    try {
      const [patResp, apptResp, rxResp] = await Promise.all([
        apiFetch(`/api/rest/doctor/${docIden}/patients/${currentPatId}`),
        apiFetch(`/api/rest/doctor/${docIden}/patients/${currentPatId}/appointments`),
        apiFetch(`/cfm/prescriptions.cfm?doctorId=${docIden}&patientId=${currentPatId}`)
      ]);

      if (!patResp.ok) throw new Error(`Patient lookup failed: ${patResp.status}`);
      if (!apptResp.ok) throw new Error(`Appointment fetch failed: ${apptResp.status}`);
      if (!rxResp.ok) throw new Error(`Prescription fetch failed: ${rxResp.status}`);

      const patData = await patResp.json();
      const apptData = await apptResp.json();
      const rxData = await rxResp.json();

      if (patData.success) {
          setPatRecord(Array.isArray(patData.patient) ? patData.patient[0] : patData.patient);
      }
      setFutureAppts(apptData.appointments || []);
      setMedList(rxData.prescriptions || []);

    } catch (e) { 
        console.error(e); 
        setLoadErr(e.message);
    }
    setIsFetching(false);
  };

  const deleteRxRecord = async (targetId) => {
    if (!window.confirm('Remove this prescription record?')) return;
    const docIden = user?.doctor_id || user?.DOCTOR_ID;
    try {
      const resp = await apiFetch(`/cfm/prescriptions.cfm?doctorId=${docIden}&patientId=${currentPatId}&prescriptionId=${targetId}`, {
          method: 'DELETE'
      });
      const parsed = await resp.json();
      if (parsed.success) gatherProfileInfo();
      else alert(parsed.message || "Deletion failed");
    } catch (e) { console.error(e); }
  };

  const executeApptCancel = async () => {
    if (!cancelExplanation.trim()) return;
    try {
      const docIden = user?.doctor_id || user?.DOCTOR_ID;
      const cancelId = pendingCancel.appointment_id || pendingCancel.APPOINTMENT_ID;

      // FIXED: Pointing to the /cfm proxy and using action: 'cancel' to avoid 404
      const resp = await apiFetch(`/cfm/appointments.cfm?doctorId=${docIden}&patientId=${currentPatId}&appointmentId=${cancelId}`, {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'cancel', 
            reason: cancelExplanation 
          })
      });
      
      const parsed = await resp.json();
      if (parsed.success) {
          setPendingCancel(null);
          setCancelExplanation('');
          gatherProfileInfo();
      } else {
          alert(parsed.message || "Cancellation failed");
      }
    } catch (e) { console.error(e); }
  };

  if (isFetching) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading Profile...</Typography></Box>;
  
  if (loadErr) return (
    <Box sx={{ p: 4, maxWidth: '600px', margin: '0 auto' }}>
        <Alert color="danger" variant="soft" sx={{ mb: 2 }}>{loadErr}</Alert>
        <Button fullWidth onClick={gatherProfileInfo}>Retry</Button>
        <Button fullWidth variant="plain" onClick={() => routeNav('/')} sx={{ mt: 1 }}>Return to Search</Button>
    </Box>
  );

  if (!patRecord) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="danger">Record Not Found</Typography><Button onClick={() => routeNav('/')}>Go Back</Button></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: '0 auto' }}>
      <Button variant="plain" startDecorator={<ArrowBackIcon />} onClick={() => routeNav('/')} sx={{ mb: 3 }}>Return to Search</Button>

      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Stack alignItems="center" spacing={2}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
                {(patRecord.first_name || patRecord.FIRST_NAME || 'P')[0]}
              </Avatar>
              <Box sx={{ textAlign: 'center' }}>
                <Typography level="h3">{patRecord.first_name || patRecord.FIRST_NAME} {patRecord.last_name || patRecord.LAST_NAME}</Typography>
                <Chip size="sm" variant="soft" color="success">Verified Patient</Chip>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              <Box><Typography level="body-xs" fontWeight="bold">Patient System ID</Typography><Typography level="body-md">{currentPatId}</Typography></Box>
              <Box><Typography level="body-xs" fontWeight="bold">Birth Date</Typography><Typography level="body-md">{formatDate(patRecord.date_of_birth || patRecord.DATE_OF_BIRTH)}</Typography></Box>
              <Box><Typography level="body-xs" fontWeight="bold">Contact</Typography><Typography level="body-sm">📧 {patRecord.email || patRecord.EMAIL}</Typography><Typography level="body-sm">📞 {patRecord.phone_number || patRecord.PHONE_NUMBER}</Typography></Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Button fullWidth size="sm" onClick={() => setShowApptDiag(true)} startDecorator={<EventIcon />}>Schedule</Button>
                <Button fullWidth size="sm" color="success" onClick={() => setShowRxDiag(true)} startDecorator={<MedicationIcon />}>Prescribe</Button>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Stack spacing={3}>
            <Card variant="outlined">
              <Typography level="title-lg" startDecorator={<EventIcon color="primary" />}>Scheduled Appointments</Typography>
              <Divider sx={{ my: 1.5 }} />
              {futureAppts.length === 0 ? (<Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>No upcoming appointments</Typography>) : (
                <Table hoverRow size="sm">
                  <thead><tr><th>Reason</th><th>Date / Time</th><th>Status</th><th style={{ width: 80 }}></th></tr></thead>
                  <tbody>
                    {futureAppts.map(ap => (
                      <tr key={ap.appointment_id || ap.APPOINTMENT_ID}>
                        <td>{ap.reason || ap.REASON}</td>
                        <td>{formatDate(ap.date || ap.DATE)} @ {ap.scheduled_start || ap.SCHEDULED_START}</td>
                        <td><Chip size="sm" color={ap.status === 'cancelled' ? 'danger' : 'primary'} variant="soft">{ap.status || 'Scheduled'}</Chip></td>
                        <td>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="sm" variant="plain" onClick={() => { setApptToEdit(ap); setShowApptDiag(true); }}><EditIcon /></IconButton>
                            {ap.status !== 'cancelled' && (
                                <IconButton size="sm" variant="plain" color="danger" onClick={() => setPendingCancel(ap)}><DeleteOutlineIcon /></IconButton>
                            )}
                          </Stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>

            <Card variant="outlined">
              <Typography level="title-lg" startDecorator={<MedicationIcon color="success" />}>Active Prescriptions</Typography>
              <Divider sx={{ my: 1.5 }} />
              {medList.length === 0 ? (<Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>No active records</Typography>) : (
                <Stack spacing={2}>
                  {medList.map((rxItem) => {
                    const rId = rxItem.prescription_id || rxItem.PRESCRIPTION_ID;
                    return (
                        <Sheet key={rId} variant="soft" sx={{ p: 2, borderRadius: 'md' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography level="title-sm">Issued {formatDate(rxItem.prescription_date || rxItem.PRESCRIPTION_DATE)}</Typography>
                            <IconButton size="sm" color="danger" variant="plain" onClick={() => deleteRxRecord(rId)}><DeleteOutlineIcon /></IconButton>
                          </Stack>
                          <Table size="sm" borderAxis="both" sx={{ bgcolor: 'background.surface' }}>
                            <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th></tr></thead>
                            <tbody>
                              {(rxItem.medications || []).map((m, idx) => (
                                <tr key={idx}>
                                  <td>{m.medication_name || m.MEDICATION_NAME}</td>
                                  <td>{m.dosage || m.DOSAGE}</td>
                                  <td>{m.freq_per_day || m.FREQ_PER_DAY}x {m.frequency_type === 1 ? 'daily' : 'weekly'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Sheet>
                    )
                  })}
                </Stack>
              )}
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {showApptDiag && <AppointmentModal patientId={currentPatId} editData={apptToEdit} onClose={() => {setShowApptDiag(false); setApptToEdit(null);}} onSuccess={() => {setShowApptDiag(false); gatherProfileInfo();}} user={user} />}
      {showRxDiag && <PrescriptionModal patientId={currentPatId} patientName={`${patRecord.first_name || patRecord.FIRST_NAME} ${patRecord.last_name || patRecord.LAST_NAME}`} editData={rxToEdit} onClose={() => {setShowRxDiag(false); setRxToEdit(null);}} onSuccess={() => {setShowRxDiag(false); gatherProfileInfo();}} user={user} />}

      <Modal open={!!pendingCancel} onClose={() => setPendingCancel(null)}>
        <ModalDialog>
            <ModalClose />
            <Typography level="h4">Cancel Appointment</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography level="body-md">Confirm cancellation for <strong>{pendingCancel ? formatDate(pendingCancel.date || pendingCancel.DATE) : ''}</strong>?</Typography>
            <FormControl sx={{ mt: 2 }} required>
                <FormLabel>Reason for Cancellation</FormLabel>
                <Textarea minRows={3} value={cancelExplanation} onChange={(e) => setCancelExplanation(e.target.value)} />
            </FormControl>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="plain" onClick={() => setPendingCancel(null)}>Keep Appointment</Button>
                <Button color="danger" onClick={executeApptCancel}>Confirm Cancel</Button>
            </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}