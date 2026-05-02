<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, DELETE, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type, Authorization">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.action" default="search">
<cfparam name="url.patientId" default="0">
<cfparam name="url.doctorId" default="0">
<cfparam name="url.search_query" default="">

<cfset action = lcase(trim(url.action))>
<cfset patientId = val(url.patientId)>
<cfset doctorId = val(url.doctorId)>

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
    <cfif action EQ "search">
        <cfset _jwt = createObject("component","api.JwtSessionService")>
        <cfset _a = _jwt.requireAnyAuthenticated()>
        <cfif NOT _a.authorized>
            <cfheader statuscode="#_a.httpStatus#">
            <cfset response = { "success": false, "message": _a.message }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>

        <cfquery datasource="rde_be" name="qDoctors">
            SELECT
                doctor.id,
                doctor.specialty,
                doctor.work_email,
                [user].first_name,
                [user].last_name
            FROM doctor
            JOIN [user] ON doctor.user_id = [user].id
            WHERE doctor.is_active = 1
            ORDER BY doctor.specialty, [user].last_name, [user].first_name
        </cfquery>

        <cfset doctors = []>
        <cfloop query="qDoctors">
            <cfset decryptedSpecialty = safeDecrypt(qDoctors.specialty)>
            <cfset decryptedFirstName = safeDecrypt(qDoctors.first_name)>
            <cfset decryptedLastName = safeDecrypt(qDoctors.last_name)>
            <cfset matchText = decryptedSpecialty & " " & decryptedFirstName & " " & decryptedLastName & " " & qDoctors.work_email>
            <cfif NOT len(trim(url.search_query)) OR findNoCase(trim(url.search_query), matchText)>
                <cfset arrayAppend(doctors, {
                    "id": qDoctors.id,
                    "specialty": decryptedSpecialty,
                    "work_email": qDoctors.work_email,
                    "first_name": decryptedFirstName,
                    "last_name": decryptedLastName
                })>
            </cfif>
        </cfloop>
        <cfset response = { "success": true, "count": arrayLen(doctors), "doctors": doctors }>

    <cfelseif action EQ "assign">
        <cfif patientId EQ 0 OR doctorId EQ 0>
            <cfset response = { "success": false, "message": "patientId and doctorId are required" }>
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

        <cfquery datasource="rde_be" name="qDoctor">
            SELECT specialty
            FROM doctor
            WHERE id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
              AND is_active = 1
        </cfquery>
        <cfif qDoctor.recordCount EQ 0>
            <cfset response = { "success": false, "message": "Doctor not found" }>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>

        <cftransaction>
            <cfquery datasource="rde_be" name="qDeactivateSameSpecialty">
                UPDATE doctor_patient_mapping
                SET is_active = 0
                WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
                  AND doctor_id IN (
                    SELECT id FROM doctor
                    WHERE specialty = <cfqueryparam value="#qDoctor.specialty[1]#" cfsqltype="CF_SQL_VARCHAR">
                  )
                  AND doctor_id <> <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
            </cfquery>

            <cfquery datasource="rde_be" name="qExisting">
                SELECT TOP 1 doctor_id
                FROM doctor_patient_mapping
                WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
                  AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
            </cfquery>

            <cfif qExisting.recordCount>
                <cfquery datasource="rde_be" name="qReactivate">
                    UPDATE doctor_patient_mapping
                    SET is_active = 1
                    WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
                      AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
                </cfquery>
            <cfelse>
                <cfquery datasource="rde_be" name="qInsert">
                    INSERT INTO doctor_patient_mapping (doctor_id, patient_id, is_active)
                    VALUES (
                        <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">,
                        <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">,
                        1
                    )
                </cfquery>
            </cfif>
        </cftransaction>

        <cfset response = { "success": true, "message": "Doctor assigned successfully." }>

    <cfelseif action EQ "unassign">
        <cfif patientId EQ 0 OR doctorId EQ 0>
            <cfset response = { "success": false, "message": "patientId and doctorId are required" }>
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

        <cfquery datasource="rde_be" name="qUnassign">
            UPDATE doctor_patient_mapping
            SET is_active = 0
            WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
              AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>

        <cfset response = { "success": true, "message": "Provider unassigned successfully." }>

    <cfelse>
        <cfheader statuscode="400">
        <cfset response = { "success": false, "message": "Unknown doctors action" }>
    </cfif>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
