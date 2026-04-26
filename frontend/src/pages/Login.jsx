import { useEffect, useState } from 'react'
import '../Piper.css'
import {
    Input,
    Typography,
    IconButton,
    Button,
    ButtonGroup,
    Select,
    Option,
    Switch,
    FormControl,
    FormLabel,
    FormHelperText, Card, Alert,
} from "@mui/joy";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/Key';
import {apiFetch} from "../lib/calls"

export const regexList = {
    email: {
        r: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMsg: "Email is in an incorrect format.",
        successMsg: "Email is valid!"
    },
    password: {
        r: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        errorMsg: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        successMsg: "Password is valid!"
    },
    name: {
        r: /^[a-zA-Z]+([ \-']{0,1}[a-zA-Z]+)*$/,
        errorMsg: "Name is invalid!",
        successMsg: "Name is valid!"
    },
    phone: {
        r: /^\d{3}-\d{3}-\d{4}$/,
        errorMsg: "Phone is in an incorrect format | Example: 123-456-7890",
        successMsg: "Phone is valid!"
    },
    text: {
        r: /^(?=(.*[a-zA-Z]){2,}).*$/,
        errorMsg: "Text must be at least 2 characters long!",
        successMsg: "Text is valid!"
    },
}

function ToggleStateIconButton({state, setState, TrueIcon, FalseIcon}){
    return (
        <IconButton
            onClick={() => {setState(!state)}}
        >
            {state ? TrueIcon : FalseIcon}
        </IconButton>
    )
}

function CommonValidatorFunction(testValue, validateWithRegex, validateWithFunction, errorMessage="Invalid input!", successMessage){
    /*
     Validate with Regex OR validate with Function
     RETURN array w/
     [0] (bool) TRUE
     [1] (text) Message
        > Error message :: used for input
        > Success message :: optionally used
    */
    try {
        if (validateWithRegex) {
            if (validateWithRegex.test(testValue)) {
                return [true, successMessage]
            } else {
                return [false, errorMessage]
            }
        } else if (validateWithFunction) {
            if (validateWithFunction(testValue)) {
                return [true, successMessage]
            } else {
                return [false, errorMessage]
            }
        } else {
            return [false, errorMessage]
        }
    } catch (e) {
        console.log("[ERROR]", e)
        return [false, e]
    }
}

function ChangeState(setState, state, newValue, key){
    if (!setState) {return false}
    if (key){
        setState({...state, [key]: newValue})
    }
    else {
        setState(newValue)
    }
}
export function CommonInput({info, setInfo, setError, title="Label", keyName, type="text", changeHandler, showPassword, setShowPassword, required=true, validatorFunction, disabled=false}){
const [validState, setValidState] = useState(validatorFunction ? validatorFunction(info[keyName], setError) : [true, ""]);
    if (!info || !setInfo){
        return <div>ERROR</div>
    }

 return (
         <FormControl
            error={validatorFunction && validState[0] === false}
         >
            <FormLabel>{title}</FormLabel>
            <Input
                disabled={disabled}
                 name={title}
                 size={"lg"}
                 type={setShowPassword ? (showPassword ? "text" : "password") : type}
                 endDecorator={setShowPassword && (<ToggleStateIconButton
                     state={showPassword}
                     setState={setShowPassword}
                     TrueIcon={<VisibilityIcon />}
                     FalseIcon={<VisibilityOffIcon />}
                 />)}
                 value={info[keyName]}
                 onChange={(event) => {
                    changeHandler(setInfo, info, event.target.value, keyName);
                    if (validatorFunction) {
                        const state = validatorFunction(event.target.value)
                        setValidState(state)
                        // if (!setError) {return false}
                        /*
                        if (state[0] === true) {
                            // setError(false)
                        } else {
                            // setError(true)
                        }
                         */
                    }
                 }}
                 required={required}
             />
             {validatorFunction && validState[0] === false && (<FormHelperText>
                 <InfoOutlinedIcon />
                 {validState[1]}
             </FormHelperText>)}
         </FormControl>
 )
}
function CommonSelect({info, setInfo, title="Label", keyName, options=[], changeHandler}){
    if (!info || !setInfo){
        return <div>ERROR</div>
    }
    return (
        <label>
            <Typography level={"title-md"}>{title}</Typography>
            <Select
                value={info[keyName]}
                onChange={(event, newValue) => { changeHandler(setInfo, info, newValue, keyName) }}

            >
            {options?.map((option) => (
                <Option key={"option-race-"+option.ID} value={option.ID}>{option.NAME}</Option>
            ))}
            </Select>
        </label>)
}
function CommonSwitch({info, setInfo, title="Label", keyName, changeHandler}){
    if (!info || !setInfo){
        return <div>ERROR</div>
    }
    return (
        <label>
            <Typography level={"title-md"}>{title}</Typography>
            <Switch
                checked={info[keyName]}
                onChange={(event) => { changeHandler(setInfo, info, event.target.checked, keyName) }}
            />
        </label>)
}

export default function MainPage({user}) {
    const [info, setInfo] = useState({
        email: "email@test.com", password: "@Password123!",
        fname: "John", lname: "Doe",
        phone: "555-555-5555",
        date_of_birth: new Date().toISOString().split("T")[0], gender: "Male", ethnicity: false, sex: "Male", race: "",
        specialty: "", work_email: "email@doctor.com"
    });
    const [loginPage, setLoginPage] = useState(0);
    if (user){
        console.log("user already loggined in???")
        return <div>
            <h2>ERR</h2>
            <p>You are already logged in!</p>
            <a href={"/"}>Go Back</a>
        </div>
    }

    if (loginPage === 0) {
        return <MainLogin setPage={setLoginPage} info={info} setInfo={setInfo} changeHandler={ChangeState} />
    }
    if (loginPage === 1) {
        return <MainSignUp setPage={setLoginPage} info={info} setInfo={setInfo} changeHandler={ChangeState} />
    }
    if (loginPage === 2) {
        return <MainForgotPassword setPage={setLoginPage} info={info} setInfo={setInfo} changeHandler={ChangeState} />
    }
}

function MainLogin({info, setInfo, changeHandler, setPage}) {
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(false)
    const [loginErrorMessage, setLoginErrorMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false);

    return (<>
    <title>Login | MMWA</title>
        <div className={"page"} id={"home"}>

        <form
            style={{width: "70vw", marginLeft: "15vw"}}
            onSubmit={async (event) => {
                event.preventDefault();
                setIsLoading(true)
                try {
                    console.log("LOG IN INFO :: ", {email: info.email, password: info.password})
                    let url = "/api/rest/auth/login"
                    const res = await fetch(url,{
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(
                            {email: info.email, password: info.password}
                        )
                    });
                    const data = await res.json();
                    if (data?.error){
                        setLoginError(true)
                        setLoginErrorMessage(data?.message || "Unknown error.")
                    } else {
                        if (window.location.pathname.includes("/login")){
                            window.location.href = "/"
                            return
                        }
                        window.location.reload()
                    }
                } catch (e) {
                    console.log(e)
                    setLoginError(true)
                    setLoginErrorMessage(e?.message || e?.error || "Unknown error!")
                } finally {
                    setIsLoading(false)
                }
            }}
        >
            <Typography level={"h2"} textAlign={"center"}>LOGIN</Typography>
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Email"}
                keyName={"email"}
                type={"email"}
                changeHandler={changeHandler}
                disabled={isLoading}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Password"}
                keyName={"password"}
                type={"password"}
                changeHandler={changeHandler}
                setShowPassword={setShowPassword}
                showPassword={showPassword}
                disabled={isLoading}
                
            />

            <br />

            {loginError && <><Alert
                startDecorator={<InfoOutlinedIcon/>}
                variant={"soft"}
                color={"danger"}
            >
                Error in logging in: {loginErrorMessage}
            </Alert>
            <br />
            </>}


            <div style={{
                display: "flex", alignItems: "flex-start"
            }}>
                <div style={{marginRight: "auto", display: "flex", flexDirection: "column", gap: "1rem"}}>
                    <Button 
                        disabled={isLoading}
                        variant="outlined"
                        onClick={() => {
                            setPage(1); 
                            setLoginError(false); 
                        }}
                        startDecorator={<KeyIcon />}
                    >Sign Up</Button>
                    <Button 
                        onClick={()=> {
                            setPage(2); 
                            setLoginError(false); 
                        }}
                        disabled={isLoading}
                    >Forgot Password</Button>
                </div>
                <Button 
                    disabled={isLoading}
                    type={"submit"}
                >Sign In</Button>
            </div>
        </form>

        </div>
    </>
    )
}

function MainSignUp({info, setInfo, changeHandler, setPage}){
    const [showPassword, setShowPassword] = useState(false);
    const [selectedSignUp, setSelectedSignUp] = useState(1);
    const [listOfRaces, setListOfRaces] = useState([])
    const [error, setError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [signingUp, setSigningUp] = useState(false)

    useEffect(()=>{
        const fetchData = async () => {
            try {
                // fetch options of races for patient dropdown
                const res = await fetch("/api/rest/base/options")
                const data = await res.json();
                setListOfRaces(data)
            } catch (e){
                console.log("265 :: Error Retrieving Races",e)
            }
        }
        fetchData()
    },[])

    return (<>
        <title>Sign Up | MMWA</title>
        <div className={"page"} id={"home"}>
        <form
            onSubmit={async (event) => {
                event.preventDefault();
                setSigningUp(true)
                let url = "/api/rest/user/register"
                const registerOBJ = {...info, signUpType: selectedSignUp == 1 ? "Patient" : "Doctor"}
                const res = await fetch(url,{
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        registerOBJ
                    )
                });
                const data = await res.json();
                console.log(data, registerOBJ)
                if (data.error){
                    setError(true)
                    setErrorMsg(data.message || "Unknown error in registering!")
                } else {
                    window.location.reload()
                }
                setSigningUp(false)
            }}
        >
        <div>
            <Typography level={"h2"} textAlign={"center"}>SIGN UP</Typography>

            <div
                style={{width: "100%", display: "flex", justifyContent: "center"}}
            >
                <ButtonGroup>
                    <Button
                        onClick={() => {setSelectedSignUp(1)}}
                        color={selectedSignUp === 1 ? "primary" : "neutral"}
                        variant={selectedSignUp === 1 ? "soft" : "outlined"}
                    >As a Patient</Button>
                    <Button
                        onClick={() => {setSelectedSignUp(2)}}
                        color={selectedSignUp === 2 ? "primary" : "neutral"}
                        variant={selectedSignUp === 2 ? "soft" : "outlined"}
                    >As a Doctor</Button>
                </ButtonGroup>
            </div>

            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"First Name"}
                keyName={"fname"}
                type={"text"}
                changeHandler={changeHandler}
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, regexList.name.r, null, regexList.name.errorMsg, regexList.name.successMsg)
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setError}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Last Name"}
                keyName={"lname"}
                type={"text"}
                changeHandler={changeHandler}
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, regexList.name.r, null, regexList.name.errorMsg, regexList.name.successMsg)
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setError}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Email"}
                keyName={"email"}
                type={"email"}
                changeHandler={changeHandler}
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, regexList.email.r, null, regexList.email.errorMsg, regexList.email.successMsg)
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setError}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Phone Number"}
                keyName={"phone"}
                type={"tel"}
                changeHandler={changeHandler}
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, regexList.phone.r, null, regexList.phone.errorMsg, regexList.phone.successMsg)
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setError}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Password"}
                keyName={"password"}
                type={"password"}
                changeHandler={changeHandler}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, regexList.password.r, null, regexList.password.errorMsg, regexList.password.successMsg)
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setError}
            />
        </div>

            <br />

        {selectedSignUp === 1 && (
            <>
                <Typography level={"h4"}>Continue as a Patient</Typography>
                <hr />

                <CommonSelect
                    info={info}
                    setInfo={setInfo}
                    title={"Race"}
                    keyName={"race"}
                    options={listOfRaces}
                    changeHandler={changeHandler}
                />
                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Date of Birth"}
                    keyName={"date_of_birth"}
                    changeHandler={changeHandler}
                    type={"date"}
                />
                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Gender"}
                    keyName={"gender"}
                    changeHandler={changeHandler}
                    validatorFunction={(testValue, setError) => {
                        const res = CommonValidatorFunction(testValue, regexList.text.r, null, "Must be at least 2 characters long", regexList.text.successMsg)
                        // if (setError) {setError(res[0] === false)}
                        return res
                    }}
                    setError={setError}
                />
                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Sex Assigned at Birth"}
                    keyName={"sex"}
                    changeHandler={changeHandler}
                    validatorFunction={(testValue, setError) => {
                        const res = CommonValidatorFunction(testValue, regexList.text.r, null, "Must be at least 2 characters long", regexList.text.successMsg)
                        // if (setError) {setError(res[0] === false)}
                        return res
                    }}
                    setError={setError}
                />
                <CommonSwitch
                    info={info}
                    setInfo={setInfo}
                    title={"Ethnicity (Latino or Hispanic)"}
                    keyName={"ethnicity"}
                    changeHandler={changeHandler}
                />
                <br /> <br />
            </>
        )}

        {selectedSignUp === 2 && (
            <>
                <Typography level={"h4"}>Continue as a Doctor</Typography>
                <hr />

                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Specialty"}
                    keyName={"specialty"}
                    changeHandler={changeHandler}
                    validatorFunction={(testValue, setError) => {
                        const res = CommonValidatorFunction(testValue, regexList.text.r, null, "Must be at least 2 characters long", regexList.text.successMsg)
                        // if (setError) {setError(res[0] === false)}
                        return res
                    }}
                    setError={setError}
                />

                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Work Email"}
                    keyName={"work_email"}
                    changeHandler={changeHandler}
                    validatorFunction={(testValue, setError) => {
                        const res = CommonValidatorFunction(testValue, regexList.email.r, null, regexList.email.errorMsg, regexList.email.successMsg)
                        // if (setError) {setError(res[0] === false)}
                        return res
                    }}
                    setError={setError}
                />
                <br />
            </>
        )}

            { error && <>
            <hr />
            <br />
            <Alert
            startDecorator={<InfoOutlinedIcon/>}
            variant={"soft"}
            color={"danger"}
        >
            Error in registering: {errorMsg}
        </Alert>
                <br /></>
        }

        <ButtonGroup>
            <Button onClick={()=>{
                setPage(0)
            }}>Go Back</Button>
            <Button type={"submit"}
                color={"success"}
                variant={"soft"}
                disabled={signingUp}
            >Sign Up</Button>
        </ButtonGroup>

        </form>
        </div>
    </>
    )
}

