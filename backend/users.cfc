<cffunction name="register" access="remote" hint="fetch test" returnformat="json">
    <cfheader name="Access-Control-Allow-Origin" value="*">
    <cfset local.response = { "success": false, "message": "" }>
<cftry>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
    <cfset regexEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">
    <cfset validEmail = REFind(regexEmail, body.email)>
    <cfif validEmail LT 0>
        <cfthrow message="Invalid email!" detail="email INPUT :: #body.email#">
    </cfif>

    <cfset validFName = len(body.fname) gt 2>
    <cfset validLName = len(body.lname) gt 2>
    <cfif !validFName>
        <cfthrow message="Invalid first name!" detail="fname INPUT :: #body.fname#">
    </cfif>
    <cfif !validLName>
        <cfthrow message="Invalid last name!" detail="lname INPUT :: #body.lname#">
    </cfif>

    <cfset regexPhone = "^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$">
    <cfset validPhone = REFind(regexPhone, body.phone)>
    <cfif validPhone LT 0>
        <cfthrow message="Invalid phone number!" detail="phone INPUT :: #body.phone#">
    </cfif>

    <cfif !ArrayContains(["Patient","Doctor"],body.signUpType)>
        <cfthrow message="Invalid sign up type!" detail="signUpType INPUT :: #body.signUpType#">
    </cfif>


    <cfquery datasource="rde_be" name="userExists">
        SELECT email
        FROM dbo.[user]
        WHERE 
            email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
            OR phone_number = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.phone#">
    </cfquery>

    <cfif userExists.RecordCount GT 0>
        <cfthrow message="User exists with current email or phone!" detail="#userExists.RecordCount#">
    </cfif>

    <!---
    
        IF PASSES, then...
        > create user account
        > create doctor OR patient account (depending on body.signUpType)
    --->
    <cfset salt = generateSecretKey("AES", 256)> 
    <cfset hashedPassword = hash(salt & body.password, "SHA-512", "UTF-8", 10000)>

    <cfquery datasource="rde_be" name="createUser" result="resultedUser">
        INSERT INTO dbo.[user] ("email","phone_number","first_name","last_name","password_hashed","password_salt") VALUES (
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">,
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.phone#">,
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.fname#">,
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.lname#">,
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#hashedPassword#">,
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#salt#">
        )
    </cfquery>

    <cfset newUserId = resultedUser.GENERATEDKEY>

<!---
    <cfif body.signUpType == "Patient">
        <cfquery datasource="rde_be" name="createPatient">
            INSERT INTO dbo.[patient] ("user_id","date_of_birth","gender","ethnicity","sex") VALUES (
                <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#newUserId#">,
                <cfqueryparam cfsqltype="CF_SQL_DATE" value="#body.date_of_birth#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.gender#">,
                <cfqueryparam cfsqltype="CF_SQL_BIT" value="#body.ethnicity#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.sex#">
            ) 
        </cfquery>
    <cfelse>
        <cfquery datasource="rde_be" name="createDoctor">
            INSERT INTO dbo.[doctor] ("specialty") VALUES (
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.specialty#">
            )
        </cfquery>
    </cfif>
--->

    <cfoutput>#serializeJSON({
        body,
        db: {
            userId: "#newUserId#",

        }
    },"struct")#</cfoutput>

    <cfcatch type="any">
        <cfoutput>#serializeJSON({
            "error": true,
            "message": cfcatch.message,
            "detail": cfcatch.detail,
            "type": cfcatch.type
        })#</cfoutput>
    </cfcatch>
</cftry>
</cffunction>


<cffunction name="login" access="remote" hint="fetch test" returnformat="json">
    <cfset local.response = { "success": false, "message": "" }>

