<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET, OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">
<cfcontent type="application/json">

<cfif cgi.request_method EQ "OPTIONS">
    <cfheader statuscode="200">
    <cfabort>
</cfif>

<cftry>
    <cfquery name="qMedications" datasource="rde_be">
        SELECT id, medication_name, side_effects, price
        FROM medication
        ORDER BY medication_name
    </cfquery>
    
    <cfset medications = []>
    <cfloop query="qMedications">
        <cfset arrayAppend(medications, {
            "id": qMedications.id,
            "medication_name": qMedications.medication_name,
            "side_effects": qMedications.side_effects,
            "price": qMedications.price
        })>
    </cfloop>
    
    <cfset response = {"success": true, "count": arrayLen(medications), "medications": medications}>
    
<cfcatch type="any">
    <cfset response = {"success": false, "message": cfcatch.message}>
</cfcatch>
</cftry>
</cfsilent>
<cfoutput>#serializeJSON(response)#</cfoutput>