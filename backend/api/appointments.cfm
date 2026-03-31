<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.doctorId" default="0">
<cfparam name="url.patientId" default="">

<cfset doctorId = val(url.doctorId)>

<cfif doctorId EQ 0>
    <cfset response = {"success": false, "message": "doctorId is required"}>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cftry>
    <cfif cgi.request_method EQ "POST">
        <!--- Create appointment --->
        <cfset requestBody = toString(getHTTPRequestData().content)>
        <cfset data = deserializeJSON(requestBody)>
        
        <cfset patientId = val(data.patientId ?: 0)>
        
        <!--- Verify authorization --->
        <cfquery name="qCheck" datasource="rde_be">
            SELECT COUNT(*) as cnt FROM doctor_patient_mapping
            WHERE doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
              AND patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
              AND is_active = 1
        </cfquery>
        
        <cfif qCheck.cnt EQ 0>
            <cfset response = {"success": false, "message": "Not authorized for this patient"}>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>
        
        <cfquery name="qInsert" datasource="rde_be" result="insertResult">
            INSERT INTO appointment (doctor_id, patient_id, date, scheduled_start, scheduled_end, reason)
            VALUES (
                <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">,
                <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">,
                <cfqueryparam value="#data.date#" cfsqltype="cf_sql_date">,
                <cfqueryparam value="#data.scheduledStart#" cfsqltype="cf_sql_time">,
                <cfqueryparam value="#data.scheduledEnd#" cfsqltype="cf_sql_time">,
                <cfqueryparam value="#data.reason#" cfsqltype="cf_sql_varchar">
            )
        </cfquery>
        
        <cfset response = {"success": true, "message": "Appointment created", "appointment_id": insertResult.generatedKey}>
        
    <cfelse>
        <!--- GET appointments --->
        <cfquery name="qAppointments" datasource="rde_be">
            SELECT 
                a.id AS appointment_id,
                a.patient_id,
                u.first_name AS patient_first_name,
                u.last_name AS patient_last_name,
                a.date,
                a.scheduled_start,
                a.scheduled_end,
                a.reason
            FROM appointment a
            INNER JOIN patient p ON a.patient_id = p.id
            INNER JOIN [user] u ON p.user_id = u.id
            WHERE a.doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
            <cfif len(url.patientId)>
                AND a.patient_id = <cfqueryparam value="#val(url.patientId)#" cfsqltype="cf_sql_bigint">
            </cfif>
            ORDER BY a.date, a.scheduled_start
        </cfquery>
        
        <cfset appointments = []>
        <cfloop query="qAppointments">
            <cfset arrayAppend(appointments, {
                "appointment_id": qAppointments.appointment_id,
                "patient_id": qAppointments.patient_id,
                "patient_name": qAppointments.patient_first_name & " " & qAppointments.patient_last_name,
                "date": dateFormat(qAppointments.date, "yyyy-mm-dd"),
                "scheduled_start": timeFormat(qAppointments.scheduled_start, "HH:mm"),
                "scheduled_end": timeFormat(qAppointments.scheduled_end, "HH:mm"),
                "reason": qAppointments.reason
            })>
        </cfloop>
        
        <cfset response = {"success": true, "count": arrayLen(appointments), "appointments": appointments}>
    </cfif>
    
<cfcatch type="any">
    <cfset response = {"success": false, "message": cfcatch.message}>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>