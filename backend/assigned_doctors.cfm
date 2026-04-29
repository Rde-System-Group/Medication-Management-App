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
    <cfquery datasource="rde_be" name="qProviders">
        SELECT
            doctor_patient_mapping.doctor_id,
            doctor.specialty,
            doctor.work_email,
            [user].first_name,
            [user].last_name
        FROM doctor_patient_mapping
        JOIN doctor ON doctor_patient_mapping.doctor_id = doctor.id
        JOIN [user] ON doctor.user_id = [user].id
        WHERE doctor_patient_mapping.patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
          AND doctor_patient_mapping.is_active = 1
          AND doctor.is_active = 1
        ORDER BY doctor.specialty, [user].last_name, [user].first_name
    </cfquery>

    <cfset providers = []>
    <cfloop query="qProviders">
        <cfset arrayAppend(providers, {
            "doctor_id": qProviders.doctor_id,
            "specialty": qProviders.specialty,
            "work_email": qProviders.work_email,
            "first_name": qProviders.first_name,
            "last_name": qProviders.last_name
        })>
    </cfloop>

    <cfset response = { "success": true, "count": arrayLen(providers), "providers": providers }>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
