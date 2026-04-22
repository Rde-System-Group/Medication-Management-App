import {
  AppBar,
  Button,
  IconButton,
  Link,
  Stack,
  Toolbar,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
//import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function NavHeader({ doctor, onLogout }) { 
 // const navigate = useNavigate();
  const displayName = doctor ? `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim().toUpperCase() : 'DOCTOR';

  /*
  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };
  */

  const handleLogout = () => {
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
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <AccountCircleIcon />
          <Stack direction="column" spacing={0} sx={{ lineHeight: 1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{displayName}</span>
          </Stack>
          <Button 
            variant="text" 
            size="small" 
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}