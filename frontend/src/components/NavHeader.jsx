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
  const first_dropdown_option = isPatient ? 'Patient Settings' : 'Account';
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
              {/*
              <Link href="/account" underline="none" variant="body1">
                Account
              </Link>
              */}
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
          <ButtonGroup size="medium" variant="contained" sx={{ boxShadow: 2 }}>
            <Button component={RouterLink} to={profilePath} sx={{ px: 2.25 }}>
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
            <MenuItem component={RouterLink} to="/account" onClick={closeMenu}>
              Account
            </MenuItem>
            <MenuItem onClick={handleLogoutClick}>
              Logout            	
            </MenuItem>
            
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