function MainForgotPassword({info, setInfo, changeHandler, setPage}){
    const [inputCode, setInputCode] = useState("");
    const [sentCode, setSentCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [verifiedCode, setVerifiedCode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    return (
        <div className={"page"} id={"home"}>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                }}
            >
                <Typography level={"h2"} textAlign={"center"}>FORGOT PASSWORD</Typography>
                <label>
                    <Typography>Email</Typography>
                    <Input
                        name={"Input"}
                        size={"lg"}
                        type={"email"}
                        value={info.email}
                        onChange={(event) => {
                            changeHandler(setInfo, info, event.target.value, "email");
                        }}
                        endDecorator={<Button
                            disabled={sentCode || loading}
                            type={sentCode ? "button" : "submit"}
                            onClick={async ()=>{
                                try {
                                    setLoading(true)
                                    const sentCode = await apiFetch("/api/rest/user/sendPRCode", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            email: info.email,
                                            sendRequest: true
                                        }),
                                        headers: { "Content-Type": "application/json" }
                                    })
                                    const dt = await sentCode.json();
                                    if (dt.error){
                                        setError(dt.message)
                                    } else {
                                        setError(null)
                                        setSentCode(true)
                                    }
                                } catch(e){
                                    console.log(623,e)
                                } finally{
                                    setLoading(false)
                                }
                            }}
                        >Send Code</Button>}
                    />
                </label>

                {sentCode && (<label>
                    <Typography>Code</Typography>
                    <Input
                        name={"Input"}
                        size={"lg"}
                        type={"text"}
                        value={inputCode}
                        onChange={(event) => {
                            setInputCode(event.target.value);
                        }}
                        endDecorator={<Button
                            disabled={verifiedCode || loading}
                            type={verifiedCode ? "button" : "submit"}
                            onClick={async ()=>{
                                try {
                                    setLoading(true)
                                    const verifyCode = await apiFetch("/api/rest/user/verifyPRCode", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            email: info.email,
                                            code: inputCode
                                        }),
                                        headers: { "Content-Type": "application/json" }
                                    })
                                    const dt = await verifyCode.json();
                                    if (dt.error){
                                        setError(dt.message)
                                    } else {
                                        setError(null)
                                        setVerifiedCode(true)
                                    }
                                } catch(e){
                                    console.log(623,e)
                                } finally{
                                    setLoading(false)
                                }
                            }}
                        >Verify</Button>}
                    />
                </label>)}

                {verifiedCode && (<div
                    style={{display: "flex", flexDirection: "column", alignItems: "flex-end", width: "100%"}}
                ><label style={{width: "100%"}}>
                    <Typography>New Password</Typography>
                    <Input
                        name={"New Password"}
                        size={"lg"}
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => {
                            setNewPassword(event.target.value);
                        }}
                        endDecorator={<ToggleStateIconButton
                            setState={setShowPassword}
                            state={showPassword}
                            TrueIcon={<VisibilityIcon />}
                            FalseIcon={<VisibilityOffIcon />}
                        />}
                    />
                </label>
                    <br />

                    <Button
                            onClick={async ()=>{
                                try {
                                    setLoading(true)
                                    const changingPassword = await apiFetch("/api/rest/user/changePassword", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            email: info.email,
                                            code: inputCode,
                                            password: newPassword
                                        }),
                                        headers: { "Content-Type": "application/json" }
                                    })
                                    const dt = await changingPassword.json();
                                    if (dt.error){
                                        setError(dt.message)
                                    } else {
                                        window.location.reload();
                                    }
                                } catch(e){
                                    console.log(623,e)
                                } finally{
                                    setLoading(false)
                                }
                            }}
                    >Change Password</Button>
                </div>)}



                <br /> <hr />
                {error && <><Alert
                    startDecorator={<InfoOutlinedIcon/>}
                    variant={"soft"}
                    color={"danger"}
                >
                    {error}
                </Alert>
                <br />
                </>}

                <Button onClick={()=>{
                    setPage(0)
                }}>Go Back</Button>

            </form>

        </div>
    )
}