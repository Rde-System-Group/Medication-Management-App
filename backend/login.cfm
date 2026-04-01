<cfsetting showDebugOutput="false">
<cferror type="exception" template="">

<cfheader name="Access-Control-Allow-Origin" value="*">
<cfheader name="Access-Control-Allow-Methods" value="POST,OPTIONS">
<cfheader name="Access-Control-Allow-Headers" value="Content-Type">

<cfcontent type="application/json">

<cftry>
    <cfset body = deserializeJSON(toString(getHTTPRequestData().content))>

    <cfset email = body.email>
    <cfset password = body.password>

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
            GET USER info (if doctor v patient) :: currently ignore if user is both 
            >> possible update to have body.loginType and /home/doctor VS /home/patient
        --->

        <!---
            TEST JWT
        <cfset text = {
            "iss" = "a",
            "sub" = "b",
            "abcd" = "efgh",
            "aud" = "adobe",
            "exp" = "#DateAdd("n", 30, now())#",
            "id"="cc",
            "iat"="#DateAdd("n", -30, now())#"
        }>

        <cfset signOptions = {
            "key" = "thisIsATestJWTSecretSTUFF" 
        }>
        // replace w/ application.jwtSecret
        
        <cfset c = {
            "algorithm" = "RS256",
            "generateIssuedAt"= true,
        "generateJti"=true
        }>
        <cfset createjws = CreateSignedJWT(text,signOptions,c)>
        --->

        <cfquery name="isDoctor" datasource="rde_be">
            SELECT is_active
            FROM dbo.[doctor]
            WHERE
                user_id = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#authenticate.id#">
        </cfquery>
        <cfif isDoctor.recordCount>
            <cfoutput>#serializeJSON({
                userId: "#authenticate.id#",
                authenticated: true,
                role: "Doctor",
                <!---
                token: "#createjws#" 
                --->
            },"struct")#</cfoutput>
        </cfif>
        <cfquery name="isPatient" datasource="rde_be">
            SELECT is_active
            FROM dbo.[patient]
            WHERE
                user_id = <cfqueryparam cfsqltype="CF_SQL_VARCHAR" value="#authenticate.id#">
        </cfquery>
        <cfif isPatient.recordCount>
            <cfoutput>#serializeJSON({
                userId: "#authenticate.id#",
                authenticated: true,
                role: "Patient",
                <!---
                token: "#createjws#" 
                --->
            },"struct")#</cfoutput>
        </cfif>
    <cfelse>
        <cfthrow message="Incorrect password!">
    </cfif>

    <cfcatch type="any">
        <cfoutput>#serializeJSON({
            "error": true,
            "message": cfcatch.message,
            "detail": cfcatch.detail,
            "type": cfcatch.type,
        })#</cfoutput>
    </cfcatch>
</cftry>