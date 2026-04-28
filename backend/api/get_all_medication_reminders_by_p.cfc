<cfcomponent rest="true" restPath="reminders" name="RemindersByPatient" output="false">

    <cffunction name="getRemindersByPatient" access="remote" returntype="any" produces="application/json" httpMethod="GET" 
                output="false" restPath="{patient_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
            <cfset _jwt = createObject("component","JwtSessionService")>
            <cfset _a = _jwt.requirePatient(arguments.patient_id)>
            <cfif NOT _a.authorized>
                <cfset restSetResponse({ status: _a.httpStatus })>
                <cfreturn serializeJSON({ "success": false, "message": _a.message })>
            </cfif>
            <cfquery datasource="rde_be" name="patient_reminder_results">
                SELECT
                medication_reminder.id,
                medication_reminder.patient_ID,
                medication_reminder.Prescription_Medication_ID,
                medication_reminder.title_of_reminder,
                medication_reminder.start_date_of_reminder,
                medication_reminder.end_date_of_reminder,
                medication_reminder.remind_mon,
                medication_reminder.remind_tues,
                medication_reminder.remind_wed,
                medication_reminder.remind_thurs,
                medication_reminder.remind_fri,
                medication_reminder.remind_sat,
                medication_reminder.remind_sun,
                medication_reminder.reminder_time_1,
                medication_reminder.reminder_time_2,
                medication_reminder.reminder_time_3,
                medication_reminder.reminder_time_4,
                prescription_medication.instructions,
                medication.medication_name
            FROM medication_reminder
            JOIN prescription_medication
            ON medication_reminder.Prescription_Medication_ID = prescription_medication.id
            JOIN medication
            ON prescription_medication.medication_id = medication.id
            WHERE medication_reminder.is_active = 1
            AND
            medication_reminder.patient_ID = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">     	
            ORDER BY medication_reminder.reminder_time_1 ASC
            </cfquery>
        <cfreturn serializeJSON(data=patient_reminder_results, queryFormat="struct")>
<! -- GET request for reminders by patient ID
      http://localhost:8500/rest/api/reminders/5 -->
    </cffunction>

</cfcomponent>

