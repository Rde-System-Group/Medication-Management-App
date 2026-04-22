import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, getDay, parse, parseISO, startOfWeek } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Popover,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NavHeader from '../components/NavHeader';
import { deleteReminder, getAppointments, getPatientInfo, getReminders } from '../services/api';

const PATIENT_ID = 1;
const locales = { 'en-US': enUS };

//from Zaid's appointments.jsx, to keep functions consistent
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

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

function formatDate(dateStr) {
    if (!dateStr) return '-';

    const parsed = parseAppointmentDate(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
        return format(parsed, 'MMM d, yyyy');
    }

    try {
        return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
        return String(dateStr);
    }
}

function parseAppointmentDate(dateValue) {
    if (!dateValue) return new Date();

    const raw = String(dateValue).trim();

    // Handles values like "2026-04-20" and "2026-04-20 00:00:00".
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

function normalizeAppointment(item, index) { //item means appointment object and index is its position in the array
    // for personal clarity - this is a mapping function 
    // it takes in an appt object and returns a new object w standardized field names and formats
    // purpose is to make it easier to work w appt data that may come from different sources or have inconsistent structures.
    return {
        appointment_id: item.appointment_id ?? item.APPOINTMENT_ID ?? item.id ?? item.ID ?? index,
        patient_id: item.patient_id ?? item.PATIENT_ID ?? item.p_id ?? item.P_ID ?? null,
        doctor_id: item.doctor_id ?? item.DOCTOR_ID ?? item.d_id ?? item.D_ID ?? null,
        date: item.date ?? item.DATE ?? item.d ?? item.D ?? null,
        scheduled_start: item.scheduled_start ?? item.SCHEDULED_START ?? item.start ?? item.START ?? null,
        scheduled_end: item.scheduled_end ?? item.SCHEDULED_END ?? item.end ?? item.END ?? null,
        reason: item.reason ?? item.REASON ?? item.r ?? item.R ?? 'Appointment',
        status: item.status ?? item.STATUS ?? item.s ?? item.S ?? 'scheduled',
        cancellation_reason: item.cancellation_reason ?? item.CANCELLATION_REASON ?? '',
        doctor_email: item.doctor_email ?? item.DOCTOR_EMAIL ?? item.work_email ?? item.WORK_EMAIL ?? '',
    };
}

//staying consistent with doctor's side of patient calendar/appointments
function CalendarCard({ loadingAppointments, calendarEvents, calendarDate, calendarView, setCalendarDate, setCalendarView, setSelectedEvent }) {
    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardHeader title="Calendar" variant="body" sx={{ py: 1.5 }} />
            <CardContent>
                {loadingAppointments ? (
                    <Box sx={{ height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">Loading Calendar...</Typography></Box>
                ) : (
                    <Box sx={{ height: 600 }}>
                        <Calendar localizer={localizer} events={calendarEvents} startAccessor="start" endAccessor="end" views={['month', 'week', 'day']} view={calendarView} date={calendarDate} onNavigate={setCalendarDate} onView={setCalendarView} onSelectEvent={(event) => setSelectedEvent(event.resource ?? event)} eventPropGetter={(event) => ({
                            style: { backgroundColor: event.isCancelled ? '#ef4444' : '#3b82f6', borderRadius: '4px', border: 'none', color: 'white', opacity: event.isCancelled ? 0.7 : 1, textDecoration: event.isCancelled ? 'line-through' : 'none', },
                        })} />
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

function UpcomingAppointmentsCard({ loadingAppointments, appointments }) {
    return (
        <Card elevation={1} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <CardHeader title="Upcoming Appointments" variant="body" sx={{ py: 1.5 }} />
            <CardContent>            	
                
                {loadingAppointments ? (<Typography>Loading appointments...</Typography>) : appointments.length === 0 ? (<Typography>No appointments scheduled</Typography>) : 
                (
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

function UpcomingRemindersCard({ reminders, loading, deletingReminderId, onDelete }) {
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

                <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Reminders</Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Button variant="contained">Create Reminder</Button>                	
                </Box>

                {loading ? (<Typography>Loading reminders...</Typography>) : reminders.length === 0 ? (<Typography>No upcoming reminders.</Typography>) 
                    : 
                    (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Medication</TableCell>
                                    <TableCell>Time</TableCell>
                                    <TableCell>Info</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reminders.map((reminder, i) => (
                                    <TableRow key={reminder.ID || reminder.id || i}>
                                        <TableCell>{reminder.medication_name || reminder.MEDICATION_NAME || reminder.title_of_reminder || reminder.TITLE_OF_REMINDER || 'n/a'}</TableCell>
                                        <TableCell>{formatTime(reminder.REMINDER_TIME_1)}</TableCell>
                                        <TableCell>
                                            {(reminder.instructions || reminder.INSTRUCTIONS) ? (
                                                <IconButton size="small" color="warning" aria-label="View reminder instructions" onClick={(event) => handleOpenInstructions(event, reminder)}><ErrorOutlineIcon fontSize="small" /></IconButton>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="contained" color="error" size="small" disabled={deletingReminderId === (reminder.ID || reminder.id)} onClick={() => onDelete(reminder.ID || reminder.id)}>Delete</Button>
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

function AppointmentDetailsDialog({ selectedEvent, setSelectedEvent }) {
    return (
        <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogContent dividers>
                {selectedEvent && (
                    <Stack spacing={1.5}>
                        {selectedEvent.status === 'cancelled' && (
                            <Box sx={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', textAlign: 'center', fontWeight: 500 }}>This appointment has been cancelled</Box>
                        )}
                        <Typography><strong>Date:</strong> {formatDate(selectedEvent.date)}</Typography>
                        <Typography><strong>Time:</strong> {formatTime(selectedEvent.scheduled_start)}{selectedEvent.scheduled_end ? ` - ${formatTime(selectedEvent.scheduled_end)}` : ''}</Typography>
                        <Typography><strong>Reason:</strong> {selectedEvent.reason}</Typography>
                        <Typography><strong>Status:</strong> {selectedEvent.status}</Typography>
                        {selectedEvent.cancellation_reason && <Typography><strong>Cancellation Reason:</strong> {selectedEvent.cancellation_reason}</Typography>}
                        {selectedEvent.doctor_email && <Typography><strong>Doctor Email:</strong> {selectedEvent.doctor_email}</Typography>}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function Appointments() {

    const [patient, setPatient] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [loadingPatient, setLoadingPatient] = useState(true);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState('month');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [deletingReminderId, setDeletingReminderId] = useState(null);
    const [reminderFeedback, setReminderFeedback] = useState({ open: false, message: '', severity: 'success' });

    //call when page loads
    useEffect(() => {
        getPatientInfo(PATIENT_ID)
            .then((data) => {
                if (Array.isArray(data)) {
                    setPatient(data[0] || null);
                } else if (data && typeof data === 'object') {
                    setPatient(data);
                } else {
                    setPatient(null);
                }
            })
            .catch((error) => {
                console.log('Patient data error:', error);
                setPatient(null);
            })
            .finally(() => {
                setLoadingPatient(false);
            });

        getReminders(PATIENT_ID)
            .then((data) => {
                if (Array.isArray(data)) {
                    setReminders(data);
                } else if (data && typeof data === 'object') {
                    setReminders([data]);
                } else {
                    setReminders([]);
                }
            })
            .catch((error) => {
                console.log('Reminder data error:', error);
                setReminders([]);
            })
            .finally(() => {
                setLoadingReminders(false);
            });

        getAppointments(PATIENT_ID)
            .then((data) => {
                let dataArray = [];

                if (Array.isArray(data)) {
                    dataArray = data;
                } else if (data && typeof data === 'object') {
                    dataArray = [data];
                }

                const newAppointments = dataArray.map((item, index) => normalizeAppointment(item, index));

                setAppointments(newAppointments);
            })
            .catch((error) => {
                console.log('Appointments data error:', error);
                setAppointments([]);
            })
            .finally(() => {
                setLoadingAppointments(false);
            });
    }, []);

    //inspired by Zaid's format with adjustments
    const calendarEvents = appointments.map((a) => {
        const dateObject = parseAppointmentDate(a.date);
        const startTime = parseAppointmentTime(a.scheduled_start, 9);
        const endTime = parseAppointmentTime(a.scheduled_end, 10);
        const isCancelled = a.status === 'cancelled';

        const startDate = new Date(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate(), startTime.hour, startTime.minute);

        let endDate = new Date(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate(), endTime.hour, endTime.minute);

        if (!a.scheduled_end) {
            endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        }

        return {
            id: a.appointment_id,
            title: isCancelled ? `${a.reason} (Cancelled)` : a.reason,
            start: startDate,
            end: endDate,
            resource: a,
            isCancelled: isCancelled,
        };
    });

    //following Zaid' format
    const sortedAppointments = [...appointments].sort((a, b) => {
        const firstDate = parseAppointmentDate(a.date);
        const secondDate = parseAppointmentDate(b.date);
        const firstTime = parseAppointmentTime(a.scheduled_start, 0);
        const secondTime = parseAppointmentTime(b.scheduled_start, 0);

        const first = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), firstTime.hour, firstTime.minute);
        const second = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate(), secondTime.hour, secondTime.minute);

        return first.getTime() - second.getTime();
    });

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
                setReminderFeedback({open: true, message: error.response?.data?.detail || error.response?.data?.message || error.message || 'Unable to delete reminder.', severity: 'error' });
            })
            .finally(() => {
                setDeletingReminderId(null);
            });
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* https://mui.com/material-ui/react-snackbar/ & https://mui.com/material-ui/react-alert/ & Google' AI search */}
            
            <Snackbar open={reminderFeedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setReminderFeedback((prev) => ({ ...prev, open: false }))}>
                <Alert severity={reminderFeedback.severity} variant="filled" sx={{ width: '100%' }}>{reminderFeedback.message}</Alert>
            </Snackbar>

            <NavHeader patient={patient} loading={loadingPatient} />
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
                <Typography variant="h3" sx={{ fontWeight: 400, mb: 2.5 }}>Appointments</Typography>
                
                
                <Grid container spacing={3} alignItems="flex-start">
                
                    { /*============================================================================= */}
                    { /* Calendar Card */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <CalendarCard loadingAppointments={loadingAppointments} calendarEvents={calendarEvents} calendarDate={calendarDate} calendarView={calendarView} setCalendarDate={setCalendarDate} setCalendarView={setCalendarView} setSelectedEvent={setSelectedEvent} />
                    </Grid>                        	
                    
                    { /*============================================================================= */}
                    { /* Vertical Aside Cards */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={2}>                    	
                            { /* Upcoming Appointments Card */}                     
                            <UpcomingAppointmentsCard loadingAppointments={loadingAppointments} appointments={sortedAppointments} />
                
                            { /* Upcoming Reminders Card */}                            	
                            <UpcomingRemindersCard reminders={reminders} loading={loadingReminders} deletingReminderId={deletingReminderId} onDelete={handleDeleteReminder} />
                        </Stack>
                    </Grid>
                    { /*============================================================================= */}
                </Grid>
            
            </Container>
            
            { /* Appointment Details Dialog */}            
            <AppointmentDetailsDialog selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} />
        </Box>
    );
}
