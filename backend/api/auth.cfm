<cfsilent>
    <!--- Handle different HTTP methods for authentication endpoints --->
    <cfset method = getHTTPRequestData().method>
    <cfset requestBody = getHTTPRequestData().content>
    
    <cfif method EQ "POST">
        <!--- Parse JSON body --->
        <cfset request_data = deserializeJSON(requestBody)>
        
        <!--- Check if this is a login or register request --->
        <cfif structKeyExists(url, 'action')>
            <cfswitch expression="#url.action#">
                <cfcase value="login">
                    <!--- Handle login --->
                    <cfset email = request_data.email>
                    <cfset password = request_data.password>
                    
                    <cfif NOT len(email) OR NOT len(password)>
                        <cfheader statuscode="400">
                        <cfoutput>{"success": false, "error": "Email and password required"}</cfoutput>
                        <cfabort>
                    </cfif>
                    
                    <!--- Query doctor table for matching credentials --->
                    <cftry>
                        <cfquery name="doctorQuery" datasource="rde_be">
                            SELECT 
                                doctor_id,
                                first_name,
                                last_name,
                                email,
                                password
                            FROM doctor
                            WHERE email = <cfqueryparam value="#email#" cfsqltype="cf_sql_varchar">
                            LIMIT 1
                        </cfquery>
                        
                        <cfif doctorQuery.recordcount EQ 0>
                            <cfheader statuscode="401">
                            <cfoutput>{"success": false, "error": "Invalid email or password"}</cfoutput>
                            <cfabort>
                        </cfif>
                        
                        <!--- For now, compare plaintext password. In production, use bcrypt --->
                        <cfif doctorQuery.password NEQ password>
                            <cfheader statuscode="401">
                            <cfoutput>{"success": false, "error": "Invalid email or password"}</cfoutput>
                            <cfabort>
                        </cfif>
                        
                        <!--- Create JWT token --->
                        <cfset jwtSecret = application.jwtSecret>
                        <cfset expiresAt = dateAdd("h", 24, now())>
                        <cfset issuedAt = now()>
                        
                        <!--- Payload structure: {doctor_id, email, iat, exp} --->
                        <cfset payload = {
                            "doctor_id": doctorQuery.doctor_id,
                            "email": email,
                            "iat": dateDiff("s", dateConvert("utc2Local", "1970-01-01 00:00:00"), issuedAt),
                            "exp": dateDiff("s", dateConvert("utc2Local", "1970-01-01 00:00:00"), expiresAt)
                        }>
                        
                        <!--- Create JWT token (simplified - in production use proper JWT library) --->
                        <cfset tokenPayload = serializeJSON(payload)>
                        <cfset token = "doctor." & doctorQuery.doctor_id & "." & hash(tokenPayload & jwtSecret, "SHA-256")>
                        
                        <!--- Return success with token --->
                        <cfheader statuscode="200">
                        <cfoutput>{
    "success": true,
    "doctor": {
        "doctor_id": #doctorQuery.doctor_id#,
        "first_name": "#doctorQuery.first_name#",
        "last_name": "#doctorQuery.last_name#",
        "email": "#email#"
    },
    "token": "#token#"
}</cfoutput>
                        
                        <cfcatch type="any">
                            <cfheader statuscode="500">
                            <cfoutput>{"success": false, "error": "Database error: #cfcatch.message#"}</cfoutput>
                        </cfcatch>
                    </cftry>
                    
                </cfcase>
                
                <cfcase value="logout">
                    <!--- Handle logout by clearing token --->
                    <cfheader statuscode="200">
                    <cfoutput>{"success": true, "message": "Logged out"}</cfoutput>
                </cfcase>
            </cfswitch>
        <cfelse>
            <!--- Default: assume login --->
            <cfset email = request_data.email>
            <cfset password = request_data.password>
            
            <cfif NOT len(email) OR NOT len(password)>
                <cfheader statuscode="400">
                <cfoutput>{"success": false, "error": "Email and password required"}</cfoutput>
                <cfabort>
            </cfif>
            
            <cftry>
                <cfquery name="doctorQuery" datasource="rde_be">
                    SELECT 
                        doctor_id,
                        first_name,
                        last_name,
                        email,
                        password
                    FROM doctor
                    WHERE email = <cfqueryparam value="#email#" cfsqltype="cf_sql_varchar">
                    LIMIT 1
                </cfquery>
                
                <cfif doctorQuery.recordcount EQ 0>
                    <cfheader statuscode="401">
                    <cfoutput>{"success": false, "error": "Invalid email or password"}</cfoutput>
                    <cfabort>
                </cfif>
                
                <cfif doctorQuery.password NEQ password>
                    <cfheader statuscode="401">
                    <cfoutput>{"success": false, "error": "Invalid email or password"}</cfoutput>
                    <cfabort>
                </cfif>
                
                <!--- Create JWT token --->
                <cfset jwtSecret = application.jwtSecret>
                <cfset expiresAt = dateAdd("h", 24, now())>
                <cfset issuedAt = now()>
                
                <cfset payload = {
                    "doctor_id": doctorQuery.doctor_id,
                    "email": email,
                    "iat": dateDiff("s", dateConvert("utc2Local", "1970-01-01 00:00:00"), issuedAt),
                    "exp": dateDiff("s", dateConvert("utc2Local", "1970-01-01 00:00:00"), expiresAt)
                }>
                
                <cfset tokenPayload = serializeJSON(payload)>
                <cfset token = "doctor." & doctorQuery.doctor_id & "." & hash(tokenPayload & jwtSecret, "SHA-256")>
                
                <cfheader statuscode="200">
                <cfoutput>{
    "success": true,
    "doctor": {
        "doctor_id": #doctorQuery.doctor_id#,
        "first_name": "#doctorQuery.first_name#",
        "last_name": "#doctorQuery.last_name#",
        "email": "#email#"
    },
    "token": "#token#"
}</cfoutput>
                
                <cfcatch type="any">
                    <cfheader statuscode="500">
                    <cfoutput>{"success": false, "error": "Database error: #cfcatch.message#"}</cfoutput>
                </cfcatch>
            </cftry>
        </cfif>
    <cfelse>
        <cfheader statuscode="405">
        <cfoutput>{"success": false, "error": "Method not allowed"}</cfoutput>
    </cfif>
</cfsilent>
