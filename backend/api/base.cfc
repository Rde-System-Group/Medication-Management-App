<cfcomponent 
    rest="true" 
    restPath="/base"
    output="false"
>
    <cffunction
        name="options"
        access="remote"
        httpmethod="GET"
        restPath="/options"
        returntype="Any"
        produces="application/json"
    >
        <cftry>
            <cfquery datasource="rde_be" name="races">
                SELECT *
                FROM dbo.[race]
            </cfquery>

            <cfreturn serializeJSON(races,"struct") >

            <cfcatch type="any">
                <cfreturn serializeJSON({
                    "error": true,
                    "message": cfcatch.message,
                    "detail": cfcatch.detail,
                    "type": cfcatch.type
                }) >
            </cfcatch>
        </cftry>
    </cffunction>

</cfcomponent>