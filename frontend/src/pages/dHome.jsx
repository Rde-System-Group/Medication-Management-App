function createGraphData(patients){
    let newGraphData = { Gender: [], Age: [], Race: [] }
    if (!patients || patients.length === 0) return newGraphData;

    let genderCats = [...new Set(patients.map(x => x.gender || x.GENDER || "Unknown"))]
    for (let i of genderCats){
        let count = patients.filter(x => (x.gender || x.GENDER || "Unknown") == i).length
        if (count > 0) newGraphData.Gender.push({value: count, label: i})
    }

    let ageCats = {
        "Children": [0, 17], "Young Adults": [18,44], "Middle-aged Adults": [45,64],
        "Youngest-old": [65,74], "Middle-old": [75,84], "Oldest-old": [85,150],
    }
    // Compute exact age (in completed years) so a patient who hasn't reached
    // their birthday this year is correctly counted as one year younger.
    function ageInYears(dob){
        if (!dob) return null;
        const birth = new Date(dob);
        if (Number.isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }
    for (let i in ageCats){
        let count = patients.filter(x => {
            const age = ageInYears(x.date_of_birth || x.DATE_OF_BIRTH);
            return age !== null && age >= ageCats[i][0] && age <= ageCats[i][1];
        }).length
        newGraphData.Age.push({value: count, label: i})
    }
    
    // Race may come as a comma-separated string (one or more values from patient_race),
    // an array, or be missing entirely. Each individual race a patient has counts toward
    // its own bucket so a multiracial patient contributes to every applicable slice.
    const extractRaces = (p) => {
        const raw = p.races ?? p.RACES ?? p.race ?? p.RACE;
        if (Array.isArray(raw)) {
            const cleaned = raw.map(s => String(s).trim()).filter(Boolean);
            return cleaned.length ? cleaned : ["Not Specified"];
        }
        if (typeof raw === "string" && raw.trim()) {
            return raw.split(",").map(s => s.trim()).filter(Boolean);
        }
        return ["Not Specified"];
    };

    const raceCounts = {};
    for (const p of patients) {
        for (const race of extractRaces(p)) {
            raceCounts[race] = (raceCounts[race] || 0) + 1;
        }
    }
    for (const [label, value] of Object.entries(raceCounts)) {
        newGraphData.Race.push({ value, label });
    }
    return newGraphData
}

// SAFE DATE PARSER: Prevents JavaScript from shifting the timezone
const getSafeDateString = (rawDate) => {
    if (!rawDate) return '';
    const cleanStr = rawDate.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts[0].length === 4) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return cleanStr; 
};

import { useEffect, useState, useMemo } from 'react'
import { Card, Typography, IconButton, Link, Tabs, Tab, TabPanel, TabList, Select, Autocomplete, FormControl, FormLabel, Option, Box } from "@mui/joy"
import { PieChart } from '@mui/x-charts/PieChart';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { apiFetch, cfmUrl } from "../lib/calls"
import Account from "../pages/Account"
import { Reminder, QuickActions } from "../components/HomeCards" // Removed Appointment import
import PatientListView from "../components/PatientListView"
import { getAuthRole } from '../services/api';
import { useNavigate } from 'react-router-dom';
const CHART_COLORS = ['#4355ff', '#ffb323', '#14b8a6', '#ef4444', '#8b5cf6', '#f97316', '#22c55e'];

async function readJsonResponse(response, label) {
    const raw = await response.text();
    try {
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error(`${label} returned non-JSON`, { status: response.status, body: raw.slice(0, 300) });
        return null;
    }
}

