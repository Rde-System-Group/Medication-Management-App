<cffunction name="pgetAuthUser" returntype="struct" access="public">
    <!---
    
        SWAP TO ACCESS=PRIVATE
        AFTER TESTING
    
    --->
    <cfset local.response = {"valid": false, "userId": 0, "role": ""} >
    <cftry>
        <cfparam name="cookie.RDE_BE_AUTH" default="none">
        <cfif cookie.RDE_BE_AUTH eq "none">
            <cfset local.response.noCookies = true>
            <cfreturn local.response >
        </cfif>
        <cfset local.jwt = pverifyJWT(cookie.RDE_BE_AUTH, application.jwtSecret)>
        <cfif local.jwt.valid>
            <cfset local.response.userID = local.jwt.claims.sub>
            <cfset local.response.role   = local.jwt.claims.role>
            <cfquery name="isUser" datasource="rde_be">
                SELECT id
                FROM dbo.[user]
                WHERE
                    id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#local.response.userID#">
            </cfquery>
            <cfif !isUser.RecordCount>
                <cfthrow message="User doesn't exist in DB!">
            </cfif>
            <cfset local.response.valid = true>
        </cfif>
        <cfreturn local.response>
    <cfcatch type="any">
        <cfset local.response.message = cfcatch.message>
        <cfreturn local.response>
    </cfcatch>
    </cftry>
</cffunction>

<cffunction name="pcreateJWT" access="private" returntype="string">
    <cfargument name="claims" type="struct" required="true">
    <cfargument name="secret" type="string" required="true">

    <cfset var header = serializeJSON({"alg":"HS256","typ":"JWT"})>
    <cfset var headerB64 = toBase64(header).replace("+","-","all").replace("/","_","all").replace("=","","all")>
    
    <cfset var payloadB64 = toBase64(serializeJSON(arguments.claims)).replace("+","-","all").replace("/","_","all").replace("=","","all")>
    
    <cfset var signingInput = headerB64 & "." & payloadB64>
    
    <cfset var mac = createObject("java","javax.crypto.Mac").getInstance("HmacSHA256")>
    <cfset var keySpec = createObject("java","javax.crypto.spec.SecretKeySpec").init(arguments.secret.getBytes("UTF-8"), "HmacSHA256")>
    <cfset mac.init(keySpec)>
    <cfset var sig = toBase64(mac.doFinal(signingInput.getBytes("UTF-8"))).replace("+","-","all").replace("/","_","all").replace("=","","all")>

    <cfreturn signingInput & "." & sig>
</cffunction>


<cffunction name="pverifyJWT" access="private" returntype="struct">
    <cfargument name="token" type="string" required="true">
    <cfargument name="secret" type="string" required="true">

    <cfset var result = { "valid": false, "claims": {} }>

    <cftry>
        <cfset var parts = listToArray(arguments.token, ".")>
        <cfif arrayLen(parts) NEQ 3>
            <cfthrow message="Invalid JWT structure">
        </cfif>

        <!--- Re-sign the header.payload and compare --->
        <cfset var signingInput = parts[1] & "." & parts[2]>

        <cfset var mac = createObject("java","javax.crypto.Mac").getInstance("HmacSHA256")>
        <cfset var keySpec = createObject("java","javax.crypto.spec.SecretKeySpec").init(arguments.secret.getBytes("UTF-8"), "HmacSHA256")>
        <cfset mac.init(keySpec)>
        <cfset var expectedSig = toBase64(mac.doFinal(signingInput.getBytes("UTF-8")))
            .replace("+","-","all")
            .replace("/","_","all")
            .replace("=","","all")>

        <cfif expectedSig NEQ parts[3]>
            <cfthrow message="Invalid JWT signature">
        </cfif>

        <cfset var padded = parts[2]
            .replace("-","+","all")
            .replace("_","/","all")>
        <cfset var remainder = len(padded) mod 4>
        <cfif remainder EQ 2><cfset padded = padded & "==">
        <cfelseif remainder EQ 3><cfset padded = padded & "=">
        </cfif>

        <cfset var claims = deserializeJSON(toString(toBinary(padded)))>


        <cfif structKeyExists(claims, "exp") AND int(getTickCount()/1000) GT claims.exp>
            <cfthrow message="JWT expired">
        </cfif>

        <cfset result.valid = true>
        <cfset result.claims = claims>

    <cfcatch type="any">
        <cfset result.valid = false>
        <cfset result.error = cfcatch.message>
    </cfcatch>
    </cftry>

    <cfreturn result>
