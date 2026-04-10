import {
  AppBar,
  Button,
  ButtonGroup,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Toolbar,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getPatientInfo } from '../services/api';
import { useNavigate } from 'react-router-dom';


export default function NavHeader({patient, loading}) { 
  const tempPatient_ID = 1;

  const [tempPatient, setTempPatient] = useState(null);

  useEffect(() => 
  {
    if (patient) return;
    
    getPatientInfo(tempPatient_ID).then((data) => setTempPatient(data[0] || null)).catch(() => setTempPatient(null));
  }, [patient]); //rerun whenever patient variable changes

  const displayPatient = patient || tempPatient || {};
  const firstName = displayPatient.FIRST_NAME || 'first name ';
  const lastName = displayPatient.LAST_NAME || 'last name';
  const fullName = `${firstName} ${lastName}`.trim().toUpperCase() || 'PATIENT';

  const navigate = useNavigate();
  
  return (
    //FIGMA LIBRARY MUI USED TO CREATE UI COMPONENTS + Figma Anima Plugin
    <AppBar position="static" color="inherit" elevation={1} sx={{ borderBottom: '1px solid', borderColor: 'divider' }} >
      <Toolbar sx={{ minHeight: 88, px: { xs: 2, md: 4 } }}>
        
        { /*============================================================================= */}
        {/* Logo/Icon placeholder */}
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 3 }} />
        
        { /*============================================================================= */}
        {/* Navigation menu links */}
        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flexGrow: 1 }}>
          <Link component={RouterLink} to="/" underline="always" variant="body1"> Home </Link>
          <Link component={RouterLink} to="/doctor-search" underline="always" variant="body1"> Search &amp; Manage Doctors </Link>
          <Link component={RouterLink} to="/appointments" underline="always" variant="body1"> Appointments </Link>
        </Stack>
        
        { /*============================================================================= */}
        {/* Patient name + dropdown button */}
        <ButtonGroup variant="contained" sx={{ mr: 2, boxShadow: 2 }}>
          {loading ?         	
              ( <Skeleton variant="rounded" width={140} height={36} /> ) 
              :         	
              ( 
                <>
                  <Button sx={{ px: 2.25 }} onClick={() => navigate('/patient-settings')}>{fullName} </Button>
                  <Button sx={{ minWidth: 42, px: 1 }} onClick={() => navigate('/patient-settings')}>
                    <ArrowDropDownIcon />
                  </Button>
                </>
              )
          }
        </ButtonGroup>
        
        { /*============================================================================= */}
        {/* Profile icon button */}
        <IconButton sx={{ bgcolor: 'action.focus', '&:hover': { bgcolor: 'action.selected' } }}>
          <AccountCircleIcon sx={{ fontSize: 34, color: 'action.active' }} />
        </IconButton>          	
        

      </Toolbar>
    </AppBar>
  );
}