<cftry>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
    <cfset email = body.email>
    <cfset password = body.password>
    <cfset role = "">

    <cfquery name="authenticate" datasource="rde_be">
        SELECT password_hashed, password_salt, id
        FROM dbo.[user]
        WHERE
            email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
    </cfquery>

    <cfif !authenticate.recordCount>
        <cfthrow message="User not found!">
    </cfif>

    <cfset hashed = hash(authenticate.PASSWORD_SALT & body.password, "SHA-512","UTF-8", 10000) >
    <cfif authenticate.PASSWORD_HASHED eq hashed>
        <!---
            GET ROLE
        --->
        <cfquery name="isDoctor" datasource="rde_be">
            SELECT id
            FROM dbo.[doctor]
            WHERE
                user_id = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#authenticate.ID#">
        </cfquery>
        <cfif isDoctor.RecordCount>
            <cfset role = "Doctor">
        </cfif>

        <cfquery name="isPatient" datasource="rde_be">
            SELECT id
            FROM dbo.[patient]
            WHERE
                user_id = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#authenticate.ID#">
        </cfquery>
        <cfif isDoctor.RecordCount>
            <cfset role = "Doctor">
        </cfif>
    
        <cfset claims = {
            "iss" : "rde-mmwa",
            "sub" : "#authenticate.id#",
            "role": "#role#",
            "exp" : int(getTickCount()/1000) + (30 * 24 * 60 * 60),
            "iat" : int(getTickCount()/1000)
        }>
        <cfset signOptions = {
            "key": application.jwtSecret || "0000"
        }>
        <cfset jwtConfig = {
            "algorithm"   : "HS256",
            "generateJti" : true
        }>
        <cfset token = createJWT(claims, application.jwtSecret)>

        <cfcookie 
            name="RDE_BE_AUTH"
            value="#token#"
            httponly="true"
            secure="true"
            samesite="Strict"
        />
        <cfreturn serializeJSON({
            "success": true,
            "token"  : token,
            "userId" : authenticate.id,
            "role"   : "#role#"
        })>
    <cfelse>
        <cfthrow message="Incorrect password!">
    </cfif>

    <cfcatch type="any">
        <cfreturn serializeJSON({
            "error": true,
            "message": cfcatch.message,
            "detail": cfcatch.detail,
            "type": cfcatch.type,
            "body": body
        }) >
    </cfcatch>
</cftry>
</cffunction>


<cffunction name="isLoggedIn" access="remote" hint="fetch test" returnformat="json">
    <cfset local.response = { "success": false, "message": "" }>
<cftry>
    <cfparam name="cookie.RDE_BE_AUTH" default="none">
    <cfif cookie.RDE_BE_AUTH eq "none">
        <cfthrow message="Cookie is undefined!">
    </cfif>
    <cfset local.jwt = verifyJWT(cookie.RDE_BE_AUTH, application.jwtSecret)>
    <cfif local.jwt.valid>
        <cfset local.response.success  = true>
        <cfset local.response.message   = "JWT is valid (logged in)!">
        <cfreturn serializeJSON(local.response, "struct")>
    </cfif>
    <cfthrow message="Cookie is not valid!">
<cfcatch type="any">
    <cfset local.response.message = cfcatch.message>
    <cfset local.response.detail = cfcatch.detail>
    <cfset local.response.error = true>
    <cfreturn serializeJSON(local.response, "struct")>
</cfcatch>
</cftry>
</cffunction>



<cffunction name="logOut" access="remote" hint="fetch test" returnformat="json">
    <cfheader name="Access-Control-Allow-Origin" value="*">
    <cfset local.response = { "success": false, "message": "" }>
<cftry>
    <cfcookie name="RDE_BE_AUTH" value="" expires="NOW">
    <cfset local.response.success = true>
    <cfset local.response.message = "Signed out!">
    <cfreturn serializeJSON(local.response, "struct")>
<cfcatch type="any">
    <cfset local.response.message = cfcatch.message>
    <cfset local.response.error = true>
    <cfreturn serializeJSON(local.response, "struct")>
</cfcatch>
</cftry>
</cffunction>

