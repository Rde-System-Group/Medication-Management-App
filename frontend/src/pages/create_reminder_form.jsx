import { useEffect, useState } from "react";
import {
    Alert,
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
    Snackbar,
    Stack,
    Typography,
    TextField,
} from "@mui/material";
import { useSearchParams } from "react-router-dom"; //useNavigate
import {
    getPatientInfo,
    getPrescribedMedications,
    getReminders,
    postReminder,
} from "../services/api";

function makeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return [data];
    return [];
}

//derived from Google search: "convert coldfusion date format to ISO in javascript" & cleaned up with AI help
function parseCFDateToISO(dateValue) {
    if (!dateValue) return "";
    const str = String(dateValue).trim();
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    // CF format: "Month, DD YYYY HH:MM:SS"
    const cfMatch = str.match(/^(\w+),\s+(\d+)\s+(\d{4})/);
    if (cfMatch) {
        const d = new Date(`${cfMatch[1]} ${cfMatch[2]}, ${cfMatch[3]}`);
        if (!isNaN(d)) {
            return d.toISOString().slice(0, 10);
        }
    }
    const d = new Date(str);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
    return "";
}

function displayFrequency(prescription_medication) {
    //1. if medication is null
    if (!prescription_medication) return "Select medication";

    const frequencyType = prescription_medication.FREQUENCY_TYPE;
    const perDay = prescription_medication.FREQ_PER_DAY
        ? `${prescription_medication.FREQ_PER_DAY}x`
        : "N/A";

    if (frequencyType === 1) {
        return `Daily, Frequency Per Day: ${perDay}`;
    }
    if (frequencyType === 2) {
        const daysPerWeek = prescription_medication.FREQ_DAYS_PER_WEEK || "-";
        return `Weekly - ${daysPerWeek}x , Frequency Per Day: ${perDay}`;
    }
    if (frequencyType === 3) {
        return `Every ${prescription_medication.FREQ_BY_X_WEEK} weeks, Frequency Per Day: ${perDay}`;
    }

    if (frequencyType === null || frequencyType === undefined) {
        return "N/A";
    }
}

