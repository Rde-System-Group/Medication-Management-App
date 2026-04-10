<cfcomponent 
    rest="true" 
    restpath="base"
    output="true"
>

// GET Request to return patients...
    <cffunction 
        name="patients"
        access="remote"
        httpmethod="GET"
        restPath="/patients"
        returntype="Any"
        produces="application/json"
    >
        <cfquery name="fetch" datasource="rde_be">
            SELECT * FROM dbo.[patient]
        </cfquery>
        <cfreturn serializeJSON(fetch, "struct")>
    </cffunction>

    
    <cffunction
        name="createPatient"
        access="remote"
        httpmethod="POST"
        restPath="/patients"
        returntype="Any"
        produces="application/json">
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


</cfcomponent>