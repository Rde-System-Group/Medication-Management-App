import axios from 'axios';
import { AUTH_TOKEN_STORAGE_KEY, apiFetch } from '../lib/calls';

axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  try {
    const t = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (t) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${t}`;
    }
  } catch {
    /* ignore */
  }
  return config;
});

const API_BASE = '/cfm'; // <-- update later
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; // For .cfc files
// NOTE: The legacy axios-based .cfm helpers below originally read a hardcoded
// DOCTOR_ID constant. Most are unused (PatientProfile et al. now go through
// `apiFetch`/`/api/rest/doctor/:id/...`), so we only fall back to 0 here so a
// missing doctorId argument visibly fails instead of silently leaking another
// doctor's data.
const FALLBACK_DOCTOR_ID = 0;

// Add cache-busting to prevent stale data
const noCache = () => `&_=${Date.now()}`;

// ============================================
// AXIOS-BASED API CALLS (.cfm endpoints)
// ============================================

export const searchPatients = async (firstName = '', lastName = '', doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.get(`${API_BASE}/patients.cfm?doctorId=${doctorId}&firstName=${firstName}&lastName=${lastName}${noCache()}`);
  return res.data;
};

export const getPatient = async (patientId, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.get(`${API_BASE}/patient.cfm?doctorId=${doctorId}&patientId=${patientId}${noCache()}`);
  return res.data;
};

export const getAppointmentsAxios = async (patientId = null, doctorId = FALLBACK_DOCTOR_ID) => {
  let url = `${API_BASE}/appointments.cfm?doctorId=${doctorId}`;
  if (patientId) url += `&patientId=${patientId}`;
  const res = await axios.get(url + noCache());
  return res.data;
};

export const createAppointment = async (data, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.post(`${API_BASE}/appointments.cfm?doctorId=${doctorId}`, data);
  return res.data;
};

export const updateAppointment = async (appointmentId, data, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.put(`${API_BASE}/appointments.cfm?doctorId=${doctorId}&appointmentId=${appointmentId}`, data);
  return res.data;
};

export const cancelAppointment = async (appointmentId, reason, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.put(`${API_BASE}/appointments.cfm?doctorId=${doctorId}&appointmentId=${appointmentId}`, { action: 'cancel', reason });
  return res.data;
};

export const getPrescriptionsAxios = async (patientId, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.get(`${API_BASE}/prescriptions.cfm?doctorId=${doctorId}&patientId=${patientId}${noCache()}`);
  return res.data;
};

export const createPrescription = async (patientId, medications, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.post(`${API_BASE}/prescriptions.cfm?doctorId=${doctorId}&patientId=${patientId}`, { medications });
  return res.data;
};

export const updatePrescription = async (patientId, prescriptionId, medications, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.put(`${API_BASE}/prescriptions.cfm?doctorId=${doctorId}&patientId=${patientId}&prescriptionId=${prescriptionId}`, { medications });
  return res.data;
};

export const deletePrescription = async (patientId, prescriptionId, doctorId = FALLBACK_DOCTOR_ID) => {
  const res = await axios.delete(`${API_BASE}/prescriptions.cfm?doctorId=${doctorId}&patientId=${patientId}&prescriptionId=${prescriptionId}`);
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

function extractLeadingJson(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return null;
  }

  const firstChar = trimmed[0];
  if (firstChar !== '{' && firstChar !== '[') {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{' || char === '[') {
      depth += 1;
      continue;
    }

    if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(0, index + 1);
      }
    }
  }

  return trimmed;
}

function array_check(response) {
  // Some ColdFusion endpoints return serialized JSON as a string.
  // Parse once so downstream normalization works consistently.
  if (typeof response === 'string') {
    const jsonPayload = extractLeadingJson(response);
    if (jsonPayload) {
      try {
        response = JSON.parse(jsonPayload);
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
  const arrayKeys = ['patients', 'patient', 'medications', 'reminders', 'appointments', 'providers', 'doctors', 'prescriptions'];
  for (const key of arrayKeys) {
    if (Array.isArray(response?.[key])) {
      return response[key];
    }
  }
  if (response?.patient && typeof response.patient === 'object') {
    return [response.patient];
  }
  if (response && typeof response === 'object') {
    return [response];
  }
  return [];
}

// =================== GET ===================

export function getPatientInfo(patientId) {
  return fetchData('/cfm/patient_self.cfm?patientId=' + encodeURIComponent(patientId));
}

export function getPrescribedMedications(patientId) {
  return fetchData('/cfm/patient_medications.cfm?patientId=' + encodeURIComponent(patientId));
}

export function getReminders(patientId) {
  return fetchData('/cfm/reminders.cfm?patientId=' + encodeURIComponent(patientId));
}

export function getAppointments(patientId) {
  return fetchData('/cfm/patient_appointments.cfm?patientId=' + encodeURIComponent(patientId));
}

export function getRemindersByMedication(patientId, medicationId) {
  return fetchData(API_BASE_URL + '/rest/reminders/patient/' + patientId + '/medication/' + medicationId);
}

export function getPrescriptions(patientId) {
  return fetchData(API_BASE_URL + '/rest/prescriptions/patient/' + patientId);
}

export function getPatientSettings(patientId) {
  return fetchData('/cfm/patient_self.cfm?patientId=' + encodeURIComponent(patientId));
}

export function getAssignedDoctors(patientId) {
  return fetchData('/cfm/assigned_doctors.cfm?patientId=' + encodeURIComponent(patientId));
}

export function searchDoctors(query) {
  const q = encodeURIComponent(query || '');
  return fetchData('/cfm/doctors.cfm?action=search&search_query=' + q);
}

// =================== POST/PUT/DELETE ===================

export function assignDoctor(patientId, doctorId) {
  return axios.post('/cfm/doctors.cfm?action=assign&patientId=' + encodeURIComponent(patientId) + '&doctorId=' + encodeURIComponent(doctorId), null, {
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
  return axios.delete('/cfm/doctors.cfm?action=unassign&patientId=' + encodeURIComponent(patientId) + '&doctorId=' + encodeURIComponent(doctorId))
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
  return axios.put(API_BASE_URL + '/rest/patient_settings/' + patientId, patientData, {
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
  return axios.post('/cfm/reminders.cfm?patientId=' + encodeURIComponent(reminderData.patient_id), reminderData, {
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

export function deleteReminder(reminderId, patientId) {
  return axios.delete(`/cfm/reminders.cfm?patientId=${encodeURIComponent(patientId)}&reminderId=${encodeURIComponent(reminderId)}`)
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
  USER / AUTH
*/
export async function getAuthUser(){
  try {
    const res = await apiFetch(`/rest/auth/getAuthUser`)
    if (!res || !res.ok) {throw new Error("Request failed!")}
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::getAuthUser",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}
export async function getAuthRole(){
  try {
    const res = await apiFetch(`/rest/auth/getAuthRole`)
    if (!res || !res.ok) {throw new Error("Request failed!")}
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::getAuthRole",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}
export async function loginUser(body){
  try {
    const res = await apiFetch(`/rest/auth/login`,body)
    if (!res || !res.ok) {throw new Error("Request failed!")}
    console.log(res)
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::loginUser",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}
export async function logoutUser(){
  try {
    const res = await apiFetch(`/rest/auth/logout`)
    if (!res || !res.ok) {throw new Error("Request failed!")}
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::logoutUser",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}

export async function updateUser(url, body){
  try {
    const res = await apiFetch(url, body)
    if (!res || !res.ok) {throw new Error("Request failed!")}
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::updateUser",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}

export async function deleteUser(){
  try {
    const res = await apiFetch("rest/user/delete", {
      method: "POST", body: JSON.stringify({delete: true})
    })
    if (!res || !res.ok) {throw new Error("Request failed!")}
    const json = await res.json();
    return json
  } catch(err){
    console.log("api.js::deleteUser",err)
    return {valid: false, error: true, message: "Unknown error."}
  }
}