<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, PUT, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.doctorId" default="0">
<cfparam name="url.patientId" default="">
<cfparam name="url.appointmentId" default="0">

<cfset doctorId = val(url.doctorId)>
<cfset appointmentId = val(url.appointmentId)>

<cfif doctorId EQ 0>
    <cfset response = {"success": false, "message": "doctorId is required"}>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cftry>
    <cfif cgi.request_method EQ "PUT" OR cgi.request_method EQ "POST">
        
        <cfset requestBody = toString(getHTTPRequestData().content)>
        <cfset data = deserializeJSON(requestBody)>
        
        <!--- Resolve target appointment id from URL first, then body as fallback --->
        <cfset bodyApptId = 0>
        <cfif structKeyExists(data, "appointmentId")>
            <cfset bodyApptId = val(data.appointmentId)>
        <cfelseif structKeyExists(data, "appointment_id")>
            <cfset bodyApptId = val(data.appointment_id)>
        </cfif>
        <cfset targetId = appointmentId NEQ 0 ? appointmentId : bodyApptId>
        
        <!--- Determine action. If an appointmentId is present anywhere, NEVER default to CREATE.
              This prevents accidental duplicate inserts when the client omits the action field. --->
        <cfset reqAction = "">
        <cfif structKeyExists(data, "action") AND len(trim(data.action))>
            <cfset reqAction = ucase(trim(data.action))>
        <cfelseif cgi.request_method EQ "PUT">
            <cfset reqAction = "UPDATE">
        <cfelseif targetId NEQ 0>
            <cfset reqAction = "UPDATE">
        <cfelse>
            <cfset reqAction = "CREATE">
        </cfif>
        
        <cfif reqAction EQ "CANCEL">
            <cfif targetId EQ 0>
                <cfset response = {"success": false, "message": "appointmentId is required to cancel"}>
                <cfoutput>#serializeJSON(response)#</cfoutput>
                <cfabort>
            </cfif>
            <cfquery name="qCancel" datasource="rde_be">
                UPDATE appointment 
                SET status = 'cancelled',
                    cancellation_reason = <cfqueryparam value="#data.reason ?: ''#" cfsqltype="cf_sql_varchar">
                WHERE id = <cfqueryparam value="#targetId#" cfsqltype="cf_sql_bigint">
                  AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
            </cfquery>
            <cfset response = {"success": true, "message": "Appointment cancelled"}>
            
        <cfelseif reqAction EQ "UPDATE">
            <cfif targetId EQ 0>
                <cfset response = {"success": false, "message": "appointmentId is required for update"}>
                <cfoutput>#serializeJSON(response)#</cfoutput>
                <cfabort>
            </cfif>
            
            <cfquery name="qUpdate" datasource="rde_be">
                UPDATE appointment 
                SET date = <cfqueryparam value="#data.date#" cfsqltype="cf_sql_date">,
                    scheduled_start = <cfqueryparam value="#data.scheduledStart#" cfsqltype="cf_sql_time">,
                    scheduled_end = <cfqueryparam value="#data.scheduledEnd#" cfsqltype="cf_sql_time">,
                    reason = <cfqueryparam value="#data.reason#" cfsqltype="cf_sql_varchar">
                WHERE id = <cfqueryparam value="#targetId#" cfsqltype="cf_sql_bigint">
                  AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
            </cfquery>
            <cfset response = {"success": true, "message": "Appointment updated", "rows_affected": qUpdate.recordCount ?: 0}>
            
        <cfelse>
            <cfset patientId = val(data.patientId ?: 0)>
            
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
            
            <cfquery name="qInsert" datasource="rde_be">
                INSERT INTO appointment (doctor_id, patient_id, date, scheduled_start, scheduled_end, reason, status)
                OUTPUT INSERTED.id
                VALUES (
                    <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">,
                    <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">,
                    <cfqueryparam value="#data.date#" cfsqltype="cf_sql_date">,
                    <cfqueryparam value="#data.scheduledStart#" cfsqltype="cf_sql_time">,
                    <cfqueryparam value="#data.scheduledEnd#" cfsqltype="cf_sql_time">,
                    <cfqueryparam value="#data.reason#" cfsqltype="cf_sql_varchar">,
                    'scheduled'
                )
            </cfquery>
            
            <cfset response = {"success": true, "message": "Appointment created", "appointment_id": qInsert.id}>
        </cfif>
        
    <cfelse>
        <cfquery name="qAppointments" datasource="rde_be">
            SELECT 
                a.id AS appointment_id,
                a.patient_id,
                u.first_name AS patient_first_name,
                u.last_name AS patient_last_name,
                a.date,
                a.scheduled_start,
                a.scheduled_end,
                a.reason,
                ISNULL(a.status, 'scheduled') AS status,
                a.cancellation_reason
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
                "reason": qAppointments.reason,
                "status": qAppointments.status,
                "cancellation_reason": qAppointments.cancellation_reason
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