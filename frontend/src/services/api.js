import axios from 'axios';


//I use .cfc files for ColdFusion components rather than cfm
//Here:communication with the ColdFusion backend API
// All API requests will be made to endpoints under this base URL

//because I used .cfc file (which returns a different structured JSON response compared to .cfm files) 
//the API response handling in the frontend needs to account for this different structure.
//The purpose of this file will be convert that JSON to a standardized format that the frontend can easily work with.


//note to self: API calls start with the prefix below
//recall prox, it forwards http://localhost:8500/rest/api
const API_BASE_URL = '/rest/api';

//from Zaid's example
const noCache = () => `&_=${Date.now()}`;


async function fetchData(url) {
 //example of url that will be inserted in this function: /rest/api/patients/123
  //clean URL by adding a cache-busting query parameter
  //the purpose of this is to ensure that the browser always fetches the latest data from the server rather than using a potentially outdated cached response
  const separator = url.includes('?') ? '&' : '?';
  const uncachedUrl = `${url}${separator}_t=${Date.now()}`;

  //the response variable holds the data returned from the API with any necessary caching prevention
  const response = await axios.get(uncachedUrl);
//response goes though array_check to ensure it is returned as an array
  return array_check(response.data);
}

function array_check(response){
  if (Array.isArray(response)) {
    return response;
  }
  // ColdFusion queryFormat="struct" returns { COLUMNS: ["ID","NAME",...], DATA: { ID:[1,2], NAME:["a","b"] } }
  // This converts it into a plain array of row objects: [{id:1, name:"a"}, {id:2, name:"b"}]
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


//getPatientInfo
//cfc file: get_patient_info.cfc
//path: /rest/api/patients/{patientId}
//Returns one row: { id, first_name, last_name, email, date_of_birth, gender }
//placement: patient info section @ patient dashboard AND patient profile
export function getPatientInfo(patientId) {
  return fetchData(API_BASE_URL + '/patients/' + patientId);
}


//getPrescribedMedications
//cfc file: get_patient_pres_medication.cfc
//path: /rest/api/prescription_medications/patient/{patientId}
//Returns array: [{ id, medication_name, dosage, supply, refills, is_active, ... }]
//placement: prescribed medications table @ patient dashboard AND patient profile
export function getPrescribedMedications(patientId) {
  return fetchData(API_BASE_URL + '/prescription_medications/patient/' + patientId);
}

//getReminders
//cfc file: get_all_medication_reminders_by_p.cfc
//path: /rest/api/reminders/{patientId}
//Returns array: [{ id, medication_name, reminder_time_1, title_of_reminder, ... }]
//placement: reminder card @ reminder table @ dashboard
export function getReminders(patientId) {
  return fetchData(API_BASE_URL + '/reminders/' + patientId);
}

//getRemindersByMedication
//cfc file: get_medication_reminders_by_medID.cfc
//path:   /rest/api/reminders/patient/{patientId}/medication/{medicationId}
//Returns array: reminders filtered by both patient AND a specific medication
//placement: TBD
export function getRemindersByMedication(patientId, medicationId) {
  return fetchData(API_BASE_URL + '/reminders/patient/' + patientId + '/medication/' + medicationId);
}


//getPrescriptions
//cfc file:get_patient_prescription.cfc
//path: /rest/api/prescriptions/patient/{patientId}
//Returns array: [{ id, doctor_id, patient_id, prescription_date, is_active }]
//placement: TBD - separate tab/page @ patient profile
// ──────────────────────────────────────────────────────────
export function getPrescriptions(patientId) {
  return fetchData(API_BASE_URL + '/prescriptions/patient/' + patientId);
}


// ──────────────────────────────────────────────────────────
//searchDoctors
//cfc file: search_doctors.cfc
//path: /rest/api/doctors/search?search_query={query}
//Returns array: [{ id, first_name, last_name, specialty, work_email }]
//placement: TBD - available for the Search page
// ──────────────────────────────────────────────────────────
export function searchDoctors(query) {
  // encodeURIComponent makes the search text safe to put in a URL
  // e.g. "Dr. Smith" becomes "Dr.%20Smith"
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