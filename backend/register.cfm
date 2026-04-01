<cfsetting showDebugOutput="false">
<cferror type="exception" template="">

<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="POST,OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">

<cfcontent type="application/json">

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
        <cfthrow message="User exists with current email and phone!" detail="#userExists.RecordCount#">
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
            INSERT INTO dbo.[doctor] ("specialty") VALUE (
            <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#body.specialty#">
            )
        </cfquery>
    </cfif>


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