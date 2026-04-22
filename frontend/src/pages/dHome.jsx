function createGraphData(patients){
    let newGraphData = { Gender: [], Age: [], Race: [] }
    if (!patients || patients.length === 0) return newGraphData;

    let genderCats = [...new Set(patients.map(x => x.gender || x.GENDER || "Unknown"))]
    for (let i of genderCats){
        let count = patients.filter(x => (x.gender || x.GENDER || "Unknown") == i).length
        newGraphData.Gender.push({value: count, label: i})
    }
    
    let ageCats = {
        "Children": [0, 17], "Young Adults": [18,44], "Middle-aged Adults": [45,64],
        "Youngest-old": [65,74], "Middle-old": [75,84], "Oldest-old": [85,150],
    }
    function getAgeCatCount(key, dob){
        if (!dob) return false;
        let age = new Date().getFullYear() - new Date(dob).getFullYear()
        return ageCats[key][0] <= age && ageCats[key][1] >= age;
    }
    for (let i in ageCats){
        let count = patients.filter(x => getAgeCatCount(i, x.date_of_birth || x.DATE_OF_BIRTH)).length
        newGraphData.Age.push({value: count, label: i})
    }
    
    let raceCats = [...new Set(patients.map(x => x.ethnicity || x.ETHNICITY || "Not Specified"))]
    for (let i of raceCats){
        let count = patients.filter(x => (x.ethnicity || x.ETHNICITY || "Not Specified") == i).length
        newGraphData.Race.push({value: count, label: i})
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

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button, IconButton, Link, Tabs, Tab, TabPanel, TabList, Select, Autocomplete, FormControl, FormLabel, Option, Table, Sheet, Box } from "@mui/joy"
import { PieChart } from '@mui/x-charts/PieChart';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { apiFetch } from "../lib/calls"
import Account from "../pages/Account"
import { Reminder, QuickActions } from "../components/HomeCards" // Removed Appointment import

export default function DHome({user, list}) {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([])
    const [graphData, setGraphData] = useState({ Gender: [], Age: [], Race: [] });
    const [graphOptions, setGraphOptions] = useState(["Gender", "Age", "Race"]);
    const [selectedGraph, setSelectedGraph] = useState("Gender");
    const [appointments, setAppointments] = useState([])
    
    useEffect(()=>{
        async function getData(){
            const urf = await apiFetch("/api/rest/auth/getUserRole");
            const urd = await urf.json()
            if (urd.valid && ["Doctor","Patient"].includes(urd.role)){
                if (urd.role == "Doctor"){
                    const doctorId = user.doctor_id || user.DOCTOR_ID;
                    if (!doctorId) return;

                    const pf = await apiFetch(`/api/rest/doctor/${doctorId}/patients`);
                    const pd = await pf.json();
                    
                    if (pd?.success && pd?.patients){
                        setPatients(pd.patients);
                        setGraphData(createGraphData(pd.patients));
                    }

                    const af = await apiFetch(`/api/rest/doctor/${doctorId}/appointments`);
                    const ad = await af.json();
                    if (ad?.success && ad?.appointments) setAppointments(ad.appointments);
                }
            }
        }
        getData()
    }, [user])

    const viewPatient = (p) => {
        const id = p.patient_id || p.PATIENT_ID || p.id || p.ID;
        if (id) {
            navigate(`/patient?id=${id}`);
        } else {
            console.error("Could not find a valid ID for patient:", p);
        }
    }

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
                            <Card>Welcome, {`${user.FIRST_NAME || user.first_name} ${user.LAST_NAME || user.last_name}`}!</Card>
                            
                            <Card className={"p-graph"}>
                                <Typography level={"title-md"}>Patient Overview</Typography>
                                <Select value={selectedGraph} onChange={(e, v) => setSelectedGraph(v)}>
                                    {graphOptions.map((opt) => (<Option key={opt} value={opt}>{opt}</Option>))}
                                </Select>
                                <br />
                                <PieChart series={[{data: graphData[selectedGraph] || []}]} height={400} />
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
                                    {/* FIXED: See All link now routes to the calendar */}
                                    <Link onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>See All</Link>
                                </div>
                                <br />
                                {appointments.length > 0 ? (
                                    // FIXED: Renders the card inline with safe dates and active arrow routing
                                    <Card 
                                        variant="outlined" 
                                        sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'background.level1' } }} 
                                        onClick={() => viewPatient(appointments[0])}
                                    >
                                        <Box>
                                            <Typography level="title-md">
                                                {getSafeDateString(appointments[0].date || appointments[0].DATE)} | {appointments[0].scheduled_start || appointments[0].SCHEDULED_START}
                                            </Typography>
                                            <Typography level="body-sm">
                                                {appointments[0].patient_name || appointments[0].PATIENT_NAME}
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
                            <QuickActions mode="Doctor" />
                        </Card>
                    </div>
                </TabPanel>

                <TabPanel value={"Doctor"}>
                    <Sheet sx={{ height: '400px', overflow: 'auto', borderRadius: 'sm' }}>
                        <Table stickyHeader hoverRow>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>DOB</th>
                                    <th>Ethnicity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p) => {
                                    const rowKey = p.patient_id || p.PATIENT_ID || p.id || p.ID;
                                    return (
                                        <tr key={rowKey}>
                                            <td>{p.first_name || p.FIRST_NAME} {p.last_name || p.LAST_NAME}</td>
                                            <td>{p.gender || p.GENDER}</td>
                                            <td>{p.date_of_birth || p.DATE_OF_BIRTH}</td>
                                            <td>{p.ethnicity || p.ETHNICITY}</td>
                                            <td>
                                                <Button 
                                                    size="sm" 
                                                    variant="plain" 
                                                    onClick={() => viewPatient(p)}
                                                >
                                                    View Profile
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    </Sheet>
                </TabPanel>

                <TabPanel value={"Settings"}>
                    <Account user={user} />
                </TabPanel>
            </Tabs>
        </div>
    )
}