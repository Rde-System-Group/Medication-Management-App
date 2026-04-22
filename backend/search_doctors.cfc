<cfcomponent rest="true"  restPath="doctors" Name="Doctors" output="false">


    <cffunction name="searchDoctors" access="remote" returntype="any" produces="application/json" httpMethod="GET" output="false" restPath="search">
        <cfargument name="search_query" required="false" restargsource="query" type="string" default="" />  
        <cfquery datasource="rde_be" name="doctor_search_results">
                SELECT
                    doctor.id,
                    doctor.specialty,
                    doctor.work_email,
                    [user].first_name,
                    [user].last_name
                FROM doctor
                JOIN [user]
                ON doctor.user_id = [user].id
                WHERE doctor.is_active = 1
                AND
                (   doctor.specialty LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">
                    OR
                    [user].first_name LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">
                    OR                      
                    [user].last_name LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">                      
                )
        </cfquery>
        <! -- Note: The search query will look for matches in the doctor's specialty, first name, or last name. If the search_query argument is empty, it will return all active doctors.
            without the square brackets [], you get this error:
            9:48:01 AM  Started executing on line 1
            Incorrect syntax near the keyword 'user'.
            9:48:02 AM  Failed to execute the query




            4/4 - https://helpx.adobe.com/coldfusion/cfml-reference/coldfusion-functions/functions-s/serializejson.html
            -->
        <cfreturn serializeJSON(data=doctor_search_results, queryFormat="struct")>


    </cffunction>


    <cffunction name="getAssignedDoctorsByPatient" access="remote" returntype="any"  produces="application/json" httpMethod="GET" output="false" restPath="assigned/patient/{patient_id}">


        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfquery datasource="rde_be" name="assigned_doctors_result">
            SELECT
                doctor_patient_mapping.doctor_id,
                doctor.specialty,
                doctor.work_email,
                [user].first_name,
                [user].last_name
            FROM doctor_patient_mapping
            JOIN doctor
                ON doctor_patient_mapping.doctor_id = doctor.id
            JOIN [user]
                ON doctor.user_id = [user].id
            WHERE doctor_patient_mapping.patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
              AND doctor_patient_mapping.is_active = 1
              AND doctor.is_active = 1
            ORDER BY doctor.specialty, [user].last_name, [user].first_name
        </cfquery>


        <cfreturn serializeJSON(data=assigned_doctors_result, queryFormat="struct")>
    </cffunction>


    <cffunction name="assignDoctorToPatient" access="remote" returntype="any" produces="application/json" httpMethod="POST" output="false" restPath="assign">


        <cfset var requestData = getHttpRequestData()>
        <cfset var cleanedRequest = {}>
        <cfset var patientId = "">
        <cfset var doctorId = "">
        <cfset var selectedDoctor = "">
        <cfset var alreadyAssigned = "">
        <cfset var existingMapping = "">
        <cfset var activeSameSpecialty = "">
        <cfset var responseMessage = "Doctor assigned successfully.">


        <cfif structKeyExists(requestData, "content") AND len(trim(requestData.content))>
            <cfset cleanedRequest = deserializeJSON(requestData.content)>
        </cfif>
        <cfif structKeyExists(cleanedRequest, "patient_id")>
            <cfset patientId = cleanedRequest.patient_id>
        </cfif>
        <cfif structKeyExists(cleanedRequest, "doctor_id")>
            <cfset doctorId = cleanedRequest.doctor_id>
        </cfif>
        <cfif NOT isNumeric(patientId) OR NOT isNumeric(doctorId)>
            <cfreturn serializeJSON({ "success": false,"message": "patient_id and doctor_id are required."})>
        </cfif>


        <cfquery datasource="rde_be" name="selectedDoctor">
            SELECT
                doctor.id,
                doctor.specialty
            FROM doctor
            WHERE doctor.id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
            AND doctor.is_active = 1
        </cfquery>


        <cfif selectedDoctor.recordCount EQ 0>
            <cfreturn serializeJSON({ "success": false,"message": "Doctor not found or inactive."})>
        </cfif>


        <cfquery datasource="rde_be" name="alreadyAssigned">
            SELECT TOP 1 doctor_id
            FROM doctor_patient_mapping
            WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
            AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
            AND is_active = 1
        </cfquery>


        <cfif alreadyAssigned.recordCount GT 0>
            <cfreturn serializeJSON({"success": true, "message": "Doctor is already assigned.","patient_id": patientId,"doctor_id": doctorId, "specialty": selectedDoctor.specialty[1] })>
        </cfif>


        <cfquery datasource="rde_be" name="existingMapping">
            SELECT TOP 1 doctor_id
            FROM doctor_patient_mapping
            WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
            AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>


        <cfquery datasource="rde_be" name="activeSameSpecialty">
            SELECT doctor_patient_mapping.doctor_id
            FROM doctor_patient_mapping
            JOIN doctor
                ON doctor_patient_mapping.doctor_id = doctor.id
            WHERE doctor_patient_mapping.patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
            AND doctor_patient_mapping.is_active = 1
            AND doctor.specialty = <cfqueryparam value="#selectedDoctor.specialty[1]#" cfsqltype="CF_SQL_VARCHAR">
            AND doctor_patient_mapping.doctor_id <> <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>


        <cftry>
            <cfif activeSameSpecialty.recordCount GT 0>
                <cfquery datasource="rde_be">
                    UPDATE doctor_patient_mapping
                    SET is_active = 0
                    WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
                    AND doctor_id IN (
                        <cfqueryparam value="#valueList(activeSameSpecialty.doctor_id)#" cfsqltype="CF_SQL_BIGINT" list="true">
                    )
                    AND is_active = 1
                </cfquery>
                <cfset responseMessage = "Doctor reassigned for this specialty.">
            </cfif>


            <cfif existingMapping.recordCount GT 0>
                <cfquery datasource="rde_be">
                    UPDATE doctor_patient_mapping
                    SET is_active = 1
                    WHERE patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
                    AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">
                </cfquery>


                <cfif responseMessage EQ "Doctor assigned successfully.">
                    <cfset responseMessage = "Doctor assignment restored.">
                </cfif>
            <cfelse>
                <cfquery datasource="rde_be">
                    INSERT INTO doctor_patient_mapping (
                        doctor_id,
                        patient_id,
                        is_active
                    )
                    VALUES (
                        <cfqueryparam value="#doctorId#" cfsqltype="CF_SQL_BIGINT">,
                        <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">,
                        1
                    )
                </cfquery>
            </cfif>
            <cfcatch type="any">
                <cfreturn serializeJSON({ "success": false, "message": cfcatch.message, "detail": cfcatch.detail, "type": cfcatch.type })>
            </cfcatch>
        </cftry>


        <cfreturn serializeJSON({"success": true, "message": responseMessage,"patient_id": patientId,"doctor_id": doctorId, "specialty": selectedDoctor.specialty[1]})>
    </cffunction>


    <cffunction name="unassignDoctorFromPatient" access="remote" returntype="any" produces="application/json" httpMethod="DELETE" output="false" restPath="assigned/patient/{patient_id}/doctor/{doctor_id}">


        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfargument name="doctor_id" required="true" restArgSource="path" type="numeric">


        <cfset var activeMapping = "">


        <cfquery datasource="rde_be" name="activeMapping">
            SELECT TOP 1 doctor_id
            FROM doctor_patient_mapping
            WHERE patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            AND doctor_id = <cfqueryparam value="#arguments.doctor_id#" cfsqltype="CF_SQL_BIGINT">
            AND is_active = 1
        </cfquery>


        <cfif activeMapping.recordCount EQ 0>
            <cfreturn serializeJSON({"success": false,"message": "Active assignment not found."})>
        </cfif>


        <cfquery datasource="rde_be">
            UPDATE doctor_patient_mapping
            SET is_active = 0
            WHERE patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            AND doctor_id = <cfqueryparam value="#arguments.doctor_id#" cfsqltype="CF_SQL_BIGINT">
            AND is_active = 1
        </cfquery>


        <cfreturn serializeJSON({"success": true, "message": "Doctor unassigned successfully.","patient_id": arguments.patient_id,"doctor_id": arguments.doctor_id})>
    </cffunction>


</cfcomponent>







