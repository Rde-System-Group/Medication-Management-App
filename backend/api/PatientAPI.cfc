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
        variables.appointmentService = new AppointmentService();
        return this;
    }

    /**
     * GET /api/patient/{patientId}/appointments
     * Get all appointments for a patient (across all doctors)
     */
    remote struct function getMyAppointments(
        required numeric patientId restargsource="path"
    ) httpmethod="GET" restpath="/{patientId}/appointments" produces="application/json" {
        
        init();

        var appointments = variables.appointmentService.getAllAppointmentsForPatient(
            patientId = arguments.patientId
        );

        var appointmentArray = [];
        for (var row in appointments) {
            arrayAppend(appointmentArray, {
                "appointment_id": row.appointment_id,
                "doctor_id": row.doctor_id,
                "doctor_name": row.doctor_first_name & " " & row.doctor_last_name,
                "date": dateFormat(row.date, "yyyy-mm-dd"),
                "scheduled_start": timeFormat(row.scheduled_start, "HH:mm"),
                "scheduled_end": timeFormat(row.scheduled_end, "HH:mm"),
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
