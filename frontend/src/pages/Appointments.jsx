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
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    IconButton,
    Paper,
    Popover,
    Snackbar,
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { apiFetch } from '../lib/calls';
import { deleteReminder, getReminders } from '../services/api';
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



//this function will take the COLUMNS and DATA structure and convert it into an array of objects 
// where each object represents a row with key-value pairs corresponding to column names and their respective values.
function normalizeCFQuery(data) {
    if (Array.isArray(data)) return data;
    if (data && data.COLUMNS && data.DATA) {
        const cols = data.COLUMNS;
        const rowCount = (data.DATA[cols[0]] || []).length;
        return Array.from({ length: rowCount }, (_, i) => {
            const row = {};
            cols.forEach(c => { row[c] = data.DATA[c][i]; });
            return row;
        });
    }
    return [];
}

// getDay() index -> reminder day-flag key (CF returns UPPERCASED column names)
const DAY_INDEX_TO_FLAG  = ['REMIND_SUN', 'REMIND_MON', 'REMIND_TUES', 'REMIND_WED', 'REMIND_THURS', 'REMIND_FRI', 'REMIND_SAT'];
const DAY_INDEX_TO_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Sub-Components ---
function UpcomingRemindersCard({ reminders, loading, deletingReminderId, onDelete, onCreate }) {
    const [instructionsAnchor, setInstructionsAnchor] = useState(null);
    const [selectedInstructions, setSelectedInstructions] = useState('');

    function handleOpenInstructions(event, reminder) {
        setInstructionsAnchor(event.currentTarget);
        setSelectedInstructions(reminder.INSTRUCTIONS || reminder.instructions || 'No instructions available.');
    }
    function handleCloseInstructions() {
        setInstructionsAnchor(null);
        setSelectedInstructions('');
    }

    return (
        <Card sx={{ width: '100%', mt: 4, elevation: 0, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
                <Popover anchorEl={instructionsAnchor} open={Boolean(instructionsAnchor)} onClose={handleCloseInstructions} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                    <Paper elevation={3} sx={{ p: 2, maxWidth: 320 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.75 }}>Instructions</Typography>
                        <Typography variant="body2" color="text.secondary">{selectedInstructions}</Typography>
                    </Paper>
                </Popover>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Upcoming Reminders</Typography>

                <Box sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={onCreate}>Create Reminder</Button>
                </Box>

                {loading ? (<Typography>Loading reminders...</Typography>) : reminders.length === 0 ? (<Typography color="text.secondary">No upcoming reminders.</Typography>) : (
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Medication</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Info</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reminders.map((reminder, i) => (
                                    <TableRow key={reminder.ID || reminder.id || i}>
                                        <TableCell>{reminder.MEDICATION_NAME || reminder.medication_name || reminder.TITLE_OF_REMINDER || reminder.title_of_reminder || 'n/a'}</TableCell>
                                        <TableCell>{[reminder.REMINDER_TIME_1, reminder.REMINDER_TIME_2, reminder.REMINDER_TIME_3, reminder.REMINDER_TIME_4].filter(Boolean).map(formatTime).join(', ') || '-'}</TableCell>
                                        <TableCell>
                                            {(reminder.INSTRUCTIONS || reminder.instructions) ? (
                                                <IconButton size="small" color="warning" aria-label="View instructions" onClick={(e) => handleOpenInstructions(e, reminder)}>
                                                    <ErrorOutlineIcon fontSize="small" />
                                                </IconButton>
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
    const [focusReminder, setFocusReminder] = useState(null);
    const [deletingReminderId, setDeletingReminderId] = useState(null);
    const [reminderFeedback, setReminderFeedback] = useState({ open: false, message: '', severity: 'success' });

    const navigate = useNavigate();
    const isPatient = user?.role === "Patient";

    const normalizeAppointment = (item) => ({
        appointment_id: item?.appointment_id ?? item?.APPOINTMENT_ID,
        patient_id: item?.patient_id ?? item?.PATIENT_ID,
        doctor_id: item?.doctor_id ?? item?.DOCTOR_ID,
        patient_name: item?.patient_name ?? item?.PATIENT_NAME,
        doctor_name: item?.DOCTOR_FIRST_NAME ? `${item.DOCTOR_FIRST_NAME} ${item.DOCTOR_LAST_NAME || ''}`.trim() : null,
        date: item?.date ?? item?.DATE,
        scheduled_start: item?.scheduled_start ?? item?.SCHEDULED_START,
        scheduled_end: item?.scheduled_end ?? item?.SCHEDULED_END,
        reason: item?.reason ?? item?.REASON,
        status: item?.status ?? item?.STATUS,
        cancellation_reason: item?.cancellation_reason ?? item?.CANCELLATION_REASON,
    });

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
                endpoint = `/api/rest/appointments/patient/${activePatId}`;
            } else {
                const activeDocId = user?.doctor_id || user?.DOCTOR_ID;
                if (!activeDocId) {
                    setScheduleList([]);
                    return;
                }
                endpoint = `/api/rest/doctor/${activeDocId}/appointments`;
            }

            const res = await apiFetch(endpoint);
            const raw = await res.text();
            let data;

            try {
                data = raw ? JSON.parse(raw) : null;
            } catch {
                const preview = (raw || '').slice(0, 200);
                throw new Error(`Non-JSON response from appointments endpoint (${res.status}): ${preview}`);
            }

            if (!res.ok) {
                const message = data?.message || data?.detail || `HTTP ${res.status}`;
                throw new Error(message);
            }

            const list = Array.isArray(data)
                ? data
                : (Array.isArray(data?.appointments) ? data.appointments : []);

            setScheduleList(list.map(normalizeAppointment));
        } catch (error) {
            console.error('Appointments data error:', error);
            setScheduleList([]);
        } finally {
            setIsFetchingSchedule(false);
        }
    }, [user, isPatient]);

    const fetchRemindersData = useCallback(async () => {
        if (!isPatient) {
            setIsFetchingReminders(false);
            setRemindersList([]);
            return;
        }
        const activePatId = user?.patient_id || user?.PATIENT_ID;
        if (!activePatId) {
            setIsFetchingReminders(false);
            setRemindersList([]);
            return;
        }
        try {
            const res = await apiFetch(`/api/rest/reminders/${activePatId}`);
            const raw = await res.text();
            let data;
            try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
            setRemindersList(normalizeCFQuery(data));
        } catch {
            setRemindersList([]);
        } finally {
            setIsFetchingReminders(false);
        }
    }, [user, isPatient]);

    function handleDeleteReminder(reminderId) {
        if (!reminderId) {
            setReminderFeedback({ open: true, message: 'Unable to delete: missing reminder id.', severity: 'error' });
            return;
        }
        if (!window.confirm('Delete this reminder?')) return;
        setDeletingReminderId(reminderId);
        deleteReminder(reminderId)
            .then(() => {
                setRemindersList((prev) => prev.filter((r) => String(r.ID || r.id) !== String(reminderId)));
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
        fetchAppointmentsData();
        fetchRemindersData();
    }, [fetchAppointmentsData, fetchRemindersData]);


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

    const parseDateOnly = (rawDate) => {
        const raw = String(rawDate || '').trim();
        const dateOnly = raw.split('T')[0].split(' ')[0];

        if (dateOnly.includes('-')) {
            const parts = dateOnly.split('-').map(Number);
            if (String(dateOnly.split('-')[0]).length === 4) {
                return { year: parts[0], month: parts[1], day: parts[2] };
            }
            return { year: parts[2], month: parts[0], day: parts[1] };
        }

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
            return {
                year: parsed.getFullYear(),
                month: parsed.getMonth() + 1,
                day: parsed.getDate(),
            };
        }

        return { year: 2026, month: 4, day: 1 };
    };

    // Combine an appointment's date + end-time (or start-time fallback) so we can
    // tell whether it's already in the past relative to "now".
    const apptEndMillis = (ap) => {
        const dateStr = ap?.date || ap?.DATE;
        if (!dateStr) return NaN;
        const rawTime = ap?.scheduled_end || ap?.SCHEDULED_END || ap?.scheduled_start || ap?.SCHEDULED_START || '23:59';
        const timeMatch = String(rawTime).match(/^(\d{1,2}):(\d{2})/);
        const hh = timeMatch ? Number(timeMatch[1]) : 23;
        const mm = timeMatch ? Number(timeMatch[2]) : 59;
        const { year, month, day } = parseDateOnly(dateStr);
        return new Date(year, month - 1, day, hh, mm, 0).getTime();
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

    const mappedReminderEvents = useMemo(() => {
        if (!isPatient || remindersList.length === 0) return [];
        const events = [];
        const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - 7);
        const windowEnd   = new Date(); windowEnd.setDate(windowEnd.getDate() + 60);

        for (const r of remindersList) {
            const rStart = r.START_DATE_OF_REMINDER ? new Date(r.START_DATE_OF_REMINDER) : null;
            const rEnd   = r.END_DATE_OF_REMINDER   ? new Date(r.END_DATE_OF_REMINDER)   : null;
            const from = new Date(Math.max(windowStart.getTime(), (rStart && !isNaN(rStart) ? rStart : windowStart).getTime()));
            const to   = new Date(Math.min(windowEnd.getTime(),   (rEnd   && !isNaN(rEnd)   ? rEnd   : windowEnd).getTime()));

            const times = [r.REMINDER_TIME_1, r.REMINDER_TIME_2, r.REMINDER_TIME_3, r.REMINDER_TIME_4].filter(Boolean);
            if (times.length === 0) continue;

            const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
            while (cursor <= to) {
                const flag = DAY_INDEX_TO_FLAG[cursor.getDay()];
                if (r[flag]) {
                    times.forEach((t, ti) => {
                        const [h, m] = parseTime(t, 8);
                        events.push({
                            id: `reminder-${r.ID}-${cursor.getTime()}-${ti}`,
                            title: `💊 ${r.MEDICATION_NAME || r.TITLE_OF_REMINDER || 'Reminder'}`,
                            start: new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), h, m),
                            end:   new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), h, m + 30),
                            resource: r,
                            isReminder: true,
                        });
                    });
                }
                cursor.setDate(cursor.getDate() + 1);
            }
        }
        return events;
    }, [remindersList, isPatient]);

    const mappedEvents = scheduleList.map(item => {
        const rawDate = item.date || item.DATE || "";
        const { year, month, day } = parseDateOnly(rawDate);

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
            <Snackbar open={reminderFeedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setReminderFeedback((prev) => ({ ...prev, open: false }))}>
                <Alert severity={reminderFeedback.severity} variant="filled" sx={{ width: '100%' }}>{reminderFeedback.message}</Alert>
            </Snackbar>
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

                    <ToggleButtonGroup value={currentViewMode} exclusive onChange={handleToggleMode} color="primary" size="medium" sx={{ bgcolor: 'white' }}>
                        <ToggleButton value="list" sx={{ px: 3 }}><FormatListBulletedIcon sx={{ mr: 1, fontSize: 20 }} />List</ToggleButton>
                        <ToggleButton value="calendar" sx={{ px: 3 }}><CalendarMonthIcon sx={{ mr: 1, fontSize: 20 }} />Calendar</ToggleButton>
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
                                                        <TableCell sx={{ py: 2.5, color: '#334155' }}>{formatTime(a.scheduled_start)} – {a.scheduled_end ? formatTime(a.scheduled_end) : 'TBD'}</TableCell>
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
                                        <Calendar localizer={localizer} events={isPatient ? [...mappedEvents, ...mappedReminderEvents] : mappedEvents} startAccessor="start" endAccessor="end" views={['month', 'week', 'day']} view={activeView} date={activeDate} onNavigate={setActiveDate} onView={setActiveView} eventPropGetter={(evt) => ({ style: { backgroundColor: evt.isReminder ? '#f59e0b' : (evt.isCancelled ? '#fca5a5' : '#3b82f6'), borderRadius: '4px', border: 'none', color: 'white', opacity: evt.isCancelled ? 0.9 : 1, textDecoration: evt.isCancelled ? 'line-through' : 'none' } })} onSelectEvent={(evt) => { if (evt.isReminder) setFocusReminder(evt.resource); else setFocusEvent(evt.resource); }} />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {isPatient && (
                    <UpcomingRemindersCard
                        reminders={remindersList}
                        loading={isFetchingReminders}
                        deletingReminderId={deletingReminderId}
                        onDelete={handleDeleteReminder}
                        onCreate={handleOpenCreateReminder}
                    />
                )}

            </Container>

            {focusReminder && (
                <div className="modal-overlay" onClick={() => setFocusReminder(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px', backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>💊 Reminder Details</Typography>
                            <button onClick={() => setFocusReminder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Medication</Typography>
                                    <Typography variant="body1">{focusReminder.MEDICATION_NAME || 'Unknown'}</Typography>
                                </Box>
                                {focusReminder.TITLE_OF_REMINDER && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Title</Typography>
                                        <Typography variant="body1">{focusReminder.TITLE_OF_REMINDER}</Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Days</Typography>
                                    <Typography variant="body1">
                                        {DAY_INDEX_TO_FLAG.map((flag, i) => focusReminder[flag] ? DAY_INDEX_TO_LABEL[i] : null).filter(Boolean).join(', ') || 'None'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Times</Typography>
                                    <Typography variant="body1">
                                        {[focusReminder.REMINDER_TIME_1, focusReminder.REMINDER_TIME_2, focusReminder.REMINDER_TIME_3, focusReminder.REMINDER_TIME_4]
                                            .filter(Boolean).map(t => formatTime(t)).join(', ') || '-'}
                                    </Typography>
                                </Box>
                                {focusReminder.INSTRUCTIONS && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Instructions</Typography>
                                        <Typography variant="body1">{focusReminder.INSTRUCTIONS}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" onClick={() => setFocusReminder(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

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