export default function CreateReminderForm({ user }) {
    const [searchParams] = useSearchParams();
    // When a doctor opens this form via the patient picker, the target patient is in the URL.
    // Patients viewing their own form fall back to their own id.
    const queryPatientId = searchParams.get("patient_id");
    const PATIENT_ID = queryPatientId
        ? Number(queryPatientId)
        : (user?.patient_id ?? user?.PATIENT_ID ?? 0);
    const [patient, setPatient] = useState(null);
    const [loadingPatient, setLoadingPatient] = useState(true);

    //const navigate = useNavigate();
    //const navigate = useNavigate();
    const [name_of_reminder, setNameOfReminder] = useState("");
    const [medication_select_ID, setMedicationSelectID] = useState("");
    //   const [frequency_per_day, setFrequencyPerDay] = useState("");
    const [start_date, setStartDate] = useState("");
    const [end_date, setEndDate] = useState("");
    const [reminder_times, setReminderTimes] = useState([]);
    const [time_chosen, setTimeChosen] = useState("08:00");
    const [anchor, setAnchor] = useState(null);
    const [submitError, setSubmitError] = useState("");
    const [savingReminder, setSavingReminder] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const [medications_list, setMedicationsList] = useState([]);
    const [loadingMedications, setLoadingMedications] = useState(true);
    const [existingReminderMedIds, setExistingReminderMedIds] = useState(new Set());
    const selectedMedication =
        medications_list.find(
            (medication) => String(medication.ID) === String(medication_select_ID),
        ) || null;

    //====== 1 ========
    function loadPatient() {
        setLoadingPatient(true);

        getPatientInfo(PATIENT_ID)
            .then((data) => {
                const patientArray = makeArray(data);
                setPatient(patientArray[0] || null); //patientArray[0] is the first patient in the array
                console.log("Patient data:", data);
            })
            .catch((error) => {
                console.log("Patient data error:", error);
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
                const medicationsArray = makeArray(data);
                setMedicationsList(medicationsArray);
                console.log("Medications data:", data);
            })
            .catch((error) => {
                console.log("Medications data error:", error);
                setMedicationsList([]);
            })
            .finally(() => {
                setLoadingMedications(false);
            });
    }

    function loadExistingReminders() {
        getReminders(PATIENT_ID)
            .then((data) => {
                const rows = makeArray(data);
                const ids = new Set(
                    rows.map((r) => String(r.PRESCRIPTION_MEDICATION_ID ?? r.prescription_medication_id ?? "")).filter(Boolean)
                );
                setExistingReminderMedIds(ids);
            })
            .catch(() => {
                // non-fatal — form will still work, just without the duplicate check
            });
    }

    //================== FORM EVENT HANDLERS ========================
    // when medication selection changes
    //must: reset chips, set start/end times
    function handleMedicationChange(e) {
        const new_select_medication_ID = e.target.value;
        setMedicationSelectID(new_select_medication_ID);
        setReminderTimes([]);
        if (new_select_medication_ID && existingReminderMedIds.has(String(new_select_medication_ID))) {
            setSubmitError("A reminder for this medication already exists.");
        } else {
            setSubmitError("");
        }

        const new_select_medication = medications_list.find(
            (med) => String(med.ID) === String(new_select_medication_ID),
        );

        if (!new_select_medication) {
            setStartDate("");
            setEndDate("");
            return;
        }

        setStartDate(
            new_select_medication.START_DATE
                ? parseCFDateToISO(new_select_medication.START_DATE)
                : "",
        );
        setEndDate(
            new_select_medication.END_DATE
                ? parseCFDateToISO(new_select_medication.END_DATE)
                : "",
        );
    }

    //when opening the time picker
    //must: set default time to 8am, open popover & set anchor to the button that was clicked
    function handleOpenTimePopover(e) {
        setTimeChosen("08:00");
        setAnchor(e.currentTarget);
    }

    //when closing the time picker
    function handleCloseTimePopover() {
        setAnchor(null);
    }

    // add time chips
    //must: add selected time to reminder_times array, close popover, can't have duplicate times, can't exceed freq_per_day
    function handleAddReminderTime() {
        if (!time_chosen) return;

        const freqPerDay = selectedMedication?.FREQ_PER_DAY ?? null;

        // if a medication is selected and has a freq_per_day, enforce the limit
        if (freqPerDay !== null && reminder_times.length >= freqPerDay) {
            handleCloseTimePopover();
            return;
        }

        setReminderTimes(
            //current list of previously added times
            (prevTimes) => {
                if (prevTimes.includes(time_chosen)) {
                    return prevTimes; //no duplicates allowed, return old list unchanged/existing times without adding
                }
                return [...prevTimes, time_chosen]; //add new time to array of times
                // ... refers to items from old array, then we add the new time_chosen to the end of the array
            },
        );
        handleCloseTimePopover();
    }

    function handleDeleteReminderTime(time_to_delete) {
        //must: go through every time in reminder_times array, create new array keeping only the times that are not equal to time_to_delete, set reminder_times to the new array
        // take time item, return true or 'time' if time is not the one we want to delete & to keep it in the array, if it is the one we want to delete, return false to remove it from the array
        // overwrite array with new one
        setReminderTimes((prevTimes) =>
            prevTimes.filter((time) => time !== time_to_delete),
        );
    }

    function handleSubmit() {
        const expectedTimesPerDay = Number(selectedMedication?.FREQ_PER_DAY ?? 0);

        if (!name_of_reminder.trim()) {
            setSubmitError("Reminder name is required.");
            return;
        }

        if (!selectedMedication) {
            setSubmitError("Select a prescribed medication before saving the reminder.");
            return;
        }

        if (existingReminderMedIds.has(String(medication_select_ID))) {
            setSubmitError("A reminder for this medication already exists.");
            return;
        }

        if (!start_date || !end_date) {
            setSubmitError("Start date and end date are required.");
            return;
        }

        if (start_date > end_date) {
            setSubmitError("Start date must be before or equal to end date.");
            return;
        }

        if (reminder_times.length === 0) {
            setSubmitError("Add at least one reminder time before saving.");
            return;
        }

        if (expectedTimesPerDay > 0 && reminder_times.length !== expectedTimesPerDay) {
            setSubmitError(`Add exactly ${expectedTimesPerDay} reminder time${expectedTimesPerDay === 1 ? "" : "s"} for this medication.`);
            return;
        }

        setSubmitError("");
        setSavingReminder(true);

        const reminderData = {
            patient_id: PATIENT_ID,
            title_of_reminder: name_of_reminder,
            prescription_medication_id: Number(medication_select_ID),
            start_date_of_reminder: start_date,
            end_date_of_reminder: end_date,
            // CF_SQL_TIME requires "HH:MM:SS" — append seconds to the "HH:MM" values from the time picker
            reminder_times: reminder_times.map((t) => t.length === 5 ? t + ":00" : t),
        };

        postReminder(reminderData)
            .then((data) => {
                console.log("Reminder created:", data);
                setShowSuccessMessage(true);
            })
            .catch((error) => {
                console.log("Create reminder error:", error);
                setSubmitError(
                    error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to create reminder.",
                );
            })
            .finally(() => {
                setSavingReminder(false);
            });
    }
    //===============================================================

    useEffect(() => {
        const initialLoadTimer = window.setTimeout(() => {
            loadPatient();
            loadMedications();
            loadExistingReminders();
        }, 0);

        return () => window.clearTimeout(initialLoadTimer);
    }, []); //empty dependency array means this runs once on component mount

    useEffect(() => {
        if (!showSuccessMessage) {
            return undefined;
        }

        const navigationTimer = window.setTimeout(() => {
            //navigate("/appointments");
            window.location.href = "/appointments";
        }, 1500);

        return () => window.clearTimeout(navigationTimer);
    }, [showSuccessMessage]);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
            <Snackbar open={showSuccessMessage} autoHideDuration={1500} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={() => setShowSuccessMessage(false)}>
                <Alert severity="success" variant="filled" sx={{ width: "100%" }}>Reminder saved successfully.</Alert>
            </Snackbar>

            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
                <Card sx={{ maxWidth: 920, p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
                    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                        {/* START OF MAIN BOX*/}
                        <Typography variant="h3" sx={{ fontWeight: 400, mb: 2.5 }}>Create A Reminder</Typography>

                        <Stack spacing={3}>
                            {/* START OF MAIN STACK */}
                            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

                            <Typography variant="h5" sx={{ fontWeight: 400, mb: 1.2 }}>Name</Typography>
                            <TextField label="Name of Reminder" variant="outlined" required value={name_of_reminder} onChange={(e) => setNameOfReminder(e.target.value)} fullWidth />

                            {/* Medication Dropdown */}
                            <FormControl variant="filled" fullWidth required>
                                <Select value={medication_select_ID} onChange={handleMedicationChange} disabled={loadingMedications} disableUnderline displayEmpty sx={{ bgcolor: "#e8e8e8", "& .MuiSelect-select": { py: 1.4 } }} renderValue={(selected) => {
                                    if (loadingMedications) return "Loading medications...";
                                    if (!selected) return "Select Prescribed Medication";
                                    const match_found = medications_list.find(
                                        (medication_item) =>
                                            String(medication_item.ID) === String(selected),
                                    );
                                    return match_found ? match_found.MEDICATION_NAME : selected;
                                }}>
                                    <MenuItem value="">
                                        <em>{loadingMedications ? "Loading medications..." : "Select Prescribed Medication"}</em>
                                    </MenuItem>
                                    {medications_list.map((medication_item) => {
                                        const alreadyHasReminder = existingReminderMedIds.has(String(medication_item.ID));
                                        return (
                                            <MenuItem key={medication_item.ID} value={medication_item.ID} disabled={alreadyHasReminder}>
                                                {medication_item.MEDICATION_NAME}{alreadyHasReminder ? ' (reminder exists)' : ''}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>

                            {/* Frequency Display */}
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 400, mb: 1.2 }}>Frequency</Typography>

                                <Box sx={{ bgcolor: "#e8e8e8", px: 1.5, py: 1.2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1 }}>Read-only</Typography>
                                    <Typography variant="body1">{displayFrequency(selectedMedication)}</Typography>
                                </Box>
                            </Box>

                            {/* Start/End Date Pickers */}
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 400, mb: 1.2 }}>Schedule</Typography>

                                <Stack direction={{ xs: "column", md: "row" }} spacing={1.4}>
                                    <TextField label="Select Start Date" type="date" required slotProps={{ inputLabel: { shrink: true } }} value={start_date} onChange={(e) => setStartDate(e.target.value)} fullWidth />
                                    <TextField label="Select End Date" type="date" required slotProps={{ inputLabel: { shrink: true } }} value={end_date} onChange={(e) => setEndDate(e.target.value)} fullWidth />
                                </Stack>
                            </Box>

                            {/* Reminder Time Pickers */}
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 400, mb: 1.2 }}>Reminder Times</Typography>

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                                    {reminder_times.map((time) => (
                                        <Chip key={time} label={time} onDelete={() => handleDeleteReminderTime(time)} sx={{ mb: 1 }} />
                                    ))}

                                    <Button variant="contained" color="neutral" onClick={handleOpenTimePopover} disabled={!selectedMedication || (selectedMedication?.FREQ_PER_DAY != null && reminder_times.length >= selectedMedication.FREQ_PER_DAY)} sx={{ height: 32 }}> + Add Time</Button>

                                    <Popover anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} anchorEl={anchor} open={Boolean(anchor)} onClose={handleCloseTimePopover}>
                                        <Paper elevation={3} sx={{ p: 1.5, width: 250 }}>
                                            <Stack direction="column" spacing={1.2}>
                                                <Typography variant="body1">Select Time</Typography>
                                                <TextField size="small" type="time" value={time_chosen} onChange={(e) => setTimeChosen(e.target.value)} fullWidth />
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button size="small" onClick={handleCloseTimePopover}>Cancel</Button>
                                                    <Button size="small" variant="contained" onClick={handleAddReminderTime}>Add</Button>
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    </Popover>
                                </Stack>
                            </Box>

                            {/* Submit Button */}
                            <Stack direction="row" spacing={2} sx={{ pt: 6 }}>
                                <Button variant="contained" onClick={handleSubmit} disabled={savingReminder}>Save Reminder</Button>
                                <Button variant="outlined" onClick={() => window.location.href = "/appointments"}>Cancel</Button>
                            </Stack>

                            {/* END OF MAIN STACK */}
                        </Stack>
                        {/* END OF MAIN BOX */}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

