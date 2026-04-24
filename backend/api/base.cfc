<cfcomponent 
    rest="true" 
    restPath="/base"
    output="false"
>

// GET Request to return patients...
    <cffunction 
        name="patients"
        access="remote"
        httpmethod="GET"
        restPath="/patients"
        returntype="Any"
        produces="application/json"
    >
        <cfquery name="fetch" datasource="rde_be">
            SELECT * FROM dbo.[patient]
        </cfquery>
        <cfreturn serializeJSON(fetch, "struct")>
    </cffunction>

    <cffunction
        name="options"
        access="remote"
        httpmethod="GET"
        restPath="/options"
        returntype="Any"
        produces="application/json"
    >
        <cftry>
            <cfquery datasource="rde_be" name="users">
                SELECT *
                FROM dbo.[race]
            </cfquery>

            <cfreturn serializeJSON(users,"struct") >

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