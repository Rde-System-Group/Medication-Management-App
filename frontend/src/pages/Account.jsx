import { useEffect, useState, useRef } from 'react'
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
    Checkbox,
    Alert,
    Modal, ModalDialog, ModalClose
} from "@mui/joy"
import { apiFetch } from '../lib/calls'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {regexList} from "../pages/Login"

async function UpdateUserInfo(keyName, value, passwordValue){
    if ((typeof value === "string" && value.length > 0) || (keyName === "RACEID" && typeof value === "number") || (keyName === "ETHNICITY" && typeof value === "number")){
        try {
        // UPDATE
        const res = await apiFetch("/api/rest/user/update", {
            method: "POST",
            body: JSON.stringify({
                type: keyName === "RACEID" ? "race" : keyName.toLowerCase(),
                value: value,
                oldPassword: passwordValue
            })
        })
        const data = await res.json();
        console.log(data)
        return data
        } catch(e){
            console.log(`ERROR in UPDATE:`,e)
            return {error: true, message: "Error in update!"}
        }
    } else {
        return {error: true, message: "Empty input!"}
    }
}

function AccountInput({setInfo, info, keyName, type="text", title="Label"}){
    const [disabled, setDisabled] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const buttonRef = useRef(null);
    return (<>
    <label>
        <Typography level={"title-md"}>{title}</Typography>
        <Input
            disabled={disabled}
            value={info[keyName]}
            onChange={(event) => {setInfo({...info, [keyName]: event.target.value})}}
            onKeyDown={(e)=>{if (e.key == "Enter"){
                buttonRef.current.click()
            }}}
            type={type}
            endDecorator={<Button
                ref={buttonRef}
                onClick={async ()=>{
                    try {
                        setDisabled(true)
                        const res = await UpdateUserInfo(keyName, info[keyName])
                        if (!res.error){
                            console.log("SUCESS!")
                            setError(false)
                            window.location.reload()
                        } else {
                            console.log("FAIL!")
                            setError(true)
                            setErrorMsg(res.message)
                        }
                    } catch (e){
                        console.log(e)
                        setError(true)
                    } finally {
                        setDisabled(false)
                    }
                }}
            >Change</Button>}
        />
    </label>
    {error && <>
    <br /><Alert
        color="danger"
        startDecorator={<InfoOutlinedIcon />}
        endDecorator={<IconButton color="danger"><CloseIcon onClick={()=>setError(false)}/></IconButton>}
    >
        {errorMsg || "Unknown error!"}
    </Alert></>}
    </>
    )
}
function AccountSelect({setInfo, info, keyName, title="Label", options=[]}){
    const [disabled, setDisabled] = useState(false);
    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    return (<>
    <label>
        <Typography level={"title-md"}>{title}</Typography>
        <Select
            value={info[keyName]}
            onChange={async (event, newValue)=>{
                try {
                    setDisabled(true)
                    setInfo({...info, [keyName]: newValue})
                    const res = await UpdateUserInfo(keyName, JSON.stringify(newValue))
                    if (res.success){
                        console.log("SUCESS!")
                    } else {
                        console.log("FAIL!")
                        setError(true)
                    }
                } catch (e){
                    console.log(e)
                    setError(true)
                } finally {
                    setDisabled(false)
                }
            }}
        >
            { 
                options.map((option) => (<Option key={keyName + "-" + option.ID} value={option.ID}>{option.NAME}</Option>))
            }
        </Select>
    </label>
    <br />
    {error && <Alert
        color="danger"
        startDecorator={<InfoOutlinedIcon />}
        endDecorator={<IconButton color="danger"><CloseIcon onClick={()=>setError(false)}/></IconButton>}
    >
        {errorMsg || "Unknown error!"}
    </Alert>}
    </>
    )
}

