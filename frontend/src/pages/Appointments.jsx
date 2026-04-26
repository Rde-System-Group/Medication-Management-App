import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Container,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Tabs,
    Tab
} from "@mui/material";

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { apiFetch } from '../lib/calls';
import { formatDate } from '../utils/formatDate';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

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

function handleDeleteReminder(reminderId) {
    console.log('Delete clicked for reminder id:', reminderId);
    alert('Under construction!!!! Must add Delete endpoint');
}

// --- Sub-Components ---
function UpcomingRemindersCard({ reminders, loading, onDelete, onCreate }) {
    return (
        <Card sx={{ width: '100%', mt: 4, elevation: 0, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}> Upcoming Reminders </Typography>

                <Box sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={onCreate}>Create Reminder</Button>
                </Box>

                {loading ? (<Typography>Loading reminders...</Typography>) : reminders.length === 0 ? (<Typography color="text.secondary">No upcoming reminders.</Typography>)
                    :
                    (
                        <Box sx={{ width: '100%', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Medication</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reminders.map((reminder, i) => (
                                        <TableRow key={reminder.ID || i}>
                                            <TableCell>{reminder.MEDICATION_NAME || reminder.TITLE_OF_REMINDER || 'n/a'}</TableCell>
                                            <TableCell>{formatTime(reminder.REMINDER_TIME_1)}</TableCell>
                                            <TableCell>
                                                <Button variant="outlined" color="error" size="small" onClick={() => onDelete(reminder.ID)}> Delete </Button>
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
    const [remindersList, setRemindersList] = useState([]);
    const [scheduleList, setScheduleList] = useState([]);
    
    const [isFetchingReminders, setIsFetchingReminders] = useState(true);
    const [isFetchingSchedule, setIsFetchingSchedule] = useState(true);

    const [currentViewMode, setCurrentViewMode] = useState('list');
    const [currentAppointmentTab, setCurrentAppointmentTab] = useState('scheduled');

    const [activeDate, setActiveDate] = useState(new Date());
    const [activeView, setActiveView] = useState('month');
    const [focusEvent, setFocusEvent] = useState(null);

    const navigate = useNavigate();
    const isPatient = user?.role === "Patient";

    const fetchAppointmentsData = useCallback(async () => {
        setIsFetchingSchedule(true);
        try {
            let endpoint = null;

            if (isPatient) {
                const activePatId = user?.patient_id || user?.PATIENT_ID;
                if (!activePatId) {
                    setScheduleList([]);
                    return;
                }
                endpoint = `/api/rest/patient/${activePatId}/appointments`;
            } else {
                const activeDocId = user?.doctor_id || user?.DOCTOR_ID;
                if (!activeDocId) {
                    setScheduleList([]);
                    return;
                }
                endpoint = `/api/rest/doctor/${activeDocId}/appointments`;
            }

            const res = await apiFetch(endpoint);
            const data = await res.json();
            if (data.success) {
                setScheduleList(data.appointments || []);
            } else {
                setScheduleList([]);
            }
        } catch (error) {
            console.error('Appointments data error:', error);
            setScheduleList([]);
        } finally {
            setIsFetchingSchedule(false);
        }
    }, [user, isPatient]);

    const fetchRemindersData = useCallback(async () => {
        // Disabled to clear the 404 Console Error since the file doesn't exist yet
        setIsFetchingReminders(false);
        setRemindersList([]);
    }, []);

    useEffect(() => {
        fetchAppointmentsData();
        fetchRemindersData();
    }, [fetchAppointmentsData, fetchRemindersData]);

    // Combine an appointment's date + end-time (or start-time fallback) so we can
    // tell whether it's already in the past relative to "now".
    const apptEndMillis = (ap) => {
        const dateStr = ap?.date || ap?.DATE;
        if (!dateStr) return NaN;
        const rawTime = ap?.scheduled_end || ap?.SCHEDULED_END || ap?.scheduled_start || ap?.SCHEDULED_START || '23:59';
        const timeMatch = String(rawTime).match(/^(\d{1,2}):(\d{2})/);
        const hh = timeMatch ? timeMatch[1].padStart(2, '0') : '23';
        const mm = timeMatch ? timeMatch[2] : '59';
        const dt = new Date(`${String(dateStr).slice(0, 10)}T${hh}:${mm}:00`);
        return dt.getTime();
    };

    const { upcomingSchedule, pastSchedule } = useMemo(() => {
        const now = Date.now();
        const upcoming = [];
        const past = [];
        for (const ap of scheduleList) {
            const t = apptEndMillis(ap);
            if (Number.isFinite(t) && t < now) past.push(ap);
            else upcoming.push(ap);
        }
        upcoming.sort((a, b) => apptEndMillis(a) - apptEndMillis(b));
        past.sort((a, b) => apptEndMillis(b) - apptEndMillis(a));
        return { upcomingSchedule: upcoming, pastSchedule: past };
    }, [scheduleList]);

    const visibleAppointments = currentAppointmentTab === 'past' ? pastSchedule : upcomingSchedule;

    const handleOpenCreateReminder = () => {
        navigate('/create-reminder-form');
    };

    // Combine an appointment's date + end-time (or start-time fallback) so we can
    // tell whether it's already in the past relative to "now".
    const apptEndMillis = (ap) => {
        const dateStr = ap?.date || ap?.DATE;
        if (!dateStr) return NaN;
        const rawTime = ap?.scheduled_end || ap?.SCHEDULED_END || ap?.scheduled_start || ap?.SCHEDULED_START || '23:59';
        const timeMatch = String(rawTime).match(/^(\d{1,2}):(\d{2})/);
        const hh = timeMatch ? timeMatch[1].padStart(2, '0') : '23';
        const mm = timeMatch ? timeMatch[2] : '59';
        const dt = new Date(`${String(dateStr).slice(0, 10)}T${hh}:${mm}:00`);
        return dt.getTime();
    };

    const { upcomingSchedule, pastSchedule } = useMemo(() => {
        const now = Date.now();
        const upcoming = [];
        const past = [];
        for (const ap of scheduleList) {
            const t = apptEndMillis(ap);
            if (Number.isFinite(t) && t < now) past.push(ap);
            else upcoming.push(ap);
        }
        upcoming.sort((a, b) => apptEndMillis(a) - apptEndMillis(b));
        past.sort((a, b) => apptEndMillis(b) - apptEndMillis(a));
        return { upcomingSchedule: upcoming, pastSchedule: past };
    }, [scheduleList]);

    const visibleAppointments = currentAppointmentTab === 'past' ? pastSchedule : upcomingSchedule;

    const handleOpenCreateReminder = () => {
        navigate('/create-reminder-form');
    };

    const handleToggleMode = (event, newMode) => {
        if (newMode !== null) setCurrentViewMode(newMode);
    };

    // MANUAL PARSER: Prevents Timezone Shifting
    const parseTime = (tStr, defaultHr) => {
        if (!tStr) return [defaultHr, 0];
        const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
        if (!match) return [defaultHr, 0];
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const ampm = (match[3] || '').toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return [h, m];
    };

    const mappedEvents = scheduleList.map(item => {
        const rawDate = item.date || item.DATE || "";
        let year = 2026, month = 4, day = 1;
        
        if (rawDate.includes('-')) {
            const parts = rawDate.split('T')[0].split('-');
            if (parts[0].length === 4) { 
                year = Number(parts[0]); month = Number(parts[1]); day = Number(parts[2]);
            } else { 
                month = Number(parts[0]); day = Number(parts[1]); year = Number(parts[2]);
            }
        }

        const [startHour, startMin] = parseTime(item.scheduled_start, 9);
        const [endHour, endMin] = parseTime(item.scheduled_end, 10);
        const cancelledFlag = item.status === 'cancelled';
        
        const titleSubject = isPatient
            ? (item.doctor_name ? `Dr. ${item.doctor_name}` : 'Appointment')
            : (item.patient_name || 'Appointment');

        return {
            id: item.appointment_id,
            title: cancelledFlag ? `❌ ${titleSubject} - ${item.reason} (Cancelled)` : `${titleSubject} - ${item.reason}`,
            // We feed the exact extracted numbers to Date to force local time
            start: new Date(year, month - 1, day, startHour, startMin),
            end: new Date(year, month - 1, day, endHour, endMin),
            resource: item,
            isCancelled: cancelledFlag,
        };
    });

    return (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                            Appointments
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
                            {isPatient
                                ? `Appointments for ${user?.first_name || user?.FIRST_NAME || ''} ${user?.last_name || user?.LAST_NAME || ''}`.trim()
                                : `Appointments for Dr. ${user?.last_name || user?.LAST_NAME || 'Sarah Smith'}`}
                        </Typography>
                    </Box>

                    <ToggleButtonGroup
                        value={currentViewMode}
                        exclusive
                        onChange={handleToggleMode}
                        color="primary"
                        size="medium"
                        sx={{ bgcolor: 'white' }}
                    >
                        <ToggleButton value="list" sx={{ px: 3 }}>
                            <FormatListBulletedIcon sx={{ mr: 1, fontSize: 20 }} />
                            List
                        </ToggleButton>
                        <ToggleButton value="calendar" sx={{ px: 3 }}>
                            <CalendarMonthIcon sx={{ mr: 1, fontSize: 20 }} />
                            Calendar
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: 'white' }}>
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                        
                        {currentViewMode === 'list' && (
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <Tabs
                                    value={currentAppointmentTab}
                                    onChange={(_e, v) => setCurrentAppointmentTab(v)}
                                    sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
                                >
                                    <Tab value="scheduled" label={`Scheduled (${upcomingSchedule.length})`} />
                                    <Tab value="past" label={`Past (${pastSchedule.length})`} />
                                </Tabs>

                                {isFetchingSchedule ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Loading appointments...</Typography></Box>
                                ) : visibleAppointments.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            {currentAppointmentTab === 'past' ? 'No past appointments' : 'No upcoming appointments'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 2 }}>DATE</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 2 }}>TIME</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 2 }}>{isPatient ? 'DOCTOR' : 'PATIENT'}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 2 }}>REASON</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visibleAppointments.map(a => {
                                                const wasCancelled = (a.status || '').toLowerCase() === 'cancelled';
                                                const isPast = currentAppointmentTab === 'past';
                                                const rowSx = wasCancelled
                                                    ? { bgcolor: '#fff1f2' }
                                                    : (isPast ? { bgcolor: '#f0fdf4' } : { '&:last-child td, &:last-child th': { border: 0 } });
                                                return (
                                                    <TableRow key={a.appointment_id} sx={rowSx}>
                                                        <TableCell sx={{ py: 2.5, color: '#334155' }}>{formatDate(a.date)}</TableCell>
                                                        <TableCell sx={{ py: 2.5, color: '#334155' }}>{a.scheduled_start} - {a.scheduled_end || 'TBD'}</TableCell>
                                                        <TableCell sx={{ py: 2.5, color: '#334155' }}>{isPatient ? (a.doctor_name ? `Dr. ${a.doctor_name}` : '-') : a.patient_name}</TableCell>
                                                        <TableCell sx={{ py: 2.5 }}>
                                                            <Box>
                                                                <Typography component="span" sx={{ color: '#334155' }}>{a.reason}</Typography>
                                                                {wasCancelled ? (
                                                                    <Typography component="span" sx={{ ml: 2, px: 1.5, py: 0.5, bgcolor: '#ffe4e6', color: '#e11d48', borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                        Cancelled
                                                                    </Typography>
                                                                ) : isPast ? (
                                                                    <Typography component="span" sx={{ ml: 2, px: 1.5, py: 0.5, bgcolor: '#dcfce7', color: '#15803d', borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                        Complete
                                                                    </Typography>
                                                                ) : null}
                                                            </Box>
                                                            {wasCancelled && a.cancellation_reason && (
                                                                <Typography variant="body2" sx={{ color: '#e11d48', fontStyle: 'italic', mt: 0.5 }}>
                                                                    Reason: {a.cancellation_reason}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </Box>
                        )}

                        {currentViewMode === 'calendar' && (
                            <Box sx={{ p: 3 }}>
                                {isFetchingSchedule ? (
                                    <Box sx={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Typography color="text.secondary">Loading Calendar...</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ height: 700 }}>
                                        <Calendar
                                            localizer={localizer}
                                            events={mappedEvents}
                                            startAccessor="start"
                                            endAccessor="end"
                                            views={['month', 'week', 'day']}
                                            view={activeView}
                                            date={activeDate}
                                            onNavigate={setActiveDate}
                                            onView={setActiveView}
                                            eventPropGetter={(evt) => ({
                                                style: {
                                                    backgroundColor: evt.isCancelled ? '#fca5a5' : '#3b82f6',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    color: 'white',
                                                    opacity: evt.isCancelled ? 0.9 : 1,
                                                    textDecoration: evt.isCancelled ? 'line-through' : 'none',
                                                }
                                            })}
                                            onSelectEvent={(evt) => setFocusEvent(evt.resource)}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {isPatient && (
                    <UpcomingRemindersCard reminders={remindersList} loading={isFetchingReminders} onDelete={handleDeleteReminder} onCreate={handleOpenCreateReminder} />
                )}

            </Container>

            {focusEvent && (
                <div className="modal-overlay" onClick={() => setFocusEvent(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{focusEvent.status === 'cancelled' ? '❌' : '📅'} Appointment Details</Typography>
                            <button className="modal-close" onClick={() => setFocusEvent(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {focusEvent.status === 'cancelled' && (
                                <div style={{background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontWeight: 500}}>
                                    This appointment has been cancelled
                                </div>
                            )}
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{isPatient ? 'Doctor' : 'Patient'}</Typography>
                                    <Typography variant="body1">{isPatient ? (focusEvent.doctor_name ? `Dr. ${focusEvent.doctor_name}` : '-') : focusEvent.patient_name}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Date</Typography>
                                    <Typography variant="body1">{formatDate(focusEvent.date)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Time</Typography>
                                    <Typography variant="body1">{focusEvent.scheduled_start} - {focusEvent.scheduled_end}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Reason</Typography>
                                    <Typography variant="body1">{focusEvent.reason}</Typography>
                                </Box>
                                {focusEvent.status === 'cancelled' && focusEvent.cancellation_reason && (
                                    <Box>
                                        <Typography variant="caption" color="error" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Cancellation Reason</Typography>
                                        <Typography variant="body1" color="error" sx={{ fontStyle: 'italic' }}>{focusEvent.cancellation_reason}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => setFocusEvent(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}
        </Box>
    </ThemeProvider>
    );
}