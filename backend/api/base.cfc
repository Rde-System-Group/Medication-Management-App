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

    <cffunction
    name="encryptAll"
    access="public"
    returntype="struct"
>
    <cfargument name="body" type="struct" required="true">

    <cfset var local = {} >
    <cfset local.response = { "message" = "", "data" = {} }>

    <cfset var structKeys = StructKeyArray(arguments.body)>

    <cfloop index="i" from="1" to="#ArrayLen(structKeys)#">
        <cfif !isArray(arguments.body[structKeys[i]])>
            <cfset local.response.data[structKeys[i]] =
                encrypt(
                    arguments.body[structKeys[i]],
                    application.encryptSecret,
                    "AES",
                    "Base64"
                )
            >
        </cfif>
    </cfloop>

    <cfset local.response.success = true>

    <cfreturn local.response>
</cffunction>
    
</cfcomponent>