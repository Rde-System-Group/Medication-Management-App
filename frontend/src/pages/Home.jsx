import { useState } from 'react'
import '../Piper.css'
import NavHeader from "../components/NavHeader.jsx";


export default function Home() {
  return (
    <div className={"page"} id={"home"}>
        This is some content for the homepage.

        Go to <a href={"/login"}>LOGIN</a> page.
    </div>
  )
}
