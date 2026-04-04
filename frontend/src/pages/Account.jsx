import { useState } from 'react'
import {
    Card,
    Select,
    Option,
    Typography,
    Input,
    Button,
    IconButton,
    Link,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Checkbox
} from "@mui/joy"

function AccountInput({setInfo, info, keyName, type="text", title="Label"}){
    return (
    <label>
        <Typography level={"title-md"}>{title}</Typography>
        <Input
            value={info[keyName]}
            onChange={(event) => {setInfo({...info, [keyName]: event.target.value})}}
            type={type}
            endDecorator={<Button
                onClick={()=>{
                    console.log(`:: REQUEST CHANGE [${keyName}] TO [${info[keyName]}]`)
                }}
            >Change</Button>}
        />
    </label>
    )
}
function AccountSelect({setInfo, info, keyName, title="Label", options=[]}){
    return (
    <label>
        <Typography level={"title-md"}>{title}</Typography>
        <Select
            value={info[keyName]}
            onChange={(event, newValue) => {
                setInfo({...info, [keyName]: newValue})
                console.log(`:: REQUEST CHANGE [${keyName}] TO [${newValue}]`)
            }}
        >
            {options.map((option) => (<Option key={keyName + "-" + option} value={option}>{option}</Option>))}
        </Select>
    </label>
    )
}

export default function Account() {
    const [info, setInfo] = useState(
        {
            fname: "John", lname: "Doe",
            password: "password", newPassword: "password",
            email: "plp", newEmail: "plp",
            phone: "123", newPhone: "123",
            sex: "", gender: "", ethnicity: false, race: "",
        }
    );
    const [viewPage, setViewPage] = useState("patient");

    return (<>
        <title>Account | MMWA</title>
        <div className={"page"} id={"account"}>
            <Tabs aria-label={"Basic_tabs"} defaultValue={0}>
                <TabList>
                    <Tab>User Settings</Tab>
                    <Tab>Patient</Tab>
                </TabList>
                <TabPanel value={0}>
                    <Card>
                        <Typography level={"title-lg"}>Update Personal Info</Typography>
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"fname"}
                            title={"First Name"}
                        />
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"lname"}
                            title={"Last Name"}
                        />
                    </Card>
                    <br />
                    <Card>
                        <Typography level={"title-lg"}>Update Password</Typography>
                        <label>
                            <Typography level={"title-md"}>Old Password</Typography>
                            <Input
                                value={info.password}
                                onChange={(event) => {setInfo({...info, password: event.target.value})}}
                                type={"password"}
                            />
                        </label>
                        <label>
                            <Typography level={"title-md"}>New Password</Typography>
                            <Input
                                value={info.newPassword}
                                onChange={(event) => {setInfo({...info, newPassword: event.target.value})}}
                                type={"password"}
                            />
                        </label>
                        <Button
                            onClick={()=>{
                                console.log(":: REQUEST CHANGE PASSWORD")
                            }}
                        >Change</Button>
                    </Card>
                    <br />
                    <Card>
                        <Typography level={"title-lg"}>Update Contact Info</Typography>
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"email"}
                            title={"Email"}
                        />
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"phone"}
                            title={"Phone Number"}
                        />
                    </Card>
                </TabPanel>
                <TabPanel value={1}>
                    <Card>
                        <Typography level={"title-lg"}>Update Identity</Typography>
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"sex"}
                            title={"Sex Assigned At Birth"}
                        />
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"gender"}
                            title={"Gender"}
                        />
                        <Typography level={"title-lg"}>Update Identity</Typography>

                        <Checkbox
                            label={"Hispanic or Latino?"}
                            value={info.ethnicity}
                            onChange={(event) => {setInfo({...info, ethnicity: event.target.checked})}}
                        />
                        <AccountSelect
                            info={info}
                            setInfo={setInfo}
                            keyName={"race"}
                            title={"Race"}
                            options={["Option1","Option2"]}
                        />
                    </Card>
                </TabPanel>
            </Tabs>
        </div>
        </>
    )
}
