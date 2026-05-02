import { Card, Link, Tabs, Tab, TabPanel, TabList } from "@mui/joy"
import PatientDashboard from "../pages/patient_dashboard"
import PatientSettings from "../pages/patient_settings"
import { useNavigate } from 'react-router-dom';

export default function PHome({user, list}) {
    const navigate = useNavigate();
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
    return (<>
        <title>Home | MMWA</title>
    <div className={"page"} id={"home"} style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
<Tabs defaultValue={"Home"}>
    <TabList>
        <Tab value="Home">Home</Tab>
        <Tab value="Settings" >Settings</Tab>
    </TabList>
    <TabPanel value={"Home"} >
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