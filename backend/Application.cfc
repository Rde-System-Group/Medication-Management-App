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
        <cfset application.encryptSecret = createObject("java", "java.lang.System").getenv("RDE_KEY") ?: "bOrD5uMClVK2msA5RUy+BRSsEJKVfY2TjSsKHc/z+wA=">
        <!--- NOTE: should be... generateSecretKey("AES", 256) that only happens once (and not refresh on app start) --->
    </cffunction>

    <cffunction name="onRequestStart" returntype="boolean">
        <cfargument name="targetPage" type="string">

        <cfset var requestOrigin  = CGI.HTTP_ORIGIN>
        <cfset var allowedOrigins = "http://localhost:5173,https://rde-mmwa.vercel.app">
        <cfset var allowedOrigin  = "">
        <cfset var resp = getPageContext().getResponse().getResponse()>

        <cfif listFindNoCase(allowedOrigins, requestOrigin)>
            <cfset allowedOrigin = requestOrigin>
        </cfif>

        <cfif len(allowedOrigin)>
            <cfset resp.setHeader("Access-Control-Allow-Origin", allowedOrigin)>
            <cfset resp.setHeader("Access-Control-Allow-Credentials", "true")>
            <cfset resp.setHeader("Vary", "Origin")>
        </cfif>

        <cfif CGI.REQUEST_METHOD EQ "OPTIONS">
            <cfset resp.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")>
            <cfset resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")>
            <cfset resp.setStatus(204)>
            <cfcontent reset="true">
            <cfabort>
        </cfif>

        <cfreturn true>
    </cffunction>

    <cffunction name="onRestRequest" returntype="void">
        <cfargument name="cfcName"    type="string">
        <cfargument name="methodName" type="string">

        <cfset var requestOrigin  = CGI.HTTP_ORIGIN>
        <cfset var allowedOrigins = "http://localhost:5173,https://rde-mmwa.vercel.app">
        <cfset var allowedOrigin  = "">
        <cfset var resp = getPageContext().getResponse().getResponse()>

        <cfif listFindNoCase(allowedOrigins, requestOrigin)>
            <cfset allowedOrigin = requestOrigin>
        </cfif>

        <cfif len(allowedOrigin)>
            <cfset resp.setHeader("Access-Control-Allow-Origin", allowedOrigin)>
            <cfset resp.setHeader("Access-Control-Allow-Credentials", "true")>
            <cfset resp.setHeader("Vary", "Origin")>
        </cfif>
    </cffunction>

</cfcomponent>
