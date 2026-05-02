'use client'
import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import PHome from "./pages/pHome";
import DHome from "./pages/dHome";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Test from "./pages/Test";
import PatientProfile from "./pages/PatientProfile";
import PatientSearch from "./pages/PatientSearch";
import LoadingPageRoute from "./pages/LoadingPage";
import Account from "./pages/Account";
import Appointments from "./pages/Appointments";
import PatientDashboard from "./pages/patient_dashboard";
import PatientSettings from "./pages/patient_settings";
import DoctorSearch from "./pages/search_doctor";
import CreateReminderForm from "./pages/create_reminder_form";
import NavHeader from "./components/NavHeader";
import LoadingPage from "./components/LoadingPage";
import NotFound from "./pages/NotFound";
import {getAuthUser, logoutUser, getAuthRole} from "./services/api"


function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [dropdownData, setDropdownData] = useState({ races: [] });

  useEffect(() => {
    const retrieveSession = async () => {
      try {
        const authData = await getAuthUser();

        if (authData.valid) {
          const authUser = Array.isArray(authData.USER)
            ? authData.USER[0]
            : (Array.isArray(authData.user) ? authData.user[0] : (authData.user || authData.USER || {}));

          // Enrich the active user with role-specific data (patient or doctor row).
          let roleData = null;
          try {
            const roleJson = await getAuthRole();
            console.log(39, roleJson)
            if (roleJson?.valid) {
              roleData = roleJson.data;
            }
          } catch (roleErr) {
            console.log("getAuthRole fetch failed:", roleErr);
          }
          setActiveUser({
              ...authUser,
              role: authData.role,
              doctor_id: authData.DOCTOR_ID || authData.doctor_id,
              patient_id: authData.PATIENT_ID || authData.patient_id,
              roleData,
          });
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log("Login check failed: ", e);
      }
      setIsAppLoading(false);
    };
    retrieveSession();
  }, []);

  const executeLogout = async () => {
    await logoutUser()
    setActiveUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login'; 
  };

  if (isAppLoading) {
    return (
        <div className="App">
          <LoadingPage />
        </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="app">
        <Routes>
            <Route path="/" element={<Landing />}></Route>
            <Route path="/login" element={<Login user={activeUser}/>}></Route>
            <Route path="/signup" element={<Login user={activeUser}/>}></Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    );
  }
  
  if (activeUser.role === "Patient") {
    return (
      <div className="App">
          <NavHeader doctor={activeUser} onLogout={executeLogout} />
          <Routes>
              <Route path="/" element={<PHome user={activeUser} list={dropdownData}/>}></Route>
              <Route path="/account" element={<Account user={activeUser} list={dropdownData}/>}></Route>
              <Route path="/appointments" element={<Appointments user={activeUser} />}></Route>
              <Route path="/dashboard" element={<PHome user={activeUser} list={dropdownData}/>}></Route>
              <Route path="/patient-settings" element={<PatientSettings user={activeUser} />}></Route>
              <Route path="/doctor-search" element={<DoctorSearch user={activeUser} />}></Route>
              <Route path="/create-reminder-form" element={<CreateReminderForm user={activeUser} />}></Route>
              <Route path="/test" element={<Test />}></Route>
              <Route path="/loading" element={<LoadingPageRoute />}></Route>
              <Route path="*" element={<NotFound />} />
          </Routes>
      </div>
      );
    }

  if (activeUser.role === "Doctor") {
    return (
      <div className="App">
          <NavHeader doctor={activeUser} onLogout={executeLogout} />
          <Routes>
              <Route path="/" element={<DHome user={activeUser} list={dropdownData}/>}></Route>
              <Route path="/account" element={<Account user={activeUser} list={dropdownData}/>}></Route>
              <Route path="/search" element={<PatientSearch user={activeUser} />}></Route>
              <Route path="/patient" element={<PatientProfile user={activeUser} />}></Route>
              <Route path="/appointments" element={<Appointments user={activeUser} />}></Route>
              <Route path="/test" element={<Test />}></Route>
              <Route path="/loading" element={<LoadingPageRoute />}></Route>
              <Route path="*" element={<NotFound />} />
          </Routes>
      </div>
      );
    }
    
    return (
      <div className="App">
          <NavHeader onLogout={executeLogout} />
          <Routes>
              <Route path="*" element={<NotFound />} />
          </Routes>
      </div>
      );
  }

export default App;
