import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Skeleton,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { getPatientSettings, getPrescribedMedications, updatePatientSettings } from '../services/api';

//Copied from Google Search to format date strings
function formatDate(dateString) {
    if (!dateString) return 'June 1, 2002';

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) return dateString;

    return parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function makeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
}

//Copied from Google Search 
function parseCFDateToISO(dateValue) {
    if (!dateValue) return '';

    const raw = String(dateValue).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return raw.slice(0, 10);
    }

    const parsed = new Date(raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    const cfMatch = raw.match(/^(\w+),\s+(\d+)\s+(\d{4})/);
    if (cfMatch) {
        const fallback = new Date(`${cfMatch[1]} ${cfMatch[2]}, ${cfMatch[3]}`);
        if (!Number.isNaN(fallback.getTime())) {
            return fallback.toISOString().slice(0, 10);
        }
    }

    return '';
}

function normalizePatientSettings(patientData) {
    if (!patientData) {
        return null;
    }

    return {
        id: patientData.id ?? patientData.ID ?? null,
        user_id: patientData.user_id ?? patientData.USER_ID ?? null,
        first_name: patientData.first_name ?? patientData.FIRST_NAME ?? '',
        last_name: patientData.last_name ?? patientData.LAST_NAME ?? '',
        email: patientData.email ?? patientData.EMAIL ?? '',
        phone_number: patientData.phone_number ?? patientData.PHONE_NUMBER ?? '',
        sex: patientData.sex ?? patientData.SEX ?? '',
        gender: patientData.gender ?? patientData.GENDER ?? '',
        ethnicity: patientData.ethnicity ?? patientData.ETHNICITY ?? '',
        date_of_birth: patientData.date_of_birth ?? patientData.DATE_OF_BIRTH ?? '',
    };
}

function buildEditablePatientForm(patientData) {
    const normalizedPatient = normalizePatientSettings(patientData);

    if (!normalizedPatient) {
        return {
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            sex: '',
            gender: '',
            ethnicity: '',
            date_of_birth: '',
        };
    }

    return {
        first_name: normalizedPatient.first_name,
        last_name: normalizedPatient.last_name,
        email: normalizedPatient.email,
        phone_number: normalizedPatient.phone_number,
        sex: normalizedPatient.sex,
        gender: normalizedPatient.gender,
        ethnicity: normalizedPatient.ethnicity === true || normalizedPatient.ethnicity === 'true' || normalizedPatient.ethnicity === 1 || normalizedPatient.ethnicity === '1' ? 'true' : 'false',
        date_of_birth: parseCFDateToISO(normalizedPatient.date_of_birth),
    };
}

function formatEthnicityValue(value) {
    if (value === true || value === 'true' || value === 1 || value === '1') {
        return 'Latino or Hispanic';
    }

    if (value === false || value === 'false' || value === 0 || value === '0') {
        return 'Not Latino or Hispanic';
    }

    return value || 'N/A';
}

function InfoRow({ label, value, loading }) {
    // component to show the label and value pair
    return (
        <Box>
            {/**  styling provided by Anima Figma Plugin */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 3 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 18, color: 'text.primary', mb: 2 }}>{label}</Typography>
                    {loading ? (<Skeleton variant="text" width={260} height={34} />) : (<Typography sx={{ fontSize: 20, fontWeight: 500, color: 'text.secondary' }}>{value}</Typography>)}
                </Box>
            </Box>
            <Divider />
        </Box>
    );
}

function PrescriptionCard({ prescription, loading }) {

    // To display when page is first loading and prescription data is not available yet
    if (loading) {
        return (
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" width={80} height={28} />
                </Box>
                <Stack spacing={1}>
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="text" width="60%" />
                    ))}
                </Stack>
            </Paper>
        );
    }
    // To display if there are no prescriptions for the patient
    if (!prescription) return null;
    
    return (
        <Paper elevation={1} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 500, color: 'text.primary' }}>{prescription.MEDICATION_NAME}</Typography>
                <Chip label={prescription.IS_ACTIVE ? 'ACTIVE' : 'INACTIVE'} sx={{ bgcolor: prescription.IS_ACTIVE ? '#2e7d32' : '#9e9e9e', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            </Box>                	
            
            {/* Displaying medication details */
            <Stack spacing={1} sx={{ fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.6 }}>
                {prescription.DOSAGE && <Typography variant="body2">Dose: {prescription.DOSAGE}</Typography>}
                {prescription.SUPPLY && <Typography variant="body2">Supply: {prescription.SUPPLY}</Typography>}
                {prescription.MEDICATION_TYPE && (<Typography variant="body2">Frequency: {prescription.MEDICATION_TYPE}</Typography>)}
                {prescription.START_DATE && <Typography variant="body2">Start Date: {formatDate(prescription.START_DATE)}</Typography>}
                {prescription.END_DATE && <Typography variant="body2">End Date: {formatDate(prescription.END_DATE)}</Typography>}
                {prescription.REFILLS !== undefined && <Typography variant="body2">Refills: {prescription.REFILLS}</Typography>}
                {prescription.INSTRUCTIONS && <Typography variant="body2">Instructions: {prescription.INSTRUCTIONS}</Typography>}
            </Stack>}
        </Paper>
    );
}


