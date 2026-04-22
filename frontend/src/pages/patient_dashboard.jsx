import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  IconButton,
  Paper,
  Popover,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
//FIGMA LIBRARY MUI USED TO CREATE UI COMPONENTS
// NAVIGATION BAR
import NavHeader from '../components/NavHeader';

// Fetch GET API functions for tables
import { deleteReminder, getAppointments, getAssignedDoctors, getPatientInfo, getPrescribedMedications, getReminders } from '../services/api';
import { useNavigate } from "react-router-dom";

//Temporary hardcoded patient ID
const PATIENT_ID = 1;

//source: https://www.bing.com/ck/a?!&&p=fb0f51ed58887088882f84fdd61a8e3ee9cc26d564041a46833ddbb47cf3b563JmltdHM9MTc3NTc3OTIwMA&ptn=3&ver=2&hsh=4&fclid=0ed859f0-c337-6416-3eff-4bf0c22e6531&psq=function+formatTime(timeStr)+%7b+if+(!timeStr)+return+%27-%27%3b+const+match+%3d+String(timeStr).match(%2f(%5cd%7b1%2c2%7d)%3a(%5cd%7b2%7d)%2f)%3b+if+(!match)+return+timeStr%3b+let+hours+%3d+parseInt(match%5b1%5d%2c+10)%3b+const+minutes+%3d+match%5b2%5d%3b+const+ampm+%3d+hours+%3e%3d+12+%3f+%27PM%27+%3a+%27AM%27%3b+hours+%3d+hours+%25+12%3b+if+(hours+%3d%3d%3d+0)+%7b+hours+%3d+12%3b+%7d+return+%60%24%7bhours%7d%3a%24%7bminutes%7d+%24%7bampm%7d%60%3b+%7d&u=a1aHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTQ2MzgwMTgvY3VycmVudC10aW1lLWZvcm1hdHRpbmctd2l0aC1qYXZhc2NyaXB0
//https://www.bing.com/ck/a?!&&p=e4da20dd5d541a3fdd9f805e6a8461067b85ca8b16419de9615b88f8ccba0b3dJmltdHM9MTc3NTc3OTIwMA&ptn=3&ver=2&hsh=4&fclid=0ed859f0-c337-6416-3eff-4bf0c22e6531&psq=function+formatTime(timeStr)+%7b+if+(!timeStr)+return+%27-%27%3b+const+match+%3d+String(timeStr).match(%2f(%5cd%7b1%2c2%7d)%3a(%5cd%7b2%7d)%2f)%3b+if+(!match)+return+timeStr%3b+let+hours+%3d+parseInt(match%5b1%5d%2c+10)%3b+const+minutes+%3d+match%5b2%5d%3b+const+ampm+%3d+hours+%3e%3d+12+%3f+%27PM%27+%3a+%27AM%27%3b+hours+%3d+hours+%25+12%3b+if+(hours+%3d%3d%3d+0)+%7b+hours+%3d+12%3b+%7d+return+%60%24%7bhours%7d%3a%24%7bminutes%7d+%24%7bampm%7d%60%3b+%7d&u=a1aHR0cHM6Ly93d3cuamF2YXNwcmluZy5uZXQvYmxvZy9qYXZhc2NyaXB0LXBhcnNpbmctdGltZXMtd2l0aG91dC1kYXRlLw\
function formatTime(timeStr) {
  if (!timeStr) return '-';

  const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${hours}:${minutes} ${ampm}`;
}

// Copied from appointments.jsx to keep record date formatting consistent across pages.
function formatDate(dateStr) {
  if (!dateStr) return '-';

  const parsed = parseAppointmentDate(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.toLocaleString('en-US', { month: 'short' })} ${parsed.getDate()}, ${parsed.getFullYear()}`;
  }

  return String(dateStr);
}

