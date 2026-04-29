<cfsilent>
<!--- CORS Headers --->
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">
<cfcontent type="application/json">

<!--- Handle OPTIONS preflight --->
<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<!--- Get parameters --->
<cfparam name="url.doctorId" default="0">
<cfparam name="url.firstName" default="">
<cfparam name="url.lastName" default="">

<cfset doctorId = val(url.doctorId)>

<!--- Validate doctorId --->
<cfif doctorId EQ 0>
    <cfset response = {
        "success": false,
        "message": "doctorId is required"
    }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cfset _jwt = createObject("component","JwtSessionService")>
<cfset _a = _jwt.requireDoctor(doctorId)>
<cfif NOT _a.authorized>
    <cfheader statuscode="#_a.httpStatus#">
    <cfset response = { "success": false, "message": _a.message }>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<!--- Query patients assigned to this doctor --->
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
        <cfif len(trim(url.firstName))>
          AND u.first_name LIKE <cfqueryparam value="%#trim(url.firstName)#%" cfsqltype="cf_sql_varchar">
        </cfif>
        <cfif len(trim(url.lastName))>
          AND u.last_name LIKE <cfqueryparam value="%#trim(url.lastName)#%" cfsqltype="cf_sql_varchar">
        </cfif>
        ORDER BY u.last_name, u.first_name
    </cfquery>
    
    <!--- Build response --->
    <cfset patients = []>
    <cfloop query="qPatients">
        <cfset arrayAppend(patients, {
            "patient_id": qPatients.patient_id,
            "first_name": qPatients.first_name,
            "last_name": qPatients.last_name,
            "email": qPatients.email,
            "phone_number": qPatients.phone_number,
            "date_of_birth": dateFormat(qPatients.date_of_birth, "yyyy-mm-dd"),
            "gender": qPatients.gender,
            "sex": qPatients.sex,
            "ethnicity": qPatients.ethnicity EQ 1 ? "Hispanic/Latino" : "Not Hispanic/Latino",
            "races": isNull(qPatients.races) ? "" : qPatients.races
        })>
    </cfloop>
    
    <cfset response = {
        "success": true,
        "count": arrayLen(patients),
        "patients": patients
    }>
    
<cfcatch type="any">
    <cfset response = {
        "success": false,
        "message": "Database error: " & cfcatch.message,
        "detail": cfcatch.detail
    }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>