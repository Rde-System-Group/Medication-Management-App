<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type, Authorization">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.patientId" default="0">
<cfset patientId = val(url.patientId)>

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
    <cfquery name="qAppointments" datasource="rde_be">
        SELECT 
            a.id AS appointment_id,
            a.doctor_id,
            du.first_name AS doctor_first_name,
            du.last_name AS doctor_last_name,
            a.date,
            a.scheduled_start,
            a.scheduled_end,
            a.reason,
            ISNULL(a.status, 'scheduled') AS status,
            a.cancellation_reason
        FROM appointment a
        INNER JOIN doctor d ON a.doctor_id = d.id
        INNER JOIN [user] du ON d.user_id = du.id
        WHERE a.patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
        ORDER BY a.date DESC, a.scheduled_start DESC
    </cfquery>
    
    <cfset appointments = []>
    <cfloop query="qAppointments">
        <cfset arrayAppend(appointments, {
            "appointment_id": qAppointments.appointment_id,
            "doctor_id": qAppointments.doctor_id,
            "doctor_name": qAppointments.doctor_first_name & " " & qAppointments.doctor_last_name,
            "date": dateFormat(qAppointments.date, "yyyy-mm-dd"),
            "scheduled_start": timeFormat(qAppointments.scheduled_start, "HH:mm"),
            "scheduled_end": timeFormat(qAppointments.scheduled_end, "HH:mm"),
            "reason": qAppointments.reason,
            "status": qAppointments.status,
            "cancellation_reason": qAppointments.cancellation_reason
        })>
    </cfloop>
    
    <cfset response = { "success": true, "count": arrayLen(appointments), "appointments": appointments }>
    
<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = {
        "success": false,
        "message": cfcatch.message,
        "detail": cfcatch.detail
    }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
