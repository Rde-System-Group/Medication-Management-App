<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="PUT, OPTIONS">
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

<cfif cgi.request_method NEQ "PUT">
    <cfheader statuscode="405">
    <cfset response = { "success": false, "message": "Method not allowed" }>
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
function encPlain(value) {
    if (!len(trim(arguments.value))) {
        return "";
    }
    return encrypt(trim(arguments.value), application.encryptSecret, "AES", "Base64");
}
</cfscript>

<cftry>
    <cfset requestBody = toString(getHTTPRequestData().content)>
    <cfset cleanedRequest = len(trim(requestBody)) ? deserializeJSON(requestBody) : {}>

    <cfquery datasource="rde_be" name="existingPatient">
        SELECT
            patient.id,
            patient.user_id,
            patient.date_of_birth,
            patient.gender,
            patient.sex,
            patient.ethnicity,
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
        INNER JOIN [user] ON patient.user_id = [user].id
        WHERE patient.id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
    </cfquery>

    <cfif existingPatient.recordCount EQ 0>
        <cfset response = { "success": false, "message": "Patient not found." }>
        <cfoutput>#serializeJSON(response)#</cfoutput>
        <cfabort>
    </cfif>

    <cfset userId = existingPatient.user_id>
    <cfset firstName = structKeyExists(cleanedRequest, "first_name") ? trim(cleanedRequest.first_name) : safeDecrypt(existingPatient.first_name)>
    <cfset lastName = structKeyExists(cleanedRequest, "last_name") ? trim(cleanedRequest.last_name) : safeDecrypt(existingPatient.last_name)>
    <cfset email = structKeyExists(cleanedRequest, "email") ? trim(cleanedRequest.email) : existingPatient.email>
    <cfset phoneNumber = structKeyExists(cleanedRequest, "phone_number") ? trim(cleanedRequest.phone_number) : safeDecrypt(existingPatient.phone_number)>
    <cfset existingDobPlain = safeDecrypt(existingPatient.date_of_birth)>
    <cfif structKeyExists(cleanedRequest, "date_of_birth")>
        <cfset dateOfBirth = trim(cleanedRequest.date_of_birth)>
    <cfelseif len(trim(existingDobPlain)) AND isDate(existingDobPlain)>
        <cfset dateOfBirth = dateFormat(existingDobPlain, "yyyy-mm-dd")>
    <cfelse>
        <cfset dateOfBirth = "">
    </cfif>
    <cfset gender = structKeyExists(cleanedRequest, "gender") ? trim(cleanedRequest.gender) : safeDecrypt(existingPatient.gender)>
    <cfset sex = structKeyExists(cleanedRequest, "sex") ? trim(cleanedRequest.sex) : safeDecrypt(existingPatient.sex)>
    <cfset raceId = structKeyExists(cleanedRequest, "race") ? trim(cleanedRequest.race) : trim(toString(existingPatient.race_id))>
    <cfif structKeyExists(cleanedRequest, "ethnicity")>
        <cfif isBoolean(cleanedRequest.ethnicity)>
            <cfset ethnicity = cleanedRequest.ethnicity ? 1 : 0>
        <cfelse>
            <cfset ethnicity = listFindNoCase("1,true,yes,y", trim(toString(cleanedRequest.ethnicity))) GT 0 ? 1 : 0>
        </cfif>
    <cfelse>
        <cfset ethnicity = existingPatient.ethnicity>
    </cfif>

    <cfif NOT len(firstName) OR NOT len(lastName) OR NOT len(email)>
        <cfset response = { "success": false, "message": "First name, last name, and email are required." }>
        <cfoutput>#serializeJSON(response)#</cfoutput>
        <cfabort>
    </cfif>
    <cfif len(raceId) AND NOT isNumeric(raceId)>
        <cfset response = { "success": false, "message": "Race must be a valid option." }>
        <cfoutput>#serializeJSON(response)#</cfoutput>
        <cfabort>
    </cfif>

    <cfquery datasource="rde_be">
        UPDATE [user]
        SET
            first_name = <cfqueryparam value="#encPlain(firstName)#" cfsqltype="CF_SQL_VARCHAR">,
            last_name = <cfqueryparam value="#encPlain(lastName)#" cfsqltype="CF_SQL_VARCHAR">,
            email = <cfqueryparam value="#email#" cfsqltype="CF_SQL_VARCHAR">,
            phone_number = <cfqueryparam value="#len(phoneNumber) ? encPlain(phoneNumber) : ''#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(phoneNumber)#">
        WHERE id = <cfqueryparam value="#userId#" cfsqltype="CF_SQL_BIGINT">
    </cfquery>

    <cfquery datasource="rde_be">
        UPDATE patient
        SET
            date_of_birth = <cfqueryparam value="#len(dateOfBirth) ? encPlain(dateOfBirth) : ''#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(dateOfBirth)#">,
            gender = <cfqueryparam value="#encPlain(gender)#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(gender)#">,
            sex = <cfqueryparam value="#encPlain(sex)#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(sex)#">,
            ethnicity = <cfqueryparam value="#ethnicity#" cfsqltype="CF_SQL_BIT">
        WHERE id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
    </cfquery>

    <cfif structKeyExists(cleanedRequest, "race")>
        <cfquery datasource="rde_be">
            DELETE FROM patient_race
            WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>
        <cfif len(raceId)>
            <cfquery datasource="rde_be">
                INSERT INTO patient_race (patient_id, race_id)
                VALUES (
                    <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">,
                    <cfqueryparam value="#val(raceId)#" cfsqltype="CF_SQL_BIGINT">
                )
            </cfquery>
        </cfif>
    </cfif>

    <!--- Re-fetch for response --->
    <cfquery datasource="rde_be" name="qOut">
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
                SELECT TOP 1 race_id FROM patient_race pr WHERE pr.patient_id = patient.id ORDER BY pr.race_id
            ) AS race_id
        FROM patient
        JOIN [user] ON patient.user_id = [user].id
        WHERE patient.id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
    </cfquery>

    <cfset outDob = safeDecrypt(qOut.date_of_birth)>
    <cfset patientDobOut = "">
    <cfif len(trim(outDob)) AND isDate(outDob)>
        <cfset patientDobOut = dateFormat(outDob, "yyyy-mm-dd")>
    </cfif>

    <cfset response = {
        "success": true,
        "patient": {
            "id": qOut.id,
            "user_id": qOut.user_id,
            "date_of_birth": patientDobOut,
            "gender": safeDecrypt(qOut.gender),
            "sex": safeDecrypt(qOut.sex),
            "ethnicity": qOut.ethnicity,
            "is_active": qOut.is_active,
            "first_name": safeDecrypt(qOut.first_name),
            "last_name": safeDecrypt(qOut.last_name),
            "email": qOut.email,
            "phone_number": safeDecrypt(qOut.phone_number),
            "race_id": isNull(qOut.race_id) ? "" : trim(toString(qOut.race_id))
        }
    }>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
