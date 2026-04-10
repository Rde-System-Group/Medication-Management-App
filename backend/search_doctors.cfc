<cfcomponent rest="true"  restPath="doctors" Name="Doctors" output="false">

    <cffunction name="searchDoctors" access="remote" returntype="any" produces="application/json" httpMethod="GET" 
                output="false" restPath="search">
    <cfargument name="search_query" required="false" restargsource="query" type="string" default="" />  
        <cfquery datasource="rde_be" name="doctor_search_results">
                SELECT
                    doctor.id,
                    doctor.specialty,
                    doctor.work_email,
                    [user].first_name,
                    [user].last_name
                FROM doctor
                JOIN [user]
                ON doctor.user_id = [user].id
                WHERE doctor.is_active = 1
                AND 
                (   doctor.specialty LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">
                    OR
                    [user].first_name LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">
                    OR                     	
                    [user].last_name LIKE <cfqueryparam value="%#arguments.search_query#%" cfsqltype="CF_SQL_VARCHAR">                     	
                )
        </cfquery>
    <! -- Note: The search query will look for matches in the doctor's specialty, first name, or last name. If the search_query argument is empty, it will return all active doctors. 
    without the square brackets [], you get this error:
            9:48:01 AM	Started executing on line 1
            Incorrect syntax near the keyword 'user'.
            9:48:02 AM	Failed to execute the query


    4/4 - https://helpx.adobe.com/coldfusion/cfml-reference/coldfusion-functions/functions-s/serializejson.html
    -->
        <cfreturn serializeJSON(data=doctor_search_results, queryFormat="struct")>

    </cffunction>

</cfcomponent>


