<cfcomponent rest="true" restPath="reminders" name="RemindersByMedication" output="false">

    <cffunction name="getRemindersByMedication_Patient" access="remote" returntype="any" produces="application/json" httpMethod="GET"
                output="false" restPath="patient/{patient_id}/medication/{medication_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfargument name="medication_id" required="true" restArgSource="path" type="numeric">

        <cfquery datasource="rde_be" name="reminder_by_med_and_patient_results">
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
                prescription_medication.medication_id,
                medication.medication_name,
                prescription_medication.instructions
            FROM medication_reminder
            JOIN prescription_medication
            ON medication_reminder.Prescription_Medication_ID = prescription_medication.id
            JOIN medication
            ON prescription_medication.medication_id = medication.id
            
            WHERE medication_reminder.is_active = 1
            AND medication_reminder.patient_ID = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            AND prescription_medication.medication_id = <cfqueryparam value="#arguments.medication_id#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>

        <cfreturn serializeJSON(data=reminder_by_med_and_patient_results, queryFormat="struct")>
<! -- GET request for reminders by patient ID and medication ID
      http://localhost:8500/rest/api/reminders/patient/1/medication/9 -->
    </cffunction>

</cfcomponent>