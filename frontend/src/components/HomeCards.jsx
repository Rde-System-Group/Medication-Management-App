import {Card, Typography, IconButton,Button} from "@mui/joy"
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import MedicationIcon from '@mui/icons-material/Medication';
import CodeIcon from '@mui/icons-material/Code';
import {apiFetch} from "../lib/calls"

export function Appointment({id}){
return (
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
)
}

export function Reminder({id}){
return (
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

export function QuickActions({mode="Patient"}){
return (
<Card >
    <Typography level={"title-md"}>Quick Actions</Typography>
    <br />
    <div className={"p-button-group"} style={{display: "flex", gap: "1rem", flexWrap: "wrap"}}>
        {mode === "Patient" && <>
        
        </>}
        {mode === "Doctor" && <>
            <QAButton
                text={"Add Appointment"}
                startDecorator={<EventAvailableIcon />}
            />
            <QAButton
                text={"Add Medication"}
                startDecorator={<MedicationIcon />}
            />
        </>}
        <QAButton
            text={"Logout"}
            startDecorator={<CodeIcon />}
            clickHandler={async ()=>{
                await apiFetch("/api/rest/auth/logout")
                window.location.reload();
            }}
        />
        <QAButton
            text={"TEST Page"}
            startDecorator={<CodeIcon />}
            href="/test"
        />
    </div>
</Card>
)
}