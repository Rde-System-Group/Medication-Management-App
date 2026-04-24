<cfcomponent>
    <cfset this.name = "RDE_Backend_API">
    <cfset this.datasource = "rde_be">
    <cfset this.name              = "rde_be">
    <cfset this.sessionManagement = "true">
    <cfset this.loginStorage      = "session">
    
    <cfset this.restsettings.cfclocation = "./api">
    <cfset this.restsettings.skipCFCWithError = "true">
    
    <cfset this.mappings["/components"] = expandPath("../components")>

    <cffunction name="onApplicationStart">
        <cfset application.jwtSecret = createObject("java", "java.lang.System").getenv("RDE_BE") ?: "1234">
        <!---
            ENV set on computer,
            IF NOT set, defaults to 1234
        --->
        <cfset application.encryptSecret = createObject("java", "java.lang.System").getenv("RDE_BE") ?: "4321">
        <!---
            ENV set on computer,
            IF NOT set, defaults to 4321
        --->
    </cffunction>

</cfcomponent>