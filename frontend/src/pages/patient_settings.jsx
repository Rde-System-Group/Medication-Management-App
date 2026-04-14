import { useEffect, useState } from 'react';
import {
    Box,
    Chip,
    Container,
    Divider,
    Link,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import NavHeader from '../components/NavHeader';
import { getPatientInfo, getPatientSettings, getPrescribedMedications } from '../services/api'; //new

const PATIENT_ID = 1;

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

function InfoRow({ label, value, loading }) {
    // component to show the label and value pair with an edit link
    return (
        <Box>
            {/**  styling provided by Anima Figma Plugin */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, py: 3 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 18, color: 'text.primary', mb: 2 }}>{label}</Typography>
                    {loading ? (<Skeleton variant="text" width={260} height={34} />) : (<Typography sx={{ fontSize: 20, fontWeight: 500, color: 'text.secondary' }}>{value}</Typography>)}
                </Box>

                <Link href="#" underline="always" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>Edit</Link>
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


export default function PatientSettings() {

    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    const [loadingPatient, setLoadingPatient] = useState(true);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);

    const [selectedTab, setSelectedTab] = useState('personalInfo'); // will switch between 'personalInfo' or 'prescriptions'

    //====== 1 ======== 
    function loadPatient() {
        setLoadingPatient(true);

        getPatientInfo(PATIENT_ID)
            .then((data) => {
                const patientArray = makeArray(data);
                setPatient(patientArray[0] || null); //patientArray[0] is the first patient in the array
                console.log('Patient data:', data);
            })
            .catch((error) => {
                console.log('Patient data error:', error);
                setPatient(null);
            })
            .finally(() => {
                setLoadingPatient(false);
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
            <NavHeader patient={patient} loading={loadingPatient} />
            
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
                        {selectedTab === 'personalInfo' && ( <><Typography variant="h5" sx={{ mb: 3, fontWeight: 400 }}>Personal Information</Typography>
                                <Stack spacing={0}>
                                    <InfoRow label="Full Name" value={`${patient?.FIRST_NAME || ''} ${patient?.LAST_NAME || ''}`} loading={loadingPatient} />                                	
                                    <InfoRow label="Email" value={patient?.EMAIL || ''} loading={loadingPatient} />
                                    <InfoRow label="Sex" value={patient?.SEX || ''} loading={loadingPatient} />                                    	
                                    <InfoRow label="Gender" value={patient?.GENDER || ''} loading={loadingPatient} />                                    	
                                    <InfoRow label="Ethnicity" value={patient?.ETHNICITY || 'N/A'} loading={loadingPatient} />                                    	
                                    <InfoRow label="Date of Birth" value={formatDate(patient?.DATE_OF_BIRTH)} loading={loadingPatient} />
                                </Stack>
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
