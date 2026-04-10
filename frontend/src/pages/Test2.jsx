import { useState } from 'react'
import {Button, ButtonGroup, Card, Typography, Input, Chip} from "@mui/joy"


export default function Test() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultsLogin, setResultsLogin] = useState(null);
  const [resultsRegister, setResultsRegister] = useState(null);
  const [authInfo, setAuthInfo] = useState({
        email: "email@test.com", password: "passwordpassword",
        fname: "John", lname: "Doe",
        phone: "555-555-5555",
        date_of_birth: new Date(), gender: "Male", ethnicity: false, sex: "Male", race: "",
        specialty: "INSERTSpecialty",
        signUpType: "Patient"
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

          </Card>
          <Card style={{width: "70%"}}>
              <Typography level="title-lg">Results</Typography>
              <code style={{style: "200px"}}>
                {JSON.stringify(resultsRegister, null, 2)}
              </code>
          </Card>
      </Card>

      
    </div>
    </>
  )
}
