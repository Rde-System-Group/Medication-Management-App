import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Grid,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import NavHeader from "../components/NavHeader";
import { getPatientInfo, getReminders } from "../services/api";

const PATIENT_ID = 1;

function formatTime(timeStr) {
    if (!timeStr) return "-";

    const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
    if (!match) return String(timeStr);

    const hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes} ${ampm}`;
}

function CalendarCard() {
    return (
        <Card elevation={0} sx={{ minHeight: 500, border: "1px solid", borderColor: "divider" }}>
            <CardHeader title="Calendar" variant="body" sx={{ py: 1.5 }} />
            <CardContent>
                <Box sx={{ minHeight: 350, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body" color="text.secondary">Calendar widget will be added here.</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

function UpcomingAppointmentsCard() {
    return (
        <Card elevation={1} sx={{ borderTop: "1px solid", borderColor: "divider" }} >
            <CardHeader title="Upcoming Appointments" variant="body" sx={{ py: 1.5 }} />
            <CardContent>
                <Box sx={{ minHeight: 180, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body" color="text.secondary">Upcoming appointments will be added here.</Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

function handleDeleteReminder(reminderId) {
    console.log('Delete clicked for reminder id:', reminderId);
    alert('Under construction!!!! Must add Delete endpoint');
}

/*
function UpcomingRemindersCard({ reminders, loading }) {
    return (
        <Card elevation={1}>
            <CardHeader
                title="Upcoming Reminders"
                variant="body1"
                action={
                    <Button variant="contained" size="small">
                        Create Reminder
                    </Button>
                }
            />

            <CardContent sx={{ pt: 0 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Medication</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading &&
                            [1, 2, 3].map((row) => (
                                <TableRow key={row}>
                                    <TableCell>
                                        <Skeleton variant="text" width={170} />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton variant="text" width={90} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Skeleton
                                            variant="rounded"
                                            width={70}
                                            height={30}
                                            sx={{ ml: "auto" }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {!loading && reminders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No reminders found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            reminders.length > 0 &&
                            reminders.map((reminder) => (
                                <TableRow key={reminder.id}>
                                    <TableCell>
                                        {reminder.medication_name ||
                                            reminder.title_of_reminder ||
                                            `Medication #${reminder.id}`}
                                    </TableCell>
                                    <TableCell>{formatTime(reminder.reminder_time_1)}</TableCell>
                                    <TableCell align="right">
                                        <Button variant="contained" color="error" size="small">
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
} */

function UpcomingRemindersCard({ reminders, loading, onDelete }) {
    return (
        <Card sx={{ height: '100%', width: '100%', minWidth: 0 }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}> Upcoming Reminders </Typography>

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

export default function Appointments() {

    const [patient, setPatient] = useState(null);
    const [reminders, setReminders] = useState([]);

    const [loadingPatient, setLoadingPatient] = useState(true);
    const [loadingReminders, setLoadingReminders] = useState(true);


    function makeArray(data) {
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') return [data];
        return [];
    }

    
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

    useEffect(() => {
        loadPatient();
        loadReminders();

    }, []);


    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <NavHeader patient={patient} loading={loadingPatient} />
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}><Typography variant="h3" sx={{ fontWeight: 400, mb: 2.5 }}>Appointments</Typography>


                <Grid container spacing={3} alignItems="flex-start">

                    { /*============================================================================= */}
                    { /* Calendar Card */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <CalendarCard />
                    </Grid>
                    { /*============================================================================= */}
                    { /* Vertical Aside Cards */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={2}>
                            { /* Upcoming Appointments Card */}
                            <UpcomingAppointmentsCard />

                            { /* Upcoming Reminders Card */}
                            <UpcomingRemindersCard reminders={reminders} loading={loadingReminders} onDelete={handleDeleteReminder} />
                        </Stack>
                    </Grid>
                    { /*============================================================================= */}
                </Grid>

            </Container>
        </Box>
    );
}
