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
<cfparam name="url.patientId" default="0">

<cfset doctorId = val(url.doctorId)>
<cfset patientId = val(url.patientId)>

<cfif doctorId EQ 0 OR patientId EQ 0>
    <cfset response = {"success": false, "message": "doctorId and patientId are required"}>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cftry>
    <!--- Verify doctor-patient relationship --->
    <cfquery name="qCheck" datasource="rde_be">
        SELECT COUNT(*) as cnt
        FROM doctor_patient_mapping
        WHERE doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
          AND patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
          AND is_active = 1
    </cfquery>
    
    <cfif qCheck.cnt EQ 0>
        <cfset response = {"success": false, "message": "Patient not found or not authorized"}>
        <cfoutput>#serializeJSON(response)#</cfoutput>
        <cfabort>
    </cfif>
    
    <!--- Get patient profile --->
    <cfquery name="qPatient" datasource="rde_be">
        SELECT 
            p.id AS patient_id,
            p.user_id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            p.date_of_birth,
            p.gender,
            p.sex,
            p.ethnicity,
            p.is_active,
            dpm.granted_at
        FROM patient p
        INNER JOIN [user] u ON p.user_id = u.id
        INNER JOIN doctor_patient_mapping dpm ON p.id = dpm.patient_id
        WHERE p.id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
          AND dpm.doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
    </cfquery>
    
    <!--- Get patient races --->
    <cfquery name="qRaces" datasource="rde_be">
        SELECT r.name, r.code
        FROM patient_race pr
        INNER JOIN race r ON pr.race_id = r.id
        WHERE pr.patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
    </cfquery>
    
    <cfset races = []>
    <cfloop query="qRaces">
        <cfset arrayAppend(races, qRaces.name)>
    </cfloop>
    
    <cfset patient = {
        "patient_id": qPatient.patient_id,
        "user_id": qPatient.user_id,
        "first_name": qPatient.first_name,
        "last_name": qPatient.last_name,
        "email": qPatient.email,
        "phone_number": qPatient.phone_number,
        "date_of_birth": dateFormat(qPatient.date_of_birth, "yyyy-mm-dd"),
        "gender": qPatient.gender,
        "sex": qPatient.sex,
        "ethnicity": qPatient.ethnicity EQ 1 ? "Hispanic/Latino" : "Not Hispanic/Latino",
        "races": races,
        "is_active": qPatient.is_active,
        "assigned_date": dateTimeFormat(qPatient.granted_at, "yyyy-mm-dd HH:nn:ss")
    }>
    
    <cfset response = {"success": true, "patient": patient}>
    
<cfcatch type="any">
    <cfset response = {"success": false, "message": cfcatch.message}>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>