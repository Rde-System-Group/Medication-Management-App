import { useState } from 'react'
import {Button, Card} from "@mui/joy"

async function TestAxiosCall(setResults){
    const res = await fetch("http://localhost:8500/rde/api/users.cfm")
    const data = await res.json()
    setResults(JSON.stringify(data, null, 2))
}


export default function Test() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState("");

  return (
    <div className={"page"} id={"test"}>

    <Card>
      This is a test page to test out functions. Except for this, does not need to be updated in git (for personal use).

      <Button
        loading={isLoading}
        onClick={()=>{
          setIsLoading(true)
          try {
            TestAxiosCall(setResults)
          } catch(e) {
            console.log("[ERROR]",e)
            setResults(JSON.stringify(e))
          }
          finally {
            setIsLoading(false)
          }
        }}
      >TEST AXIOS CALL</Button>

        {results && <Card><code>{results}</code></Card>}


        Go back to <a href={"/"}>HOME</a> page.
    </Card>
    </div>
  )
}
