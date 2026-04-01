<cfsetting showDebugOutput="false">
<cferror type="exception" template="">

<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="GET,OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">

<cfcontent type="application/json">

<cftry>
    <cfquery datasource="rde_be" name="users">
        SELECT *
        FROM dbo.[race]
    </cfquery>

    <cfoutput>#serializeJSON(users,"struct")#</cfoutput>

    <cfcatch type="any">
        <cfoutput>#serializeJSON({
            "error": true,
            "message": cfcatch.message,
            "detail": cfcatch.detail,
            "type": cfcatch.type
        })#</cfoutput>
    </cfcatch>
</cftry>