import { useState } from 'react'
import {Button, ButtonGroup, Card, Typography, Input, Chip} from "@mui/joy"
import { CommonInput } from './Login';
import {apiFetch} from "../lib/calls"

async function TestAxiosCall(setResults){
    let url = "/api/users.cfm"
    const res = await apiFetch(url,{
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
            name: "Anna",
            email: "email@example.com"
        }
      )
    });
    const data = await res.json()
    setResults(JSON.stringify(data, null, 2))
}

function CreateForm({name="createForm", isLoading, setInfo, info, options=[], submitHandler, children}){
  return (<form
    onSubmit={submitHandler}
  >
    {options.map(x => {
        if (x.key in info){
          return (<CommonInput 
            required={"req" in x ? x.req : true}
            key={`${name}-${x.key}`}
            setInfo={setInfo}
            info={info}
            title={x.title}
            keyName={x.key}
            changeHandler={(setInfo, info, newValue, keyName) => {
              setInfo({...info, [keyName]: newValue})
            }}
          />)
        }
        return null
    })}
    {children}
    <hr />

    <Button
      disabled={isLoading}
      type="submit"
    >Submit</Button>
  </form>)
}


export default function Test() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultsLogin, setResultsLogin] = useState(null);
  const [resultsRegister, setResultsRegister] = useState(null);
  const [resultsLoginInfo, setResultsLoginInfo] = useState(null);
  const [resultsGetUpdate, setResultsGetUpdate] = useState(null);
  const [authInfo, setAuthInfo] = useState({
        email: "email@test.com", password: "passwordpassword",
        fname: "John", lname: "Doe",
        phone: "555-555-5555",
        date_of_birth: new Date(), gender: "Male", ethnicity: false, sex: "Male", race: "",
        specialty: "Specialty",
        signUpType: "Patient"
  })
  const [fetchInfo, setFetchInfo] = useState({
      patientID: 2,
      fname: "Jane",
      lname: ""
  })
  const [fetchUserInfo, setFetchUserInfo] = useState({
      userID: 2,
      fname: "Jane",
      lname: ""
  })
  
  const [resultsUserInfo, setResultsUserInfo] = useState(null)

  return (<>
    <title>Test | MMWA</title>
    <div className={"page"} id={"test"}>
      <Button component="a" href="/phome" >Home</Button>
      <hr />

      <Card orientation='horizontal'>
          <Card style={{width: "30%"}}>
              <Typography level="title-lg">Register User</Typography>
              
              <CreateForm 
                isLoading={isLoading}
                setInfo={setAuthInfo}
                info={authInfo}
                options={[
                  {title: "First Name", key: "fname"},
                  {title: "Last Name", key: "lname"},
                  {title: "Email", key: "email"},
                  {title: "Phone", key: "phone"},
                  {title: "Password", key: "password"}
                ]}
                submitHandler={async (ev)=>{
                  ev.preventDefault();
                  try {
                    setIsLoading(true)
                    let url = "/api/rest/auth/register"
                    const res = await apiFetch(url,{
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(authInfo)
                    });
                    const data = await res.json();
                    setResultsRegister(data)
                  } catch(e){
                    
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                <br />
                <Typography level="title-sm">Sign Up Type</Typography>
                <ButtonGroup>
                    <Button 
                      onClick={()=>{setAuthInfo({...authInfo, signUpType: "Patient"})}}
                      type="button"
                      color="neutral"
                      variant={authInfo.signUpType === "Patient" ? "solid" : "outlined"}
                    >Patient</Button>
                    <Button 
                      onClick={()=>{setAuthInfo({...authInfo, signUpType: "Doctor"})}}
                      type="button"
                      color="neutral"
                      variant={authInfo.signUpType === "Doctor" ? "solid" : "outlined"}
                    >Doctor</Button>
                </ButtonGroup>
              </CreateForm>

          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code style={{style: "200px"}}>
                {JSON.stringify(resultsRegister, null, 2)}
              </code>
          </Card>
      </Card>

      <br /> <hr /> <br />

      <Card orientation='horizontal'>
          <Card style={{width: "30%"}}>
              <Typography level="title-lg">Login User</Typography>
              
              <CreateForm 
                isLoading={isLoading}
                setInfo={setAuthInfo}
                info={authInfo}
                options={[
                  {title: "Email", key: "email"},
                  {title: "Password", key: "password"}
                ]}
                submitHandler={async (ev)=>{
                  ev.preventDefault();
                  try {
                    setIsLoading(true)
                    let url = "/api/rest/auth/login"
                    const res = await apiFetch(url,{
                      method: "POST",
                      credentials: "include",
                      headers: { 
                          "Content-Type": "application/json",
                       },
                      body: JSON.stringify({
                          email: authInfo.email,
                          password: authInfo.password
                      })
                    });
                    const data = await res.json();
                    setResultsLogin(data)
                  } catch(e){
                    
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
              </CreateForm>

          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code>
                {JSON.stringify(resultsLogin, null, 2)}
              </code>
          </Card>
      </Card>

      <br /> <hr /> <br />

      <Card orientation='horizontal'>
          <Card style={{width: "30%", alignItems: "flex-start"}}>
              <Typography level="title-lg">Cookies Check</Typography>

          <Button
            disabled={isLoading}
            onClick={async ()=>{
              try {
                setIsLoading(true)
                const res = await apiFetch("/api/rest/auth/checkLogin",{
                  credentials: "include"
                });
                const data = await res.json();
                setResultsLoginInfo(data)
              } catch(e){
                  
              } finally {
                setIsLoading(false)
              }
            }}
          >Logged In?</Button>
          
          <Button
            disabled={isLoading}
            onClick={async ()=>{
              try {
                setIsLoading(true)
                const res = await apiFetch("/api/rest/auth/logout");
                const data = await res.json();
                setResultsLoginInfo(data)
              } catch(e){
                  
              } finally {
                setIsLoading(false)
              }
            }}
          >Log Out</Button>
          
          <Button
            disabled={isLoading}
            onClick={async ()=>{
              try {
                setIsLoading(true)
                const res = await apiFetch("/api/rest/auth/getAuthUser",{
                  credentials: "include"
                });
                const data = await res.json();
                setResultsLoginInfo(data)
              } catch(e){
                  
              } finally {
                setIsLoading(false)
              }
            }}
          >Get User Auth (private)</Button>
          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code style={{minHeight: "100px"}}>
                {JSON.stringify(resultsLoginInfo, null, 2)}
              </code>
          </Card>
      </Card>

      <br /> <hr /> <br />

      <Card orientation='horizontal'>
          <Card style={{width: "30%"}}>
              <Typography level="title-lg">Fetch User</Typography>
              <CreateForm 
                isLoading={isLoading}
                setInfo={setFetchUserInfo}
                info={fetchUserInfo}
                options={[
                  {req: false, title: "User ID", key: "userID"},
                  {req: false, title: "First Name", key: "fname"},
                  {req: false, title: "Last Name", key: "lname"}
                ]}
                submitHandler={async (ev)=>{
                  ev.preventDefault();
                  try {
                    setIsLoading(true)
                    let url = "/api/rest/auth/user"
                    const res = await apiFetch(url,{
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(fetchUserInfo)
                    });
                    const data = await res.json();
                    setResultsUserInfo(data)
                  } catch(e){
                    
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
              </CreateForm>

          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code style={{minHeight: "100px"}}>
                {JSON.stringify(resultsUserInfo, null, 2)}
              </code>
          </Card>
      </Card>

      <br /> <hr /> <br />

      <Card orientation='horizontal'>
          <Card style={{width: "30%"}}>
              <Typography level="title-lg">Update User</Typography>
              
              <CreateForm 
                isLoading={isLoading}
                setInfo={setAuthInfo}
                info={authInfo}
                options={[
                  {title: "First Name", key: "fname"},
                  {title: "Last Name", key: "lname"},
                  {title: "Email", key: "email"},
                  {title: "Phone", key: "phone"},
                ]}
                submitHandler={async (ev)=>{
                  ev.preventDefault();
                  try {
                    setIsLoading(true)
                    let url = "/api/rest/auth/updateUser"
                    const res = await apiFetch(url,{
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({...authInfo, 
                          userid: document.getElementById("updateByUserID").value
                      })
                    });
                    const data = await res.json();
                    setResultsGetUpdate(data)
                  } catch(e){
                    
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                <br />
                <label>
                    <Typography level="body-md">Update User by ID</Typography>
                    <Input 
                      defaultValue={2}
                      id="updateByUserID"
                      startDecorator={<Chip variant="solid">User ID</Chip>}
                    />
                </label>
              </CreateForm>

          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code>
                {JSON.stringify(resultsGetUpdate, null, 2)}
              </code>
          </Card>
      </Card>
      
    </div>
    </>
  )
}
