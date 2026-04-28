<cfcomponent
    rest="true"
    restPath="/auth"
    output="false"
>
    <cffunction
        name="login" 
        restPath="/login"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json">
        <cfset local.response = { "success": false, "message": "" }>

    <cftry>
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cfif !structKeyExists(body, "email") OR !structKeyExists(body, "password")>
            <cfthrow 
                message="Error in /login"
                detail="Email or password missing from body."
            >
        </cfif>
        <cfset email = body.email>
        <cfset password = body.password>
        <cfset role = "">

        <cfquery name="userFound" datasource="rde_be">
            SELECT password_hashed, password_salt, id
            FROM dbo.[user]
            WHERE
                email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                AND is_active = 1
        </cfquery>

        <cfif !userFound.recordCount>
            <cfthrow message="Wrong credentials!">
        </cfif>

        <cfset hashed = hash(userFound.PASSWORD_SALT & body.password, "SHA-512","UTF-8", 10000) >
        <cfif userFound.PASSWORD_HASHED eq hashed>
            <cfquery name="isDoctor" datasource="rde_be">
                SELECT id
                FROM dbo.[doctor]
                WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#userFound.ID#">
            </cfquery>
            <cfif isDoctor.RecordCount>
                <cfset role = "Doctor">
            </cfif>

            <cfquery name="isPatient" datasource="rde_be">
                SELECT id
                FROM dbo.[patient]
                WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#userFound.ID#">
            </cfquery>
            <cfif isPatient.RecordCount>
                <cfset role = "Patient">
            </cfif>
        
            <cfset claims = {
                "iss" : "rde-mmwa",
                "sub" : "#userFound.id#",
                "role": "#role#",
                "exp" : int(getTickCount()/1000) + (30 * 24 * 60 * 60),
                "iat" : int(getTickCount()/1000)
            }>
            <!--- Embed stable role ids for session tracking (still verified server-side on every request). --->
            <cfif isDoctor.RecordCount>
                <cfset claims["doctorId"] = isDoctor.id>
            </cfif>
            <cfif isPatient.RecordCount>
                <cfset claims["patientId"] = isPatient.id>
            </cfif>
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
                "userId" : userFound.id,
                "role"   : "#role#",
                "doctorId": "#isDoctor.id#",
                "patientId": "#isPatient.id#"
            })>
        <cfelse>
            <cfthrow message="Wrong credentials!">
        </cfif>

        <cfcatch type="any">
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type,
            }) >
        </cfcatch>
    </cftry>
    </cffunction>

    <cffunction
        name="checkLogin" 
        restPath="/checkLogin"
        httpmethod="GET"
        access="remote" 
        returntype="Any"
        produces="application/json">
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

    <cffunction
        name="logout" 
        restPath="/logout"
        httpmethod="GET"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cfset local.response = { "success": false, "message": "" }>
    <cftry>
        <cfcookie 
            name="RDE_BE_AUTH" 
            value="" 
            expires="NOW"
            httponly="true"
            secure="true"
            samesite="Strict"
        >
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

    <cffunction 
        name="verifyJWT" 
        access="private" 
        returntype="struct"
    >
        <cfargument name="token" type="string" required="true">
        <cfargument name="secret" type="string" required="true">

        <cfset var result = { "valid": false, "claims": {} }>

        <cftry>
            <cfset var parts = listToArray(arguments.token, ".")>
            <cfif arrayLen(parts) NEQ 3>
                <cfthrow message="Invalid JWT structure">
            </cfif>

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

    <cffunction name="safeDecrypt" access="private" returntype="string" output="false">
        <cfargument name="value" required="true">
        <cfif isNull(arguments.value)>
            <cfreturn "">
        </cfif>
        <cftry>
            <cfreturn decrypt(arguments.value, application.encryptSecret, "AES", "Base64")>
            <cfcatch type="any">
                <cfreturn arguments.value>
            </cfcatch>
        </cftry>
    </cffunction>

    <cffunction 
        name="getAuthUser" 
        restPath="/getAuthUser"
        httpmethod="GET"
        access="public" 
        returntype="Any"
        produces="application/json"
    >
        <cfset local.response = {"valid": false, "userId": 0, "role": ""} >
        <cftry>
            <cfparam name="cookie.RDE_BE_AUTH" default="none">
            <cfif cookie.RDE_BE_AUTH eq "none">
                <cfset local.response.noCookies = true>
                <cfthrow 
                    message="Cookies are not found (no auth)!"
                >
            </cfif>
            <cfset local.jwt = verifyJWT(cookie.RDE_BE_AUTH, application.jwtSecret)>
            <cfif local.jwt.valid>
                <cfset local.response.userID = local.jwt.claims.sub>
                <cfset local.response.role   = local.jwt.claims.role>
                
                <cfquery name="isUser" datasource="rde_be" result="foundUser">
                    SELECT id, email, phone_number, first_name, last_name
                    FROM dbo.[user]
                    WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#local.response.userID#">
                    AND is_active = 1
                </cfquery>
                <cfif !isUser.RecordCount>
                    <cfthrow message="Error in retrieving user from database!">
                </cfif>
                <cfset local.response.valid = true>

                <cfset local.response.user = {
                    "email": isUser.email,
                    "phone_number": safeDecrypt(isUser.phone_number),
                    "first_name": safeDecrypt(isUser.first_name),
                    "last_name": safeDecrypt(isUser.last_name),
                }>
                

                <cfif local.response.role EQ "Doctor">
                    <cfquery name="getDoc" datasource="rde_be">
                        SELECT id FROM dbo.[doctor] WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#local.response.userID#">
                    </cfquery>
                    <cfif getDoc.RecordCount>
                        <cfset local.response.doctor_id = getDoc.id>
                    </cfif>
                <cfelseif local.response.role EQ "Patient">
                    <cfquery name="getPat" datasource="rde_be">
                        SELECT id FROM dbo.[patient] WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#local.response.userID#">
                    </cfquery>
                    <cfif getPat.RecordCount>
                        <cfset local.response.patient_id = getPat.id>
                    </cfif>
                </cfif>

            </cfif>
            <cfreturn serializeJSON(local.response, "struct")>
        <cfcatch type="any">
            <cfset local.response.message = cfcatch.message>
            <cfreturn serializeJSON(local.response, "struct")>
        </cfcatch>
        </cftry>
    </cffunction>

    <cffunction 
        name="getUserRole" 
        restPath="/getUserRole"
        httpmethod="GET"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
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
    <cffunction 
        name="getAuthRole" 
        restPath="/getAuthRole"
        httpmethod="GET"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cfset local.response = {"valid": false, "userId": 0, "data": ""} >
        <cftry>
            <cfset authComp = createObject("component","auth")>
            <cfset result = authComp.getAuthUser() >
            <cfset res = deserializeJSON(result) >
            
            <cfif structKeyExists(res, "error") >
                <cfthrow 
                    message="Error in /user/update"
                    detail="Missing cookies (Auth)!"
                >
            </cfif>
            <cfif !structKeyExists(res, "userId")>
                <cfthrow 
                    message="Error in /user/update"
                    detail="Missing userID in auth!"
                >
            </cfif>

            <cfset local.response["userId"] = res.userId>
            <cfif res.role == "Patient">
                <cfset local.response.role = "Patient">
                <cfquery name="found" datasource="rde_be">
                    SELECT patient.*, race.name AS "RACE", race.id AS "RACEID"
                    FROM dbo.[patient]
                    LEFT JOIN patient_race ON patient_race.patient_id = patient.id
                    LEFT JOIN race ON patient_race.race_id = race.id
                    WHERE
                        user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                        AND is_active = 1
                </cfquery>
                <cfif !found.recordCount>
                    <cfthrow message="Error in retrieving data from database!">
                </cfif>
                <cfset local.response.data = {
                    id: found.id,
                    "first_name": res.user.first_name,
                    "last_name": res.user.last_name,
                    "date_of_birth": decrypt(found.date_of_birth, application.encryptSecret, "AES", "Base64"),
                    "gender": decrypt(found.gender, application.encryptSecret, "AES", "Base64"),
                    "ethnicity": found.ethnicity,
                    "sex": decrypt(found.sex, application.encryptSecret, "AES", "Base64"),
                    "RACE": found.race,
                    "RACEID": found.raceid,

                }>
                <cfset local.response.valid = true>
            </cfif>

            <cfif res.role == "Doctor">
                <cfset local.response.role = "Doctor">
                <cfquery name="found" datasource="rde_be">
                    SELECT *
                    FROM dbo.[doctor]
                    WHERE
                        user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                        AND is_active = 1
                </cfquery>
                <cfif !found.recordCount>
                    <cfthrow message="Error in retrieving data from database!">
                </cfif>
                <cfset local.response.data = {
                    id: found.id,
                    "specialty": decrypt(found.specialty, application.encryptSecret, "AES", "Base64"),
                    "work_email": found.work_email
                }>
                <cfset local.response.valid = true>
            </cfif>

            <cfreturn serializeJSON(local.response, "struct")>
        <cfcatch type="any">
            <cfset local.response.message = cfcatch.message>
            <cfreturn serializeJSON(local.response, "struct")>
        </cfcatch>
        </cftry>
    </cffunction>

</cfcomponent>
