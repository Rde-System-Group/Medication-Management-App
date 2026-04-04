<cfcomponent>
    <cfset this.name              = "rde_be">
    <cfset this.sessionManagement = true>
    <cfset this.loginStorage      = "session">
    
    <cfset this.restsettings.cfclocation = "*.*">

    <cffunction name="onApplicationStart">
        <cfset application.jwtSecret = createObject("java", "java.lang.System").getenv("RDE_BE") ?: "0000">
        <!---
            ENV set on computer,
            IF NOT set, defaults to 0000
        --->
    </cffunction>

</cfcomponent>