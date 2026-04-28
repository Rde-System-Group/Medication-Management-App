<cfcomponent
    rest="true"
    restPath="/user"
    output="false"
>
    <cffunction 
        name="update" 
        restPath="/update"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cfheader name="Access-Control-Allow-Origin" value="*">
        <cfset local.response = { "success": false, "message": "" }>
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
    <cftry>
        <cfif !structKeyExists(body, "type") OR !structKeyExists(body, "value")>
            <cfthrow 
                message="Error in /user/update"
                detail="Missing keys in body payload."
            >
        </cfif>
        <cfif !ArrayContains(["first_name","last_name","password","email","phone_number","race","ethnicity"],body.type)>
            <cfthrow 
                message="Error in /user/update"
                detail="Update key is not valid."
            >
        </cfif>
        <cfif ArrayContains(["password"],body.type) AND !structKeyExists(body, "oldPassword")>
            <cfthrow 
                message="Error in /user/update"
                detail="Missing 'oldPassword' key for resetting password."
            >
        </cfif>

        <!---
            CHECK FOR USER AUTH (/fetchUser)
        --->
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
        
        <!---
            [UPDATE VALUE] depending on value... 
        --->

        <!--- FIRST/LAST Name update --->
        <cfif FindNoCase("_name",body.type)>
            <cfif len(body.value) lt 2 OR (body.type NEQ "first_name" AND body.type NEQ "last_name")>
                <cfthrow message="Error in /user/update" detail="Invalid name!">
            </cfif>
            <cfif body.type EQ "first_name">
                <cfquery name="update_first_name">
                    UPDATE dbo.[user]
                    SET        
                        first_name = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">,
                        updated_at = getdate()
                    WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                </cfquery>
            </cfif>
            <cfif body.type EQ "last_name">
                <cfquery name="update_last_name">
                    UPDATE dbo.[user]
                    SET        
                        last_name = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">,
                        updated_at = getdate()  
                    WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                </cfquery>
            </cfif>
        </cfif>

        <!--- EMAIL update --->
        <cfif body.type EQ "email">
            <cfset regexEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">
            <cfif REFind(regexEmail, body.value) EQ 0>
                <cfthrow message="Error in /user/update" detail="Invalid email!">
            </cfif>
            <!--- check if in use --->
            <cfquery name="emailInUse">
                SELECT email 
                FROM dbo.[user]
                WHERE email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">
            </cfquery>
            <cfif emailInUse.RecordCount GT 0>
                <cfthrow message="Error in /user/update" detail="Email is already is use!">
            </cfif>
            <!--- then update --->
            <cfquery name="update_email">
                UPDATE dbo.[user]
                SET        
                    email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">,
                    updated_at = getdate()
                WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
            </cfquery>
        </cfif>
        <!--- PHONE update --->
        <cfif body.type EQ "phone_number">
            <cfset regexPhone = "^\d{3}-\d{3}-\d{4}$">
            <cfif REFind(regexPhone, body.value) EQ 0>
                <cfthrow message="Error in /user/update" detail="Invalid phone number!">
            </cfif>
            <!--- check if in use --->
            <cfquery name="phoneInUse">
                SELECT phone_number 
                FROM dbo.[user]
                WHERE phone_number = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">
            </cfquery>
            <cfif phoneInUse.RecordCount GT 0>
                <cfthrow message="Error in /user/update" detail="Phone number is already is use!">
            </cfif>
            <!--- then update --->
            <cfquery name="update_phone_number">
                UPDATE dbo.[user]
                SET        
                    phone_number = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.value#">,
                    updated_at = getdate()  
                WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
            </cfquery>
        </cfif>
        <!--- PASSWORD update --->
        <cfif body.type EQ "password">
            <cfquery name="userFound">
                SELECT password_hashed, password_salt, id
                FROM dbo.[user]
                WHERE
                    id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
            </cfquery>
            <!---
            CHECK OLD PASSWORD AGAINST NEW PASSWORD
                +
            CHECK PASSWORD MEETS REQS
            --->
            <cfset hashed = hash(userFound.PASSWORD_SALT & body.oldPassword, "SHA-512","UTF-8", 10000) >
                <cfif userFound.PASSWORD_HASHED neq hashed>
                    <cfthrow message="Error in /user/update" detail="Passwords do not match!">
                </cfif>
                <cfset regexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$">

                    <cfif NOT body.value.matches(regexPassword)>
                        <cfthrow message="Error in /user/update" detail="New password does not meet the password requirements!">
                    </cfif>

                <cfset salt = generateSecretKey("AES", 256)> 
                <cfset hashedPassword = hash(salt & body.value, "SHA-512", "UTF-8", 10000)>
                
                <cfquery name="update_password">
                    UPDATE dbo.[user]
                    SET        
                        "password_hashed" = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#hashedPassword#">,
                        "password_salt" = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#salt#">,
                        "updated_at" = getdate()  
                    WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                </cfquery>
        </cfif>
        <!--- RACE update --->
        <cfif body.type EQ "race">
            <cfif !isNumeric(body.value)>
                <cfthrow message="Race should be a big int data type.">
            </cfif>
            <cfquery name="foundPatient">
                SELECT id 
                FROM dbo.[patient]
                WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                    AND is_active = 1
            </cfquery>
            <cfif !foundPatient.RecordCount>
                <cfthrow message="Patient not found.">
            </cfif>
            <cfquery datasource="rde_be" name="validRace">
                SELECT id
                FROM dbo.[race]
                WHERE 
                    id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.value#">
            </cfquery>
            <cfif !validRace.RecordCount>
                <cfthrow message="Invalid option picked for Race!">
            </cfif>
            <cfquery name="updateRace">
                UPDATE dbo.[patient_race]
                SET        
                    race_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.value#">
                WHERE patient_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#foundPatient.id#">
            </cfquery>
        </cfif>
        <!--- ETHNICITY update --->
        <cfif body.type EQ "ethnicity">
            <cfif !isBoolean(body.value)>
                <cfthrow message="Ethnicity should be a bit data type.">
            </cfif>
            <cfquery name="updateEthnicity">
                UPDATE dbo.[patient]
                SET        
                    ethnicity = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.value#">
                WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#res.userId#">
                    AND is_active = 1
            </cfquery>
        </cfif>
            
        <cfreturn serializeJSON({
            "success": true,
            "message": "Successfully updated User (#res?.userId#)'s [#body.type#] TO [#body.value#]"
        },"struct") >

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
        name="register" 
        restPath="/register"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cfheader name="Access-Control-Allow-Origin" value="*">
        <cfset local.response = { "success": false, "message": "", "encrypted": false }>
    <cftry>
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <!---
            CHECK THAT ALL FIELDS EXIST
        --->
        <cfif !structKeyExists(body, "email") OR !structKeyExists(body, "password") OR !structKeyExists(body, "fname") OR !structKeyExists(body, "lname") OR !structKeyExists(body, "phone") OR !structKeyExists(body, "signUpType") >
                <cfthrow message="Missing required fields from body!" detail="Missing fields for User">
        </cfif>
        <cfif !ArrayContains(["Patient","Doctor"],body.signUpType)>
            <cfthrow message="Invalid sign up type!" detail="signUpType INPUT :: #body.signUpType#">
        </cfif>
        <!--- CHECK Patient specific fields --->
        <cfif (body.signUpType === "Patient") AND (!structKeyExists(body, "race") OR !structKeyExists(body, "date_of_birth") OR !structKeyExists(body, "sex") OR !structKeyExists(body, "gender") OR !structKeyExists(body, "ethnicity"))>
                <cfthrow message="Missing required fields from body!" detail="Missing fields for Patient role">
        </cfif>
        <!--- CHECK Doctor specific fields --->
        <cfif (body.signUpType === "Doctor") AND (!structKeyExists(body, "specialty") OR !structKeyExists(body, "work_email"))>
                <cfthrow message="Missing required fields from body!" detail="Missing fields for Doctor role">
        </cfif>

        <cfset regexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$">

            <cfif NOT body.password.matches(regexPassword)>
                <cfthrow message="Error in /user/update" detail="New password does not meet the password requirements!">
            </cfif>

        <cfset regexEmail = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$">
        
            <cfif REFind(regexEmail, body.email) EQ 0>
                <cfthrow message="Invalid email!" detail="email INPUT :: #body.email#">
            </cfif>

        <cfset regexName = "^[a-zA-Z]+([ \-']{0,1}[a-zA-Z]+)*$">
            <cfif REFind(regexName, body.fname) EQ 0>
                <cfthrow message="Invalid first name!" detail="fname INPUT :: #body.fname#">
            </cfif>
            <cfif REFind(regexName, body.lname) EQ 0>
                <cfthrow message="Invalid last name!" detail="lname INPUT :: #body.lname#">
            </cfif>


        <cfset regexPhone = "^\d{3}-\d{3}-\d{4}$">
        <cfset validPhone = REFind(regexPhone, body.phone)>


                <cfif validPhone EQ 0>
                    <cfthrow message="Invalid phone number!" detail="phone INPUT :: #body.phone#">
                </cfif>

        <!---
            CHECK FOR PATIENT/DOCTOR INFO before adding user + role
        --->
        <cfif body.signUpType == "Patient">
            <!--- check for race :: query DB for race_id to ensure value exists --->
            <cfquery datasource="rde_be" name="validRace">
                SELECT id
                FROM dbo.[race]
                WHERE 
                    id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.race#">
            </cfquery>
            <cfif validRace.RecordCount EQ 0>
                <cfthrow message="Invalid option picked for Race!" detail="#validRace.RecordCount#">
            </cfif>
            <!--- check for dob :: check value type is Date --->
            <cfif !isDate(body.date_of_birth)>
                <cfthrow message="Invalid value for DOB!" detail="dob INPUT :: #body.dob#">
            </cfif>
            <!--- check for gender :: check for length of string is non-empty --->
            <cfif len(body.gender) lt 2>
                <cfthrow message="Invalid length for Gender!" detail="gender INPUT :: #body.gender#">
            </cfif>
            <!--- check for sex :: check for length of string is non-empty --->
            <cfif len(body.sex) lt 2>
                <cfthrow message="Invalid length for Sex!" detail="sex INPUT :: #body.sex#">
            </cfif>
            <!--- check for ethnicity :: check is value type is Boolean --->
            <cfif !isBoolean(body.ethnicity)>
                <cfthrow message="Invalid valid for Ethnicity!" detail="ethnicity INPUT :: #body.ethnicity#">
            </cfif>
        </cfif>
        <cfif body.signUpType == "Doctor">
            <!--- check for specialty --->
            <cfif len(body.specialty) lt 2>
                <cfthrow message="Invalid length for Specialty!" detail="specialty INPUT :: #body.specialty#">
            </cfif>
            <!--- check for work email --->
            <cfif REFind(regexEmail, body.work_email) EQ 0>
                <cfthrow message="Invalid work email!" detail="work_email INPUT :: #body.work_email#">
            </cfif>
        </cfif>


        <!--- CHECK IF A USER WITH SAME EMAIL/PHONE E --->
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
        

        <!--- create user --->
        <cfset salt = generateSecretKey("AES", 256)> 
        <cfset hashedPassword = hash(salt & body.password, "SHA-512", "UTF-8", 10000)>
        <cfquery datasource="rde_be" name="createUser" result="resultedUser">
            INSERT INTO dbo.[user] ("email","phone_number","first_name","last_name","password_hashed","password_salt") 
            VALUES (
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.phone,application.encryptSecret,"AES","Base64")#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.fname,application.encryptSecret,"AES","Base64")#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.lname,application.encryptSecret,"AES","Base64")#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#hashedPassword#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#salt#">
            )
        </cfquery>
        <cfset newuserid = resultedUser.generatedKey>

        <!--- create patient OR doctor--->
        <cfif body.signUpType == "Patient">
            <cfquery datasource="rde_be" name="createPatient" result="resultedPatient">
                INSERT INTO dbo.[patient] ("user_id","date_of_birth","gender","ethnicity","sex") VALUES (
                    <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#newuserid#">,
                    <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.date_of_birth,application.encryptSecret,"AES","Base64")#">,
                    <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.gender,application.encryptSecret,"AES","Base64")#">,
                    <cfqueryparam cfsqltype="CF_SQL_BIT" value="#body.ethnicity#">,
                    <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.sex,application.encryptSecret,"AES","Base64")#">
                ) 
            </cfquery>
            <cfset newpatientid = resultedPatient.generatedKey>
            <cfquery datasource="rde_be" name="createRaceMapping">
                INSERT INTO dbo.[patient_race] ("patient_id","race_id") VALUES (
                    <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#newpatientid#">,
                    <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#body.race#">
                ) 
            </cfquery>
        <cfelse>
            <cfquery datasource="rde_be" name="createDoctor">
                INSERT INTO dbo.[doctor] ("user_id","specialty","work_email") VALUES (
                <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#newuserid#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#encrypt(body.specialty,application.encryptSecret,"AES","Base64")#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.work_email#">
                )
            </cfquery>
        </cfif>


        <cfset successResponse = {
            "success": true,
            "userId": "",
            "message": "User successfully created!"
        }>
            <cfset successResponse.userId = newuserid || "null">
        <cfreturn serializeJSON(successResponse, "struct")>

        <cfcatch type="any">
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type
            }) />
        </cfcatch>
    </cftry>
    </cffunction>

    <cffunction 
        name="delete" 
        restPath="/delete"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cfheader name="Access-Control-Allow-Origin" value="*">
        <cfset local.response = { "success": false, "message": "" }>
    <cftry>
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cfif !structKeyExists(body, "delete") OR !isBoolean(body.delete)>
            <cfthrow 
                message="Request body is in incorrect format!"
            >
        </cfif>
        <!---
            CHECK USER AUTH
        --->
            <cfobject component="auth" name="userAuth">
            <cfset result = deserializeJSON(userAuth.getAuthUser()) >
            <cfif !result.valid>
                <cfthrow message="User is not signed in!" >
            </cfif>
        <!---
            > set DOCTOR/PATIENT status (is_active) to false
            > set USER status (is_active) to false
        --->
            <cfif result.role === "Patient">
                <cfquery >
                    UPDATE dbo.[patient]
                        SET is_active = 0,
                            date_removed = CURRENT_TIMESTAMP,
                            reason_removed = 'Deleted account!'
                    WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#result.userId#">
                </cfquery>
            </cfif>
            <cfif result.role === "Doctor">
                <cfquery >
                    UPDATE dbo.[doctor]
                        SET is_active = 0,
                            date_removed = CURRENT_TIMESTAMP,
                            reason_removed = "Deleted account!"
                    WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#result.userId#">
                </cfquery>
            </cfif>
            <cfquery >
                UPDATE dbo.[user]
                    SET is_active = 0,
                        updated_at = CURRENT_TIMESTAMP
                WHERE id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#result.userId#">
            </cfquery>
        <!---

        --->

        <cfset local.response.message = "Successfully deleted user!">
        <cfset local.response.result = result>
        <cfreturn serializeJSON(local.response,"struct") >

    <cfcatch>
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type
            }) />

    </cfcatch>
    </cftry>
    </cffunction>

    <!--- 
        FORGOT PASSWORD WORK FLOW
        > Send Code to Email (if email exists)
        > User Receives Code
        > Server verifies code
        > User changes code (+ extra verification?)

        - old codes expire after a code is sent
        - on password reset, code expires (no reuse)
    --->
    <cffunction 
        name="sendPRCode" 
        restPath="/sendPRCode"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <!---
            CHECK FOR BODY
        --->
    <cftry>
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
        <cfif !structKeyExists(body, "email") OR !isBoolean(body.sendRequest)>
            <cfthrow 
                message="Request body is in incorrect format!"
                detail="0"
            >
        </cfif>


        <!---
            CHECK EMAIL EXISTS FOR VALID USER
        --->
            <cfquery name="userExists" result="foundUser">
                SELECT * FROM dbo.[user]
                WHERE email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                AND is_active = 1
            </cfquery>
            
            <cfif !userExists.RecordCount>
                <cfthrow message="Error in sending code." detail="1">
            </cfif>

        <!---
            UPDATE OTHER CODES OF THIS KIND to invalidate old codes
        --->
        <cfset created_at = createODBCDateTime(now())>

        <cfquery name="updateOldCodes">
            UPDATE dbo.password_reset_request
            SET
                "expires_at" = <cfqueryparam cfsqltype="CF_SQL_TIMESTAMP" value=#created_at#>
            WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#userExists.id#">
        </cfquery>

        <!---
            CREATE CODE + INSERT INTO DB
        --->
        <cfset randomPIN = randRange(100000, 999999, "SHA1PRNG")>
        <cfset salt = generateSecretKey("AES", 256)> 
        <cfset hashedPIN = hash(salt & randomPin, "SHA-512", "UTF-8", 10000)>

        <cfset expires_at = createODBCDateTime(dateAdd("n", 30, now()))>

        <cfquery datasource="rde_be" name="createCode" result="resultedCode">
            INSERT INTO dbo.password_reset_request("user_id","code_hashed","code_salt", "created_at", "expires_at") 
            VALUES (
                <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#userExists.id#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#hashedPin#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#salt#">,
                <cfqueryparam cfsqltype="CF_SQL_TIMESTAMP" value="#created_at#">,
                <cfqueryparam cfsqltype="CF_SQL_TIMESTAMP" value="#expires_at#">
            )
        </cfquery>
        <!---
            SEND CODE
        --->
        <cfmail 
            from="it491rdecapstonespring26@gmail.com"
            to="#body.email#"
            subject="[MMWA] Password Reset Request"
        >
            Hello #userExists.first_name#!

            There is a password reset request for your account with MMWA (a student capstone project if this seems too official and you somehow got this outside of typical workflow...). To complete the password reset, enter the verification code in the password request form on our website. This code will expire in 30 minutes.

            Vertification Code: #randomPin#

            If you did not request for your password to be reset, you may ignore this message.
        </cfmail>   

        <cfreturn serializeJSON({
            "success": true,
            "message": "1"
        }) />
    <cfcatch>
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type
            }) />

    </cfcatch>
    </cftry>

    </cffunction>
    <cffunction 
        name="verifyPRCode" 
        restPath="/verifyPRCode"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
    <cftry>
        <!---
            CHECK FOR BODY
        --->
        <!--- If called internally, body is passed in. If called directly via HTTP, parse it. --->
        <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>

        <cfif !structKeyExists(body, "email") OR !structKeyExists(body, "code")>
            <cfthrow message="Request body is in incorrect format!">
        </cfif>


        <!---
            CHECK CODE + EMAIL
        --->
            <cfquery name="userExists" result="foundUser">
                SELECT * FROM dbo.[user]
                WHERE email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                AND is_active = 1
            </cfquery>
            
            <cfif !userExists.RecordCount>
                <cfthrow message="Error in sending code." detail="Invalid email.">
            </cfif>

            <cfquery name="getResetRequest" datasource="rde_be">
                SELECT TOP 1
                    prr.code_hashed,
                    prr.code_salt,
                    prr.expires_at
                FROM dbo.password_reset_request prr
                JOIN dbo.[user] u ON u.id = prr.user_id
                WHERE u.email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                ORDER BY prr.created_at DESC
            </cfquery>
            <cfif !getResetRequest.RecordCount>
                <cfthrow message="Error in sending code." detail="Invalid request.">
            </cfif>
            <cfif now() GT getResetRequest.expires_at>
                <cfthrow message="Code has expired.">
            </cfif>
            <cfset submittedHash = hash(getResetRequest.code_salt & body.code, "SHA-512", "UTF-8", 10000)>

            <cfif submittedHash neq getResetRequest.code_hashed>
                <cfthrow message="Error in sending code." detail="Invalid code.">
            </cfif>

        <cfreturn serializeJSON({
            "success": true,
            "message": "Password request is valid!"
        }) />
    <cfcatch>
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type
            }) />

    </cfcatch>
    </cftry>

    </cffunction>
    
    <cffunction 
        name="changePassword" 
        restPath="/changePassword"
        httpmethod="POST"
        access="remote" 
        returntype="Any"
        produces="application/json"
    >
        <cftry>
            <!--- CHECK FOR BODY --->
            <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>
            <cfif !structKeyExists(body, "email") OR !structKeyExists(body, "code") OR !structKeyExists(body, "password")>
                <cfthrow 
                    message="Request body is in incorrect format!"
                >
            </cfif>

            <!--- CHECK FOR EMAIL CODE VALIDATION --->
            <cfhttp 
                method="POST" 
                url="http://localhost:8500/rest/user/verifyPRCode"
                result="verifyResult"
            >
                <cfhttpparam type="header" name="Content-Type" value="application/json">
                <cfhttpparam type="body" value='#serializeJSON({"email": body.email, "code": body.code})#'>
            </cfhttp>

            <cfset results = deserializeJSON(verifyResult.fileContent)>
            <cfif verifyResult.statusCode EQ "200 OK">
                <cfif structKeyExists(results, "error")>
                    <!--- verifyPRCode returned an error in its body --->
                    <cfreturn serializeJSON({
                        "error": true,
                        "message": "Password change is invalid!"
                    })>
                </cfif>
                <!--- proceed with password update --->
                
                <!--- fetch user --->
                <cfquery name="userExists" result="foundUser">
                    SELECT id FROM dbo.[user]
                    WHERE email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                    AND is_active = 1
                </cfquery>
                
                <cfif !userExists.RecordCount>
                    <cfthrow message="Error in sending code." detail="Invalid email.">
                </cfif>

                <!---
                    IF VERIFIED, UPDATE PASSWORD
                --->

                <!---
                    BUT FIRST CHECK VALID PASSWORD
                --->
                <cfset regexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$">

                    <cfif NOT body.password.matches(regexPassword)>
                        <cfthrow message="Error in /user/changePassword" detail="New password does not meet the password requirements!">
                    </cfif>

                <cfset salt = generateSecretKey("AES", 256)> 
                <cfset hashedPassword = hash(salt & body.password, "SHA-512", "UTF-8", 10000)>
                <cfset curtime = createODBCDateTime(now())>
                    <cfquery name="updatePassword">
                        UPDATE dbo.[user]
                        SET
                            "password_hashed" = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#hashedPassword#">,
                            "password_salt" = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#salt#">,
                            "updated_at" = <cfqueryparam cfsqltype="CF_SQL_TIMESTAMP" value=#curtime#>
                        WHERE email = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.email#">
                    </cfquery>
                    <cfquery name="updateOldCodes">
                        UPDATE dbo.password_reset_request
                        SET
                            "expires_at" = <cfqueryparam cfsqltype="CF_SQL_TIMESTAMP" value=#curtime#>
                        WHERE user_id = <cfqueryparam cfsqltype="CF_SQL_BIGINT" value="#userExists.id#">
                    </cfquery>
                    <cfreturn serializeJSON({
                        "success": true,
                        "message": "Password was changed successfully!"
                    })>
            <cfelse>
                <!--- HTTP call itself failed --->
                <cfreturn serializeJSON({
                    "error": true,
                    "message": "Failed to reach verification service."
                })>
            </cfif>
        <cfcatch>
                <cfreturn serializeJSON({
                    "error": true,
                    "message": cfcatch.message,
                    "detail": cfcatch.detail,
                    "type": cfcatch.type
                }) />

        </cfcatch>
        </cftry>
    </cffunction>
</cfcomponent>

