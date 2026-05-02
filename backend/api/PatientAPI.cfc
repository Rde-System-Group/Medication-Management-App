/**
 * Base path: /api/patient
 */
component 
    displayname="PatientAPI"
    rest="true"
    restpath="/patient"
    output="false" 
{
    public PatientAPI function init() {
        variables.appointmentService = createObject("component", "AppointmentService").init();
        variables.jwtSession = createObject("component", "JwtSessionService");
        return this;
    }

    private string function safeDate(value) {
        if (isNull(arguments.value) || !isDate(arguments.value)) return "";
        return dateFormat(arguments.value, "yyyy-mm-dd");
    }

    private string function safeTime(value) {
        if (isNull(arguments.value) || !isDate(arguments.value)) return "";
        return timeFormat(arguments.value, "HH:mm");
    }

    private string function safeDecrypt(value) {
        if (isNull(arguments.value)) return "";
        try {
            return decrypt(arguments.value, application.encryptSecret, "AES", "Base64");
        } catch (any e) {
            return arguments.value;
        }
    }

    /**
     * GET /api/patient/{patientId}/appointments
     * Get all appointments for a patient (across all doctors)
     */
    remote struct function getMyAppointments(
        required numeric patientId restargsource="path"
    ) httpmethod="GET" restpath="/{patientId}/appointments" produces="application/json" {
        
        init();
        var authz = variables.jwtSession.requirePatient(arguments.patientId);
        if (!authz.authorized) {
            restSetResponse({ "status": authz.httpStatus });
            return { "success": false, "message": authz.message };
        }

        var appointments = variables.appointmentService.getAllAppointmentsForPatient(
            patientId = arguments.patientId
        );

        var appointmentArray = [];
        for (var row in appointments) {
            arrayAppend(appointmentArray, {
                "appointment_id": row.appointment_id,
                "doctor_id": row.doctor_id,
                "doctor_name": trim(safeDecrypt(row.doctor_first_name) & " " & safeDecrypt(row.doctor_last_name)),
                "date": safeDate(row.date),
                "scheduled_start": safeTime(row.scheduled_start),
                "scheduled_end": safeTime(row.scheduled_end),
                "reason": row.reason,
                "status": row.status,
                "cancellation_reason": row.cancellation_reason
            });
        }

        return {
            "success": true,
            "count": arrayLen(appointmentArray),
            "appointments": appointmentArray
        };
    }
}
