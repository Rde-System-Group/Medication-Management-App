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
    <cfquery datasource="rde_be" name="qPatient">
        SELECT
            patient.id,
            patient.user_id,
            patient.date_of_birth,
            patient.gender,
            patient.sex,
            patient.ethnicity,
            patient.is_active,
            [user].first_name,
            [user].last_name,
            [user].email,
            [user].phone_number,
            (
                SELECT TOP 1 pr.race_id
                FROM patient_race pr
                WHERE pr.patient_id = patient.id
                ORDER BY pr.race_id
            ) AS race_id
        FROM patient
        JOIN [user] ON patient.user_id = [user].id
        WHERE patient.id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
    </cfquery>

    <cfif qPatient.recordCount EQ 0>
        <cfset response = { "success": false, "message": "Patient not found" }>
    <cfelse>
        <cfset decryptedDob = safeDecrypt(qPatient.date_of_birth)>
        <cfset patientDob = "">
        <cfif len(trim(decryptedDob)) AND isDate(decryptedDob)>
            <cfset patientDob = dateFormat(decryptedDob, "yyyy-mm-dd")>
        </cfif>
        <cfset raceOutVal = "" />
        <cfif NOT isNull(qPatient.race_id) AND len(trim(toString(qPatient.race_id)))>
            <cfset raceOutVal = trim(toString(qPatient.race_id)) />
        </cfif>
        <cfset response = {
            "success": true,
            "patient": {
                "id": qPatient.id,
                "user_id": qPatient.user_id,
                "date_of_birth": patientDob,
                "gender": safeDecrypt(qPatient.gender),
                "sex": safeDecrypt(qPatient.sex),
                "ethnicity": qPatient.ethnicity,
                "is_active": qPatient.is_active,
                "first_name": safeDecrypt(qPatient.first_name),
                "last_name": safeDecrypt(qPatient.last_name),
                "email": qPatient.email,
                "phone_number": safeDecrypt(qPatient.phone_number),
                "race_id": raceOutVal
            }
        }>
    </cfif>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
