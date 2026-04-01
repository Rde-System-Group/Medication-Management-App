import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import PatientSearch from './pages/PatientSearch';
import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <aside className="sidebar">
          <div className="doctor-info">
            <div className="avatar">SS</div>
            <div>
              <div className="doctor-name">Dr. Sarah Smith</div>
              <div className="specialty">Family Medicine</div>
            </div>
          </div>
          <nav>
            <NavLink to="/" end>🔍 Patient Search</NavLink>
            <NavLink to="/appointments">📅 Appointments</NavLink>
          </nav>
          <div className="security-note">
            You can only view patients assigned to you.
          </div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<PatientSearch />} />
            <Route path="/patient/:id" element={<PatientProfile />} />
            <Route path="/appointments" element={<Appointments />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
