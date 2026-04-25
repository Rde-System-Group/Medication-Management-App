import {
  AppBar,
  Button,
  Link,
  Stack,
  Toolbar,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link as RouterLink } from 'react-router-dom';

export default function NavHeader({ doctor, onLogout }) { 
  const formattedName = doctor ? `${doctor.FIRST_NAME || doctor.first_name || ''} ${doctor.LAST_NAME || doctor.last_name || ''}`.trim().toUpperCase() : 'DOCTOR';

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
          <Link href="/account" underline="none" variant="body1">
            Account
          </Link>
          {/* The new navigation link is injected here */}
          <Link component={RouterLink} to="/appointments" underline="none" variant="body1">
            Appointments
          </Link>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <AccountCircleIcon />
          <Stack direction="column" spacing={0} sx={{ lineHeight: 1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{formattedName}</span>
          </Stack>
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
