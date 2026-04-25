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

    <cffunction
        name="encrypt"
        access="remote"
        httpmethod="POST"
        restPath="/encrypt"
        returntype="Any"
        produces="application/json"
    >
    <cfset local.response = {"message": "" }>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cftry>
            <cfif !structKeyExists(body, "value")>
                <cfthrow 
                    message="Error in /base/encrypt"
                    detail="Missing keys in body payload."
                >
            </cfif>
            <cfset encryptedRes = encrypt(body.value, application.encryptSecret, "AES", "Base64") >
            <cfset local.response["data"] = encryptedRes >
            <cfset local.response["success"] = true >
            <cfreturn serializeJSON(local.response,"struct") >

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
        name="decrypt"
        access="remote"
        httpmethod="POST"
        restPath="/decrypt"
        returntype="Any"
        produces="application/json"
    >
    <cfset local.response = {"message": "" }>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cftry>
            <cfif !structKeyExists(body, "value")>
                <cfthrow 
                    message="Error in /base/decrypt"
                    detail="Missing keys in body payload."
                >
            </cfif>
            <cfset decryptValue = decrypt(body.value, application.encryptSecret, "AES", "Base64") >
            <cfset local.response["data"] = decryptValue >
            <cfset local.response["success"] = true >
            <cfreturn serializeJSON(local.response,"struct") >

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