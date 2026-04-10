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
export function CommonInput({info, setInfo, setError, title="Label", keyName, type="text", changeHandler, showPassword, setShowPassword, required=true, validatorFunction}){
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

export default function MainPage() {
    const [info, setInfo] = useState({
        email: "email@test.com", password: "passwordpassword",
        fname: "John", lname: "Doe",
        phone: "555-555-5555",
        date_of_birth: "", gender: "Male", ethnicity: false, sex: "Male", race: "",
        specialty: ""
    });
    const [loginPage, setLoginPage] = useState(0);

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
    const [inputError, setInputError] = useState(false);
    const [signupError, setSignupError] = useState(false);
    const [authRes, setAuthRes] = useState(null);

    useEffect(()=>{
        async function getData(){
            const urf = await fetch("/api/rest/auth/getUserRole");
            const data = await urf.json()
            if (data?.valid){
                if (window.location.href.includes("/login")){
                    window.location.href = "/"
                    return
                }
                window.location.reload()
            }
        }
        getData()
    },[])

    return (<>
    <title>Login | MMWA</title>
        <div className={"page"} id={"home"}>

        <form
            onSubmit={async (event) => {
                event.preventDefault();
                try {
                    if (inputError){
                        setSignupError(true)
                        return
                    }
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
                        setAuthRes(false)
                    } else {
                        if (window.location.href.includes("/login")){
                            window.location.href = "/"
                            return
                        }
                        window.location.reload()
                    }
                } catch (e) {
                    console.log(e)
                    setAuthRes(false)
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
                validatorFunction={(testValue, setError) => {
                    const res = CommonValidatorFunction(testValue, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, null, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.", "Password is valid!")
                    // if (setError) {setError(res[0] === false)}
                    return res
                }}
                setError={setInputError}
            />

            <br />

            {signupError && <Alert
                startDecorator={<InfoOutlinedIcon/>}
                variant={"soft"}
                color={"danger"}
            >
                Error in signing up!
            </Alert>}

            {authRes != null && (
                <Typography level="title-md">AUTHORIZED? ({authRes ? <span style={{fontWeight: "bolder", color: "green"}}>yes</span> : <span style={{fontWeight: "bolder", color: "red"}}>no</span>})</Typography>
            )}

            <br />

            <div style={{
                display: "flex", alignItems: "flex-start"
            }}>
                <div style={{marginRight: "auto", display: "flex", flexDirection: "column", gap: "1rem"}}>
                    <Button onClick={() => {setPage(1)}}>Sign Up</Button>
                    <Button onClick={()=> {setPage(2)}}>Forgot Password</Button>
                </div>
                <Button type={"submit"}>Sign In</Button>
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

    // fetch listofraces
    useEffect(()=>{
        const fetchData = async () => {
            try {
                const res = await fetch("/api/races.cfm")
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
                console.log(`SIGN UP AS ${selectedSignUp == 1 ? "PATIENT" : "DOCTOR"}`)
                console.log("SENT INFO :: ", info)
                let url = "/api/rest/auth/register"
                const res = await fetch(url,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    {...info, signUpType: selectedSignUp == 1 ? "Patient" : "Doctor"}
                )
                });
                const data = await res.json();
                console.log(data)

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
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Last Name"}
                keyName={"lname"}
                type={"text"}
                changeHandler={changeHandler}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Email"}
                keyName={"email"}
                type={"email"}
                changeHandler={changeHandler}
            />
            <CommonInput
                info={info}
                setInfo={setInfo}
                title={"Phone Number"}
                keyName={"phone"}
                type={"tel"}
                changeHandler={changeHandler}
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
                />
                <CommonInput
                    info={info}
                    setInfo={setInfo}
                    title={"Sex Assigned at Birth"}
                    keyName={"sex"}
                    changeHandler={changeHandler}
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
                />
                <br />
            </>
        )}



        <ButtonGroup>
            <Button onClick={()=>{
                setPage(0)
            }}>Go Back</Button>
            <Button type={"submit"}
                color={"success"}
                variant={"soft"}
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
    return (
        <div className={"page"} id={"home"}>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    console.log(info);
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
                            disabled={sentCode}
                            onClick={()=>{
                                setSentCode(true)
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
                            disabled={verifiedCode}
                            onClick={()=>{
                                setVerifiedCode(true)
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
                        onClick={()=>{
                            setVerifiedCode(true)
                        }}
                    >Change Password</Button>
                </div>)}



                <br /> <hr />

                <Button onClick={()=>{
                    setPage(0)
                }}>Go Back</Button>

            </form>

        </div>
    )
}