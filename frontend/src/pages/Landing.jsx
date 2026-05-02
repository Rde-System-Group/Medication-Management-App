import { Box, Button, Card, Chip, Dropdown, Menu, MenuButton, MenuItem, Stack, Typography } from '@mui/joy';
import { Link as RouterLink } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicationIcon from '@mui/icons-material/Medication';
import SecurityIcon from '@mui/icons-material/Security';
import rdeLogo from '../assets/rde-logo.png';

export default function Landing() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', overflowX: 'hidden' }}>
      <Box
        component="header"
        sx={{
          px: { xs: 2, sm: 4, md: 8 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          bgcolor: 'background.surface',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box component="img" src={rdeLogo} alt="RDE logo" sx={{ width: 64, height: 44, objectFit: 'contain' }} />
          <Typography level="title-lg" sx={{ fontWeight: 800 }}>MMWA</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          <Dropdown>
            <MenuButton
              slots={{ root: Button }}
              slotProps={{
                root: {
                  variant: 'outlined',
                  endDecorator: <KeyboardArrowDownIcon />,
                },
              }}
              sx={{ minWidth: 112, whiteSpace: 'nowrap' }}
            >
              Sign In
            </MenuButton>
            <Menu placement="bottom-end" sx={{ minWidth: 180 }}>
              <MenuItem component={RouterLink} to="/login?role=doctor">Sign in as Doctor</MenuItem>
              <MenuItem component={RouterLink} to="/login?role=patient">Sign in as Patient</MenuItem>
            </Menu>
          </Dropdown>
          <Button component={RouterLink} to="/signup?type=patient" sx={{ minWidth: 112, whiteSpace: 'nowrap' }}>Register</Button>
        </Stack>
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 4, md: 8 },
          py: { xs: 4, md: 8 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
          gap: { xs: 3, md: 6 },
          alignItems: 'center',
          maxWidth: 1180,
          mx: 'auto',
        }}
      >
        <Stack spacing={3}>
          <Chip color="primary" variant="soft" sx={{ alignSelf: 'flex-start' }}>Secure Healthcare Platform</Chip>
          <Stack spacing={1.5}>
            <Typography level="h1" sx={{ fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' }, lineHeight: 1.05 }}>
              Smarter healthcare management, simplified.
            </Typography>
            <Typography level="body-lg" sx={{ color: 'text.secondary', maxWidth: 620 }}>
              Seamlessly bridge the gap between providers and patients. MMWA provides a secure, unified platform to track prescriptions, coordinate appointments, and monitor treatment adherence.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to="/login?role=doctor" size="lg" startDecorator={<LocalHospitalIcon />}>
              Login as Doctor
            </Button>
            <Button component={RouterLink} to="/login?role=patient" size="lg" variant="outlined">
              Login as Patient
            </Button>
            <Button component={RouterLink} to="/signup?type=patient" size="lg" color="success" variant="soft">
              Sign Up
            </Button>
          </Stack>
        </Stack>

        <Card
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: '24px',
            boxShadow: 'lg',
            bgcolor: 'background.surface',
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Box component="img" src={rdeLogo} alt="RDE logo" sx={{ width: { xs: 180, sm: 240 }, maxWidth: '100%', objectFit: 'contain' }} />
            <Stack spacing={2} sx={{ width: '100%' }}>
              {[
                ['Comprehensive Patient Profiles', 'Access complete medical histories, active prescriptions, and upcoming appointments in one unified view.', <LocalHospitalIcon />],
                ['Intelligent Medication Tracking', 'Easily issue new prescriptions and automate patient medication reminders to improve health outcomes.', <MedicationIcon />],
                ['Role-Based Security', 'Enterprise-grade data isolation ensures strict privacy boundaries between patient portals and provider dashboards.', <SecurityIcon />],
              ].map(([title, text, icon]) => (
                <Card key={title} variant="soft" sx={{ textAlign: 'left' }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: 'primary.600', pt: 0.25 }}>{icon}</Box>
                    <Box>
                      <Typography level="title-md">{title}</Typography>
                      <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{text}</Typography>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
