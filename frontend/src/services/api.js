import axios from 'axios';

const API_BASE = 'http://localhost:8500/Medication-Management-App/backend/api';
const DOCTOR_ID = 1;

export const searchPatients = async (firstName = '', lastName = '') => {
  const res = await axios.get(`${API_BASE}/patients.cfm?doctorId=${DOCTOR_ID}&firstName=${firstName}&lastName=${lastName}`);
  return res.data;
};

export const getPatient = async (patientId) => {
  const res = await axios.get(`${API_BASE}/patient.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}`);
  return res.data;
};

export const getAppointments = async (patientId = null) => {
  let url = `${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}`;
  if (patientId) url += `&patientId=${patientId}`;
  const res = await axios.get(url);
  return res.data;
};

export const createAppointment = async (data) => {
  const res = await axios.post(`${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}`, data);
  return res.data;
};

export const getPrescriptions = async (patientId) => {
  const res = await axios.get(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}`);
  return res.data;
};

export const createPrescription = async (patientId, medications) => {
  const res = await axios.post(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}`, { medications });
  return res.data;
};

export const getMedications = async () => {
  const res = await axios.get(`${API_BASE}/medications.cfm`);
  return res.data;
};
