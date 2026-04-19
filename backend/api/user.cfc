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
        <cfif !ArrayContains(["first_name","last_name","password","email","phone_number"],body.type)>
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
            <cfif (structKeyExists(body, "first_name") AND len(body.first_name) lt 2) OR structKeyExists(body, "last_name") AND len(body.last_name) lt 2>
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
            
            
        <cfreturn serializeJSON({
            "success:": true,
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
        <cfset local.response = { "success": false, "message": "" }>
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
        <cfif (body.signUpType === "Patient") AND !structKeyExists(body, "race") OR !structKeyExists(body, "date_of_birth") OR !structKeyExists(body, "sex") OR !structKeyExists(body, "ethnicity")>
                <cfthrow message="Missing required fields from body!" detail="Missing fields for Patient role">
        </cfif>
        <!--- CHECK Doctor specific fields --->
        <cfif (body.signUpType === "Doctor") AND !structKeyExists(body, "specialty") AND !structKeyExists(body, "work_email")>
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

        <!--- create patient OR doctor--->
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
                INSERT INTO dbo.[doctor] ("specialty","work_email") VALUES (
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.specialty#">,
                <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.work_email#">
                )
            </cfquery>
        </cfif>


        <cfreturn #serializeJSON({
            "success": true,
            "userId": "#newUserId#",
            "message": "User successfully created!"
        },"struct")# >

        <cfcatch type="any">
            <cfreturn serializeJSON({
                "error": true,
                "message": cfcatch.message,
                "detail": cfcatch.detail,
                "type": cfcatch.type,
                "body": body
            }) />
        </cfcatch>
    </cftry>
    </cffunction>

    <cffunction
        name="fetchUser" 
        restPath="/user"
        httpmethod="POST"
        access="private" 
        returntype="Any"
        produces="application/json"
    >
        <cfheader name="Access-Control-Allow-Origin" value="*">
        <cfset local.response = { "success": false, "message": "" }>
        <cfset local.response.roles = []>
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
        <!---
            CHECK FOR USER ROLES
        --->

        <cfreturn serializeJSON(users,"struct")>
    <cfcatch type="any">
        <cfset local.response.message = cfcatch.message>
        <cfset local.response.error = true>
        <cfreturn serializeJSON(local.response, "struct")>
    </cfcatch>
    </cftry>
    </cffunction>

</cfcomponent>
