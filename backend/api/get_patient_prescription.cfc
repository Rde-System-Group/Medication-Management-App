<cfcomponent rest="true" restPath="prescriptions" name="Prescriptions" output="false">

    <cffunction name="getPrescriptionsByPatient" access="remote" returntype="any" produces="application/json" httpMethod="GET"
                output="false" restPath="patient/{patient_id}">

        <cfargument name="patient_id" required="true" restArgSource="path" type="numeric">
        <cfquery datasource="rde_be" name="prescription_by_patient_results">
            SELECT
                prescription.id,
                prescription.doctor_id,
                prescription.patient_id,
                prescription.prescription_date,
                prescription.is_active,
                prescription.deletion_date
            FROM prescription
            WHERE prescription.is_active = 1
            AND prescription.patient_id = <cfqueryparam value="#arguments.patient_id#" cfsqltype="CF_SQL_BIGINT">
        </cfquery>

         <cfreturn serializeJSON(data=prescription_by_patient_results, queryFormat="struct")>
<! -- GET request for patient prescriptions by patient ID (cross-check with prescription table)
      http://localhost:8500/rest/api/prescriptions/patient/1 -->
    </cffunction>

</cfcomponent>