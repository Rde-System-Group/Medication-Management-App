import { useState, useEffect } from 'react';
//import { useNavigate } from 'react-router-dom';
import { searchPatients } from '../services/api';

export default function PatientSearch({user}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  //const navigate = useNavigate();

  useEffect(() => { loadPatients(); }, []);

  // Auto-search when both fields are cleared
  useEffect(() => {
    if (firstName === '' && lastName === '') {
      loadPatients();
    }
  }, [firstName, lastName]);

  const loadPatients = async (fn = '', ln = '') => {
    setLoading(true);
    try {
      const data = await searchPatients(fn, ln);
      setPatients(data.patients || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(firstName, lastName);
  };

  return (
    <div>
      <h1>Patient Search</h1>
      <p className="subtitle">Search for patients by first and last name. Only patients assigned to you are shown.</p>

      <div className="card">
        <form onSubmit={handleSearch} className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter first name..." />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter last name..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{alignSelf: 'flex-end'}}>Search</button>
        </form>
      </div>

      <div className="card" style={{padding: 0}}>
        <div style={{padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <strong>{patients.length} patients found</strong>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : patients.length === 0 ? (
          <div className="empty" style={{padding: '2rem', textAlign: 'center'}}>No patients found</div>
        ) : (
          patients.map(p => (
            <div key={p.patient_id} className="patient-row">
              <div className="patient-avatar">👤</div>
              <div className="patient-info">
                <div className="patient-name">{p.first_name} {p.last_name}</div>
                <div className="patient-meta">DOB: {p.date_of_birth} · {p.gender} · Patient ID: {p.patient_id}</div>
              </div>
              {/* FIXED: View Profile button now routes to the patient profile page   OLD: navigate(`/patient/${p.patient_id}`) */
              {/* <button className="btn btn-primary" onClick={() => navigate(`/patient/${p.patient_id}`)}> */}}
              <button className="btn btn-primary" onClick={() => window.location.href = `/patient/${p.patient_id}`}>
                View Profile
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