export default function DHome({user, list}) {
    const [patients, setPatients] = useState([])
    const [graphData, setGraphData] = useState({ Gender: [], Age: [], Race: [] });
    const [graphOptions, setGraphOptions] = useState(["Gender", "Age", "Race"]);
    const [selectedGraph, setSelectedGraph] = useState("Gender");
    const [appointments, setAppointments] = useState([])
    const firstName = user?.FIRST_NAME || user?.first_name || user?.user?.FIRST_NAME || user?.user?.first_name || user?.roleData?.FIRST_NAME || user?.roleData?.first_name || 'Doctor';
    const lastName = user?.LAST_NAME || user?.last_name || user?.user?.LAST_NAME || user?.user?.last_name || user?.roleData?.LAST_NAME || user?.roleData?.last_name || '';
    const navigate = useNavigate();
    
      useEffect(()=>{
        async function getData(){
            if (user && user.role === "Doctor"){
                    const doctorId = user?.roleData?.ID;
                    if (!doctorId) return;

                    const pf = await apiFetch(`${cfmUrl}/patients.cfm?doctorId=${encodeURIComponent(doctorId)}`);
                    const pd = await readJsonResponse(pf, 'Patient search');
                    
                    if (pd?.success && pd?.patients){
                        setPatients(pd.patients);
                        setGraphData(createGraphData(pd.patients));
                    }

                    const af = await apiFetch(`${cfmUrl}/appointments.cfm?doctorId=${encodeURIComponent(doctorId)}`);
                    const ad = await readJsonResponse(af, 'Doctor appointments');
                    if (ad?.success && ad?.appointments) setAppointments(ad.appointments);
            }
        }
        getData()
    }, [])

    const viewPatient = (p) => {
        const id = p.patient_id || p.PATIENT_ID || p.id || p.ID;
        if (id) {
            navigate(`/patient?id=${id}`)
        } else {
            console.error("Could not find a valid ID for patient:", p);
        }
    }

    // Only show future, non-cancelled appointments in the home widget,
    // sorted so the very next appointment is first.
    const upcomingAppointments = useMemo(() => {
        const now = Date.now();
        const apptStartMillis = (a) => {
            const dateStr = a?.date || a?.DATE;
            if (!dateStr) return NaN;
            const rawTime = a?.scheduled_end || a?.SCHEDULED_END || a?.scheduled_start || a?.SCHEDULED_START || '23:59';
            const m = String(rawTime).match(/^(\d{1,2}):(\d{2})/);
            const hh = m ? m[1].padStart(2, '0') : '23';
            const mm = m ? m[2] : '59';
            return new Date(`${String(dateStr).slice(0, 10)}T${hh}:${mm}:00`).getTime();
        };
        return appointments
            .filter((a) => (a.status || '').toLowerCase() !== 'cancelled')
            .filter((a) => {
                const t = apptStartMillis(a);
                return Number.isFinite(t) && t >= now;
            })
            .sort((a, b) => apptStartMillis(a) - apptStartMillis(b));
    }, [appointments]);

    const selectedChartData = useMemo(() => (
        (graphData[selectedGraph] || []).map((item, index) => ({
            ...item,
            color: item.color || CHART_COLORS[index % CHART_COLORS.length],
        }))
    ), [graphData, selectedGraph]);

    const selectedPieData = useMemo(
        () => selectedChartData.filter((item) => Number(item.value) > 0),
        [selectedChartData]
    );

    if (!user || user?.role !== "Doctor"){
        return (
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 200px)"}}>
                <Card size="lg">
                    <h1>Cannot View Page</h1>
                    <p>You are not authorized to view this page.</p>
                    <Link href="/login" >SIGN IN</Link>
                </Card>
            </div>
        )
    }
    
    return (
        <div className={"page"} id={"home"}>
            <title>Home | MMWA</title>
            <Tabs defaultValue={"Home"}>
                <TabList>
                    <Tab value="Home">Home</Tab>
                    <Tab value="Doctor">My Patients</Tab>
                    <Tab value="Settings" >Settings</Tab>
                </TabList>
                
                <TabPanel value={"Home"}>
                    <div className={"homepage-container"}>
                        <Card className={"left"} variant={"plain"}>
                            <Card>Welcome, {`${firstName} ${lastName}`.trim()}!</Card>
                            
                            <Card className={"p-graph"}>
                                <Typography level={"title-md"}>Patient Overview</Typography>
                                <Select value={selectedGraph} onChange={(e, v) => setSelectedGraph(v)}>
                                    {graphOptions.map((opt) => (<Option key={opt} value={opt}>{opt}</Option>))}
                                </Select>
                                <br />
                                <Box sx={{ width: '100%', minHeight: { xs: 430, sm: 430 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', height: 280, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <PieChart
                                            series={[{
                                                data: selectedPieData,
                                                innerRadius: 0,
                                                outerRadius: 110,
                                                cx: '50%',
                                                cy: '50%',
                                            }]}
                                            height={280}
                                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                            hideLegend
                                        />
                                    </Box>
                                    <Box sx={{ minHeight: 110, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', justifyContent: 'center', gap: 1.5, width: '100%', px: 1, pt: 1 }}>
                                        {selectedChartData.map((item) => (
                                            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, maxWidth: '100%' }}>
                                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                                                <Typography level="body-sm" sx={{ lineHeight: 1.2, overflowWrap: 'anywhere' }}>
                                                    {item.label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Card>
                        </Card>

                        <Card className={"right"} variant={"plain"}>
                            <Card>
                                <FormControl>
                                    <FormLabel><Typography level={"title-md"}>Search for Patients</Typography></FormLabel>
                                    <Autocomplete
                                        startDecorator={<SearchIcon />}
                                        options={patients}
                                        getOptionLabel={(option) => `${option.first_name || option.FIRST_NAME} ${option.last_name || option.LAST_NAME}`}
                                        groupBy={(option) => {
                                            const name = option.first_name || option.FIRST_NAME;
                                            return name ? name.at(0).toUpperCase() : "?";
                                        }}
                                        onChange={(event, newValue) => {
                                            if(newValue) viewPatient(newValue);
                                        }}
                                    />
                                </FormControl>
                            </Card>

                            <Card>
                                <div style={{display: "flex", justifyContent: "space-between"}}>
                                    <Typography level={"title-md"}>Upcoming Appointments</Typography>
                                    <Link onClick={() => window.location.href = '/appointments'} style={{ cursor: 'pointer' }}>See All</Link>
                                </div>
                                <br />
                                {upcomingAppointments.length > 0 ? (
                                    <Card 
                                        variant="outlined" 
                                        sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'background.level1' } }} 
                                        onClick={() => viewPatient(upcomingAppointments[0])}
                                    >
                                        <Box>
                                            <Typography level="title-md">
                                                {getSafeDateString(upcomingAppointments[0].date || upcomingAppointments[0].DATE)} | {upcomingAppointments[0].scheduled_start || upcomingAppointments[0].SCHEDULED_START}
                                            </Typography>
                                            <Typography level="body-sm">
                                                {upcomingAppointments[0].patient_name || upcomingAppointments[0].PATIENT_NAME}
                                            </Typography>
                                        </Box>
                                        <IconButton variant="plain" size="sm">
                                            <KeyboardArrowRightIcon />
                                        </IconButton>
                                    </Card>
                                ) : (
                                    <Typography level="body-sm">No upcoming appointments</Typography>
                                )}
                            </Card>
                            <QuickActions mode="Doctor" patients={patients} />
                        </Card>
                    </div>
                </TabPanel>

                <TabPanel value={"Doctor"}>
                    <PatientListView user={user} title="My Patients" />
                </TabPanel>

                <TabPanel value={"Settings"}>
                    <Account user={user} />
                </TabPanel>
            </Tabs>
        </div>
    )
}
