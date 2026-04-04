<cfcomponent
    displayname="TestAPI"
    rest="true"
    restpath="/test"
    output="false"
>
    
    <cffunction 
        name="patients"
        restpath="/patients"
        httpmethod="GET"
        produces="application/json"
    >
        <cfquery name="fetch" datasource="rde_be">
            SELECT * FROM dbo.[patient]
        </cfquery>
        <cfdump var="#fetch#" output="console">
        <cfreturn fetch>
    </cffunction>
</cfcomponent>