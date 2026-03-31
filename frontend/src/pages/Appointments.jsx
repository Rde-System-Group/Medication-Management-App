import { useState, useEffect } from 'react';
import { getAppointments } from '../services/api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointments().then(data => {
      setAppointments(data.appointments || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1>Appointments</h1>
      <p className="subtitle">All upcoming appointments for Dr. Sarah Smith</p>

      <div className="card">
        {appointments.length === 0 ? (
          <div className="empty">No appointments scheduled</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.appointment_id}>
                  <td>{a.date}</td>
                  <td>{a.scheduled_start} - {a.scheduled_end}</td>
                  <td>{a.patient_name}</td>
                  <td>{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