// Copied from appointments.jsx so the dashboard parses appointment date strings exactly the same way.
function parseAppointmentDate(dateValue) {
  if (!dateValue) return new Date();

  const raw = String(dateValue).trim();
  const sqlLike = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
  const fromIso = new Date(sqlLike);
  if (!Number.isNaN(fromIso.getTime())) {
    return fromIso;
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return new Date();
}

function parseAppointmentTime(timeValue, fallbackHour) {
  const match = String(timeValue || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return { hour: fallbackHour, minute: 0 };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function makeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

function normalizeAppointment(item, index) {
  return {
    appointment_id: item.appointment_id ?? item.APPOINTMENT_ID ?? item.id ?? item.ID ?? index,
    date: item.date ?? item.DATE ?? item.d ?? item.D ?? null,
    scheduled_start: item.scheduled_start ?? item.SCHEDULED_START ?? item.start ?? item.START ?? null,
    reason: item.reason ?? item.REASON ?? item.r ?? item.R ?? 'Appointment',
    status: item.status ?? item.STATUS ?? item.s ?? item.S ?? 'scheduled',
  };
}

function normalizeDoctor(doctor) {
  return {
    id: doctor.id ?? doctor.ID ?? doctor.doctor_id ?? doctor.DOCTOR_ID,
    first_name: doctor.first_name ?? doctor.FIRST_NAME ?? '',
    last_name: doctor.last_name ?? doctor.LAST_NAME ?? '',
    specialty: doctor.specialty ?? doctor.SPECIALTY ?? '',
    work_email: doctor.work_email ?? doctor.WORK_EMAIL ?? '',
  };
}

//FIGMA LIBRARY MUI USED TO CREATE UI COMPONENTS
function MedicationCard({ medications, loading }) {
  return (
    <Card sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Your Prescribed Medications</Typography>

        {loading ? (<Typography>Loading medications...</Typography>) : medications.length === 0 ? (<Typography>No prescribed medications found.</Typography>) :
          (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Medication Name</TableCell>
                    <TableCell>Dosage</TableCell>
                    <TableCell>Supply</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Refills</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {medications.map((medication, i) => (
                    <TableRow key={medication.id || medication.ID || i}>
                      <TableCell>{medication.medication_name || medication.MEDICATION_NAME || '-'}</TableCell>
                      <TableCell>{medication.dosage || medication.DOSAGE || '-'}</TableCell>
                      <TableCell>{medication.supply || medication.SUPPLY || '-'}</TableCell>
                      <TableCell>
                        {medication.is_active === 1 || medication.is_active === true || medication.IS_ACTIVE === 1 || medication.IS_ACTIVE === true ? 'Active' : 'Inactive'}
                      </TableCell>
                      <TableCell>{medication.refills ?? medication.REFILLS ?? 'n/a'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
      </CardContent>
    </Card>
  );
}

function ProviderCard({ providers, loading }) {
  return (
    <Paper sx={{ p: 2, minHeight: 250, height: '100%', width: '100%', minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Primary Care Provider
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading provider...</Typography>
      ) : providers.length === 0 ? (
        <Typography color="text.secondary">No provider assigned yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {providers.map((provider, index) => (
            <Paper key={provider.id || index} variant="outlined" sx={{ p: 1.25 }}>
              <Typography sx={{ fontWeight: 600 }}>{provider.first_name} {provider.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{provider.specialty || 'No specialty'}</Typography>
              <Typography variant="body2" color="text.secondary">{provider.work_email || 'No email'}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
}


function ReminderCard({ reminders, loading, deletingReminderId, onDelete }) {
  const navigate = useNavigate();
  const [instructionsAnchor, setInstructionsAnchor] = useState(null);
  const [selectedReminderInstructions, setSelectedReminderInstructions] = useState('');

  function handleOpenInstructions(event, reminder) {
    setInstructionsAnchor(event.currentTarget);
    setSelectedReminderInstructions(
      reminder.instructions || reminder.INSTRUCTIONS || 'No instructions available for this reminder.',
    );
  }

  function handleCloseInstructions() {
    setInstructionsAnchor(null);
    setSelectedReminderInstructions('');
  }

  return (
    <Card sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <CardContent>
        <Popover anchorEl={instructionsAnchor} open={Boolean(instructionsAnchor)} onClose={handleCloseInstructions} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
          <Paper elevation={3} sx={{ p: 2, maxWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Instructions</Typography>
            <Typography variant="body2" color="text.secondary">{selectedReminderInstructions}</Typography>
          </Paper>
        </Popover>

        <Typography variant="h6" sx={{ mb: 2 }}> Reminders </Typography>

        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => navigate("/create-reminder-form")}>Create Reminder</Button>
        </Box>

        {loading ? (<Typography>Loading reminders...</Typography>) : reminders.length === 0 ? (<Typography>No upcoming reminders.</Typography>)
          :
          (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small">
                { /*============================================================================= */}
                <TableHead>
                  <TableRow>
                    <TableCell>Medication</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Info</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                { /*============================================================================= */}
                <TableBody>
                  {
                    reminders.map((reminder, i) =>
                    (
                      <TableRow key={reminder.ID || reminder.id || i}>
                        <TableCell>{reminder.medication_name || reminder.MEDICATION_NAME || reminder.title_of_reminder || reminder.TITLE_OF_REMINDER || 'n/a'}</TableCell>
                        <TableCell>{formatTime(reminder.REMINDER_TIME_1)}</TableCell>
                        <TableCell>
                          {(reminder.instructions || reminder.INSTRUCTIONS) ? (
                            <IconButton size="small" color="warning" aria-label="View reminder instructions" onClick={(event) => handleOpenInstructions(event, reminder)}>
                              <ErrorOutlineIcon fontSize="small" />
                            </IconButton>
                          ) : (
                            <Typography variant="caption" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="contained" color="error" size="small" disabled={deletingReminderId === (reminder.ID || reminder.id)} onClick={() => onDelete(reminder.ID || reminder.id)}> Delete </Button>
                        </TableCell>
                      </TableRow>
                    )
                    )
                  }
                </TableBody>
                { /*============================================================================= */}
              </Table>
            </Box>
          )}
      </CardContent>
    </Card>
  );
}

function AppointmentCard({ appointments, loading }) {
  return (
    // Copied structure from appointments.jsx UpcomingAppointmentsCard for visual consistency.
    <Card elevation={1} sx={{ height: '100%', width: '100%', minWidth: 0, borderTop: '1px solid', borderColor: 'divider' }}>
      <CardHeader title="Upcoming Appointments" variant="body" sx={{ py: 1.5 }} />
      <CardContent>
        {loading ? (<Typography>Loading appointments...</Typography>) : appointments.length === 0 ? (<Typography>No appointments scheduled</Typography>)
          : (
            <Box sx={{ width: '100%', overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.appointment_id} sx={appointment.status === 'cancelled' ? { opacity: 0.6, bgcolor: '#fef2f2' } : {}}>
                      <TableCell>{formatDate(appointment.date)}</TableCell>
                      <TableCell>{formatTime(appointment.scheduled_start)}</TableCell>
                      <TableCell>
                        {appointment.reason}
                        {appointment.status === 'cancelled' && (
                          <Typography variant="caption" display="block" color="error">Cancelled</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
      </CardContent>
    </Card>
  );
}

function PatientDashboard() {

  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);

  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [deletingReminderId, setDeletingReminderId] = useState(null);
  const [reminderFeedback, setReminderFeedback] = useState({ open: false, message: '', severity: 'success' });

  //====== 1 ======== 
  function loadPatient() {
    setLoadingPatient(true);

    getPatientInfo(PATIENT_ID)
      .then((data) => {
        const patientArray = makeArray(data);
        setPatient(patientArray[0] || null); //patientArray[0] is the first patient in the array
        console.log('Patient data:', data);
      })
      .catch((error) => {
        console.log('Patient data error:', error);
        setPatient(null);
      })
      .finally(() => {
        setLoadingPatient(false);
      });
  }

  function loadMedications() {
    setLoadingMedications(true);

    getPrescribedMedications(PATIENT_ID)
      .then((data) => {
        const medicationArray = makeArray(data);
        setMedications(medicationArray);
        console.log('Medication data:', data);
      })
      .catch((error) => {
        console.log('Medication data error:', error);
        setMedications([]);
      })
      .finally(() => {
        setLoadingMedications(false);
      });
  }

  function loadReminders() {
    setLoadingReminders(true);

    getReminders(PATIENT_ID)
      .then((data) => {
        const reminderArray = makeArray(data);
        setReminders(reminderArray);
        console.log('Reminder data:', data);
      })
      .catch((error) => {
        console.log('Reminder data error:', error);
        setReminders([]);
      })
      .finally(() => {
        setLoadingReminders(false);
      });
  }

  function loadAppointments() {
    setLoadingAppointments(true);

    getAppointments(PATIENT_ID)
      .then((data) => {
        const appointmentArray = makeArray(data)
          .map((item, index) => normalizeAppointment(item, index))
          .sort((a, b) => {
            const firstDate = parseAppointmentDate(a.date);
            const secondDate = parseAppointmentDate(b.date);
            const firstTime = parseAppointmentTime(a.scheduled_start, 0);
            const secondTime = parseAppointmentTime(b.scheduled_start, 0);

            const first = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), firstTime.hour, firstTime.minute);
            const second = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate(), secondTime.hour, secondTime.minute);

            return first.getTime() - second.getTime();
          });

        setAppointments(appointmentArray);
      })
      .catch((error) => {
        console.log('Appointments data error:', error);
        setAppointments([]);
      })
      .finally(() => {
        setLoadingAppointments(false);
      });
  }

  function loadProviders() {
    setLoadingProviders(true);

    getAssignedDoctors(PATIENT_ID)
      .then((data) => {
        const providerArray = makeArray(data).map(normalizeDoctor);
        setProviders(providerArray);
      })
      .catch((error) => {
        console.log('Provider data error:', error);
        setProviders([]);
      })
      .finally(() => {
        setLoadingProviders(false);
      });
  }

  function handleDeleteReminder(reminderId) {
    if (!reminderId) {
      setReminderFeedback({ open: true, message: 'Unable to delete reminder: missing reminder id.', severity: 'error' });
      return;
    }

    if (!window.confirm('Delete this reminder?')) {
      return;
    }

    setDeletingReminderId(reminderId);

    deleteReminder(reminderId)
      .then(() => {
        setReminders((prevReminders) => prevReminders.filter((reminder) => String(reminder.ID || reminder.id) !== String(reminderId)));
        setReminderFeedback({ open: true, message: 'Reminder deleted successfully.', severity: 'success' });
      })
      .catch((error) => {
        setReminderFeedback({
          open: true,
          message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Unable to delete reminder.',
          severity: 'error',
        });
      })
      .finally(() => {
        setDeletingReminderId(null);
      });
  }

  useEffect(() => {
    loadPatient();
    loadMedications();
    loadReminders();
    loadAppointments();
    loadProviders();
  }, []); //run once when the page first loads



  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Snackbar open={reminderFeedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setReminderFeedback((prev) => ({ ...prev, open: false }))} >
        <Alert severity={reminderFeedback.severity} variant="filled" sx={{ width: '100%' }}>
          {reminderFeedback.message}
        </Alert>
      </Snackbar>

      <NavHeader patient={patient} loading={loadingPatient} />

      <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2 } }}>

        <Grid container spacing={2}>
          { /*============================================================================= */}
          {/* Medication card */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
            <MedicationCard medications={medications} loading={loadingMedications} />
          </Grid>
          { /*============================================================================= */}
          {/* Provider card */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <ProviderCard providers={providers} loading={loadingProviders} />
          </Grid>
          { /*============================================================================= */}
          {/* Reminder card */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
            <ReminderCard reminders={reminders} loading={loadingReminders} deletingReminderId={deletingReminderId} onDelete={handleDeleteReminder} />
          </Grid>
          { /*============================================================================= */}
          {/* Appointment card */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <AppointmentCard appointments={appointments} loading={loadingAppointments} />
          </Grid>
          { /*============================================================================= */}
        </Grid>

      </Container>
    </Box>
  );
}

export default PatientDashboard;
