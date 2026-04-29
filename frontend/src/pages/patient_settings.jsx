import { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
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
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { getPatientSettings, getPrescribedMedications, updatePatientSettings } from '../services/api';
import { apiFetch } from '../lib/calls';

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

function makeRaceOptions(data) {
    if (Array.isArray(data)) return data;
    if (data && data.COLUMNS && data.DATA) {
        const cols = data.COLUMNS;
        const rowCount = (data.DATA[cols[0]] || []).length;
        return Array.from({ length: rowCount }, (_, i) => {
            const row = {};
            cols.forEach((c) => {
                row[c] = data.DATA[c][i];
            });
            return row;
        });
    }
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
        race_id: patientData.race_id ?? patientData.RACE_ID ?? '',
        race: patientData.race ?? patientData.RACE ?? '',
        date_of_birth: patientData.date_of_birth ?? patientData.DATE_OF_BIRTH ?? '',
    };
}

function normalizePrescription(prescriptionData) {
    if (!prescriptionData) return null;

    return {
        id: prescriptionData.id ?? prescriptionData.ID ?? prescriptionData.prescription_medication_id ?? prescriptionData.PRESCRIPTION_MEDICATION_ID ?? null,
        medication_name: prescriptionData.medication_name ?? prescriptionData.MEDICATION_NAME ?? '',
        dosage: prescriptionData.dosage ?? prescriptionData.DOSAGE ?? '',
        supply: prescriptionData.supply ?? prescriptionData.SUPPLY ?? '',
        frequency_type: prescriptionData.frequency_type ?? prescriptionData.FREQUENCY_TYPE ?? '',
        freq_per_day: prescriptionData.freq_per_day ?? prescriptionData.FREQ_PER_DAY ?? '',
        start_date: prescriptionData.start_date ?? prescriptionData.START_DATE ?? '',
        end_date: prescriptionData.end_date ?? prescriptionData.END_DATE ?? '',
        refills: prescriptionData.refills ?? prescriptionData.REFILLS ?? '',
        instructions: prescriptionData.instructions ?? prescriptionData.INSTRUCTIONS ?? '',
        is_active: prescriptionData.is_active ?? prescriptionData.IS_ACTIVE ?? false,
    };
}

