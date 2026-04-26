<cfcomponent rest="true" restPath="patient_settings" name="UpdatePatientInfo" output="false">

	<cffunction name="updatePatientInfo" access="remote" returntype="any" produces="application/json" httpMethod="PUT" output="false" restPath="{patient_id}">

		<cfargument name="patient_id" required="true" restArgSource="path" type="numeric">

		<cfset var requestData = getHttpRequestData()>
		<cfset var cleanedRequest = {}>
		<cfset var existingPatient = "">
		<cfset var updatedPatient = "">

		<cfset var firstName = "">
		<cfset var lastName = "">
		<cfset var email = "">
		<cfset var phoneNumber = "">
		<cfset var dateOfBirth = "">
		<cfset var gender = "">
		<cfset var sex = "">
		<cfset var ethnicity = 0>
		<cfset var userId = "">

		<cfif structKeyExists(requestData, "content") AND len(trim(requestData.content))>
			<cfset cleanedRequest = deserializeJSON(requestData.content)>
		</cfif>

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
				[user].phone_number
			FROM patient
			JOIN [user]
				ON patient.user_id = [user].id
			WHERE patient.id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
		</cfquery>

		<cfif existingPatient.recordCount EQ 0>
			<cfreturn serializeJSON({ "success": false, "message": "Patient not found." })>
		</cfif>

		<cfset userId = existingPatient.user_id[1]>
		<cfset firstName = structKeyExists(cleanedRequest, "first_name") ? trim(cleanedRequest.first_name) : trim(existingPatient.first_name[1])>
		<cfset lastName = structKeyExists(cleanedRequest, "last_name") ? trim(cleanedRequest.last_name) : trim(existingPatient.last_name[1])>
		<cfset email = structKeyExists(cleanedRequest, "email") ? trim(cleanedRequest.email) : trim(existingPatient.email[1])>
		<cfset phoneNumber = structKeyExists(cleanedRequest, "phone_number") ? trim(cleanedRequest.phone_number) : trim(existingPatient.phone_number[1])>
		<cfset dateOfBirth = structKeyExists(cleanedRequest, "date_of_birth") ? trim(cleanedRequest.date_of_birth) : "">
		<cfset gender = structKeyExists(cleanedRequest, "gender") ? trim(cleanedRequest.gender) : trim(existingPatient.gender[1])>
		<cfset sex = structKeyExists(cleanedRequest, "sex") ? trim(cleanedRequest.sex) : trim(existingPatient.sex[1])>
		<cfif structKeyExists(cleanedRequest, "ethnicity")>
			<cfif isBoolean(cleanedRequest.ethnicity)>
				<cfset ethnicity = cleanedRequest.ethnicity>
			<cfelse>
				<cfset ethnicity = listFindNoCase("1,true,yes,y", trim(cleanedRequest.ethnicity)) GT 0>
			</cfif>
		<cfelse>
			<cfset ethnicity = existingPatient.ethnicity[1]>
		</cfif>

		<cfif NOT len(firstName) OR NOT len(lastName) OR NOT len(email)>
			<cfreturn serializeJSON({"success": false, "message": "First name, last name, and email are required."})>
		</cfif>

		<cftry>
			<cfquery datasource="rde_be">
				UPDATE [user]
				SET
					first_name = <cfqueryparam value="#firstName#" cfsqltype="CF_SQL_VARCHAR">,
					last_name = <cfqueryparam value="#lastName#" cfsqltype="CF_SQL_VARCHAR">,
					email = <cfqueryparam value="#email#" cfsqltype="CF_SQL_VARCHAR">,
					phone_number = <cfqueryparam value="#phoneNumber#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(phoneNumber)#">
				WHERE id = <cfqueryparam value="#userId#" cfsqltype="CF_SQL_BIGINT">
			</cfquery>

			<cfquery datasource="rde_be">
				UPDATE patient
				SET
					date_of_birth = <cfqueryparam value="#dateOfBirth#" cfsqltype="CF_SQL_DATE" null="#NOT len(dateOfBirth)#">,
					gender = <cfqueryparam value="#gender#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(gender)#">,
					sex = <cfqueryparam value="#sex#" cfsqltype="CF_SQL_VARCHAR" null="#NOT len(sex)#">,
					ethnicity = <cfqueryparam value="#ethnicity#" cfsqltype="CF_SQL_BIT">
				WHERE id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
			</cfquery>

			<cfquery datasource="rde_be" name="updatedPatient">
				SELECT
					patient.id,
					patient.user_id,
					patient.date_of_birth,
					patient.gender,
					patient.sex,
					patient.is_active,
					patient.ethnicity AS ethnicity,
					[user].first_name AS first_name,
					[user].last_name AS last_name,
					[user].email AS email,
					[user].phone_number AS phone_number
				FROM patient
				JOIN [user]
					ON patient.user_id = [user].id
				WHERE patient.id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
			</cfquery>

			<cfreturn serializeJSON(data=updatedPatient, queryFormat="struct")>
			<cfcatch type="any">
				<cfreturn serializeJSON({"success": false, "message": cfcatch.message, "detail": cfcatch.detail, "type": cfcatch.type})>
			</cfcatch>
		</cftry>
	</cffunction>

</cfcomponent>
