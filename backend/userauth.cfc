    <cffunction name="login" access="public" returntype="struct">
        <cfargument name="username" type="string" required="true">
        <cfargument name="password" type="string" required="true">
        
        <cfset var result = {success: false, message: ""}>
        
        <!--- Simple validation: admin/admin123 --->
        <cfif arguments.username EQ "admin" AND arguments.password EQ "admin123">
            <cfset session.user = {
                username: arguments.username,
                loginTime: now()
            }>
            <cfset result.success = true>
            <cfset result.message = "Login successful!">
        <cfelse>
            <cfset result.message = "Invalid username or password">
        </cfif>
        
        <cfreturn result>
    </cffunction>
    
    <cffunction name="isLoggedIn" access="public" returntype="boolean">
        <cfreturn structKeyExists(session, "user")>
    </cffunction>
    
    <cffunction name="logout" access="public" returntype="void">
        <cfif structKeyExists(session, "user")>
            <cfset structDelete(session, "user")>
        </cfif>
    </cffunction>
    
    <cffunction name="getUser" access="public" returntype="struct">
        <cfif isLoggedIn()>
            <cfreturn session.user>
        <cfelse>
            <cfreturn {username: "Guest"}>
        </cfif>
    </cffunction>
    
</cfcomponent>