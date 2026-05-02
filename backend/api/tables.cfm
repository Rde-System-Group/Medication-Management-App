<cfsilent>
<cfheader name="Access-Control-Allow-Origin" value="*">
<cfcontent type="application/json">
</cfsilent>
<cftry>
    <cfquery name="qTables" datasource="rde_be">
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    </cfquery>
    
    <cfset tables = []>
    <cfloop query="qTables">
        <cfset arrayAppend(tables, qTables.TABLE_NAME)>
    </cfloop>
    
    <cfoutput>#serializeJSON({"success": true, "tables": tables})#</cfoutput>
    
<cfcatch type="any">
    <cfoutput>#serializeJSON({"success": false, "error": cfcatch.message})#</cfoutput>
</cfcatch>
</cftry>