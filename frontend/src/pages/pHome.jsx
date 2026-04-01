import { useEffect, useState } from 'react'
import {Card, Select, Option, Typography, Input, Button, IconButton, Link, Autocomplete, FormControl, FormLabel} from "@mui/joy"
import { PieChart } from '@mui/x-charts/PieChart';
import SearchIcon from '@mui/icons-material/Search';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import {TextField} from "@mui/material";

function createGraphData(setGraphData, patients){
    // expect patients to exist
    console.log(patients)
    let newGraphData = {
        Gender: [],
        Age: []
    }

    
    let genderCats = [...new Set(patients.map(x => x.GENDER))]
    for (let i of genderCats){
        let count = patients.filter(x => x.GENDER == i).length
        newGraphData.Gender.push({value: count, label: i})
    }
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
    console.log("45 :: ",newGraphData)
    setGraphData(newGraphData)
}

export default function PHome() {
    const [graphData, setGraphData] = useState(
        {
            Gender: [
                {value: 10, label: "Male"},
                {value: 15, label: "Female"},
                {value: 20, label: "Other"}
            ],
            Age: [
                {value: 7, label: "0-12"},
                {value: 12, label: "13-17"},
                {value: 30, label: "18-29"},
                {value: 43, label: "30-59"},
                {value: 10, label: "60-79"}
            ]
        }
    );
    const [graphOptions, setGraphOptions] = useState(graphData ? Object.keys(graphData) : []);
    const [selectedGraph, setSelectedGraph] = useState(graphOptions[0]);
    const [viewPage, setViewPage] = useState("patient");
    const [patients, setPatients] = useState([])
    const [user, setUser] = useState({
        fname: "John", lname: "Doe",
    })

    useEffect(()=>{
        const getData = async ()=>{
            const res = await fetch("/api/patients.cfc?method=get");
            const data = await res.json();
            console.log(data)
            setPatients(data);
            createGraphData(setGraphData,data)
        }
        getData()
    },[])

    return (
    <div className={"page"} id={"home"}>
        <div className={"homepage-container"}>
            <Card className={"left"} variant={"plain"}>
                <Card>Welcome, {`${user.fname} ${user.lname}`}!</Card>
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
                                    {new Date().toLocaleDateString() + " | " + new Date().toLocaleTimeString()}
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
                                text={"Add Reminder"}
                                startDecorator={<AddAlertIcon />}
                            />
                            <QAButton
                                text={"Add Medication"}
                                startDecorator={<MedicationIcon />}
                            />
                        </div>
                    </label>
                </Card>
            </Card>
        </div>
    </div>
  )
}

function QAButton({text="click me!", startDecorator, endDecorator, clickHandler, color="primary"}){
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