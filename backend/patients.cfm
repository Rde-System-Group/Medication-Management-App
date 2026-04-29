<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type, Authorization">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.doctorId" default="0">
<cfparam name="url.firstName" default="">
<cfparam name="url.lastName" default="">

<cfset doctorId = val(url.doctorId)>

<cfif doctorId EQ 0>
    <cfset response = { "success": false, "message": "doctorId is required" }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cfset _jwt = createObject("component","api.JwtSessionService")>
<cfset _a = _jwt.requireDoctor(doctorId)>
<cfif NOT _a.authorized>
    <cfheader statuscode="#_a.httpStatus#">
    <cfset response = { "success": false, "message": _a.message }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cfscript>
function safeDecrypt(value) {
    if (isNull(arguments.value)) {
        return "";
    }
    try {
        return decrypt(arguments.value, application.encryptSecret, "AES", "Base64");
    } catch (any e) {
        return arguments.value;
    }
}
</cfscript>

<cftry>
    <cfquery name="qPatients" datasource="rde_be">
        SELECT 
            p.id AS patient_id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone_number,
            p.date_of_birth,
            p.gender,
            p.sex,
            p.ethnicity,
            (
                SELECT STRING_AGG(r.name, ', ')
                FROM patient_race pr
                INNER JOIN race r ON pr.race_id = r.id
                WHERE pr.patient_id = p.id
            ) AS races
        FROM patient p
        INNER JOIN [user] u ON p.user_id = u.id
        INNER JOIN doctor_patient_mapping dpm ON p.id = dpm.patient_id
        WHERE dpm.doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
          AND dpm.is_active = 1
          AND p.is_active = 1
        ORDER BY u.last_name, u.first_name
    </cfquery>
    
    <cfset patients = []>
    <cfloop query="qPatients">
        <cfset decryptedFirstName = safeDecrypt(qPatients.first_name)>
        <cfset decryptedLastName = safeDecrypt(qPatients.last_name)>
        <cfset firstNameMatches = NOT len(trim(url.firstName)) OR findNoCase(trim(url.firstName), decryptedFirstName)>
        <cfset lastNameMatches = NOT len(trim(url.lastName)) OR findNoCase(trim(url.lastName), decryptedLastName)>
        <cfif firstNameMatches AND lastNameMatches>
            <cfset decryptedDob = safeDecrypt(qPatients.date_of_birth)>
            <cfset patientDob = "">
            <cfif len(trim(decryptedDob)) AND isDate(decryptedDob)>
                <cfset patientDob = dateFormat(decryptedDob, "yyyy-mm-dd")>
            </cfif>
            <cfset arrayAppend(patients, {
                "patient_id": qPatients.patient_id,
                "first_name": decryptedFirstName,
                "last_name": decryptedLastName,
                "email": qPatients.email,
                "phone_number": safeDecrypt(qPatients.phone_number),
                "date_of_birth": patientDob,
                "gender": safeDecrypt(qPatients.gender),
                "sex": safeDecrypt(qPatients.sex),
                "ethnicity": qPatients.ethnicity EQ 1 ? "Hispanic/Latino" : "Not Hispanic/Latino",
                "races": isNull(qPatients.races) ? "" : qPatients.races
            })>
        </cfif>
    </cfloop>
    
    <cfset response = {
        "success": true,
        "count": arrayLen(patients),
        "patients": patients
    }>
    
<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = {
        "success": false,
        "message": "Database error: " & cfcatch.message,
        "detail": cfcatch.detail
    }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
