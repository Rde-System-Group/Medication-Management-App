/**
 * Base path: /api/doctor
 */
component 
    displayname="DoctorAPI"
    rest="true"
    restpath="/doctor"
    output="false" 
{
    // Services
    property name="patientService" type="components.PatientService";
    property name="appointmentService" type="components.AppointmentService";
    property name="prescriptionService" type="components.PrescriptionService";

    /**
     * Constructor - initialize services
     */
    public DoctorAPI function init() {
        variables.patientService = new components.PatientService();
        variables.appointmentService = new components.AppointmentService();
        variables.prescriptionService = new components.PrescriptionService();
        return this;
    }

    // ==========================================
    // PATIENT ENDPOINTS
    // ==========================================

    /**
     * GET /api/doctor/{doctorId}/patients
     * Search patients assigned to a doctor
     * Query params: firstName, lastName
     */
    remote struct function getPatients(
        required numeric doctorId restargsource="path",
        string firstName restargsource="query" default="",
        string lastName restargsource="query" default=""
    ) httpmethod="GET" restpath="/{doctorId}/patients" produces="application/json" {
        
        init();
        
        var patients = variables.patientService.searchPatients(
            doctorId = arguments.doctorId,
            firstName = arguments.firstName,
            lastName = arguments.lastName
        );
        
        // Convert query to array of structs
        var patientArray = [];
        for (var row in patients) {
            arrayAppend(patientArray, {
                "patient_id": row.patient_id,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "email": row.email,
                "phone_number": row.phone_number,
                "date_of_birth": dateFormat(row.date_of_birth, "yyyy-mm-dd"),
                "gender": row.gender,
                "sex": row.sex,
                "ethnicity": row.ethnicity ? "Hispanic/Latino" : "Not Hispanic/Latino"
            });
        }
        
        return {
            "success": true,
            "count": arrayLen(patientArray),
            "patients": patientArray
        };
    }

    /**
     * GET /api/doctor/{doctorId}/patients/{patientId}
     * Get a specific patient's profile
     */
    remote struct function getPatientProfile(
        required numeric doctorId restargsource="path",
        required numeric patientId restargsource="path"
    ) httpmethod="GET" restpath="/{doctorId}/patients/{patientId}" produces="application/json" {
        
        init();
        
        var patient = variables.patientService.getPatientProfile(
            doctorId = arguments.doctorId,
            patientId = arguments.patientId
        );
        
        if (structIsEmpty(patient)) {
            restSetResponse({
                "status": 403,
                "content": {
                    "success": false,
                    "message": "Patient not found or not authorized"
                }
            });
            return {
                "success": false,
                "message": "Patient not found or not authorized"
            };
        }
        
        return {
            "success": true,
            "patient": patient
        };
    }

    // ==========================================
    // APPOINTMENT ENDPOINTS
    // ==========================================

    /**
     * GET /api/doctor/{doctorId}/appointments
     * Get all appointments for a doctor
     * Query params: startDate, endDate
     */
    remote struct function getAppointments(
        required numeric doctorId restargsource="path",
        string startDate restargsource="query" default="",
        string endDate restargsource="query" default=""
    ) httpmethod="GET" restpath="/{doctorId}/appointments" produces="application/json" {
        
        init();
        
        var appointments = variables.appointmentService.getDoctorAppointments(
            doctorId = arguments.doctorId,
            startDate = isDate(arguments.startDate) ? arguments.startDate : "",
            endDate = isDate(arguments.endDate) ? arguments.endDate : ""
        );
        
        // Convert query to array
        var appointmentArray = [];
        for (var row in appointments) {
            arrayAppend(appointmentArray, {
                "appointment_id": row.appointment_id,
                "patient_id": row.patient_id,
                "patient_name": row.patient_first_name & " " & row.patient_last_name,
                "date": dateFormat(row.date, "yyyy-mm-dd"),
                "scheduled_start": timeFormat(row.scheduled_start, "HH:mm"),
                "scheduled_end": timeFormat(row.scheduled_end, "HH:mm"),
                "reason": row.reason
            });
        }
        
        return {
            "success": true,
            "count": arrayLen(appointmentArray),
            "appointments": appointmentArray
        };
    }

    /**
     * GET /api/doctor/{doctorId}/patients/{patientId}/appointments
     * Get appointments for a specific patient
     */
    remote struct function getPatientAppointments(
        required numeric doctorId restargsource="path",
        required numeric patientId restargsource="path"
    ) httpmethod="GET" restpath="/{doctorId}/patients/{patientId}/appointments" produces="application/json" {
        
        init();
        
        var appointments = variables.appointmentService.getPatientAppointments(
            doctorId = arguments.doctorId,
            patientId = arguments.patientId
        );
        
        var appointmentArray = [];
        for (var row in appointments) {
            arrayAppend(appointmentArray, {
                "appointment_id": row.appointment_id,
                "date": dateFormat(row.date, "yyyy-mm-dd"),
                "scheduled_start": timeFormat(row.scheduled_start, "HH:mm"),
                "scheduled_end": timeFormat(row.scheduled_end, "HH:mm"),
                "reason": row.reason
            });
        }
        
        return {
            "success": true,
            "count": arrayLen(appointmentArray),
            "appointments": appointmentArray
        };
    }

    /**
     * POST /api/doctor/{doctorId}/patients/{patientId}/appointments
     * Create a new appointment
     */
    remote struct function createAppointment(
        required numeric doctorId restargsource="path",
        required numeric patientId restargsource="path",
        required string date restargsource="form",
        required string scheduledStart restargsource="form",
        required string scheduledEnd restargsource="form",
        required string reason restargsource="form"
    ) httpmethod="POST" restpath="/{doctorId}/patients/{patientId}/appointments" produces="application/json" consumes="application/json,application/x-www-form-urlencoded" {
        
        init();
        
        var result = variables.appointmentService.createAppointment(
            doctorId = arguments.doctorId,
            patientId = arguments.patientId,
            date = arguments.date,
            scheduledStart = arguments.scheduledStart,
            scheduledEnd = arguments.scheduledEnd,
            reason = arguments.reason
        );
        
        if (!result.success) {
            restSetResponse({ "status": 400 });
        }
        
        return result;
    }

    // ==========================================
    // PRESCRIPTION ENDPOINTS
    // ==========================================

    /**
     * GET /api/doctor/{doctorId}/patients/{patientId}/prescriptions
     * Get prescriptions for a patient
     */
    remote struct function getPatientPrescriptions(
        required numeric doctorId restargsource="path",
        required numeric patientId restargsource="path"
    ) httpmethod="GET" restpath="/{doctorId}/patients/{patientId}/prescriptions" produces="application/json" {
        
        init();
        
        var prescriptions = variables.prescriptionService.getPatientPrescriptions(
            doctorId = arguments.doctorId,
            patientId = arguments.patientId
        );
        
        return {
            "success": true,
            "count": arrayLen(prescriptions),
            "prescriptions": prescriptions
        };
    }

    /**
     * POST /api/doctor/{doctorId}/patients/{patientId}/prescriptions
     * Create a new prescription with medications
     * Body: { "medications": [ { medication_id, dosage, supply, ... }, ... ] }
     */
    remote struct function createPrescription(
        required numeric doctorId restargsource="path",
        required numeric patientId restargsource="path"
    ) httpmethod="POST" restpath="/{doctorId}/patients/{patientId}/prescriptions" produces="application/json" consumes="application/json" {
        
        init();
        
        // Parse JSON body
        var requestBody = toString(getHTTPRequestData().content);
        var data = deserializeJSON(requestBody);
        
        if (!structKeyExists(data, "medications") || !isArray(data.medications)) {
            restSetResponse({ "status": 400 });
            return {
                "success": false,
                "message": "medications array is required"
            };
        }
        
        var result = variables.prescriptionService.createPrescription(
            doctorId = arguments.doctorId,
            patientId = arguments.patientId,
            medications = data.medications
        );
        
        if (!result.success) {
            restSetResponse({ "status": 400 });
        }
        
        return result;
    }

    /**
     * GET /api/doctor/medications
     * Get all available medications for dropdown
     */
    remote struct function getMedications()
        httpmethod="GET" restpath="/medications" produces="application/json" {
        
        init();
        
        var medications = variables.prescriptionService.getAllMedications();
        
        var medArray = [];
        for (var row in medications) {
            arrayAppend(medArray, {
                "id": row.id,
                "medication_name": row.medication_name,
                "side_effects": row.side_effects,
                "price": row.price
            });
        }
        
        return {
            "success": true,
            "count": arrayLen(medArray),
            "medications": medArray
        };
    }
}