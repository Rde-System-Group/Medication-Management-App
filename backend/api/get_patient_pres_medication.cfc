<cfcomponent rest="true" restPath="prescription_medications" name="PrescriptionMedications" output="false">

    <cffunction 
        name="getPrescriptionMedicationsByPatient"
        access="remote"
        returntype="any"
        produces="application/json"
        httpMethod="GET"
        output="false"
        restPath="patient/{patient_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <!--- Simple auth check: user must be logged in --->
        <cfset var authComp = createObject("component","auth")>
        <cfset var authData = deserializeJSON(authComp.getAuthUser())>
        <cfif NOT structKeyExists(authData, "valid") OR NOT authData.valid>
            <cfreturn serializeJSON({"success": false, "message": "Unauthorized. Please log in."})>
        </cfif>
        <cfif structKeyExists(authData, "role") AND authData.role EQ "Patient" AND val(authData.patient_id) NEQ val(arguments.patient_id)>
            <cfreturn serializeJSON({"success": false, "message": "Unauthorized patient access."})>
        </cfif>

        <cfquery datasource="rde_be" name="patient_prescribed_medication_results">
            SELECT
                prescription_medication.id,
                prescription_medication.prescription_id,
                prescription_medication.medication_id,
                medication.medication_name,
                prescription_medication.dosage,
                prescription_medication.supply,
                prescription_medication.frequency_type,
                prescription_medication.freq_per_day,
                prescription_medication.freq_days_per_week,
                prescription_medication.freq_by_x_week,
                prescription_medication.start_date,
                prescription_medication.end_date,
                prescription_medication.refills,
                prescription_medication.instructions,
                prescription_medication.is_active
            FROM prescription_medication
            JOIN prescription
                ON prescription_medication.prescription_id = prescription.id
            JOIN medication
                ON prescription_medication.medication_id = medication.id
            WHERE prescription.patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
            AND prescription_medication.is_active = 1
            AND prescription.is_active = 1
        </cfquery>
        
         <cfreturn serializeJSON(data=patient_prescribed_medication_results, queryFormat="struct")>
<! -- GET request for patient prescribed medications by patient ID (cross-check with prescription table)
      http://localhost:8500/rest/api/prescription_medications/patient/8    or 1 -->
    </cffunction>

</cfcomponent>