<cfcomponent rest="true" restPath="reminders" name="CreateReminder" output="false">

    <cffunction
        name="createReminder" access="remote" returntype="any" produces="application/json" httpMethod="POST" output="false" restPath="">

        <cfset var requestData = getHttpRequestData()>
        <cfset var cleaned_request = {}>
        <cfset var createdReminder = "">
        <cfset var nextReminderId = "">
        <cfset var insertedReminderId = "">

        <cfset var patient_ID = "">
        <cfset var prescription_medication_ID = "">
        <cfset var title_of_reminder = "">
        <cfset var start_date = "">
        <cfset var end_date = "">

        <cfset var  Mon = 0>
        <cfset var Tues = 0>
        <cfset var Wed = 0>
        <cfset var Thurs = 0>
        <cfset var Fri = 0>
        <cfset var Sat = 0>
        <cfset var Sun = 0>

        <cfset var Time1 = "">
        <cfset var Time2 = "">
        <cfset var Time3 = "">
        <cfset var Time4 = "">
        <cfset var Times = []>

        <cfif structKeyExists(requestData, "content") AND len(trim(requestData.content))>
            <cfset cleaned_request = deserializeJSON(requestData.content)>
        </cfif>

        <cfif structKeyExists(cleaned_request, "patient_id")>
            <cfset patient_ID = cleaned_request.patient_id>
        </cfif>

        <cfif structKeyExists(cleaned_request, "prescription_medication_id")>
            <cfset prescription_medication_ID = cleaned_request.prescription_medication_id>
        </cfif>

        <cfif structKeyExists(cleaned_request, "title_of_reminder")>
            <cfset title_of_reminder = cleaned_request.title_of_reminder>
        </cfif>

        <cfif structKeyExists(cleaned_request, "start_date_of_reminder")>
            <cfset start_date = cleaned_request.start_date_of_reminder>
        </cfif>

        <cfif structKeyExists(cleaned_request, "end_date_of_reminder")>
            <cfset end_date = cleaned_request.end_date_of_reminder>
        </cfif>

        <cfif structKeyExists(cleaned_request, "remind_mon")>
            <cfset Mon = cleaned_request.remind_mon>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_tues")>
            <cfset Tues = cleaned_request.remind_tues>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_wed")>
            <cfset Wed = cleaned_request.remind_wed>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_thurs")>
            <cfset Thurs = cleaned_request.remind_thurs>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_fri")>
            <cfset Fri = cleaned_request.remind_fri>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_sat")>
            <cfset Sat = cleaned_request.remind_sat>
        </cfif>
        <cfif structKeyExists(cleaned_request, "remind_sun")>
            <cfset Sun = cleaned_request.remind_sun>
        </cfif>

        <cfif structKeyExists(cleaned_request, "reminder_times") AND isArray(cleaned_request.reminder_times)>
            <cfset Times = cleaned_request.reminder_times>
            <cfif arrayLen(Times) GTE 1>
                <cfset Time1 = Times[1]>
            </cfif>
            <cfif arrayLen(Times) GTE 2>
                <cfset Time2 = Times[2]>
            </cfif>
            <cfif arrayLen(Times) GTE 3>
                <cfset Time3 = Times[3]>
            </cfif>
            <cfif arrayLen(Times) GTE 4>
                <cfset Time4 = Times[4]>
            </cfif>
        </cfif>

        <cfif NOT len(trim(patient_ID))>
            <cfreturn serializeJSON({"success": false, "message": "patient_id is required"})>
        </cfif>

        <cfset _jwt = createObject("component","JwtSessionService")>
        <cfset _a = _jwt.requirePatient(val(patient_ID))>
        <cfif NOT _a.authorized>
            <cfset restSetResponse({ "status": _a.httpStatus })>
            <cfreturn serializeJSON({ "success": false, "message": _a.message })>
        </cfif>

        <cftry>
            <cfquery datasource="rde_be" name="nextReminderId">
                SELECT ISNULL(MAX(id), 0) + 1 AS id
                FROM medication_reminder
            </cfquery>

            <cfquery datasource="rde_be" name="insertedReminderId">
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
                    <cfqueryparam value="#nextReminderId.id[1]#" cfsqltype="CF_SQL_BIGINT">,
                    <cfqueryparam value="#patient_ID#" cfsqltype="CF_SQL_BIGINT">,
                    <cfqueryparam value="#prescription_medication_ID#" cfsqltype="CF_SQL_BIGINT" null="#NOT len(trim(prescription_medication_ID))#">,
                    <cfqueryparam value="#title_of_reminder#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(trim(title_of_reminder))#">,
                    <cfqueryparam value="#start_date#" cfsqltype="CF_SQL_DATE" null="#NOT len(trim(start_date))#">,
                    <cfqueryparam value="#end_date#" cfsqltype="CF_SQL_DATE" null="#NOT len(trim(end_date))#">,
                    <cfqueryparam value="#Mon#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Tues#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Wed#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Thurs#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Fri#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Sat#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Sun#" cfsqltype="CF_SQL_BIT">,
                    <cfqueryparam value="#Time1#" cfsqltype="CF_SQL_TIME" null="#NOT len(trim(Time1))#">,
                    <cfqueryparam value="#Time2#" cfsqltype="CF_SQL_TIME" null="#NOT len(trim(Time2))#">,
                    <cfqueryparam value="#Time3#" cfsqltype="CF_SQL_TIME" null="#NOT len(trim(Time3))#">,
                    <cfqueryparam value="#Time4#" cfsqltype="CF_SQL_TIME" null="#NOT len(trim(Time4))#">,
                    1
                )
            </cfquery>

            <cfquery datasource="rde_be" name="createdReminder">
                SELECT
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
                FROM medication_reminder
                WHERE id = <cfqueryparam value="#insertedReminderId.id[1]#" cfsqltype="CF_SQL_BIGINT">
            </cfquery>
            <cfcatch type="any">
                <cfreturn serializeJSON({"success": false, "message": cfcatch.message, "detail": cfcatch.detail, "type": cfcatch.type })>
            </cfcatch>
        </cftry>

        <cfreturn serializeJSON(data=createdReminder, queryFormat="struct")>
        <!-- POST request example:
             http://localhost:8500/rest/api/reminders -->
    </cffunction>

</cfcomponent>