</cffunction>


<cffunction name="fetch" access="remote" hint="fetch test" returnformat="json">
    <cfset local.response = { "success": false, "message": "" }>
<cftry>
    <!---
        CHECK HERE for patient information
    !--->
    <cfset local.auth = pgetAuthUser()>
    
    <cfif NOT local.auth.valid>
        <cfreturn serializeJSON({ 
                "error": true, 
                "message": "Unauthorized",
                "auth": auth
        },"struct")>
    </cfif>
    
    <cfquery datasource="rde_be" name="patients">
    SELECT  PT.*, first_name, last_name, doctor_id AS DID
    FROM dbo.[patient] as PT
    LEFT JOIN dbo.[user] as U
        ON U.id = PT.user_id
    LEFT JOIN dbo.[doctor_patient_mapping] as DPM
        ON DPM.patient_id = PT.user_id
    WHERE DPM.doctor_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#local.auth.userID#">
    </cfquery>
    
    <cfset local.response.success = true>
    <cfset local.response["data"] = patients>
    <cfreturn serializeJSON(local.response, "struct")>
<cfcatch type="any">
    <cfset local.response.message = cfcatch.message>
    <cfset local.response.error = true>
    <cfreturn serializeJSON(local.response, "struct")>
</cfcatch>
</cftry>
</cffunction>


<cffunction name="post" access="remote" hint="update test" returnformat="json">
<cftry>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
    <cfheader name="Access-Control-Allow-Origin" value="*">
    <cfset local.response = { "success": false, "message": "" }>


    <cfset regexEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">
    <cfset validEmail = REFind(regexEmail, body.email)>
    <cfif validEmail EQ 0>
        <cfthrow message="Invalid email!" detail="email INPUT :: #body.email#">
    </cfif>

    <cfif len(body.fname) lt 2>
        <cfthrow message="Invalid first name!" detail="fname INPUT :: #body.fname#">
    </cfif>
    <cfif len(body.lname) lt 2>
        <cfthrow message="Invalid last name!" detail="lname INPUT :: #body.lname#">
    </cfif>

    <cfset regexPhone = "^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$">
    <cfset validPhone = REFind(regexPhone, body.phone)>
    <cfif validPhone EQ 0>
        <cfthrow message="Invalid phone number!" detail="phone INPUT :: #body.phone#">
    </cfif>

    <cfquery datasource="rde_be" name="userExists">
        SELECT id 
        FROM dbo.[user]
        WHERE
            dbo.[user].id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.userid#">
    </cfquery>
    <cfif !userExists.recordCount>
        <cfthrow message="User not found!">
    </cfif>

    
    <cfquery datasource="rde_be" name="updateRes">
        UPDATE dbo.[user]
        SET
            first_name = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.fname#">,
            last_name = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.lname#">,
            email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">,
            phone_number = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.phone#">,
            updated_at = getdate()
        WHERE
            dbo.[user].id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.userid#">
    </cfquery>

    <cfreturn serializeJSON({
        success: true,
        message: "User updated successfully!"
    },"struct")>

<cfcatch type="any">
    <cfset local.response.message = cfcatch.message>
    <cfreturn serializeJSON(local.response, "struct")>
</cfcatch>
</cftry>
</cffunction>

