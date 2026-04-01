<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cfparam name="url.doctorId" default="0">
<cfparam name="url.patientId" default="0">
<cfparam name="url.prescriptionId" default="0">

<cfset doctorId = val(url.doctorId)>
<cfset patientId = val(url.patientId)>
<cfset prescriptionId = val(url.prescriptionId)>

<cfif doctorId EQ 0 OR patientId EQ 0>
    <cfset response = {"success": false, "message": "doctorId and patientId are required"}>
    <cfoutput>#serializeJSON(response)#</cfoutput>
    <cfabort>
</cfif>

<cftry>
    <!--- Verify authorization --->
    <cfquery name="qCheck" datasource="rde_be">
        SELECT COUNT(*) as cnt FROM doctor_patient_mapping
        WHERE doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
          AND patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
          AND is_active = 1
    </cfquery>
    
    <cfif qCheck.cnt EQ 0>
        <cfset response = {"success": false, "message": "Not authorized for this patient"}>
        <cfoutput>#serializeJSON(response)#</cfoutput>
        <cfabort>
    </cfif>
    
    <cfif cgi.request_method EQ "DELETE">
        <!--- Delete prescription --->
        <cfif prescriptionId EQ 0>
            <cfset response = {"success": false, "message": "prescriptionId is required"}>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>
        
        <cftransaction>
            <cfquery name="qDeleteMeds" datasource="rde_be">
                DELETE FROM prescription_medication WHERE prescription_id = <cfqueryparam value="#prescriptionId#" cfsqltype="cf_sql_bigint">
            </cfquery>
            <cfquery name="qDeleteRx" datasource="rde_be">
                DELETE FROM prescription 
                WHERE id = <cfqueryparam value="#prescriptionId#" cfsqltype="cf_sql_bigint">
                  AND doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
                  AND patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
            </cfquery>
        </cftransaction>
        
        <cfset response = {"success": true, "message": "Prescription deleted"}>
        
    <cfelseif cgi.request_method EQ "PUT">
        <!--- Update prescription --->
        <cfif prescriptionId EQ 0>
            <cfset response = {"success": false, "message": "prescriptionId is required"}>
            <cfoutput>#serializeJSON(response)#</cfoutput>
            <cfabort>
        </cfif>
        
        <cfset requestBody = toString(getHTTPRequestData().content)>
        <cfset data = deserializeJSON(requestBody)>
        
        <cftransaction>
            <!--- Delete old medications and insert new ones --->
            <cfquery name="qDeleteMeds" datasource="rde_be">
                DELETE FROM prescription_medication WHERE prescription_id = <cfqueryparam value="#prescriptionId#" cfsqltype="cf_sql_bigint">
            </cfquery>
            
            <cfloop array="#data.medications#" index="med">
                <cfquery name="qInsertMed" datasource="rde_be">
                    INSERT INTO prescription_medication (
                        prescription_id, medication_id, dosage, supply,
                        frequency_type, freq_per_day, freq_days_per_week, freq_by_x_week,
                        start_date, end_date, refills, instructions, is_active
                    ) VALUES (
                        <cfqueryparam value="#prescriptionId#" cfsqltype="cf_sql_bigint">,
                        <cfqueryparam value="#med.medication_id#" cfsqltype="cf_sql_bigint">,
                        <cfqueryparam value="#med.dosage#" cfsqltype="cf_sql_varchar">,
                        <cfqueryparam value="#med.supply#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.frequency_type ?: 1#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.freq_per_day ?: 1#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.freq_days_per_week ?: ''#" cfsqltype="cf_sql_integer" null="#NOT len(med.freq_days_per_week ?: '')#">,
                        <cfqueryparam value="#med.freq_by_x_week ?: ''#" cfsqltype="cf_sql_integer" null="#NOT len(med.freq_by_x_week ?: '')#">,
                        <cfqueryparam value="#med.start_date#" cfsqltype="cf_sql_date">,
                        <cfqueryparam value="#med.end_date#" cfsqltype="cf_sql_date">,
                        <cfqueryparam value="#med.refills ?: 0#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.instructions ?: ''#" cfsqltype="cf_sql_varchar" null="#NOT len(med.instructions ?: '')#">,
                        1
                    )
                </cfquery>
            </cfloop>
        </cftransaction>
        
        <cfset response = {"success": true, "message": "Prescription updated"}>
        
    <cfelseif cgi.request_method EQ "POST">
        <!--- Create prescription --->
        <cfset requestBody = toString(getHTTPRequestData().content)>
        <cfset data = deserializeJSON(requestBody)>
        
        <cftransaction>
            <!--- Insert prescription header --->
            <cfquery name="qInsertRx" datasource="rde_be">
                INSERT INTO prescription (doctor_id, patient_id, prescription_date, is_active)
                OUTPUT INSERTED.id
                VALUES (
                    <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">,
                    <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">,
                    CAST(GETDATE() AS DATE),
                    1
                )
            </cfquery>
            
            <cfset prescriptionId = qInsertRx.id>
            
            <!--- Insert medications --->
            <cfloop array="#data.medications#" index="med">
                <cfquery name="qInsertMed" datasource="rde_be">
                    INSERT INTO prescription_medication (
                        prescription_id, medication_id, dosage, supply,
                        frequency_type, freq_per_day, freq_days_per_week, freq_by_x_week,
                        start_date, end_date, refills, instructions, is_active
                    ) VALUES (
                        <cfqueryparam value="#prescriptionId#" cfsqltype="cf_sql_bigint">,
                        <cfqueryparam value="#med.medication_id#" cfsqltype="cf_sql_bigint">,
                        <cfqueryparam value="#med.dosage#" cfsqltype="cf_sql_varchar">,
                        <cfqueryparam value="#med.supply#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.frequency_type ?: 1#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.freq_per_day ?: 1#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.freq_days_per_week ?: ''#" cfsqltype="cf_sql_integer" null="#NOT len(med.freq_days_per_week ?: '')#">,
                        <cfqueryparam value="#med.freq_by_x_week ?: ''#" cfsqltype="cf_sql_integer" null="#NOT len(med.freq_by_x_week ?: '')#">,
                        <cfqueryparam value="#med.start_date#" cfsqltype="cf_sql_date">,
                        <cfqueryparam value="#med.end_date#" cfsqltype="cf_sql_date">,
                        <cfqueryparam value="#med.refills ?: 0#" cfsqltype="cf_sql_integer">,
                        <cfqueryparam value="#med.instructions ?: ''#" cfsqltype="cf_sql_varchar" null="#NOT len(med.instructions ?: '')#">,
                        1
                    )
                </cfquery>
            </cfloop>
        </cftransaction>
        
        <cfset response = {"success": true, "message": "Prescription created", "prescription_id": prescriptionId}>
        
    <cfelseif cgi.request_method EQ "GET">
        <!--- GET prescriptions --->
        <cfquery name="qPrescriptions" datasource="rde_be">
            SELECT id, prescription_date, is_active, created_at
            FROM prescription
            WHERE doctor_id = <cfqueryparam value="#doctorId#" cfsqltype="cf_sql_bigint">
              AND patient_id = <cfqueryparam value="#patientId#" cfsqltype="cf_sql_bigint">
            ORDER BY prescription_date DESC
        </cfquery>
        
        <cfset prescriptions = []>
        <cfloop query="qPrescriptions">
            <!--- Get medications for this prescription --->
            <cfquery name="qMeds" datasource="rde_be">
                SELECT pm.*, m.medication_name
                FROM prescription_medication pm
                INNER JOIN medication m ON pm.medication_id = m.id
                WHERE pm.prescription_id = <cfqueryparam value="#qPrescriptions.id#" cfsqltype="cf_sql_bigint">
            </cfquery>
            
            <cfset meds = []>
            <cfloop query="qMeds">
                <cfset arrayAppend(meds, {
                    "id": qMeds.id,
                    "medication_id": qMeds.medication_id,
                    "medication_name": qMeds.medication_name,
                    "dosage": qMeds.dosage,
                    "supply": qMeds.supply,
                    "frequency_type": qMeds.frequency_type,
                    "freq_per_day": qMeds.freq_per_day,
                    "start_date": dateFormat(qMeds.start_date, "yyyy-mm-dd"),
                    "end_date": dateFormat(qMeds.end_date, "yyyy-mm-dd"),
                    "refills": qMeds.refills,
                    "instructions": qMeds.instructions
                })>
            </cfloop>
            
            <cfset arrayAppend(prescriptions, {
                "prescription_id": qPrescriptions.id,
                "prescription_date": dateFormat(qPrescriptions.prescription_date, "yyyy-mm-dd"),
                "is_active": qPrescriptions.is_active,
                "medications": meds
            })>
        </cfloop>
        
        <cfset response = {"success": true, "count": arrayLen(prescriptions), "prescriptions": prescriptions}>
    </cfif>
    
<cfcatch type="any">
    <cfset response = {"success": false, "message": cfcatch.message}>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>