import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import PHome from "./pages/pHome";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Account from "./pages/Account";
import NavHeader from "./components/NavHeader";
import LoadingPage from "./components/LoadingPage";
import {apiFetch} from "./lib/calls"
import PatientSearch from './pages/PatientSearch';
import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';
import './App.css';

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
        const u = await apiFetch("/api/rest/auth/getAuthUser");
        const ud = await u.json();
        if (ud.valid){
          console.log(ud)
          // get user info...
              let url = "/api/rest/auth/user"
              const res = await apiFetch(url,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({userID: ud?.userId})
              });
              const resD = await res.json();
              console.log(1,resD)
              if (Array.isArray(resD)){
                setUser(resD[0])
              }
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

export default App;
