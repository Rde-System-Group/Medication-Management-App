import { useMemo, useState } from "react";
import { Card, Typography, IconButton, Button, Modal, ModalDialog, ModalClose, Divider, FormControl, FormLabel, Autocomplete, Alert, Stack } from "@mui/joy"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {apiFetch} from "../lib/calls"

export function Appointment({id}){
return (
    <Card
        orientation={"horizontal"}
        style={{ justifyContent: "space-between", alignItems: "center" }}
    >
    <div>
        <Typography level={"title-md"}>
            {new Date().toLocaleDateString()} | 10:00 AM
        </Typography>
        John Doe
    </div>
    <IconButton
        style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
        component={"a"}
        size={"lg"}
        href={"#"}
    >
        <ArrowRightIcon sx={{fontSize: "2rem"}}/>
    </IconButton>
    </Card>
)
}

export function Reminder({id}){
return (
<Card
    orientation={"horizontal"}
    style={{ justifyContent: "space-between", alignItems: "center" }}
>
    <div>
        <Typography level={"title-md"}>
            Medication Name (XX mg)
        </Typography>
        Every 4 hours (in 2 hours)
    </div>
    <IconButton
        style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
        component={"a"}
        size={"lg"}
        href={"#"}
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
            />
            <QAButton
                text={"Add Medication"}
                startDecorator={<MedicationIcon />}
            />
        </>}
        <QAButton
            text={"Logout"}
            startDecorator={<CodeIcon />}
            clickHandler={async ()=>{
                await apiFetch("/api/rest/auth/logout")
                window.location.reload();
            }}
        />
        <QAButton
            text={"TEST Page"}
            startDecorator={<CodeIcon />}
            href="/test"
        />
    </div>
</Card>
)
}