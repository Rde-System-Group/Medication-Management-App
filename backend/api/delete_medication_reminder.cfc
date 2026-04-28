<cfcomponent rest="true" restPath="reminders" name="ReminderDelete" output="false">

    <cffunction name="deleteReminder" access="remote" returntype="any" produces="application/json" httpMethod="DELETE" 
                output="false" restPath="{reminder_id}">

        <cfargument name="reminder_id" required="true" restArgSource="path" type="numeric">

            <cfquery datasource="rde_be" name="select_target_reminder">
                SELECT
                medication_reminder.id,
                medication_reminder.patient_ID AS patient_id
                FROM medication_reminder
                WHERE medication_reminder.is_active = 1
                AND
                medication_reminder.id = <cfqueryparam value="#arguments.reminder_id#" cfsqltype="CF_SQL_BIGINT">     	
            </cfquery>            	

            <cfif select_target_reminder.recordCount EQ 0>
                <cfreturn serializeJSON({ "message": "Reminder not found." })>            	
            </cfif>

            <cfset _jwt = createObject("component","JwtSessionService")>
            <cfset _a = _jwt.requirePatient(val(select_target_reminder.patient_id))>
            <cfif NOT _a.authorized>
                <cfset restSetResponse({ status: _a.httpStatus })>
                <cfreturn serializeJSON({ "success": false, "message": _a.message })>
            </cfif>

            <cfquery datasource="rde_be" name="delete_reminder">
                UPDATE medication_reminder
                SET is_active = 0
                WHERE medication_reminder.id = <cfqueryparam value="#arguments.reminder_id#" cfsqltype="CF_SQL_BIGINT">
            </cfquery>                	
        
        <cfreturn serializeJSON({ "message": "Reminder deleted successfully.", "reminder_id": arguments.reminder_id })>
        <!-- GET request for reminders by patient ID
        http://localhost:8500/rest/api/reminders/5 -->
    </cffunction>

</cfcomponent>

