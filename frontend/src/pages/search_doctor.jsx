import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { assignDoctor, getAssignedDoctors, searchDoctors, unassignDoctor } from '../services/api';

function DoctorSearch({ user }) {
  const PATIENT_ID = user?.patient_id ?? user?.PATIENT_ID ?? 0;

  const [query, setQuery] = useState(''); //this state will be for storing the search query entered by the user
  const [results, setResults] = useState([]); //this state will be for storing the search results returned by the API
  const [loading, setLoading] = useState(false); //this state will be for indicating whether a search is currently in progress
  const [searched, setSearched] = useState(false); //this state will be for indicating whether a search has been performed
  const [assignedProviders, setAssignedProviders] = useState([]);
  const [loadingAssignedProviders, setLoadingAssignedProviders] = useState(true);
  const [assigningDoctorId, setAssigningDoctorId] = useState(null);
  const [unassigningDoctorId, setUnassigningDoctorId] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  function makeArray(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return [data];
    return [];
  }

  function normalizeDoctor(doctor) {
    return {
      id: doctor.id ?? doctor.ID ?? doctor.doctor_id ?? doctor.DOCTOR_ID,
      first_name: doctor.first_name ?? doctor.FIRST_NAME ?? '',
      last_name: doctor.last_name ?? doctor.LAST_NAME ?? '',
      specialty: doctor.specialty ?? doctor.SPECIALTY ?? '',
      work_email: doctor.work_email ?? doctor.WORK_EMAIL ?? '',
    };
  }

  function loadAssignedProviders() {
    setLoadingAssignedProviders(true);

    getAssignedDoctors(PATIENT_ID)
      .then((data) => {
        const normalized = makeArray(data).map(normalizeDoctor);
        setAssignedProviders(normalized);
      })
      .catch(() => {
        setAssignedProviders([]);
      })
      .finally(() => {
        setLoadingAssignedProviders(false);
      });
  }

  //====== 1 ======== 
  function handleSearch() {
    setLoading(true); //set loading state to true when a search is initiated
    setSearched(true); //set searched state to true when a search is performed

    searchDoctors(query) //call the searchDoctors function from the API service with the current query
      .then((data) => setResults(makeArray(data).map(normalizeDoctor))) //update results state with the data returned from the API
      .catch(() => setResults([])) //if there's an error, set results to an empty array
      .finally(() => setLoading(false)); //set loading state to false once the search is complete
  }

  //====== 2 ======== 
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function getProviderForSpecialty(specialty) {
    return assignedProviders.find((provider) => String(provider.specialty || '').toLowerCase() === String(specialty || '').toLowerCase());
  }

  function handleAssignDoctor(doctor) {
    if (!doctor?.id) {
      setFeedback({ open: true, message: 'Unable to assign doctor.', severity: 'error' });
      return;
    }

    const existingProvider = getProviderForSpecialty(doctor.specialty);
    if (existingProvider && String(existingProvider.id) !== String(doctor.id)) {
      const shouldReplace = window.confirm(`You already have a ${doctor.specialty} provider. Replace with ${doctor.first_name} ${doctor.last_name}?`);
      if (!shouldReplace) {
        return;
      }
    }

    setAssigningDoctorId(doctor.id);

    assignDoctor(PATIENT_ID, doctor.id)
      .then((response) => {
        setFeedback({
          open: true,
          message: response?.message || 'Doctor assignment updated.',
          severity: 'success',
        });
        loadAssignedProviders();
      })
      .catch((error) => {
        setFeedback({
          open: true,
          message: error.response?.data?.message || error.message || 'Unable to assign doctor.',
          severity: 'error',
        });
      })
      .finally(() => {
        setAssigningDoctorId(null);
      });
  }

  function handleUnassignDoctor(provider) {
    if (!provider?.id) {
      setFeedback({ open: true, message: 'Unable to unassign provider.', severity: 'error' });
      return;
    }

    const shouldUnassign = window.confirm(`Unassign ${provider.first_name} ${provider.last_name} (${provider.specialty})?`);
    if (!shouldUnassign) {
      return;
    }

    setUnassigningDoctorId(provider.id);

    unassignDoctor(PATIENT_ID, provider.id)
      .then((response) => {
        setFeedback({
          open: true,
          message: response?.message || 'Provider unassigned successfully.',
          severity: 'success',
        });
        loadAssignedProviders();
      })
      .catch((error) => {
        setFeedback({
          open: true,
          message: error.response?.data?.message || error.message || 'Unable to unassign provider.',
          severity: 'error',
        });
      })
      .finally(() => {
        setUnassigningDoctorId(null);
      });
  }

  useEffect(() => {
    loadAssignedProviders();
  }, []);



  return (
    /* NOTE: Created using FIGMA MUI library components, FIGMA Anima plugin, and VS CODE PLUGINS 
    https://www.geeksforgeeks.org/reactjs/react-mui-paper-api/
    https://www.bing.com/ck/a?!&&p=005b9c1b33e8a8bdd557754fc538d6efe735d489ab0c6f5463ad710c561c91bbJmltdHM9MTc3NTYwNjQwMA&ptn=3&ver=2&hsh=4&fclid=0ed859f0-c337-6416-3eff-4bf0c22e6531&u=a1L3ZpZGVvcy9yaXZlcnZpZXcvcmVsYXRlZHZpZGVvP3E9cGFwZXIrdnMrY2FyZCttdWkrdmlzdWFsJm1pZD0xNTI4MDQzRTE1MEQ4QTZDMjQ5RTE1MjgwNDNFMTUwRDhBNkMyNDlFJkZPUk09VklSRQ
    */
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Snackbar open={feedback.open} autoHideDuration={2500} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}>
        <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%' }}> {feedback.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
              	 {/* copied from Appointments.jsx */}	
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
              <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1e293b" }}>
                      Doctor Search
                  </Typography>
                  <Typography variant="body1" sx={{ color: "#64748b", mt: 0.5 }}>
                      Search for doctors and manage your assigned providers. You can only have one provider per specialty, but you can change your assigned providers at any time.
                  </Typography>
              </Box>
          </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          <Paper elevation={1} sx={{ p: 3, flex: 1, minWidth: 0, width: { xs: '100%', md: 'auto' }, maxWidth: { xs: '100%', md: 700 } }}>
            {/* Search bar component */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
              <TextField fullWidth placeholder="Search by name or specialty" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }} sx={{ mb: { xs: 2, sm: 0 } }} />
              <Button variant="contained" onClick={handleSearch} sx={{ whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' } }}> Search  </Button>
            </Box>

            { /*============================================================================= */}
            {/* Results table */}
            {loading ? (<Typography>Searching...</Typography>) : searched && results.length === 0 ? (<Typography color="text.secondary">No doctors found.</Typography>) : results.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Specialty</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((doctor_obj, index) => {
                    const assignedForSpecialty = getProviderForSpecialty(doctor_obj.specialty);
                    const isCurrentlyAssigned = assignedForSpecialty && String(assignedForSpecialty.id) === String(doctor_obj.id);

                    return (
                      <TableRow key={doctor_obj.id || index}>
                        <TableCell>{doctor_obj.first_name || 'n/a'} {doctor_obj.last_name || ''}</TableCell>
                        <TableCell>{doctor_obj.specialty || 'n/a'}</TableCell>
                        <TableCell>{doctor_obj.work_email || 'n/a'}</TableCell>
                        <TableCell>
                          <Button variant={isCurrentlyAssigned ? 'outlined' : 'contained'} size="small" disabled={assigningDoctorId === doctor_obj.id || isCurrentlyAssigned} onClick={() => handleAssignDoctor(doctor_obj)}>{isCurrentlyAssigned ? 'Assigned' : 'Assign'}</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : null}
            { /*============================================================================= */}
          </Paper>

          <Paper elevation={1} sx={{ p: 3, width: { xs: '100%', md: 360 }, maxWidth: '100%', flexShrink: 0, mt: { xs: 3, md: 0 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Your Provider</Typography>

            {loadingAssignedProviders ? (
              <Typography color="text.secondary">Loading providers...</Typography>
            ) : assignedProviders.length === 0 ? (
              <Typography color="text.secondary">No provider assigned yet.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {assignedProviders.map((provider, idx) => (
                  <Paper key={provider.id || idx} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{provider.first_name} {provider.last_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{provider.specialty || 'No specialty'}</Typography>
                        <Typography variant="body2" color="text.secondary">{provider.work_email || 'No email'}</Typography>
                      </Box>
                      <IconButton size="small" color="error" aria-label={`Unassign ${provider.first_name} ${provider.last_name}`} onClick={() => handleUnassignDoctor(provider)} disabled={unassigningDoctorId === provider.id} >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Stack>

      </Container>
    </Box>
  );
}

export default DoctorSearch;
