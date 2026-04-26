import axios from 'axios';

const API_BASE = '/cfm'; // <-- update later
const API_BASE_URL = '/rest/api'; // For .cfc files
const DOCTOR_ID = 1;

// Add cache-busting to prevent stale data
const noCache = () => `&_=${Date.now()}`;

// ============================================
// AXIOS-BASED API CALLS (.cfm endpoints)
// ============================================

export const searchPatients = async (firstName = '', lastName = '') => {
  const res = await axios.get(`${API_BASE}/patients.cfm?doctorId=${DOCTOR_ID}&firstName=${firstName}&lastName=${lastName}${noCache()}`);
  return res.data;
};

export const getPatient = async (patientId) => {
  const res = await axios.get(`${API_BASE}/patient.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}${noCache()}`);
  return res.data;
};

export const getAppointments = async (patientId = null) => {
  let url = `${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}`;
  if (patientId) url += `&patientId=${patientId}`;
  const res = await axios.get(url + noCache());
  return res.data;
};

export const createAppointment = async (data) => {
  const res = await axios.post(`${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}`, data);
  return res.data;
};

export const updateAppointment = async (appointmentId, data) => {
  const res = await axios.put(`${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}&appointmentId=${appointmentId}`, data);
  return res.data;
};

export const cancelAppointment = async (appointmentId, reason) => {
  const res = await axios.put(`${API_BASE}/appointments.cfm?doctorId=${DOCTOR_ID}&appointmentId=${appointmentId}`, { action: 'cancel', reason });
  return res.data;
};

export const getPrescriptions = async (patientId) => {
  const res = await axios.get(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}${noCache()}`);
  return res.data;
};

export const createPrescription = async (patientId, medications) => {
  const res = await axios.post(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}`, { medications });
  return res.data;
};

export const updatePrescription = async (patientId, prescriptionId, medications) => {
  const res = await axios.put(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}&prescriptionId=${prescriptionId}`, { medications });
  return res.data;
};

export const deletePrescription = async (patientId, prescriptionId) => {
  const res = await axios.delete(`${API_BASE}/prescriptions.cfm?doctorId=${DOCTOR_ID}&patientId=${patientId}&prescriptionId=${prescriptionId}`);
  return res.data;
};

export const getMedications = async () => {
  const res = await axios.get(`${API_BASE}/medications.cfm`);
  return res.data;
};

// ============================================
// FETCH-BASED API CALLS (.cfc endpoints)
// ============================================

async function fetchData(url) {
  const separator = url.includes('?') ? '&' : '?';
  const uncachedUrl = `${url}${separator}_t=${Date.now()}`;
  const response = await axios.get(uncachedUrl);
  return array_check(response.data);
}

function array_check(response) {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && response.COLUMNS && response.DATA) {
    const cols = response.COLUMNS;
    const rowCount = (response.DATA[cols[0]] || []).length;
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
      const row = {};
      cols.forEach(c => { row[c.toLowerCase()] = response.DATA[c][i]; });
      rows.push(row);
    }
    return rows;
  }
  if (response && typeof response === 'object') {
    return [response];
  }
  return [];
}

export function getPatientInfo(patientId) {
  return fetchData(API_BASE_URL + '/patients/' + patientId);
}

export function getPrescribedMedications(patientId) {
  return fetchData(API_BASE_URL + '/prescription_medications/patient/' + patientId);
}

export function getReminders(patientId) {
  return fetchData(API_BASE_URL + '/reminders/' + patientId);
}

export function getRemindersByMedication(patientId, medicationId) {
  return fetchData(API_BASE_URL + '/reminders/patient/' + patientId + '/medication/' + medicationId);
}

export function searchDoctors(query) {
  const q = encodeURIComponent(query || '');
  return fetchData(API_BASE_URL + '/doctors/search?search_query=' + q);
}

export function getPatientSettings(patientId) {
  return fetchData(API_BASE_URL + '/patient_settings/' + patientId);
}






/*
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Example function to get data from a .cfc endpoint
export const getData = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    // Convert the .cfc JSON response to a standardized format
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
*/