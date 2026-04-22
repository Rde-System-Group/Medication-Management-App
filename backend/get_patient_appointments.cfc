<cfcomponent rest="true" restPath="appointments" name="Appointments" output="false">

    <cffunction name="getAppointmentsByPatient" access="remote" returntype="any" produces="application/json" httpMethod="GET"
                output="false" restPath="patient/{patient_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfquery datasource="rde_be" name="patient_appointment_results">
            SELECT
                appointment.id AS appointment_id,
                appointment.patient_id,
                appointment.doctor_id,
                appointment.scheduled_start,
                appointment.scheduled_end,
                appointment.date,
                appointment.reason,
                appointment.status,
                doctor.work_email as doctor_email,
                isNull(appointment.status, 'scheduled') AS status,
                isNull(appointment.cancellation_reason, '') AS cancellation_reason
            FROM appointment
            JOIN doctor
            ON appointment.doctor_id = doctor.id
            WHERE doctor.is_active = 1
            AND 
            (
                appointment.patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            )
            ORDER BY appointment.date ASC, appointment.scheduled_start ASC
        </cfquery>

        <cfreturn serializeJSON(data=patient_appointment_results, queryFormat="struct")>
<! -- GET request for appointments by patient ID
      http://localhost:8500/rest/api/appointments/patient/1 -->
    </cffunction>

</cfcomponent>