import { useEffect, useState } from 'react'
import {Card, Typography, Button, IconButton, Link, Tabs, Tab, TabPanel, TabList} from "@mui/joy"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {apiFetch} from "../lib/calls"
import { getAppointments, getReminders } from '../services/api';
import Account from "../pages/Account"
import PatientDashboard from "../pages/patient_dashboard"
import PatientSettings from "../pages/patient_settings"
import {Appointment, Reminder} from "../components/HomeCards"


export default function PHome({user, list}) {
    const [appointments, setAppointments] = useState([])
    const [reminders, setReminders] = useState([])
    const PATIENT_ID = user?.patient_id ?? user?.PATIENT_ID ?? 0

    function makeArray(data){
        if (Array.isArray(data)) return data
        if (data && typeof data === "object") return [data]
        return []
    }

    function appointmentMillis(ap){
        const rawDate = ap?.date || ap?.DATE || ""
        const rawTime = ap?.scheduled_start || ap?.SCHEDULED_START || "00:00"
        const timeMatch = String(rawTime).match(/(\d{1,2}):(\d{2})/)
        const hours = timeMatch ? Number(timeMatch[1]) : 0
        const minutes = timeMatch ? Number(timeMatch[2]) : 0
        const parsedDate = new Date(rawDate)
        if (Number.isNaN(parsedDate.getTime())) return Number.POSITIVE_INFINITY
        return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), hours, minutes).getTime()
    }

    useEffect(()=>{
        async function getData(){
            try {
                const [appointmentData, reminderData] = await Promise.all([
                    getAppointments(PATIENT_ID),
                    getReminders(PATIENT_ID),
                ])

                const upcomingAppointments = makeArray(appointmentData)
                    .filter((appointment) => appointmentMillis(appointment) >= Date.now())
                    .sort((a, b) => appointmentMillis(a) - appointmentMillis(b))

                setAppointments(upcomingAppointments)
                setReminders(makeArray(reminderData))
            } catch (e) {
                console.log("Error loading pHome data", e)
                setAppointments([])
                setReminders([])
            }
        }
        getData()
    },[PATIENT_ID])

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
    <div className={"page"} id={"home"} style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
<Tabs defaultValue={"Home"}>
    <TabList>
        <Tab value="Home">Home</Tab>
        <Tab value="Patient">Patient</Tab>
        <Tab value="Settings" >Settings</Tab>
    </TabList>
    <TabPanel value={"Home"}>
        <div className={"homepage-container"}>
            <Card className={"left"} variant={"plain"}>
                <Card>Welcome, {`${user?.roleData?.first_name} ${user?.roleData?.last_name}`}!</Card>
                <Card >
                    <label>
                        <Typography level={"title-md"}>Quick Actions</Typography>
                        <br />
                        <div className={"p-button-group"} style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
                            <QAButton
                                text={"Add Reminder"}
                                startDecorator={<AddAlertIcon />}
                                href="/create-reminder-form"
                            />
                            <QAButton
                                text={"Patient Settings"}
                                startDecorator={<CodeIcon />}
                                href="/patient-settings"
                            />
                            <QAButton
                                text={"Logout"}
                                startDecorator={<CodeIcon />}
                                clickHandler={async ()=>{
                                    await apiFetch("/api/rest/auth/logout")
                                    window.location.reload();
                                }}
                            />
                        </div>
                    </label>
                </Card>
            </Card>
            <Card className={"right"} variant={"plain"}>
                <Card >
                    <label>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <Typography level={"title-md"}>Upcoming Appointments</Typography>
                            <Link href={"/appointments"}>See All</Link>
                        </div>
                        <br />
                        <Appointment appointment={appointments[0]} />
                    </label>
                </Card>

                <Card >
                    <label>
                        <div style={{display: "flex", justifyContent: "space-between"}}>
                            <Typography level={"title-md"}>Upcoming Reminders</Typography>
                            <Link href={"/appointments"}>See All</Link>
                        </div>
                        <br />
                        <Reminder reminder={reminders[0]} />
                    </label>
                </Card>
            </Card>
        </div>
    </TabPanel>
    <TabPanel value={"Patient"} >
        <PatientDashboard user={user} />
    </TabPanel>
    <TabPanel value={"Settings"}>
        <PatientSettings user={user} />
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