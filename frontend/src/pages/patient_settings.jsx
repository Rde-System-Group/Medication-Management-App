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

function makeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
}

function InfoRow({ label, value, loading }) {
    return (
        <Box>
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

    if (!prescription) return null;
    
    return (
        <Paper elevation={1} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{ fontSize: 22, fontWeight: 500, color: 'text.primary' }}>{prescription.medication_name || `Medication #${prescription.id}`}</Typography>
                <Chip label={prescription.is_active ? 'ACTIVE' : 'INACTIVE'} sx={{ bgcolor: prescription.is_active ? '#2e7d32' : '#9e9e9e', color: 'white', fontWeight: 600, fontSize: '0.75rem' }} />
            </Box>
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
                                
                                </Stack>
                            </>
                        )}
                        {/* ========================================= */}
                        {/* PRESCRIPTIONS TAB */}
                        {selectedTab === 'prescriptions' && (<><Typography variant="h5" sx={{ mb: 3, fontWeight: 400 }}>Your Prescriptions</Typography></>)}
                        {/* ========================================= */}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
