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

//=======================================GET REQUESTS========================================================
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

//getAppointments
//cfc file: get_patient_appointments.cfc
//path: /rest/api/appointments/patient/{patientId}
//Returns array: [{ id, p_id, d_id, start, d, r, s, work_email }]
//placement: appointments page calendar + upcoming list
export function getAppointments(patientId) {
  return fetchData(API_BASE_URL + '/appointments/patient/' + patientId);
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

export function getPatientSettings(patientId) {
  return fetchData(API_BASE_URL + '/patient_settings/' + patientId);
}
export function getAssignedDoctors(patientId) {
  return fetchData(API_BASE_URL + '/doctors/assigned/patient/' + patientId);
}

//searchDoctors
//cfc file: search_doctors.cfc
//path: /rest/api/doctors/search?search_query={query}
//Returns array: [{ id, first_name, last_name, specialty, work_email }]
//placement: doctor search page
export function searchDoctors(query) {
  const q = encodeURIComponent(query || '');
  return fetchData(API_BASE_URL + '/doctors/search?search_query=' + q);
}

//=======================================POST/PUT/DELETE REQUESTS========================================================

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

export function postReminder(reminderData)
{
  const output = axios.post(API_BASE_URL + '/reminders', reminderData, {
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => {
      if (!Array.isArray(response.data) && response.data?.success === false) {
        const backendError = new Error(response.data.detail || response.data.message || 'Unable to create reminder');
        backendError.response = { data: response.data };
        throw backendError;
      }

      // Handle the response from the server
      console.log('Reminder created successfully:', response.data);
      return response.data; // Return the created reminder data
    })
    .catch(error => {
      // Handle any errors that occur during the request
      console.error('Error creating reminder:', error);
      console.error('Reminder error response:', error.response?.data);
      throw error; // Rethrow the error to be handled by the caller
    });
  return output;
}

export function deleteReminder(reminderId)
{
  const output = axios.delete(API_BASE_URL + '/reminders/' + reminderId)
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
  return output;
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