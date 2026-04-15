import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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

function AppContent() {
  const { token, doctor, loading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([])

  if (loading) {
    return (
      <div className="App">
        <LoadingPage />
      </div>
    )
  }

  return (
    <div className="App">
      <NavHeader doctor={doctor} onLogout={() => navigate('/login')} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><PHome doctor={doctor} patients={patients} /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App;
