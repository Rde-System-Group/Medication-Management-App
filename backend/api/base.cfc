<cfcomponent 
    rest="true" 
    restPath="/base"
    output="false"
>

    <!--- Removed unauthenticated /base/patients dump (PHI). Use authenticated doctor APIs instead. --->
    <cffunction 
        name="patients"
        access="remote"
        httpmethod="GET"
        restPath="/patients"
        returntype="Any"
        produces="application/json"
    >
        <cfset restSetResponse({ "status": 404 })>
        <cfreturn serializeJSON({ "success": false, "message": "Not found" })>
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
    <cfset var _jwt = createObject("component","JwtSessionService")>
    <cfset var _a = _jwt.requireAnyAuthenticated()>
    <cfif NOT _a.authorized>
        <cfset restSetResponse({ "status": _a.httpStatus })>
        <cfreturn serializeJSON({ "error": true, "message": _a.message })>
    </cfif>
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
    <cfset var _jwt = createObject("component","JwtSessionService")>
    <cfset var _a = _jwt.requireAnyAuthenticated()>
    <cfif NOT _a.authorized>
        <cfset restSetResponse({ "status": _a.httpStatus })>
        <cfreturn serializeJSON({ "error": true, "message": _a.message })>
    </cfif>
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

    

    <cffunction
        name="encryptAll"
        access="remote"
        httpmethod="POST"
        restPath="/encryptAll"
        returntype="Any"
        produces="application/json"
    >
    <cfset var _jwt = createObject("component","JwtSessionService")>
    <cfset var _a = _jwt.requireAnyAuthenticated()>
    <cfif NOT _a.authorized>
        <cfset restSetResponse({ "status": _a.httpStatus })>
        <cfreturn serializeJSON({ "error": true, "message": _a.message })>
    </cfif>
    <cfset local.response = {"message": "" }>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cftry>
            <cfif !isStruct(body) OR isArray(body)>
                <cfthrow 
                    message="Error in /base/encryptAll"
                    detail="Missing body payload. (#!isStruct(body)#, #isArray(body)#, #!isStruct(body) OR isArray(body)#)"
                >
            </cfif>

            <cfset structKeys = StructKeyArray(body)>
            <cfset local.response["data"] = {} >

            <cfloop index="i" from="1" to="#ArrayLen(structKeys)#">
                <cfif !isArray(body[structKeys[i]])> 
                    <cfset local.response.data[structKeys[i]] = encrypt(body[structKeys[i]], application.encryptSecret, "AES", "Base64") >
                </cfif>
            </cfloop>

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
        name="decryptAll"
        access="remote"
        httpmethod="POST"
        restPath="/decryptAll"
        returntype="Any"
        produces="application/json"
    >
    <cfset var _jwt = createObject("component","JwtSessionService")>
    <cfset var _a = _jwt.requireAnyAuthenticated()>
    <cfif NOT _a.authorized>
        <cfset restSetResponse({ "status": _a.httpStatus })>
        <cfreturn serializeJSON({ "error": true, "message": _a.message })>
    </cfif>
    <cfset local.response = {"message": "" }>
    <cfset unallowedFields = ["password","newPassword","oldPassword"] >
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cftry>
            <cfif !isStruct(body) OR isArray(body)>
                <cfthrow 
                    message="Error in /base/decryptAll"
                    detail="Missing body payload."
                >
            </cfif>

            <cfset structKeys = StructKeyArray(body)>
            <cfset local.response["data"] = {} >

            <cfloop
                index="i"
                from="1"
                to="#ArrayLen(structKeys)#"
            >
                <cfif !isArray(body[structKeys[i]]) AND ArrayContains(unallowedFields, structKeys[i])> 
                    <cfset local.response.data[structKeys[i]] = decrypt(body[structKeys[i]], application.encryptSecret, "AES", "Base64") >
                </cfif>
            </cfloop>

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