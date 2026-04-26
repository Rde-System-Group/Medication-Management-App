function createGraphData(patients){
    // expect patients to exist
    let newGraphData = {
        Sex: [],
        Age: [],
        Race: []
    }

    // GENDER
    let sexCats = [...new Set(patients.map(x => x.sex))]
    for (let i of sexCats){
        let count = patients.filter(x => x.sex == i).length
        newGraphData.Sex.push({value: count, label: i})
    }
    //AGE
    let ageCats = {
        "Children": [0, 17],
        "Young Adults": [18,44],
        "Middle-aged Adults": [45,64],
        "Youngest-old": [65,74],
        "Middle-old": [75,84],
        "Oldest-old": [85,150],
    }
    function getAgeCatCount(key, dob){
        let age = new Date().getFullYear() - new Date(dob).getFullYear()
        if (ageCats[key][0] <= age && ageCats[key][1] >= age){
            return true
        } else {return false}
    }
    for (let i in ageCats){
        let count = patients.filter(x => getAgeCatCount(i,x.date_of_birth)).length
        newGraphData.Age.push({value: count, label: i})
    }
    // RACE
    let raceCats = [...new Set(patients.map(x => x.race).filter(x => x !== null && x !== undefined))]
    for (let i of raceCats){
        let count = patients.filter(x => x.race == i).length
        newGraphData.Race.push({value: count, label: i})
    }
    return newGraphData
}

import { useEffect, useState } from 'react'
import { Card, Typography, Button, IconButton, Link, Tabs, Tab, TabPanel, TabList, Select, Autocomplete, FormControl, FormLabel, Option, Table, Sheet, Box } from "@mui/joy"
import { PieChart } from '@mui/x-charts/PieChart';
import SearchIcon from '@mui/icons-material/Search';
import {apiFetch} from "../lib/calls"
import Account from "../pages/Account"
import {Appointment, Reminder, QuickActions} from "../components/HomeCards"



export default function DHome({user, list}) {
    const [patients, setPatients] = useState([])
    const [graphData, setGraphData] = useState(
        createGraphData(patients) || {
            Gender: [],
            Age: [],
            Race: []
        }
    );
    const [graphOptions, setGraphOptions] = useState(graphData ? Object.keys(graphData) : []);
    const [selectedGraph, setSelectedGraph] = useState(graphOptions[0]);
    const [appointments, setAppointments] = useState([])
    useEffect(()=>{
        // Check for User Role, then fetch depending on needs
        async function getData(){
            const urf = await apiFetch("/api/rest/auth/getUserRole");
            const urd = await urf.json()
            if (urd.valid && ["Doctor","Patient"].includes(urd.role)){
                if (urd.role == "Doctor"){
                    console.log("DOCTOR mode")
                    // FETCH patients, appointments
                    const doctorID = user.roleData.ID;
                    const pf = await apiFetch(`/api/rest/doctor/${doctorID}/patients`)
                    // **UPDATE THIS LIST
                    const pd = await pf.json();
                    console.log("81 ::",pd)
                    if (pd && pd.success){
                        setPatients(pd.patients)
                        setGraphData(createGraphData(pd.patients))
                    } else {
                        console.log("ERR in retrieving patients!")
                    }
                } else if (urd.role == "Patient"){
                    console.log("PATIENT mode")
                    // FETCH appointments, reminders
                }
            } else {
                console.log("ERROR in LOGIN AUTHENTICATION (stale cookie?)",urd)
                // window.location.href = "/login"
            }
        }
        getData()
    }, [user])

    const viewPatient = (p) => {
        const id = p.patient_id || p.PATIENT_ID || p.id || p.ID;
        if (id) {
            window.location.href = `/patient?id=${id}`
        } else {
            console.error("Could not find a valid ID for patient:", p);
        }
    }

    if (!user || user?.role !== "Doctor"){
        return (<div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 200px)"}}>
            <Card size="lg">
                <h1>Cannot View Page</h1>
                <p>You are not authorized to view this page.</p>
                <Link href="/login" >SIGN IN</Link>
                <Link href="/" >GO BACK</Link>
            </Card>
        </div>)
    }
    console.log(user)

    return (<>
        <title>Home | MMWA</title>
    <div className={"page"} id={"home"}>
<Tabs defaultValue={"Home"}>
    <TabList>
        <Tab value="Home">Home</Tab>
        <Tab value="Doctor">Doctor</Tab>
        <Tab value="Settings" >Settings</Tab>
    </TabList>
    <TabPanel value={"Home"}>
        <div className={"homepage-container"}>
            <Card className={"left"} variant={"plain"}>
                <Card>Welcome, {`${user.FIRST_NAME} ${user.LAST_NAME}`}!</Card>
                
                <Card className={"p-graph"}>
                    <label>
                        <Typography level={"title-md"}>Patient Overview</Typography>
                        <Select
                            value={selectedGraph}
                            onChange={(event, newValue) => {
                                setSelectedGraph(newValue);
                                console.log(graphData)
                            }}
                        >
                            {graphOptions.map((option) => (<Option
                                 key={option}
                                 value={option}
                            >{option}
                            </Option>))}
                        </Select>
                    </label>
                    <br />
                    <PieChart
                        series={[
                            {data: graphData[selectedGraph] || []}
                        ]}
                        height={400}
                    />
                </Card>
            </Card>
                <Card className={"right"} variant={"plain"}>
                    <Card>
                    <FormControl id="grouped-demo">
                        <FormLabel>
                            <Typography level={"title-md"}>Search for Patients</Typography>
                        </FormLabel>
                            <Autocomplete
                                startDecorator={<SearchIcon />}
                                options={Array.isArray(patients) ? patients.sort((a,b) => -b.first_name?.at(0).localeCompare(a.FIRST_NAME?.at(0))) : []}
                                groupBy={(option) => option.first_name.at(0)}
                                getOptionLabel={(option) => option.first_name + " " + option.last_name}
                                onChange={(event, newValue) => {
                                    window.location.href = `/patient?id=${newValue.patient_id}`
                                }}
                            />
                    </FormControl>
                    </Card>

                            <Card>
                                <div style={{display: "flex", justifyContent: "space-between"}}>
                                    <Typography level={"title-md"}>Upcoming Appointments</Typography>
                                    {/* FIXED: See All link now routes to the calendar */}
                                    <Link href="/appointments" style={{ cursor: 'pointer' }}>See All</Link>
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
                            <QuickActions mode="Doctor" patients={patients} />
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
        <Account user={user} list={list}/>
    </TabPanel>
</Tabs>
</div>
</>
  )
}