function formatPrescriptionFrequency(quantity, intervalType) {
    const interval = String(intervalType) === '1' ? 'Daily'
        : String(intervalType) === '2' ? 'Weekly'
            : String(intervalType) === '3' ? 'Monthly'
                : 'As needed';
    return `Quantity: ${quantity || '1'}x, Interval: ${interval}`;
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
            race: '',
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
        race: normalizedPatient.race_id ? String(normalizedPatient.race_id) : '',
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
    const normalizedPrescription = normalizePrescription(prescription);
    const isActive = normalizedPrescription.is_active === true || normalizedPrescription.is_active === 1 || normalizedPrescription.is_active === '1';
    
    return (
        <Paper elevation={1} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 500, color: 'text.primary' }}>{normalizedPrescription.medication_name || 'Medication'}</Typography>
                <Chip label={isActive ? 'ACTIVE' : 'INACTIVE'} sx={{ bgcolor: isActive ? '#2e7d32' : '#9e9e9e', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            </Box>                	
            
            {/* Displaying medication details */
            <Stack spacing={1} sx={{ fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.6 }}>
                {normalizedPrescription.dosage && <Typography variant="body2">Dose: {normalizedPrescription.dosage}</Typography>}
                {normalizedPrescription.supply && <Typography variant="body2">Supply: {normalizedPrescription.supply}</Typography>}
                {(normalizedPrescription.freq_per_day || normalizedPrescription.frequency_type) && (
                    <Typography variant="body2">
                        Frequency: {formatPrescriptionFrequency(normalizedPrescription.freq_per_day, normalizedPrescription.frequency_type)}
                    </Typography>
                )}
                {normalizedPrescription.start_date && <Typography variant="body2">Start Date: {formatDate(normalizedPrescription.start_date)}</Typography>}
                {normalizedPrescription.end_date && <Typography variant="body2">End Date: {formatDate(normalizedPrescription.end_date)}</Typography>}
                {normalizedPrescription.refills !== '' && normalizedPrescription.refills !== undefined && <Typography variant="body2">Refills: {normalizedPrescription.refills}</Typography>}
                {normalizedPrescription.instructions && <Typography variant="body2">Instructions: {normalizedPrescription.instructions}</Typography>}
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
    const [listOfRaces, setListOfRaces] = useState([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');

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

    function loadRaceOptions() {
        apiFetch('/api/rest/base/options')
            .then((res) => res.json())
            .then((data) => {
                setListOfRaces(makeRaceOptions(data));
            })
            .catch(() => {
                setListOfRaces([]);
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
        setPasswordError('');
        setPasswordForm({ oldPassword: '', newPassword: '' });
    }

    function handlePasswordFormChange(event) {
        const { name, value } = event.target;
        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleUpdatePassword() {
        if (!passwordForm.oldPassword.trim() || !passwordForm.newPassword.trim()) {
            setPasswordError('Old password and new password are required.');
            return;
        }

        setPasswordError('');
        setPasswordSaving(true);

        try {
            const res = await apiFetch('/api/rest/user/update', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'password',
                    value: passwordForm.newPassword,
                    oldPassword: passwordForm.oldPassword,
                }),
            });
            const data = await res.json();

            if (data?.error || data?.success === false) {
                throw new Error(data?.detail || data?.message || 'Unable to update password.');
            }

            setPasswordForm({ oldPassword: '', newPassword: '' });
            setFeedback({ open: true, message: 'Password updated successfully.', severity: 'success' });
        } catch (error) {
            setPasswordError(error.message || 'Unable to update password.');
        } finally {
            setPasswordSaving(false);
        }
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
            race: patientForm.race,
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

    async function handleLogout() {
        try {
            await apiFetch('/api/rest/auth/logout');
        } catch (error) {
            console.log('Logout API failed', error);
        }
        window.location.href = '/login';
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
        loadRaceOptions();
    }, []);
    
    
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <Snackbar open={feedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}>
                <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%' }}>{feedback.message}</Alert>
            </Snackbar>

            <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 3, md: 6 }, flexDirection: { xs: 'column', md: 'row' }}}>
                    {/* SIDEBAR */}
                    <Paper elevation={0} sx={{ width: { xs: '100%', md: 256 }, bgcolor: '#f8fafc' }}>

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

                            <ListItemButton selected={selectedTab === 'manageAccount'} onClick={() => setSelectedTab('manageAccount')} sx={{ py: 1, px: 2 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <ManageAccountsOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Manage Account" />
                            </ListItemButton>
                        </List>

                        <Divider />
                        <Box sx={{ px: 2, py: 2 }}>
                            <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>Logout</Button>
                        </Box>
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
                                            <TextField label="Race" name="race" value={patientForm.race} onChange={handlePatientFormChange} select fullWidth>
                                                {listOfRaces.map((option) => (
                                                    <MenuItem key={`race-${option.ID}`} value={String(option.ID)}>{option.NAME}</MenuItem>
                                                ))}
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
                                        <InfoRow label="Race" value={patient?.race || 'N/A'} loading={loadingPatient} />
                                        <InfoRow label="Date of Birth" value={formatDate(patient?.date_of_birth)} loading={loadingPatient} />
                                    </Stack>
                                )}

                                {editingPersonalInfo && (<Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0', mt: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Update Password</Typography>
                                    <Stack spacing={2}>
                                        {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}
                                        <TextField label="Old Password" name="oldPassword" type="password" value={passwordForm.oldPassword} onChange={handlePasswordFormChange} fullWidth />
                                        <TextField label="New Password" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordFormChange} fullWidth />
                                        <Stack direction="row" justifyContent="flex-end">
                                            <Button variant="contained" onClick={handleUpdatePassword} disabled={passwordSaving}>Update Password</Button>
                                        </Stack>
                                    </Stack>
                                </Paper>)}
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
                                            {prescriptions.map((p, index) => (<PrescriptionCard key={p.id || p.ID || p.prescription_id || p.PRESCRIPTION_ID || `prescription-${index}`} prescription={p} loading={false} /> ))}
                                        </Stack>
                                    )}                        
                            </>)
                        }
                        {/* ========================================= */}
                        {/* MANAGE ACCOUNT TAB */}
                        {selectedTab === 'manageAccount' && (
                            <>
                                <Typography variant="h5" sx={{ fontWeight: 400, mb: 3 }}>Manage Account</Typography>
                                <Paper elevation={1} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                                    <Typography variant="body1" sx={{ mb: 2 }}>Permanently delete your account.</Typography>
                                    <Button variant="contained" color="error" onClick={() => setOpenDeleteDialog(true)}>Delete Account</Button>
                                </Paper>

                                <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                                    <DialogTitle>Delete Account</DialogTitle>
                                    <DialogContent>
                                        <DialogContentText>Are you sure you want to delete your account? This action cannot be undone.</DialogContentText>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>No</Button>
                                        <Button variant="contained" color="error" onClick={async () => { await apiFetch('/api/rest/user/delete', { method: 'POST', body: JSON.stringify({ delete: true }) }); window.location.reload(); }}>Yes, Delete</Button>
                                    </DialogActions>
                                </Dialog>
                            </>
                        )}
                        {/* ========================================= */}
                    </Box>
                </Box>
            </Container>
            
        </Box>
    );
}
