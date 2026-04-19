function createGraphData(patients){
    // expect patients to exist
    let newGraphData = {
        Gender: [],
        Age: [],
        Race: []
    }

    // GENDER
    let genderCats = [...new Set(patients.map(x => x.GENDER))]
    for (let i of genderCats){
        let count = patients.filter(x => x.GENDER == i).length
        newGraphData.Gender.push({value: count, label: i})
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
        let count = patients.filter(x => getAgeCatCount(i,x.DATE_OF_BIRTH)).length
        newGraphData.Age.push({value: count, label: i})
    }
    // RACE
    let raceCats = [...new Set(patients.map(x => x.RACE).filter(x => x !== null))]
    for (let i of raceCats){
        let count = patients.filter(x => x.RACE == i).length
        newGraphData.Race.push({value: count, label: i})
    }
    return newGraphData
}

import { useEffect, useState } from 'react'
import {Card, Typography, Button, IconButton, Link, Tabs, Tab, TabPanel, TabList, Select, Autocomplete, FormControl, FormLabel, Option} from "@mui/joy"
import { PieChart } from '@mui/x-charts/PieChart';
import SearchIcon from '@mui/icons-material/Search';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {apiFetch} from "../lib/calls"
import Account from "../pages/Account"



export default function DHome({user, list}) {
    const [patients, setPatients] = useState([])
    const [graphData, setGraphData] = useState(
        createGraphData(patients) || {
            Gender: [
                {value: 10, label: "Male"},
                {value: 15, label: "Female"},
                {value: 20, label: "Other"}
            ],
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
                    const pf = await apiFetch("/api/rest/base/patients")
                    const pd = await pf.json();
                    console.log("81 ::",pd)
                    if (pd?.data){
                        setPatients(pd.data)
                        setGraphData(createGraphData(pd.data))
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
    },[])
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
                                options={patients.sort((a,b) => -b.FIRST_NAME.at(0).localeCompare(a.FIRST_NAME.at(0)))}
                                groupBy={(option) => option.FIRST_NAME.at(0)}
                                getOptionLabel={(option) => option.FIRST_NAME + " " + option.LAST_NAME}
                                onChange={(event, newValue) => {
                                    console.log(newValue)
                                    /*
                                        router :: go to patient page?
                                    */
                                }}
                            />
                    </FormControl>
                    </Card>

                <Card >
                    <label>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <Typography level={"title-md"}>Upcoming Appointments</Typography>
                            <Link href={"#"}>See All</Link>
                        </div>
                        <br />
                        <Card
                            orientation={"horizontal"}
                            style={{ justifyContent: "space-between", alignItems: "center" }}
                        >
                            <div>
                                <Typography level={"title-md"}>
                                    {new Date().toLocaleDateString()} | 10:00 AM
                                </Typography>
                                John Doe
                            </div>
                            <IconButton
                                style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
                                component={"a"}
                                size={"lg"}
                                href={"#"}
                            >
                                <ArrowRightIcon sx={{fontSize: "2rem"}}/>
                            </IconButton>
                        </Card>
                    </label>
                </Card>

                <Card >
                    <label>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <Typography level={"title-md"}>Upcoming Reminders</Typography>
                            <Link href={"#"}>See All</Link>
                        </div>
                        <br />
                        <Card
                            orientation={"horizontal"}
                            style={{ justifyContent: "space-between", alignItems: "center" }}
                        >
                            <div>
                                <Typography level={"title-md"}>
                                    Medication Name (XX mg)
                                </Typography>
                                Every 4 hours (in 2 hours)
                            </div>
                            <IconButton
                                style={{borderRadius: "5rem", width: "2rem", height: "2rem"}}
                                component={"a"}
                                size={"lg"}
                                href={"#"}
                            >
                                <ArrowRightIcon sx={{fontSize: "2rem"}}/>
                            </IconButton>
                        </Card>
                    </label>
                </Card>

                <Card >
                    <label>
                        <Typography level={"title-md"}>Quick Actions</Typography>
                        <br />
                        <div className={"p-button-group"} style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
                            <QAButton
                                text={"Add Appointment"}
                                startDecorator={<EventAvailableIcon />}
                            />
                            <QAButton
                                text={"Add Medication"}
                                startDecorator={<MedicationIcon />}
                            />
                            <QAButton
                                text={"Logout"}
                                startDecorator={<CodeIcon />}
                                clickHandler={()=>{
                                    console.log("LOG OUT!")
                                }}
                            />
                            <QAButton
                                text={"TEST Page"}
                                startDecorator={<CodeIcon />}
                                href="/test"
                            />
                            <QAButton
                                text={"ACCOUNT Page"}
                                startDecorator={<CodeIcon />}
                                href="/account"
                            />
                            <QAButton
                                text={"LOGIN Page"}
                                startDecorator={<CodeIcon />}
                                href="/login"
                            />
                        </div>
                    </label>
                </Card>
            </Card>
        </div>
    </TabPanel>
    <TabPanel value={"Doctor"} >
        <h2>[INSERT HERE]</h2>
    </TabPanel>
    <TabPanel value={"Settings"}>
        <Account user={user} />
    </TabPanel>
</Tabs>
</div>
</>
  )
}

function QAButton({text="click me!", href=null, startDecorator, endDecorator, clickHandler, color="primary"}){
    if (href){
    return (
        <Button
            component="a"
            href={href}
            color={color}
            startDecorator={startDecorator}
            endDecorator={endDecorator}
            variant={"outlined"}
        >{text}</Button>
    )}
    return (
        <Button
            onClick={clickHandler}
            color={color}
            startDecorator={startDecorator}
            endDecorator={endDecorator}
            variant={"outlined"}
        >{text}</Button>
    )
}