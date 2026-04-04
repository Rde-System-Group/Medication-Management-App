'use client'
import { useState, useEffect } from 'react';
// import './App.css';
import { Routes, Route } from "react-router";
import PHome from "./pages/pHome";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Test from "./pages/Test";
import Test2 from "./pages/Test2";
import Account from "./pages/Account";
import NavHeader from "./components/NavHeader";
import LoadingPage from "./components/LoadingPage";
import {apiFetch} from "./lib/calls"

function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({
    fname: "John", lname: "Doe"
  })
  const [patients, setPatients] = useState([])
    useEffect(()=>{
      const fetchData = async () => {
        console.log("FETCH 33")
        // FETCH USER (if logged in)
        const u = await apiFetch("/api/users.cfc?method=isLoggedIn");
        const ud = await u.json();
        if (ud.success){
          console.log(ud)
          setLoggedIn(true)
          // THEN... fetch information as needed
        }
        setLoading(false);
      }
      fetchData()
    },[])

    if (loading){
      return (
          <div className="App">
            <LoadingPage />
          </div>
      )
    }

  return (
      <div className="App">
          <NavHeader />
          <Routes>
              <Route path="/" element={<PHome user={user} patients={patients} />}   ></Route>
              <Route path="/login" element={<Login />}></Route>
              <Route path="/account" element={<Account />}></Route>
              <Route path="/test" element={<Test />}></Route>
              <Route path="/test2" element={<Test2 />}></Route>
          </Routes>
      </div>
  )
}

export default App
