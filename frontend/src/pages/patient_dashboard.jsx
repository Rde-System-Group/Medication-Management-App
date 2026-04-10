import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
//FIGMA LIBRARY MUI USED TO CREATE UI COMPONENTS
// NAVIGATION BAR
import NavHeader from '../components/NavHeader';

// Fetch GET API functions for tables
import { getPatientInfo, getPrescribedMedications, getReminders } from '../services/api';

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

function makeArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
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

//Temporarily hardcoded provider information - MUST EDIT
function ProviderCard() {
  return (
    <Paper sx={{ p: 2, minHeight: 250, height: '100%', width: '100%', minWidth: 0 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Your Primary Care Provider
      </Typography>

      <Typography>Dr. Jane Doe, MD</Typography>
      <Typography color="text.secondary">Doctor Specialty</Typography>
    </Paper>
  );
}


function ReminderCard({ reminders, loading, onDelete }) {
  return (
    <Card sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}> Reminders </Typography>

        <Box sx={{ mb: 2 }}>
          <Button variant="contained">Create Reminder</Button>
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
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                { /*============================================================================= */}
                <TableBody>
                  {
                    reminders.map((reminder, i) =>
                    (
                      <TableRow key={reminder.ID || i}>
                        <TableCell>{reminder.MEDICATION_NAME || reminder.TITLE_OF_REMINDER || 'n/a'}</TableCell>
                        <TableCell>{formatTime(reminder.REMINDER_TIME_1)}</TableCell>
                        <TableCell>
                          <Button variant="contained" color="error" size="small" onClick={() => onDelete(reminder.ID)}> Delete </Button>
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

function AppointmentCard() {
  return (
    <Paper sx={{ p: 2, minHeight: 260, height: '100%', width: '100%', minWidth: 0 }}>
      <Typography variant="h6">Upcoming Appointments</Typography>
    </Paper>
  );
}

function PatientDashboard() {

  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);

  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingMedications, setLoadingMedications] = useState(true);
  const [loadingReminders, setLoadingReminders] = useState(true);

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

  function handleDeleteReminder(reminderId) {
    console.log('Delete clicked for reminder id:', reminderId);
    alert('Under construction!!!! Must add Delete endpoint');
  }

  useEffect(() => {
    loadPatient();
    loadMedications();
    loadReminders();
  }, []); //run once when the page first loads



  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
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
            <ProviderCard />
          </Grid>
          { /*============================================================================= */}
          {/* Reminder card */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
            <ReminderCard reminders={reminders} loading={loadingReminders} onDelete={handleDeleteReminder} />
          </Grid>
          { /*============================================================================= */}
          {/* Appointment card */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <AppointmentCard />
          </Grid>
          { /*============================================================================= */}
        </Grid>

      </Container>
    </Box>
  );
}

export default PatientDashboard;
