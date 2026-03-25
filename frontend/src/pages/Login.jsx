import { useState } from 'react'
import '../Piper.css'

function Login() {
    const [mode, setMode] = useState(0); // 0 = doctor, 1 = patient, 2 = admin???

  return (
      <div className={"page"} id={"home"}>
          This is some content for the login page.

          Go to <a href={"/"}>HOME</a> page.
      </div>
  )
}

export default Login
