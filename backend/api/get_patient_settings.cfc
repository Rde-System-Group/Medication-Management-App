<cfcomponent rest="true" restPath="patient_settings" name="PatientSettings" output="false">
	
    <cffunction name="getPatientSettingsbyID" access="remote" returntype="any" produces="application/json" httpMethod="GET"
        output="false" restPath="{patient_id}">
       
    <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfset _jwt = createObject("component","JwtSessionService")>
        <cfset _a = _jwt.requirePatient(arguments.patient_id)>
        <cfif NOT _a.authorized>
            <cfset restSetResponse({ status: _a.httpStatus })>
            <cfreturn serializeJSON({ "success": false, "message": _a.message })>
        </cfif>
        <cfquery datasource="rde_be" name="patient_settings_info_result">
            SELECT
                patient.id,
                patient.user_id,
                patient.date_of_birth,
                patient.gender,
                patient.sex,
                patient.is_active,
                patient.ethnicity AS ethnicity,
                patient_race.race_id AS race_id,
                isNull(race.name, '') AS race,
                [user].first_name AS first_name,
                [user].last_name AS last_name,
                [user].email AS email,
                [user].phone_number AS phone_number
            FROM patient
            JOIN [user]
            ON patient.user_id = [user].id
            JOIN patient_race
            ON patient.id = patient_race.patient_id
            JOIN race
            ON patient_race.race_id = race.id
            WHERE patient.id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>

    <cfreturn serializeJSON(data=patient_settings_info_result, queryFormat="struct")>
<! -- GET request for patient info by patient ID

      http://localhost:8500/rest/api/patient_settings/1 
-->
    </cffunction>

</cfcomponent>