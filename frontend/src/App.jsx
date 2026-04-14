import axios from "axios";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PatientDashboard from "./pages/patient_dashboard.jsx";
import DoctorSearch from "./pages/search_doctor.jsx";
import Appointments from "./pages/appointments.jsx";
import PatientSettings from "./pages/patient_settings.jsx";
import CreateReminderForm from "./pages/create_reminder_form.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientDashboard />} />
      <Route path="/doctor-search" element={<DoctorSearch />} />
      <Route path="/appointments" element={<Appointments />} />
      <Route path="/patient-settings" element={<PatientSettings />} />
      <Route path="/create-reminder-form" element={<CreateReminderForm />} />h
      {/* If route doesn't exist, send user back to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

/*

import axios from "axios";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PatientDashboard from "./pages/patient_dashboard.jsx";
import DoctorSearch from "./pages/search_doctor.jsx";

function App() {
  
  const [search, setSearch] = useState("");
  const [results, setResults] = useState("");

  function searchDoctors() {
    axios.get("/rest/api/doctors/search", {
      params: { search_query: search }
    })
    .then((response) => {
      setResults(JSON.stringify(response.data, null, 2));
    })
    .catch((error) => {
      console.log(error);
      setResults("Error connecting to backend");
    });
  }

  return (
   <div>
      
      <h1>Search Doctors</h1>

      <input
        type="text"
        placeholder="Enter doctor name or specialty"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={searchDoctors}>Search</button>

      <pre>{results}</pre>
    </div> 

  );
}

export default App;
*/