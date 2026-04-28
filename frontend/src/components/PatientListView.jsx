import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Stack,
  Input,
  Button,
  FormControl,
  FormLabel,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/joy';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { apiFetch } from '../lib/calls';

/**
 * Reusable patient list / search UI used by both the standalone /search route
 * (PatientSearch.jsx) and the "My Patients" tab on the doctor home page
 * (dHome.jsx). Filters by the logged-in doctor's ID via searchPatients().
 *
 * Props:
 *   - user        : the logged-in user object (must expose doctor_id / DOCTOR_ID)
 *   - title       : optional heading text shown above the search inputs
 *   - subtitle    : optional muted line beneath the title
 *   - showHeader  : set to false to hide the title/subtitle block
 */
export default function PatientListView({
  user,
  title = 'Patient Search',
  subtitle = 'Search for patients by first and last name. Only patients assigned to you are shown.',
  showHeader = true,
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const doctorId = user?.doctor_id || user?.DOCTOR_ID;

  useEffect(() => {
    if (doctorId) loadPatients();
  }, [doctorId]);

  // Auto-search when both fields are cleared
  useEffect(() => {
    if (doctorId && firstName === '' && lastName === '') {
      loadPatients();
    }
  }, [firstName, lastName, doctorId]);

  const loadPatients = async (fn = '', ln = '') => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('doctorId', doctorId);
      if (fn) params.set('firstName', fn);
      if (ln) params.set('lastName', ln);
      const qs = params.toString();
      const url = `/cfm/patients.cfm?${qs}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error(`Patient search failed: ${res.status}`);
      const data = await res.json();
      setPatients(data?.patients || []);
    } catch (err) {
      console.error(err);
      setPatients([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(firstName, lastName);
  };

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 1.5, sm: 2, md: 4 }, minWidth: 0 }}>
      {showHeader && (
        <>
          <Typography level="h2" sx={{ mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography level="body-md" sx={{ color: 'text.secondary', mb: 3 }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}

      <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
        <form onSubmit={handleSearch}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>First Name</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name..."
              />
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <FormLabel>Last Name</FormLabel>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name..."
              />
            </FormControl>
            <Button type="submit" startDecorator={<SearchIcon />} sx={{ minWidth: 120 }}>
              Search
            </Button>
          </Stack>
        </form>
      </Card>

      <Card variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography level="title-sm">
            {patients.length} {patients.length === 1 ? 'patient' : 'patients'} found
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography level="body-md">No patients found</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {patients.map((p) => (
              <Stack
                key={p.patient_id}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
                sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2 }}
              >
                <Avatar color="primary" variant="soft" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography level="title-md">
                    {p.first_name} {p.last_name}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                    DOB: {p.date_of_birth} &middot; {p.gender} &middot; Patient ID: {p.patient_id}
                  </Typography>
                </Box>
                <Button
                  variant="solid"
                  color="primary"
                  fullWidth
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                  onClick={() => navigate(`/patient?id=${p.patient_id}`)}
                >
                  View Profile
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}