export default function PatientSettings({ user }) {
    const PATIENT_ID = user?.patient_id ?? user?.PATIENT_ID ?? 0;

    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    const [loadingPatient, setLoadingPatient] = useState(true);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);

    const [selectedTab, setSelectedTab] = useState('personalInfo'); // will switch between 'personalInfo' or 'prescriptions'
    const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
    const [savingPatient, setSavingPatient] = useState(false);
    const [saveError, setSaveError] = useState('');
    // Copied from Google query
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
    const [patientForm, setPatientForm] = useState(buildEditablePatientForm(null));

    //====== 1 ======== 
    function loadPatient() {
        setLoadingPatient(true);

        getPatientSettings(PATIENT_ID)
            .then((data) => {
                const patientArray = makeArray(data);
                const normalizedPatient = normalizePatientSettings(patientArray[0] || null);
                setPatient(normalizedPatient);
                setPatientForm(buildEditablePatientForm(normalizedPatient));
                console.log('Patient data:', data);
            })
            .catch((error) => {
                console.log('Patient data error:', error);
                setPatient(null);
                setPatientForm(buildEditablePatientForm(null));
            })
            .finally(() => {
                setLoadingPatient(false);
            });
    }

    function handlePatientFormChange(event) {
        const { name, value } = event.target;
        setPatientForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    }

    function handleStartEditing() {
        setEditingPersonalInfo(true);
        setSaveError('');
        setPatientForm(buildEditablePatientForm(patient));
    }

    function handleCancelEditing() {
        setEditingPersonalInfo(false);
        setSaveError('');
        setPatientForm(buildEditablePatientForm(patient));
    }

    function handleSavePatientSettings() {
        if (!patientForm.first_name.trim() || !patientForm.last_name.trim() || !patientForm.email.trim()) {
            setSaveError('First name, last name, and email are required.');
            return;
        }

        setSaveError('');
        setSavingPatient(true);

        updatePatientSettings(PATIENT_ID, {
            first_name: patientForm.first_name.trim(),
            last_name: patientForm.last_name.trim(),
            email: patientForm.email.trim(),
            phone_number: patientForm.phone_number.trim(),
            sex: patientForm.sex.trim(),
            gender: patientForm.gender.trim(),
            ethnicity: patientForm.ethnicity === 'true',
            date_of_birth: patientForm.date_of_birth,
        })
            .then((data) => {
                const updatedPatient = normalizePatientSettings(makeArray(data)[0] || null);
                setPatient(updatedPatient);
                setPatientForm(buildEditablePatientForm(updatedPatient));
                setEditingPersonalInfo(false);
                setFeedback({ open: true, message: 'Patient settings updated successfully.', severity: 'success' });
            })
            .catch((error) => {
                //
                setSaveError(
                    error.response?.data?.detail ||
                    error.response?.data?.message ||
                    error.message ||
                    'Unable to update patient settings.',
                );
            })
            .finally(() => {
                setSavingPatient(false);
            });
    }

    //====== 2 ======== 
    function loadPrescriptions() {
        setLoadingPrescriptions(true);
        getPrescribedMedications(PATIENT_ID)
            .then((data) => {
                const prescriptionsArray = makeArray(data);
                setPrescriptions(prescriptionsArray);
                console.log('Prescriptions data:', data);
            }).catch((error) => {
                console.log('Prescriptions data error:', error);
                setPrescriptions([]);
            }).finally(() => {
                setLoadingPrescriptions(false);
            });
    }
    
    useEffect(() => {
        loadPatient();
        loadPrescriptions();
    }, []);
    
    
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Snackbar open={feedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}>
                <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%' }}>{feedback.message}</Alert>
            </Snackbar>

            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 3, md: 6 }, flexDirection: { xs: 'column', md: 'row' }}}>
                    {/* SIDEBAR */}
                    <Paper elevation={0} sx={{ width: { xs: '100%', md: 256 }, bgcolor: '#f5f5f5' }}>

                        <List disablePadding sx={{ py: 1 }}>
                            <ListItemButton selected={selectedTab === 'personalInfo'} onClick={() => setSelectedTab('personalInfo')} >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <ContactPageOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Personal Information" />
                            </ListItemButton>

                            <ListItemButton selected={selectedTab === 'prescriptions'} onClick={() => setSelectedTab('prescriptions')} sx={{ py: 1, px: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Inventory2OutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Prescriptions" />
                            </ListItemButton>
                        </List>

                        <Divider />
                    </Paper>
                    
                    {/* MAIN CONTENT */}
                    <Box sx={{ flex: 1, width: '100%', maxWidth: 820 }}>
                        {/* ========================================= */}
                        {/* PERSONAL INFORMATION TAB */}
                        {selectedTab === 'personalInfo' && ( <>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 400 }}>Personal Information</Typography>
                                    {!editingPersonalInfo && (
                                        <Button variant="text" onClick={handleStartEditing}>Edit</Button>
                                    )}
                                </Box>

                                {editingPersonalInfo ? (
                                    <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                                        <Stack spacing={2.5}>
                                            {saveError ? <Alert severity="error">{saveError}</Alert> : null}

                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                                <TextField label="First Name" name="first_name" value={patientForm.first_name} onChange={handlePatientFormChange} fullWidth />
                                                <TextField label="Last Name" name="last_name" value={patientForm.last_name} onChange={handlePatientFormChange} fullWidth />
                                            </Stack>

                                            <TextField label="Email" name="email" type="email" value={patientForm.email} onChange={handlePatientFormChange} fullWidth />
                                            <TextField label="Phone Number" name="phone_number" value={patientForm.phone_number} onChange={handlePatientFormChange} fullWidth />

                                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                                <TextField label="Sex" name="sex" value={patientForm.sex} onChange={handlePatientFormChange} fullWidth />
                                                <TextField label="Gender" name="gender" value={patientForm.gender} onChange={handlePatientFormChange} fullWidth />
                                            </Stack>

                                            <TextField label="Ethnicity" name="ethnicity" value={patientForm.ethnicity} onChange={handlePatientFormChange} select fullWidth>
                                                <MenuItem value="false">Not Latino or Hispanic</MenuItem>
                                                <MenuItem value="true">Latino or Hispanic</MenuItem>
                                            </TextField>
                                            <TextField label="Date of Birth" name="date_of_birth" type="date" value={patientForm.date_of_birth} onChange={handlePatientFormChange} slotProps={{ inputLabel: { shrink: true } }} fullWidth />

                                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                                <Button variant="outlined" onClick={handleCancelEditing} disabled={savingPatient}>Cancel</Button>
                                                <Button variant="contained" onClick={handleSavePatientSettings} disabled={savingPatient}>Save Changes</Button>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                ) : (
                                    <Stack spacing={0}>
                                        <InfoRow label="Full Name" value={`${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()} loading={loadingPatient} />
                                        <InfoRow label="Email" value={patient?.email || ''} loading={loadingPatient} />
                                        <InfoRow label="Phone Number" value={patient?.phone_number || 'N/A'} loading={loadingPatient} />
                                        <InfoRow label="Sex" value={patient?.sex || ''} loading={loadingPatient} />
                                        <InfoRow label="Gender" value={patient?.gender || ''} loading={loadingPatient} />
                                        <InfoRow label="Ethnicity" value={formatEthnicityValue(patient?.ethnicity)} loading={loadingPatient} />
                                        <InfoRow label="Date of Birth" value={formatDate(patient?.date_of_birth)} loading={loadingPatient} />
                                    </Stack>
                                )}
                            </>
                        )}
                        {/* ========================================= */}
                        {/* PRESCRIPTIONS TAB */}
                        {selectedTab === 'prescriptions' && 

                            (<><Typography variant="h5" sx={{ mb: 3, fontWeight: 400 }}>Your Prescriptions</Typography>
                                    {loadingPrescriptions ? 
                                        (<Stack spacing={2}>
                                            <PrescriptionCard key={1} prescription={null} loading={true} />                                          	
                                        </Stack>) 
                                        :
                                        prescriptions.length === 0 ? (<Typography variant="body2" color="text.secondary">No prescriptions found.</Typography>) 
                                        : 
                                        (<Stack spacing={0}>
                                            {prescriptions.map((p) => (<PrescriptionCard key={p.ID} prescription={p} loading={false} /> ))}
                                        </Stack>
                                    )}                        
                            </>)
                        }
                        {/* ========================================= */}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
