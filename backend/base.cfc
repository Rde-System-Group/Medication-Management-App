<cfcomponent rest="true" restpath="base" Name="Base">

// GET Request to return patients...
<cffunction name="get" access="remote" returnType="array" produces="application/json" httpmethod="GET">
    <cfquery name="patients" datasource="rde_be">
        SELECT id
        FROM dbo.[user]
        WHERE
            id = <cfqueryparam  cfsqltype="CF_SQL_BIGINT" value="2">
    </cfquery>
</cffunction>

</cfcomponent>