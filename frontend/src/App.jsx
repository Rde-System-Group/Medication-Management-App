'use client'
import { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import PHome from "./pages/pHome";
import DHome from "./pages/dHome";
import Login from "./pages/Login";
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
import { apiFetch, AUTH_TOKEN_STORAGE_KEY } from "./lib/calls";


function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [dropdownData, setDropdownData] = useState({ races: [] });

  useEffect(() => {
    const retrieveSession = async () => {
      try {
        const authRes = await apiFetch("/api/rest/auth/getAuthUser");
        const authData = await authRes.json();

        if (authData.valid) {
          console.log("Updated Login Data:", authData);

          // Enrich the active user with role-specific data (patient or doctor row).
          let roleData = null;
          try {
            const roleRes = await apiFetch("/api/rest/auth/getAuthRole");
            const roleJson = await roleRes.json();
            if (roleJson?.valid && Array.isArray(roleJson?.data) && roleJson.data.length) {
              roleData = roleJson.data[0];
            }
          } catch (roleErr) {
            console.log("getAuthRole fetch failed:", roleErr);
          }

          setActiveUser({
              ...authData.USER[0],
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
    try {
        await apiFetch("/api/rest/auth/logout"); 
    } catch (error) {
        console.error("Logout API failed", error);
    }
    try {
      sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
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
        <NavHeader onLogout={executeLogout} />
        <Routes>
            <Route path="/" element={<Login user={activeUser}/>}></Route>
            <Route path="/login" element={<Login user={activeUser}/>}></Route>
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
              <Route path="/dashboard" element={<PatientDashboard user={activeUser} />}></Route>
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
