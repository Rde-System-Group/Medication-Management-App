import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Popover,
    Select,
    Stack,
    Typography,
    TextField,
} from "@mui/material";
// NAVIGATION BAR
import NavHeader from "../components/NavHeader";
import { useNavigate } from "react-router-dom";

//Temporary hardcoded patient ID
const PATIENT_ID = 1;

export default function CreateReminderForm() {
    const navigate = useNavigate();
    const [name_of_reminder, setNameOfReminder] = useState("");
    const [medication_ID, setMedicationID] = useState("");
    //   const [frequency_per_day, setFrequencyPerDay] = useState("");
    const [start_date, setStartDate] = useState("");
    const [end_date, setEndDate] = useState("");
    const [reminder_times, setReminderTimes] = useState([]);
    const [default_time, setDefaultTime] = useState("08:00");

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
            <NavHeader patient={patient} loading={loadingPatient} />

            <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ maxWidth: 920 }}>
                    <Typography variant="h3" sx={{ fontWeight: 400, mb: 2.5 }}>
                        Create A Reminder
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
