<cfcomponent output="false" hint="Validates RDE_BE_AUTH cookie (or Authorization: Bearer) and enforces role + resource ownership for REST and .cfm endpoints.">

    <cffunction name="readBearerToken" access="private" returntype="string" output="false">
        <cfset var hdr = getHTTPRequestData().headers>
        <cfset var raw = "">
        <cfif isStruct(hdr)>
            <cfif structKeyExists(hdr, "Authorization")>
                <cfset raw = hdr.Authorization>
            <cfelseif structKeyExists(hdr, "authorization")>
                <cfset raw = hdr.authorization>
            </cfif>
        </cfif>
        <cfif len(trim(raw)) AND findNoCase("Bearer ", raw) EQ 1>
            <cfreturn trim(mid(raw, 8, len(raw)))>
        </cfif>
        <cfreturn "">
    </cffunction>

    <!--- Prefer HttpOnly cookie; use Authorization: Bearer only as fallback (e.g. cross-site cookie limits). --->
    <cffunction name="readSessionToken" access="private" returntype="string" output="false">
        <cfif structKeyExists(cookie, "RDE_BE_AUTH") AND len(trim(cookie.RDE_BE_AUTH))>
            <cfreturn trim(cookie.RDE_BE_AUTH)>
        </cfif>
        <cfreturn readBearerToken()>
    </cffunction>

    <!--- Same algorithm as auth.cfc verifyJWT --->
    <cffunction name="verifyJWT" access="private" returntype="struct" output="false">
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
            <cfset var padded = parts[2].replace("-","+","all").replace("_","/","all")>
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

    <!---
        Returns: ok, httpStatus, message, userId, role, doctorId, patientId
        doctorId / patientId are resolved from DB (not trusted from URL).
    --->
    <cffunction name="getPrincipal" access="public" returntype="struct" output="false">
        <cfset var out = {
            "ok": false,
            "httpStatus": 401,
            "message": "Authentication required",
            "userId": 0,
            "role": "",
            "doctorId": 0,
            "patientId": 0
        }>
        <cftry>
            <cfset var token = readSessionToken()>
            <cfif NOT len(token)>
                <cfreturn out>
            </cfif>
            <cfset var jwt = verifyJWT(token, application.jwtSecret)>
            <cfif NOT jwt.valid>
                <cfif structKeyExists(jwt, "error")>
                    <cfset out.message = jwt.error>
                <cfelse>
                    <cfset out.message = "Invalid or expired session">
                </cfif>
                <cfset out.httpStatus = 401>
                <cfreturn out>
            </cfif>
            <cfset var uid = val(jwt.claims.sub)>
            <cfset var role = "">
            <cfif structKeyExists(jwt.claims, "role")>
                <cfset role = jwt.claims.role>
            </cfif>
            <cfquery name="uActive" datasource="rde_be">
                SELECT id FROM dbo.[user]
                WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#uid#">
                AND is_active = 1
            </cfquery>
            <cfif NOT uActive.recordCount>
                <cfset out.message = "User inactive or not found">
                <cfset out.httpStatus = 401>
                <cfreturn out>
            </cfif>
            <cfset out.userId = uid>
            <cfset out.role = role>
            <cfif role EQ "Doctor">
                <cfquery name="d" datasource="rde_be">
                    SELECT id FROM dbo.[doctor]
                    WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#uid#">
                    AND is_active = 1
                </cfquery>
                <cfif d.recordCount>
                    <cfset out.doctorId = d.id>
                </cfif>
            <cfelseif role EQ "Patient">
                <cfquery name="p" datasource="rde_be">
                    SELECT id FROM dbo.[patient]
                    WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#uid#">
                    AND is_active = 1
                </cfquery>
                <cfif p.recordCount>
                    <cfset out.patientId = p.id>
                </cfif>
            </cfif>
            <cfset out.ok = true>
            <cfset out.httpStatus = 200>
            <cfset out.message = "">
            <cfreturn out>
        <cfcatch type="any">
            <cfset out.message = cfcatch.message>
            <cfreturn out>
        </cfcatch>
        </cftry>
    </cffunction>

    <cffunction name="requireDoctor" access="public" returntype="struct" output="false">
        <cfargument name="pathDoctorId" type="numeric" required="true">
        <cfset var p = getPrincipal()>
        <cfif NOT p.ok>
            <cfreturn { "authorized": false, "httpStatus": p.httpStatus, "message": p.message }>
        </cfif>
        <cfif p.role NEQ "Doctor">
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Doctor access required" }>
        </cfif>
        <cfif val(p.doctorId) EQ 0 OR val(p.doctorId) NEQ val(arguments.pathDoctorId)>
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Not authorized for this doctor account" }>
        </cfif>
        <cfreturn { "authorized": true, "httpStatus": 200, "message": "" }>
    </cffunction>

    <cffunction name="requireDoctorSession" access="public" returntype="struct" output="false">
        <cfset var p = getPrincipal()>
        <cfif NOT p.ok>
            <cfreturn { "authorized": false, "httpStatus": p.httpStatus, "message": p.message }>
        </cfif>
        <cfif p.role NEQ "Doctor" OR val(p.doctorId) EQ 0>
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Doctor access required" }>
        </cfif>
        <cfreturn { "authorized": true, "httpStatus": 200, "message": "" }>
    </cffunction>

    <cffunction name="requirePatient" access="public" returntype="struct" output="false">
        <cfargument name="pathPatientId" type="numeric" required="true">
        <cfset var p = getPrincipal()>
        <cfif NOT p.ok>
            <cfreturn { "authorized": false, "httpStatus": p.httpStatus, "message": p.message }>
        </cfif>
        <cfif p.role NEQ "Patient">
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Patient access required" }>
        </cfif>
        <cfif val(p.patientId) EQ 0 OR val(p.patientId) NEQ val(arguments.pathPatientId)>
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Not authorized for this patient record" }>
        </cfif>
        <cfreturn { "authorized": true, "httpStatus": 200, "message": "" }>
    </cffunction>

    <!--- Any logged-in Doctor or Patient (active user row). --->
    <cffunction name="requireAnyAuthenticated" access="public" returntype="struct" output="false">
        <cfset var p = getPrincipal()>
        <cfif NOT p.ok>
            <cfreturn { "authorized": false, "httpStatus": p.httpStatus, "message": p.message }>
        </cfif>
        <cfif p.role NEQ "Doctor" AND p.role NEQ "Patient">
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Access denied" }>
        </cfif>
        <cfif p.role EQ "Doctor" AND val(p.doctorId) EQ 0>
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Doctor profile not found" }>
        </cfif>
        <cfif p.role EQ "Patient" AND val(p.patientId) EQ 0>
            <cfreturn { "authorized": false, "httpStatus": 403, "message": "Patient profile not found" }>
        </cfif>
        <cfreturn { "authorized": true, "httpStatus": 200, "message": "" }>
    </cffunction>

</cfcomponent>
