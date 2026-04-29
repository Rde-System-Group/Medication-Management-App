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
    const firstName = user?.FIRST_NAME || user?.first_name || user?.user?.FIRST_NAME || user?.user?.first_name || user?.roleData?.FIRST_NAME || user?.roleData?.first_name || 'Patient';
    const lastName = user?.LAST_NAME || user?.last_name || user?.user?.LAST_NAME || user?.user?.last_name || user?.roleData?.LAST_NAME || user?.roleData?.last_name || '';
    const PATIENT_ID = user?.patient_id ?? user?.PATIENT_ID ?? 0

    function makeArray(data){
        if (Array.isArray(data)) return data
        if (data && typeof data === "object") return [data]
        return []
    }

    function parseDateOnly(rawDate){
        if (!rawDate) return null
        const value = String(rawDate).trim().split("T")[0]
        const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (isoMatch) {
            return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
        }
        const usMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
        if (usMatch) {
            return new Date(Number(usMatch[3]), Number(usMatch[1]) - 1, Number(usMatch[2]))
        }
        const parsed = new Date(value)
        return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    function appointmentMillis(ap){
        const rawDate = ap?.date || ap?.DATE || ""
        const rawTime = ap?.scheduled_start || ap?.SCHEDULED_START || "00:00"
        const timeMatch = String(rawTime).match(/(\d{1,2}):(\d{2})/)
        const hours = timeMatch ? Number(timeMatch[1]) : 0
        const minutes = timeMatch ? Number(timeMatch[2]) : 0
        const parsedDate = parseDateOnly(rawDate)
        if (!parsedDate) return Number.POSITIVE_INFINITY
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
                    .filter((appointment) => (appointment.status || appointment.STATUS || "").toLowerCase() !== "cancelled")
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
                <Card>Welcome, {`${firstName} ${lastName}`.trim()}!</Card>
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