export default function Account({user, list}) {
    const [info, setInfo] = useState(user);
    const [roleInfo, setRoleInfo] = useState(user.roleData)
    const [newPasswordInvalid, setNewPasswordInvalid] = useState(false)
    const [viewPage, setViewPage] = useState(user?.role.toLowerCase());
    const [errorPW, setErrorPW] = useState(false);
    const [errorPWMsg, setErrorPWMsg] = useState("");
    const [openPopup, setOpenPopup] = useState(false);

    useEffect(()=>{
        async function fetchData(){
            const res = await apiFetch("/api/rest/auth/checkLogin")
            const data = await res.json();
            console.log(data)
        }
        fetchData()
    },[])

    if (!user){
        return (<div style={{display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 200px)"}}>
            <Card size="lg">
                <h1>Cannot View Page</h1>
                <p>You are not authorized to view this page.</p>
                <Link href="/login" >SIGN IN</Link>
            </Card>
        </div>)
    }

    return (<>
        <title>Account | MMWA</title>
        <div className={"page"} id={"account"}>
            <Tabs aria-label={"Basic_tabs"} defaultValue={0}>
                <TabList>
                    <Tab>User Settings</Tab>
                    <Tab>{viewPage === "patient" ? "Patient" : "Doctor"}</Tab>
                </TabList>
                <TabPanel value={0}>
                    <Card>
                        <Typography level={"title-lg"}>Update Personal Info</Typography>
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"FIRST_NAME"}
                            title={"First Name"}
                        />
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"LAST_NAME"}
                            title={"Last Name"}
                        />
                    </Card>
                    <br />
                    <Card>
                        <Typography level={"title-lg"}>Update Password</Typography>
                        <form
                            onSubmit={async (e)=>{
                                e.preventDefault();
                                try {
                                    setErrorPW(true)
                                    const res = await UpdateUserInfo(keyName, info[keyName])
                                    if (res.success){
                                        console.log("SUCESS!")
                                        setErrorPW(false)
                                    } else {
                                        console.log("FAIL!")
                                        setErrorPW(true)
                                        setErrorPWMsg(res.message)
                                    }
                                } catch (e){
                                    console.log(e)
                                    setErrorPW(true)
                                } finally {
                                    setErrorPW(false)
                                }
                            }}
                        >
                            <label>
                                <Typography level={"title-md"}>Old Password</Typography>
                                <Input
                                    disabled={errorPW}
                                    type={"password"}
                                    autoComplete="current-password"
                                />
                            </label>
                            <label>
                                <Typography level={"title-md"}>New Password</Typography>
                                <Input
                                    disabled={errorPW}
                                    type={"password"}
                                    autoComplete="new-password"
                                    onChange={(e)=>{
                                        if (regexList?.password.r.test(e.target.value)){
                                            setNewPasswordInvalid(false)
                                        } else {
                                            setNewPasswordInvalid(true)
                                        }
                                    }}
                                />
                            </label>
                            <br />
                            {newPasswordInvalid && <><Alert
                                    startDecorator={<InfoOutlinedIcon/>}
                                    variant={"soft"}
                                    color={"danger"}
                                >
                                    Password doesn't meet requirements! Must be at least 8 characters long without spaces, 1 special character, 1 uppercase letter, 1 lowercase latter, and 1 number.
                                </Alert>
                                <br /></>
                            }
                            {errorPW && <><Alert
                                    startDecorator={<InfoOutlinedIcon/>}
                                    variant={"soft"}
                                    color={"danger"}
                                    disabled={errorPW}
                                >
                                    {errorPWMsg || "Unknown error in updating password..."}
                                </Alert>
                                <br /></>
                            }
                            <Button
                                type="submit"
                            >Change</Button>
                        </form>
                    </Card>
                    <br />
                    <Card>
                        <Typography level={"title-lg"}>Update Contact Info</Typography>
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"EMAIL"}
                            title={"Email"}
                        />
                        <AccountInput
                            info={info}
                            setInfo={setInfo}
                            keyName={"PHONE_NUMBER"}
                            title={"Phone Number"}
                        />
                    </Card>
                    <br />
                    <Card>
                        <Typography level={"title-lg"}>Manage Account</Typography>
                        <Button 
                            color="danger"
                            style={{width: "fit-content"}}
                            onClick={()=>{
                                setOpenPopup(true)  
                            }}
                        >Delete Account</Button>
                        <Modal
                            open={openPopup}
                            onClose={()=>{setOpenPopup(false)}}
                        >
                            <ModalDialog>
                                <ModalClose />
                                <Typography level="title-lg">Deleting Account</Typography>
                                <Typography level="body-md">Are you sure you want to delete your account?</Typography>
                                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                                    <Button
                                        variant="outlined"
                                        color="neutral"
                                        size="sm"
                                        onClick={()=>{
                                            setOpenPopup(false)
                                        }}
                                    >No</Button>
                                    <Button
                                        variant="outlined"
                                        color="danger"
                                        size="md"
                                        style={{marginLeft: "auto"}}
                                        onClick={async ()=>{
                                            await apiFetch("/api/rest/user/delete", {
                                                method: "POST",
                                                body: JSON.stringify({
                                                    delete: true
                                                })
                                            })
                                            window.location.reload();
                                        }}
                                    >Yes</Button>

                                </div>
                            </ModalDialog>
                        </Modal>
                    </Card>
                </TabPanel>
                <TabPanel value={1}>
                    <Card>
                        {viewPage === "patient" ? <>
                            <Typography level={"title-lg"}>Update Identity</Typography>
                            <AccountInput
                                info={roleInfo}
                                setInfo={setRoleInfo}
                                keyName={"SEX"}
                                title={"Sex Assigned At Birth"}
                            />
                            <AccountInput
                                info={roleInfo}
                                setInfo={setRoleInfo}
                                keyName={"GENDER"}
                                title={"Gender"}
                            />

                            <Checkbox
                                label={"Hispanic or Latino?"}
                                checked={roleInfo.ETHNICITY}
                                onChange={async (event) => {
                                    setRoleInfo({...roleInfo, ETHNICITY: event.target.checked})
                                    await UpdateUserInfo("ETHNICITY", event.target.checked ? 1 : 0)
                                }}
                            />
                            <AccountSelect
                                info={roleInfo}
                                setInfo={setRoleInfo}
                                keyName={"RACEID"}
                                title={"Race"}
                                options={list?.races || []}
                            />
                        </> : <>
                            <Typography level={"title-lg"}>Update Specialty</Typography>
                            <AccountInput
                                info={roleInfo}
                                setInfo={setRoleInfo}
                                keyName={"specialty"}
                                title={"Specialty"}
                            />
                        </>
                        }
                    </Card>
                </TabPanel>
            </Tabs>
        </div>
        </>
    )
}
