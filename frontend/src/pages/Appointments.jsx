import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../styling/theme'; 

import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import NavHeader from "../components/NavHeader";
import { getAppointments, getPatientInfo, getReminders } from '../services/api';
import { formatDate } from '../utils/formatDate';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const PATIENT_ID = 1;

// --- Helper Functions ---
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

function makeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
}

function handleDeleteReminder(reminderId) {
    console.log('Delete clicked for reminder id:', reminderId);
    alert('Under construction!!!! Must add Delete endpoint');
}

// --- Sub-Components ---
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
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Medication</TableCell>
                                        <TableCell>Time</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reminders.map((reminder, i) => (
                                        <TableRow key={reminder.ID || i}>
                                            <TableCell>{reminder.MEDICATION_NAME || reminder.TITLE_OF_REMINDER || 'n/a'}</TableCell>
                                            <TableCell>{formatTime(reminder.REMINDER_TIME_1)}</TableCell>
                                            <TableCell>
                                                <Button variant="contained" color="error" size="small" onClick={() => onDelete(reminder.ID)}> Delete </Button>
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

// --- Main Component ---
export default function Appointments({user}) {
    // API State
    const [patient, setPatient] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    
    // Loading State
    const [loadingPatient, setLoadingPatient] = useState(true);
    const [loadingReminders, setLoadingReminders] = useState(true);
    const [loadingAppointments, setLoadingAppointments] = useState(true);

    // Calendar State
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarView, setCalendarView] = useState('month');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Data Fetching
    const loadPatient = useCallback(() => {
        setLoadingPatient(true);
        getPatientInfo(PATIENT_ID)
            .then((data) => {
                const patientArray = makeArray(data);
                setPatient(patientArray[0] || null);
            })
            .catch((error) => {
                console.log('Patient data error:', error);
                setPatient(null);
            })
            .finally(() => setLoadingPatient(false));
    }, []);

    const loadReminders = useCallback(() => {
        setLoadingReminders(true);
        getReminders(PATIENT_ID)
            .then((data) => {
                setReminders(makeArray(data));
            })
            .catch((error) => {
                console.log('Reminder data error:', error);
                setReminders([]);
            })
            .finally(() => setLoadingReminders(false));
    }, []);

    const loadAppointments = useCallback(() => {
        setLoadingAppointments(true);
        getAppointments()
            .then((data) => {
                setAppointments(data.appointments || []);
            })
            .catch((error) => {
                console.error('Appointments data error:', error);
                setAppointments([]);
            })
            .finally(() => setLoadingAppointments(false));
    }, []);

    useEffect(() => {
        loadPatient();
        loadReminders();
        loadAppointments();
    }, [loadPatient, loadReminders, loadAppointments]);

    // Calendar Data Formatting
    const calendarEvents = appointments.map(a => {
        const [startHour, startMin] = (a.scheduled_start || '09:00').split(':').map(Number);
        const [endHour, endMin] = (a.scheduled_end || '10:00').split(':').map(Number);
        const dateObj = new Date(a.date);
        const isCancelled = a.status === 'cancelled';
        
        return {
            id: a.appointment_id,
            title: isCancelled ? `❌ ${a.patient_name} - ${a.reason} (Cancelled)` : `${a.patient_name} - ${a.reason}`,
            start: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), startHour, startMin),
            end: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), endHour, endMin),
            resource: a,
            isCancelled,
        };
    });

    const handleNavigate = useCallback((newDate) => {
        setCalendarDate(newDate);
    }, []);

    const handleViewChange = useCallback((newView) => {
        setCalendarView(newView);
    }, []);

    return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
                <Typography variant="h3" sx={{ fontWeight: 400, mb: 2.5 }}>Appointments</Typography>

                <Grid container spacing={3} alignItems="flex-start">
                    
                    {/* --- Calendar View --- */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                            <CardHeader title="Calendar" variant="body" sx={{ py: 1.5 }} />
                            <CardContent>
                                {loadingAppointments ? (
                                    <Box sx={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Typography color="text.secondary">Loading Calendar...</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ height: 600 }}>
                                        <Calendar
                                            localizer={localizer}
                                            events={calendarEvents}
                                            startAccessor="start"
                                            endAccessor="end"
                                            views={['month', 'week', 'day']}
                                            view={calendarView}
                                            date={calendarDate}
                                            onNavigate={handleNavigate}
                                            onView={handleViewChange}
                                            eventPropGetter={(event) => ({
                                                style: {
                                                    backgroundColor: event.isCancelled ? '#ef4444' : '#3b82f6',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    color: 'white',
                                                    opacity: event.isCancelled ? 0.7 : 1,
                                                    textDecoration: event.isCancelled ? 'line-through' : 'none',
                                                }
                                            })}
                                            onSelectEvent={(event) => setSelectedEvent(event.resource)}
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* --- Side Panels --- */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Stack spacing={2}>
                            
                            {/* Upcoming Appointments List View */}
                            <Card elevation={1} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                                <CardHeader title="Upcoming Appointments" variant="body" sx={{ py: 1.5 }} />
                                <CardContent>
                                    {loadingAppointments ? (
                                        <Typography>Loading appointments...</Typography>
                                    ) : appointments.length === 0 ? (
                                        <Typography color="text.secondary">No appointments scheduled</Typography>
                                    ) : (
                                        <Box sx={{ width: '100%', overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Time</TableCell>
                                                        <TableCell>Patient</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {appointments.map(a => (
                                                        <TableRow 
                                                            key={a.appointment_id} 
                                                            sx={a.status === 'cancelled' ? { opacity: 0.6, bgcolor: '#fef2f2' } : {}}
                                                        >
                                                            <TableCell>{formatDate(a.date)}</TableCell>
                                                            <TableCell>{a.scheduled_start}</TableCell>
                                                            <TableCell>
                                                                {a.patient_name}
                                                                {a.status === 'cancelled' && (
                                                                    <Typography variant="caption" display="block" color="error">
                                                                        Cancelled
                                                                    </Typography>
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

                            {/* Upcoming Reminders List View */}
                            <UpcomingRemindersCard reminders={reminders} loading={loadingReminders} onDelete={handleDeleteReminder} />
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            {/* Appointment Details Modal (Kept with original HTML classes) */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h2>{selectedEvent.status === 'cancelled' ? '❌' : '📅'} Appointment Details</h2>
                            <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            {selectedEvent.status === 'cancelled' && (
                                <div style={{background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontWeight: 500}}>
                                    This appointment has been cancelled
                                </div>
                            )}
                            <div className="appt-detail-grid">
                                <div className="appt-detail-item">
                                    <label>Patient</label>
                                    <span>{selectedEvent.patient_name}</span>
                                </div>
                                <div className="appt-detail-item">
                                    <label>Date</label>
                                    <span>{formatDate(selectedEvent.date)}</span>
                                </div>
                                <div className="appt-detail-item">
                                    <label>Time</label>
                                    <span>{selectedEvent.scheduled_start} - {selectedEvent.scheduled_end}</span>
                                </div>
                                <div className="appt-detail-item">
                                    <label>Reason</label>
                                    <span>{selectedEvent.reason}</span>
                                </div>
                                {selectedEvent.status === 'cancelled' && selectedEvent.cancellation_reason && (
                                    <div className="appt-detail-item" style={{gridColumn: '1 / -1'}}>
                                        <label>Cancellation Reason</label>
                                        <span style={{color: '#dc2626', fontStyle: 'italic'}}>{selectedEvent.cancellation_reason}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="outlined" onClick={() => setSelectedEvent(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    </ThemeProvider>
    );
}