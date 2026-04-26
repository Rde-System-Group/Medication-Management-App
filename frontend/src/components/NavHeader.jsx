import {
  AppBar,
  Button,
  ButtonGroup,
  Link,
  Stack,
  Toolbar,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link as RouterLink } from 'react-router-dom';

export default function NavHeader({ doctor, onLogout }) { 
  const formattedName = doctor ? `${doctor.FIRST_NAME || doctor.first_name || ''} ${doctor.LAST_NAME || doctor.last_name || ''}`.trim().toUpperCase() : 'DOCTOR';
  const isPatient = (doctor?.role || '').toLowerCase() === 'patient';
  const profilePath = isPatient ? '/patient-settings' : '/account';

  const triggerLogout = () => {
    if (onLogout) {
        onLogout(); 
    }
  };
  
  return (
    <AppBar position="static" color="inherit" elevation={1} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 4 } }}>
        
        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexGrow: 1 }}>
          <Link href="/" underline="none" variant="body1" sx={{ fontWeight: 600 }}>
            MMWA
          </Link>
          {isPatient ? (
            <>
              <Link component={RouterLink} to="/dashboard" underline="none" variant="body1">
                Dashboard
              </Link>
              <Link href="/account" underline="none" variant="body1">
                Account
              </Link>
              <Link component={RouterLink} to="/appointments" underline="none" variant="body1">
                Appointments
              </Link>
              
              <Link component={RouterLink} to="/create-reminder-form" underline="none" variant="body1">
                Create Reminder Form
              </Link>
              <Link component={RouterLink} to="/doctor-search" underline="none" variant="body1">
                Search & Manage Doctors
              </Link>
            </>
          ) : (
            <>
              <Link href="/account" underline="none" variant="body1">
                Account
              </Link>
              <Link component={RouterLink} to="/appointments" underline="none" variant="body1">
                Appointments
              </Link>
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <ButtonGroup variant="contained" sx={{ boxShadow: 2 }}>
            <Button component={RouterLink} to={profilePath} sx={{ px: 2.25 }}>
              {formattedName}
            </Button>
            <Button component={RouterLink} to={profilePath} sx={{ minWidth: 42, px: 1 }} aria-label="Open profile page">
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Button 
            variant="text" 
            size="small" 
            onClick={triggerLogout}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
