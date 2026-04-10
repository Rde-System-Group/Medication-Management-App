<cfcomponent rest="true" restPath="appointments" name="Appointments" output="false">

    <cffunction name="getAppointmentsByPatient" access="remote" returntype="any" produces="application/json" httpMethod="GET"
                output="false" restPath="patient/{patient_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfquery datasource="rde_be" name="patient_appointment_results">
            SELECT
                appointment.id,
                appointment.patient_id AS p_ID,
                appointment.doctor_id AS d_ID,
                appointment.scheduled_start AS start,
                appointment.date AS d,
                appointment.reason AS r,
                appointment.status AS s,
                doctor.work_email
            FROM appointment
            JOIN doctor
            ON appointment.doctor_id = doctor.id
            WHERE doctor.is_active = 1
            AND 
            (
                appointment.patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            )
        </cfquery>

        <cfreturn serializeJSON(data=patient_appointment_results, queryFormat="struct")>
<! -- GET request for appointments by patient ID
      http://localhost:8500/rest/api/appointments/patient/1 -->
    </cffunction>

</cfcomponent>