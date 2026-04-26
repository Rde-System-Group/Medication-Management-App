<cfcomponent rest="true" restPath="patients" name="Patients" output="false">
	
    <cffunction name="getPatientById" access="remote" returntype="any" produces="application/json" httpMethod="GET"
        output="false" restPath="{patient_id}">
        
    <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfquery datasource="rde_be" name="patient_info_result">
            SELECT
                patient.id,
                patient.user_id,
                patient.date_of_birth,
                patient.gender,
                patient.sex,
                patient.is_active,
                [user].first_name AS first_name,
                [user].last_name AS last_name,
                [user].email AS email
            FROM patient
            JOIN [user]
            ON patient.user_id = [user].id
            WHERE patient.id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>

    <cfreturn serializeJSON(data=patient_info_result, queryFormat="struct")>
<! -- GET request for patient info by patient ID
      http://localhost:8500/rest/api/patients/1 -->
    </cffunction>

</cfcomponent>