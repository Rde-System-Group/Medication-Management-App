component output="false" {

    /**
     * Application settings for RDE Backend API
     */
    this.name = "RDE_Backend_API";
    this.applicationTimeout = createTimeSpan(1, 0, 0, 0);
    this.sessionManagement = true;
    this.sessionTimeout = createTimeSpan(0, 2, 0, 0);
    
    // Data source name configured in ColdFusion Administrator
    this.datasource = "rde_be";
    
    // REST API settings
    this.restsettings = {
        cfclocation: "./",
        skipcfcaliaschecks: true
    };

    /**
     * Application start
     */
    public boolean function onApplicationStart() {
        return true;
    }

    /**
     * Request start - runs before every request
     */
    public boolean function onRequestStart(required string targetPage) {
        // Set response content type for API
        if (findNoCase("/api/", arguments.targetPage)) {
            getPageContext().getResponse().setContentType("application/json");
        }
        
        // CORS headers for development
        header name="Access-Control-Allow-Origin" value="*";
        header name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS";
        header name="Access-Control-Allow-Headers" value="Content-Type, Authorization";
        
        // Handle preflight OPTIONS requests
        if (cgi.request_method == "OPTIONS") {
            header statuscode="200" statustext="OK";
            abort;
        }
        
        return true;
    }

    /**
     * Handle errors
     */
    public void function onError(required any exception, required string eventName) {
        var errorResponse = {
            "success": false,
            "error": arguments.exception.message,
            "detail": arguments.exception.detail ?: ""
        };
        
        header statuscode="500" statustext="Internal Server Error";
        getPageContext().getResponse().setContentType("application/json");
        writeOutput(serializeJSON(errorResponse));
    }
}
