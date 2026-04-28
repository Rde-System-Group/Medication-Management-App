import axios from 'axios';
import { apiFetch } from "./lib/calls";

const API_BASE = 'http://localhost:8500/Medication-Management-App/backend/api'; // <-- update later
const API_BASE_URL = 'http://20.57.128.226:8500/rest'; // For .cfc files
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

export const getAppointmentsAxios = async (patientId = null) => {
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

export const getPrescriptionsAxios = async (patientId) => {
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
  // Some ColdFusion endpoints return serialized JSON as a string.
  // Parse once so downstream normalization works consistently.
  if (typeof response === 'string') {
    const trimmed = response.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        response = JSON.parse(trimmed);
      } catch {
        return [];
      }
    } else {
      return [];
    }
  }

  if (Array.isArray(response)) {
    return response;
  }
  // ColdFusion queryFormat="struct" returns { COLUMNS: [...], DATA: { COL: [...] } }
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

// =================== GET ===================

export function getPatientInfo(patientId) {
  return fetchData(API_BASE_URL + '/patients/' + patientId);
}

export function getPrescribedMedications(patientId) {
  return fetchData(API_BASE_URL + '/prescription_medications/patient/' + patientId);
}

export function getReminders(patientId) {
  return fetchData(API_BASE_URL + '/reminders/' + patientId);
}

export function getAppointments(patientId) {
  return fetchData(API_BASE_URL + '/appointments/patient/' + patientId);
}

export function getRemindersByMedication(patientId, medicationId) {
  return fetchData(API_BASE_URL + '/reminders/patient/' + patientId + '/medication/' + medicationId);
}

export function getPrescriptions(patientId) {
  return fetchData(API_BASE_URL + '/prescriptions/patient/' + patientId);
}

export function getPatientSettings(patientId) {
  return fetchData(API_BASE_URL + '/patient_settings/' + patientId);
}

export function getAssignedDoctors(patientId) {
  return fetchData(API_BASE_URL + '/doctors/assigned/patient/' + patientId);
}

export function searchDoctors(query) {
  const q = encodeURIComponent(query || '');
  return fetchData(API_BASE_URL + '/doctors/search?search_query=' + q);
}

// =================== POST/PUT/DELETE ===================

export function assignDoctor(patientId, doctorId) {
  return axios.post(API_BASE_URL + '/doctors/assign', {
    patient_id: patientId,
    doctor_id: doctorId,
  }, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to assign doctor');
        backendError.response = { data: response.data };
        throw backendError;
      }
      return response.data;
    })
    .catch((error) => {
      console.error('Error assigning doctor:', error);
      console.error('Doctor assignment error response:', error.response?.data);
      throw error;
    });
}

export function unassignDoctor(patientId, doctorId) {
  return axios.delete(API_BASE_URL + '/doctors/assigned/patient/' + patientId + '/doctor/' + doctorId)
    .then((response) => {
      if (response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to unassign doctor');
        backendError.response = { data: response.data };
        throw backendError;
      }
      return response.data;
    })
    .catch((error) => {
      console.error('Error unassigning doctor:', error);
      console.error('Doctor unassignment error response:', error.response?.data);
      throw error;
    });
}

export function updatePatientSettings(patientId, patientData) {
  return axios.put(API_BASE_URL + '/patient_settings/' + patientId, patientData, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => {
      if (!Array.isArray(response.data) && response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to update patient settings');
        backendError.response = { data: response.data };
        throw backendError;
      }
      return array_check(response.data);
    })
    .catch(error => {
      console.error('Error updating patient settings:', error);
      console.error('Patient settings error response:', error.response?.data);
      throw error;
    });
}

export function postReminder(reminderData) {
  return axios.post(API_BASE_URL + '/reminders', reminderData, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => {
      if (!Array.isArray(response.data) && response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to create reminder');
        backendError.response = { data: response.data };
        throw backendError;
      }
      console.log('Reminder created successfully:', response.data);
      return response.data;
    })
    .catch(error => {
      console.error('Error creating reminder:', error);
      console.error('Reminder error response:', error.response?.data);
      throw error;
    });
}

export function deleteReminder(reminderId) {
  return axios.delete(API_BASE_URL + '/reminders/' + reminderId)
    .then(response => {
      if (response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to delete reminder');
        backendError.response = { data: response.data };
        throw backendError;
      }
      console.log('Reminder deleted successfully:', response.data);
      return response.data;
    })
    .catch(error => {
      console.error('Error deleting reminder:', error);
      console.error('Reminder delete error response:', error.response?.data);
      throw error;
    });
}


/*
  USER/AUTH
*/
export async function getAuthUser(){
  try {
    const res = await apiFetch("api/rest/auth/getAuthUser")
    return await authRes.json();
  } catch(err){
    console.log(err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}
export async function logoutUser(){
  try {
    const res = await apiFetch("api/rest/auth/logout")
    return await authRes.json();
  } catch(err){
    console.error("Logout API failed: ", err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}