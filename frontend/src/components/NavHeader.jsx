import { useState } from 'react';
import {
  AppBar,
  Button,
  ButtonGroup,
  Link,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link as RouterLink } from 'react-router-dom';

export default function NavHeader({ doctor, onLogout }) { 
  const formattedName = doctor ? `${doctor.FIRST_NAME || doctor.first_name || ''} ${doctor.LAST_NAME || doctor.last_name || ''}`.trim().toUpperCase() : 'DOCTOR';
  const isPatient = (doctor?.role || '').toLowerCase() === 'patient';
  const profilePath = isPatient ? '/patient-settings' : '/account';
  
  //https://mui.com/material-ui/react-menu/
  const first_dropdown_option = isPatient ? 'Patient Intake Settings' : 'Account';
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const triggerLogout = () => {
    if (onLogout) {
        onLogout(); 
    }
  };

  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    closeMenu();
    triggerLogout();
  };
  
  return (
    <AppBar position="static" color="inherit" elevation={1} sx={{ borderBottom: '1px solid', borderColor: 'divider', maxWidth: '100vw', overflowX: 'hidden' }}>
      <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 2, md: 4 }, py: { xs: 1, md: 0 }, flexWrap: 'wrap', rowGap: 1, columnGap: 1, minWidth: 0 }}>
        
        <Stack direction="row" spacing={{ xs: 1.25, sm: 2.5 }} alignItems="center" sx={{ flexGrow: 1, minWidth: 0, flexWrap: 'wrap', rowGap: 1 }}>
          <Link href="/" underline="none" variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            MMWA
          </Link>
          {isPatient ? (
            <>
              <Link component={RouterLink} to="/dashboard" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Dashboard
              </Link>
              <Link component={RouterLink} to="/appointments" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Appointments
              </Link>
              <Link component={RouterLink} to="/create-reminder-form" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Create Reminder
              </Link>
              <Link component={RouterLink} to="/doctor-search" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Doctors
              </Link>
            </>
          ) : (
            <>
              <Link href="/account" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Account
              </Link>
              <Link component={RouterLink} to="/appointments" underline="none" variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Appointments
              </Link>
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' }, minWidth: 0 }}>
          <ButtonGroup size="medium" variant="contained" sx={{ boxShadow: 2, maxWidth: '100%' }}>
            <Button component={RouterLink} to={profilePath} sx={{ px: { xs: 1.25, sm: 2.25 }, maxWidth: { xs: 'calc(100vw - 90px)', sm: 'none' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formattedName}
            </Button>
            <Button onClick={openMenu} sx={{ minWidth: 42, px: 1 }} aria-label="Open profile menu">
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem component={RouterLink} to={profilePath} onClick={closeMenu}>
              {first_dropdown_option}            	
            </MenuItem>
            {/*
            <MenuItem component={RouterLink} to="/account" onClick={closeMenu}>
              Account
            </MenuItem>
            */}
            <MenuItem onClick={handleLogoutClick}>
              Logout            	
            </MenuItem>
            
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
