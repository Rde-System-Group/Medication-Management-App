'use client'
import { useState, useEffect } from 'react';
// import './App.css';
import { Routes, Route } from "react-router";
import PHome from "./pages/pHome";
import DHome from "./pages/dHome";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Test from "./pages/Test";
import PatientProfile from "./pages/PatientProfile";
import PatientSearch from "./pages/PatientSearch";
import LoadingPageRoute from "./pages/LoadingPage";
import Account from "./pages/Account";
import Appointments from "./pages/Appointments";
import NavHeader from "./components/NavHeader";
import LoadingPage from "./components/LoadingPage";
import NotFound from "./pages/NotFound"
import {apiFetch} from "./lib/calls"

function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null)
  const [patients, setPatients] = useState([])
  const [list, setList] = useState({
    races: []
  })
    useEffect(()=>{
      const fetchData = async () => {
        // FETCH USER (if logged in)
        const u = await apiFetch("/api/rest/auth/getAuthUser");
        const ud = await u.json();
        if (ud.valid){
            console.log(ud)
            setUser({...ud.USER[0], role: ud.role})
            /*
              Add any other fetches here on log in!
            */
          setLoggedIn(true)
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

    if (!user){
      return (
        <div className="app">
          <NavHeader />
          <Routes>
            {/*
                USER ROUTES
            */}
              <Route 
                path="/" 
                element={<Login user={user}/>}
                 ></Route>
              <Route 
                path="/login" 
                element={<Login user={user}/>}
              ></Route>
              {/*
                  PAGE NOT FOUND ROUTE
              */}
              <Route 
                path="*" 
                element={<NotFound />} />
          </Routes>
        </div>
      )
    }

  return (
      <div className="App">
          <NavHeader />
          <Routes>
            {/*
                USER ROUTES
            */}
              <Route 
                path="/" 
                element={<Login user={user}/>}
                 ></Route>
              <Route 
                path="/account" 
                element={<Account user={user} list={list}/>}
              ></Route>
              {/*
                  DOCTOR ROUTES
              */}
              <Route 
                path="/home/doctor" 
                element={<DHome user={user} list={list}/>}
                 ></Route>
              <Route 
                path="/home/doctor/search" 
                element={<PatientSearch user={user} />}
                 ></Route>
              <Route 
                path="/home/doctor/patient" 
                element={<PatientProfile user={user} />}
                 ></Route>
              {/*
                  PATIENT ROUTES
              */}
              <Route 
                path="/home/patient" 
                element={<PHome user={user} list={list}/>}
                 ></Route>
              <Route 
                path="/home/patient/appointments" 
                element={<Appointments user={user} />}
                 ></Route>
              {/*
                  TEST ROUTES
              */}
              <Route 
                path="/test" 
                element={<Test />}
              ></Route>
              <Route 
                path="/loading" 
                element={<LoadingPageRoute />}
              ></Route>
              {/*
                  PAGE NOT FOUND ROUTE
              */}
              <Route 
                path="*" 
                element={<NotFound />} />
          </Routes>
      </div>
  )
}

export default App
