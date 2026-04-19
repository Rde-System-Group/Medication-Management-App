import { useState } from 'react'


export default function Home() {
  return (
    <div className={"page"} id={"home"}>
        This is some content for the homepage.

        <br /> <br />

        Go to <a href={"/login"}>LOGIN</a> page. 

        <br /> <br />

        Go to <a href={"/test"}>TEST</a> page.
    </div>
  )
}
