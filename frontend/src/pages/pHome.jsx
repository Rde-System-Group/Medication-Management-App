import { useEffect, useState } from 'react'
import {Card, Typography, Button, IconButton, Link, Tabs, Tab, TabPanel, TabList} from "@mui/joy"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {apiFetch} from "../lib/calls"
import Account from "../pages/Account"


export default function PHome({user, list}) {
    const [appointments, setAppointments] = useState([])
    const [reminders, setReminders] = useState([])

    useEffect(()=>{
        // Check for User Role, then fetch depending on needs
        async function getData(){
            return
            /*
                urd.role :: using includes in case there are multiple assigned (Doctor can be Patient)
            */
            if (urd.valid && urd.role.includes("Patient")){
                setViewPage(urd.role)
                console.log("PATIENT mode")
                    // FETCH appointments, reminders
            } else {
                console.log("ERROR in LOGIN AUTHENTICATION (stale cookie?)",urd)
                // window.location.href = "/login"
            }
        }
        getData()
    },[])

    // IF UNAUTHORIZED
    if (!user || user?.role !== "Patient"){
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
        <Tab value="Patient">Patient</Tab>
        <Tab value="Settings" >Settings</Tab>
    </TabList>
    <TabPanel value={"Home"}>
        <div className={"homepage-container"}>
            <Card className={"left"} variant={"plain"}>
                <Card>Welcome, {`${user.FIRST_NAME} ${user.LAST_NAME}`}!</Card>
            </Card>
            <Card className={"right"} variant={"plain"}>
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
                                text={"Add Reminder"}
                                startDecorator={<AddAlertIcon />}
                            />
                            <QAButton
                                text={"Logout"}
                                startDecorator={<CodeIcon />}
                                clickHandler={async ()=>{
                                    await apiFetch("/api/auth/logout")
                                    window.location.reload();
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
    <TabPanel value={"Patient"} >
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