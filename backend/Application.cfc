<cfcomponent>
    <cfset this.name = "RDE_Backend_API">
    <cfset this.datasource = "rde_be">
    <cfset this.sessionManagement = "true">
    <cfset this.loginStorage = "session">
    
    <cfset this.mappings["/components"] = expandPath("./components")>

    <cfset this.restsettings.skipCFCWithError = "true">

    <cffunction name="onApplicationStart">
        <cfset application.jwtSecret = createObject("java", "java.lang.System").getenv("RDE_BE") ?: "0000">
        </cffunction>

</cfcomponent>