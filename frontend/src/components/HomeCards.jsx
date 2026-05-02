import { useMemo, useState } from "react";
import { Card, Typography, IconButton, Button, Modal, ModalDialog, ModalClose, Divider, FormControl, FormLabel, Autocomplete, Alert, Stack } from "@mui/joy"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {logoutUser} from "../services/api"

function formatTime(timeStr) {
    if (!timeStr) return "-";
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
    if (!match) return String(timeStr);
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const value = String(dateStr).trim().split("T")[0];
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const usMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    const parsed = isoMatch
        ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
        : usMatch
            ? new Date(Number(usMatch[3]), Number(usMatch[1]) - 1, Number(usMatch[2]))
            : new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(dateStr);
    return parsed.toLocaleDateString();
}

export function Appointment({appointment}){
return (
    <Card
        orientation={"horizontal"}
        style={{ justifyContent: "space-between", alignItems: "center" }}
    >
    <div>
        <Typography level={"title-md"}>
            {appointment ? `${formatDate(appointment.date || appointment.DATE)} | ${formatTime(appointment.scheduled_start || appointment.SCHEDULED_START)}` : "No upcoming appointments"}
        </Typography>
        {appointment ? (appointment.reason || appointment.REASON || "Appointment") : "You are all caught up."}
    </div>
    <IconButton
        style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
        component={"a"}
        size={"lg"}
        href={"/appointments"}
    >
        <ArrowRightIcon sx={{fontSize: "2rem"}}/>
    </IconButton>
    </Card>
)
}

export function Reminder({reminder}){
return (
<Card
    orientation={"horizontal"}
    style={{ justifyContent: "space-between", alignItems: "center" }}
>
    <div>
        <Typography level={"title-md"}>
            {reminder ? (reminder.MEDICATION_NAME || reminder.medication_name || reminder.TITLE_OF_REMINDER || reminder.title_of_reminder || "Reminder") : "No reminders found"}
        </Typography>
        {reminder ? [reminder.REMINDER_TIME_1, reminder.REMINDER_TIME_2, reminder.REMINDER_TIME_3, reminder.REMINDER_TIME_4].filter(Boolean).map(formatTime).join(', ') || '-' : "Create your first reminder."}
    </div>
    <IconButton
        style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
        component={"a"}
        size={"lg"}
        href={"/appointments"}
    >
        <ArrowRightIcon sx={{fontSize: "2rem"}}/>
    </IconButton>
</Card>
)
}



function QAButton({text="click me!", href=null, startDecorator, endDecorator, clickHandler, color="primary"}){
    if (href){
    return (
        <Button
            component="a"
            href={href}
            color={color}
            startDecorator={startDecorator}
            endDecorator={endDecorator}
            variant={"outlined"}
        >{text}</Button>
    )}
    return (
        <Button
            onClick={clickHandler}
            color={color}
            startDecorator={startDecorator}
            endDecorator={endDecorator}
            variant={"outlined"}
        >{text}</Button>
    )
}

export function QuickActions({ mode = "Patient", patients = [] }){
    const [patientPickerOpen, setPatientPickerOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'appointment' | 'medication'
    const [selectedPatient, setSelectedPatient] = useState(null);

    const normalizedPatients = useMemo(() => (Array.isArray(patients) ? patients : []), [patients]);
    const getPatientId = (p) => p?.patient_id || p?.PATIENT_ID || p?.id || p?.ID;
    const getPatientName = (p) => `${p?.first_name || p?.FIRST_NAME || ''} ${p?.last_name || p?.LAST_NAME || ''}`.trim() || `Patient #${getPatientId(p) ?? '?'}`;

    const openPicker = (action) => {
        setPendingAction(action);
        setSelectedPatient(null);
        setPatientPickerOpen(true);
    };

    const proceed = () => {
        const id = getPatientId(selectedPatient);
        if (!id || !pendingAction) return;
        setPatientPickerOpen(false);
        window.location.href = `/patient?id=${encodeURIComponent(id)}&action=${encodeURIComponent(pendingAction)}`;
    };

return (
<Card >
    <Typography level={"title-md"}>Quick Actions</Typography>
    <br />
    <div className={"p-button-group"} style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
        {mode === "Patient" && <>
        
        </>}
        {mode === "Doctor" && <>
            <QAButton
                text={"Add Appointment"}
                startDecorator={<EventAvailableIcon />}
                clickHandler={() => openPicker('appointment')}
            />
            <QAButton
                text={"Add Medication"}
                startDecorator={<MedicationIcon />}
                clickHandler={() => openPicker('medication')}
            />
        </>}
        <QAButton
            text={"Logout"}
            startDecorator={<CodeIcon />}
            clickHandler={async ()=>{
                await logoutUser()
                window.location.reload();
            }}
        />
    </div>

    <Modal open={patientPickerOpen} onClose={() => setPatientPickerOpen(false)}>
        <ModalDialog sx={{ width: 520, maxWidth: '92vw' }}>
            <ModalClose />
            <Typography level="h4">
                {pendingAction === 'appointment' ? 'Add Appointment' : pendingAction === 'medication' ? 'Add Medication' : 'Select Patient'}
            </Typography>
            <Typography level="body-sm" sx={{ mt: 0.5 }}>
                Select the patient to continue.
            </Typography>
            <Divider sx={{ my: 2 }} />

            {normalizedPatients.length === 0 ? (
                <Alert color="warning" variant="soft">
                    No patients are loaded yet. If this persists, try refreshing or use the “Search for Patients” box above.
                </Alert>
            ) : (
                <FormControl>
                    <FormLabel>Patient</FormLabel>
                    <Autocomplete
                        options={normalizedPatients}
                        getOptionLabel={(option) => getPatientName(option)}
                        groupBy={(option) => {
                            const name = option?.first_name || option?.FIRST_NAME;
                            return name ? name.at(0).toUpperCase() : "?";
                        }}
                        value={selectedPatient}
                        onChange={(event, newValue) => setSelectedPatient(newValue)}
                    />
                </FormControl>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button variant="plain" color="neutral" onClick={() => setPatientPickerOpen(false)}>Cancel</Button>
                <Button disabled={!selectedPatient || normalizedPatients.length === 0} onClick={proceed}>
                    Continue
                </Button>
            </Stack>
        </ModalDialog>
    </Modal>
</Card>
)
}