/*
Save tabs:
https://mui.com/material-ui/react-popover/?_gl=1*1ehj579*_up*MQ..*_ga*MTk0NjIwMTU3Ni4xNzc2NjI4NTAw*_ga_5NXDQLC2ZK*czE3NzY2Mjg0OTkkbzEkZzAkdDE3NzY2Mjg0OTkkajYwJGwwJGgw

https://mui.com/material-ui/react-text-field/
https://helpx.adobe.com/coldfusion/developing-applications/changes-in-coldfusion/restful-web-services-in-coldfusion.html
https://www.google.com/search?q=inline+stlying+box+in+mui&sca_esv=55e9f3c856495c1e&rlz=1C1RXQR_enUS1019US1019&sxsrf=ANbL-n42EwitfRlNIVaQUURhqoa706iLbA%3A1776269670803&ei=Zrnfaa7YMPvn5NoPj8WtsAo&biw=1064&bih=1048&ved=0ahUKEwiuo4OWoPCTAxX7M1kFHY9iC6YQ4dUDCBE&uact=5&oq=inline+stlying+box+in+mui&gs_lp=Egxnd3Mtd2l6LXNlcnAiGWlubGluZSBzdGx5aW5nIGJveCBpbiBtdWkyBRAAGO8FMgUQABjvBTIFEAAY7wUyBRAAGO8FSMAPUJYGWNkHcAF4AZABAJgB5gagAYsMqgEFNS0xLjG4AQPIAQD4AQGYAgKgArMFwgIKEAAYRxjWBBiwA5gDAOIDBRIBMSBAiAYBkAYIkgcFMS41LTGgB5MJsgcDNS0xuAepBcIHAzItMsgHCoAIAQ&sclient=gws-wiz-serp
https://mui.com/material-ui/react-chip/
https://www.google.com/search?q=time+picker+mui+form+event+handler+function&sca_esv=55e9f3c856495c1e&rlz=1C1RXQR_enUS1019US1019&biw=1064&bih=475&sxsrf=ANbL-n7Ano9JZeXMe1cCP45aatFFtIBx1g%3A1776273279027&ei=f8ffaYitAc6Fw8cPv7CW8Qc&ved=0ahUKEwjI6MfOrfCTAxXOwvACHT-YJX4Q4dUDCBE&uact=5&oq=time+picker+mui+form+event+handler+function&gs_lp=Egxnd3Mtd2l6LXNlcnAiK3RpbWUgcGlja2VyIG11aSBmb3JtIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24yBRAhGKABMgUQIRigATIFECEYoAEyBRAhGKABMgUQIRirAkjbElDpBljrEHABeAGQAQCYAX2gAe8GqgEDNi4zuAEDyAEA-AEBmAIKoAKpB8ICChAAGEcY1gQYsAPCAhcQLhjcBhi4BhjaBhjYAhjIAxiwA9gBAcICBRAhGJ8FmAMAiAYBkAYLugYECAEYGZIHAzYuNKAHuDGyBwM1LjS4B6EHwgcFMC40LjbIByCACAE&sclient=gws-wiz-serp
*/