<cffunction name="getUser" access="remote" hint="fetch test" returnformat="json">
    <cfheader name="Access-Control-Allow-Origin" value="*">
    <cfset local.response = { "success": false, "message": "" }>
<cftry>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>

    <!---
        CHECK HERE for patient information
    !--->
    <cfquery datasource="rde_be" name="users">
    SELECT  id, email, phone_number, first_name, last_name FROM dbo.[user]
    WHERE 1=1
        <cfif structKeyExists(body, "isActive") AND isBoolean(body.isActive)>
            AND isActive = <cfqueryparam cfsqltype="CF_SQL_BIT" value="#body.isActive#">
        <cfelse>
            AND isActive = 1
        </cfif>
        <cfif structKeyExists(body, "fname") AND len(trim(body.fname)) gt 0>
            AND first_name LIKE <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="%#body.fname#%">
        </cfif>
        <cfif structKeyExists(body, "lname") AND len(trim(body.lname)) gt 0>
            AND last_name LIKE <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="%#body.lname#%">
        </cfif>
        <cfif structKeyExists(body, "userID") AND isNumeric(body.userID)>
            AND id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.userID#">
        </cfif>
</cfquery>

    <cfreturn serializeJSON(users,"struct")>
<cfcatch type="any">
    <cfset local.response.message = cfcatch.message>
    <cfset local.response.error = true>
    <cfreturn serializeJSON(local.response, "struct")>
</cfcatch>
</cftry>
</cffunction>






<cffunction name="createJWT" access="private" returntype="string">
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


<cffunction name="verifyJWT" access="private" returntype="struct">
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


<cffunction name="getAuthUser" returnformat="json" access="remote">
    <!---
    
        SWAP TO ACCESS=PRIVATE
        AFTER TESTING
    
    --->
    <cfset local.response = {"valid": false, "userId": 0, "role": ""} >
    <cftry>
        <cfparam name="cookie.RDE_BE_AUTH" default="none">
        <cfif cookie.RDE_BE_AUTH eq "none">
            <cfset local.response.noCookies = true>
            <cfreturn serializeJSON(local.response, "struct")>
        </cfif>
        <cfset local.jwt = verifyJWT(cookie.RDE_BE_AUTH, application.jwtSecret)>
        <cfif local.jwt.valid>
            <cfset local.response.userID = local.jwt.claims.sub>
            <cfset local.response.role   = local.jwt.claims.role>
            <cfquery name="isUser" datasource="rde_be">
                SELECT id
                FROM dbo.[user]
                WHERE
                    id = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#local.response.userID#">
            </cfquery>
            <cfif !isUser.RecordCount>
                <cfthrow message="User doesn't exist in DB!">
            </cfif>
            <cfset local.response.valid = true>
            <cfdump var="#local.response#" output="console">
        </cfif>
        <cfreturn serializeJSON(local.response, "struct")>
    <cfcatch type="any">
        <cfset local.response.message = cfcatch.message>
        <cfreturn serializeJSON(local.response, "struct")>
    </cfcatch>
    </cftry>
</cffunction>



<cffunction name="getUserRole" returnformat="json" access="remote">
    <cfset local.response = {"valid": false, "role": ""} >
    <cftry>
        <cfparam name="cookie.RDE_BE_AUTH" default="none">
        <cfif cookie.RDE_BE_AUTH eq "none">
            <cfreturn serializeJSON(local.response, "struct")>
        </cfif>
        <cfset local.jwt = verifyJWT(cookie.RDE_BE_AUTH, application.jwtSecret)>
        <cfif local.jwt.valid>
            <cfset local.response.valid  = true>
            <cfset local.response.role   = local.jwt.claims.role>
        </cfif>
        <cfreturn serializeJSON(local.response, "struct")>
    <cfcatch type="any">
        <cfreturn serializeJSON(local.response, "struct")>
    </cfcatch>
    </cftry>
</cffunction>
