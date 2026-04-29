<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, OPTIONS">
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

<cftry>
    <cfquery datasource="rde_be" name="qMedications">
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
        JOIN prescription ON prescription_medication.prescription_id = prescription.id
        JOIN medication ON prescription_medication.medication_id = medication.id
        WHERE prescription.patient_id = <cfqueryparam value="#patientId#" cfsqltype="CF_SQL_BIGINT">
          AND prescription_medication.is_active = 1
          AND prescription.is_active = 1
        ORDER BY medication.medication_name
    </cfquery>

    <cfset medications = []>
    <cfloop query="qMedications">
        <cfset arrayAppend(medications, {
            "id": qMedications.id,
            "prescription_id": qMedications.prescription_id,
            "medication_id": qMedications.medication_id,
            "medication_name": qMedications.medication_name,
            "dosage": qMedications.dosage,
            "supply": qMedications.supply,
            "frequency_type": qMedications.frequency_type,
            "freq_per_day": qMedications.freq_per_day,
            "freq_days_per_week": qMedications.freq_days_per_week,
            "freq_by_x_week": qMedications.freq_by_x_week,
            "start_date": isNull(qMedications.start_date) ? "" : dateFormat(qMedications.start_date, "yyyy-mm-dd"),
            "end_date": isNull(qMedications.end_date) ? "" : dateFormat(qMedications.end_date, "yyyy-mm-dd"),
            "refills": qMedications.refills,
            "instructions": qMedications.instructions,
            "is_active": qMedications.is_active
        })>
    </cfloop>

    <cfset response = { "success": true, "count": arrayLen(medications), "medications": medications }>

<cfcatch type="any">
    <cfheader statuscode="500">
    <cfset response = { "success": false, "message": cfcatch.message, "detail": cfcatch.detail }>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>
