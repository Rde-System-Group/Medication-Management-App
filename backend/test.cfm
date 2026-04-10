<cfoutput>
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<h1>ColdFusion Test</h1>
<p>Time: #now()#</p>
<p>Datasource test:</p>
<cftry>
    <cfquery name="test" datasource="rde_be" maxrows="1">
        SELECT 1 as test_value
    </cfquery>
    <p style="color:green">✅ Database connection successful!</p>
<cfcatch>
    <p style="color:red">❌ Database error: #cfcatch.message#</p>
</cfcatch>
</cftry>
</body>
</html>
</cfoutput>
