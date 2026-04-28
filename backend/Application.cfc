<cfcomponent>
    <cfset this.name              = "RDE_Backend_API">
    <cfset this.datasource        = "rde_be">
    <cfset this.sessionManagement = "true">
    <cfset this.loginStorage      = "session">

    <cfset this.restsettings.cfclocation      = "./api">
    <cfset this.restsettings.skipCFCWithError = "false">

    <cfset this.mappings["/components"] = expandPath("./api/components")>

    <cffunction name="onApplicationStart">
        <cfset application.jwtSecret     = createObject("java", "java.lang.System").getenv("RDE_BE") ?: "1234">
        <cfset application.encryptSecret = generateSecretKey("AES", 256)>
    </cffunction>

<cffunction name="setCORSHeaders" returntype="void">
    <cfset local.allowedOrigins = ["http://localhost:5173"]>
    <cfset local.requestOrigin  = CGI.HTTP_ORIGIN ?: "">
    <cfset local.response       = getPageContext().getResponse().getResponse()>

    <!--- Remove any CORS headers CF's REST handler already set --->
    <cfset local.response.setHeader("Access-Control-Allow-Origin", "")>
    <cfset local.response.getHttpResponse().removeHeader("Access-Control-Allow-Origin")>

    <cfif arrayFindNoCase(local.allowedOrigins, local.requestOrigin)>
        <cfset local.response.setHeader("Access-Control-Allow-Origin",      local.requestOrigin)>
        <cfset local.response.setHeader("Access-Control-Allow-Credentials", "true")>
        <cfset local.response.setHeader("Vary",                             "Origin")>
    </cfif>

    <cfset local.response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")>
    <cfset local.response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")>
</cffunction>

<cffunction name="onRequestStart" returntype="boolean">
    <cfargument name="targetPage" type="string">
    <cfset setCORSHeaders()>
    <cfif CGI.REQUEST_METHOD EQ "OPTIONS">
        <cfheader name="Access-Control-Max-Age" value="86400">
        <cfabort>
    </cfif>
    <cfreturn true>
</cffunction>

<cffunction name="onRestRequest" returntype="void">
    <cfargument name="cfcName"    type="string">
    <cfargument name="methodName" type="string">
    <cfset setCORSHeaders()>
    <cfif CGI.REQUEST_METHOD EQ "OPTIONS">
        <cfheader name="Access-Control-Max-Age" value="86400">
        <cfabort>
    </cfif>
</cffunction>

</cfcomponent>