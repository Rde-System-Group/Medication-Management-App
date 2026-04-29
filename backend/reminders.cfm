<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, DELETE, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type, Authorization">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.patientId" default="0">
<cfparam name="url.reminderId" default="0">
<cfset patientId = val(url.patientId)>
<cfset reminderId = val(url.reminderId)>

<cfif patientId EQ 0>
    <cfset response = { "success": false, "message": "patientId is required" }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cfset _jwt = createObject("component","api.JwtSessionService")>
<cfset _a = _jwt.requirePatient(patientId)>
<cfif NOT _a.authorized>
    <cfheader statuscode="#_a.httpStatus#">
    <cfset response = { "success": false, "message": _a.message }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cftry>
    <cfif cgi.request_method EQ "POST">
        <cfset requestBody = toString(getHTTPRequestData().content)>
        <cfset data = len(trim(requestBody)) ? deserializeJSON(requestBody) : {}>

        <cfset prescriptionMedicationId = val(data.prescription_medication_id ?: 0)>
        <cfset titleOfReminder = data.title_of_reminder ?: "">
        <cfset startDate = data.start_date_of_reminder ?: "">
        <cfset endDate = data.end_date_of_reminder ?: "">
        <cfset reminderTimes = (structKeyExists(data, "reminder_times") AND isArray(data.reminder_times)) ? data.reminder_times : []>

        <cfif prescriptionMedicationId EQ 0>
            <cfset response = { "success": false, "message": "prescription_medication_id is required" }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>

        <cfif NOT len(trim(titleOfReminder)) OR NOT len(trim(startDate)) OR NOT len(trim(endDate))>
            <cfset response = { "success": false, "message": "Reminder name, start date, and end date are required" }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>

        <cfquery datasource="rde_be" name="qMedicationCheck">
            SELECT COUNT(*) AS cnt
            FROM prescription_medication
            JOIN prescription ON prescription_medication.prescription_id = prescription.id
            WHERE prescription_medication.id = <cfqueryparam value="#prescriptionMedicationId#" cfsqltype="CF_SQL_BIGINT">
              AND prescription.patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
              AND prescription_medication.is_active = 1
              AND prescription.is_active = 1
        </cfquery>

        <cfif qMedicationCheck.cnt EQ 0>
            <cfset response = { "success": false, "message": "Medication not found for this patient" }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>

        <cfquery datasource="rde_be" name="qNextReminderId">
            SELECT ISNULL(MAX(id), 0) + 1 AS id
            FROM medication_reminder
        </cfquery>

        <cfquery datasource="rde_be" name="qInsertReminder">
            INSERT INTO medication_reminder (
                id,
                patient_id,
                Prescription_Medication_ID,
                title_of_reminder,
                start_date_of_reminder,
                end_date_of_reminder,
                remind_mon,
                remind_tues,
                remind_wed,
                remind_thurs,
                remind_fri,
                remind_sat,
                remind_sun,
                reminder_time_1,
                reminder_time_2,
                reminder_time_3,
                reminder_time_4,
                is_active
            )
            OUTPUT INSERTED.id
            VALUES (
                <cfqueryparam value="#qNextReminderId.id[1]#" cfsqltype="CF_SQL_BIGINT">,
                <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">,
                <cfqueryparam value="#prescriptionMedicationId#" cfsqltype="CF_SQL_BIGINT">,
                <cfqueryparam value="#titleOfReminder#" cfsqltype="CF_SQL_VARCHAR">,
                <cfqueryparam value="#startDate#" cfsqltype="CF_SQL_DATE">,
                <cfqueryparam value="#endDate#" cfsqltype="CF_SQL_DATE">,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                <cfqueryparam value="#arrayLen(reminderTimes) GTE 1 ? reminderTimes[1] : ''#" cfsqltype="CF_SQL_TIME" null="#arrayLen(reminderTimes) LT 1#">,
                <cfqueryparam value="#arrayLen(reminderTimes) GTE 2 ? reminderTimes[2] : ''#" cfsqltype="CF_SQL_TIME" null="#arrayLen(reminderTimes) LT 2#">,
                <cfqueryparam value="#arrayLen(reminderTimes) GTE 3 ? reminderTimes[3] : ''#" cfsqltype="CF_SQL_TIME" null="#arrayLen(reminderTimes) LT 3#">,
                <cfqueryparam value="#arrayLen(reminderTimes) GTE 4 ? reminderTimes[4] : ''#" cfsqltype="CF_SQL_TIME" null="#arrayLen(reminderTimes) LT 4#">,
                1
            )
        </cfquery>

        <cfset response = { "success": true, "message": "Reminder created", "id": qInsertReminder.id[1] }>

    <cfelseif cgi.request_method EQ "DELETE">
        <cfif reminderId EQ 0>
            <cfset response = { "success": false, "message": "reminderId is required" }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>
        <cfquery datasource="rde_be" name="qDelete">
            UPDATE medication_reminder
            SET is_active = 0
            WHERE id = <cfqueryparam value="#reminderId#" cfsqltype="CF_SQL_BIGINT">
              AND patient_ID = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>
        <cfset response = { "success": true, "message": "Reminder deleted" }>
    <cfelse>
        <cfquery datasource="rde_be" name="qReminders">
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
            JOIN prescription_medication ON medication_reminder.Prescription_Medication_ID = prescription_medication.id
            JOIN medication ON prescription_medication.medication_id = medication.id
            WHERE medication_reminder.is_active = 1
              AND medication_reminder.patient_ID = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
            ORDER BY medication_reminder.reminder_time_1 ASC
        </cfquery>

        <cfset reminders = []>
        <cfloop query="qReminders">
            <cfset arrayAppend(reminders, {
                "id": qReminders.id,
                "patient_ID": qReminders.patient_ID,
                "Prescription_Medication_ID": qReminders.Prescription_Medication_ID,
                "title_of_reminder": qReminders.title_of_reminder,
                "start_date_of_reminder": isNull(qReminders.start_date_of_reminder) ? "" : dateFormat(qReminders.start_date_of_reminder, "yyyy-mm-dd"),
                "end_date_of_reminder": isNull(qReminders.end_date_of_reminder) ? "" : dateFormat(qReminders.end_date_of_reminder, "yyyy-mm-dd"),
                "remind_mon": qReminders.remind_mon,
                "remind_tues": qReminders.remind_tues,
                "remind_wed": qReminders.remind_wed,
                "remind_thurs": qReminders.remind_thurs,
                "remind_fri": qReminders.remind_fri,
                "remind_sat": qReminders.remind_sat,
                "remind_sun": qReminders.remind_sun,
                "REMINDER_TIME_1": isNull(qReminders.reminder_time_1) ? "" : timeFormat(qReminders.reminder_time_1, "HH:mm"),
                "REMINDER_TIME_2": isNull(qReminders.reminder_time_2) ? "" : timeFormat(qReminders.reminder_time_2, "HH:mm"),
                "REMINDER_TIME_3": isNull(qReminders.reminder_time_3) ? "" : timeFormat(qReminders.reminder_time_3, "HH:mm"),
                "REMINDER_TIME_4": isNull(qReminders.reminder_time_4) ? "" : timeFormat(qReminders.reminder_time_4, "HH:mm"),
                "instructions": qReminders.instructions,
                "medication_name": qReminders.medication_name
            })>
        </cfloop>

        <cfset response = { "success": true, "count": arrayLen(reminders), "reminders": reminders }>
    </cfif>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
