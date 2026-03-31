<!---
    index.cfm
    Simple test page to verify ColdFusion is working
    and list available API endpoints
--->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RDE Backend API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint {
            font-family: monospace;
            background: #e8f4e8;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 5px 0;
            display: flex;
            gap: 10px;
        }
        .method {
            font-weight: bold;
            min-width: 60px;
        }
        .method.get { color: #28a745; }
        .method.post { color: #007bff; }
        .status { color: #28a745; font-weight: bold; }
        .note { color: #666; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>🏥 RDE Backend API</h1>
    <p class="status">✅ ColdFusion is running!</p>
    
    <div class="card">
        <h2>Deliverable #1: Doctor's Client Search + Data Entry</h2>
        <p>REST API endpoints for the Doctor Dashboard</p>
    </div>

    <h2>📋 Patient Endpoints</h2>
    <div class="card">
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/{doctorId}/patients?firstName=&lastName=</span>
        </div>
        <p class="note">Search patients assigned to doctor (filtered by name)</p>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/{doctorId}/patients/{patientId}</span>
        </div>
        <p class="note">Get patient profile (only if assigned to doctor)</p>
    </div>

    <h2>📅 Appointment Endpoints</h2>
    <div class="card">
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/{doctorId}/appointments</span>
        </div>
        <p class="note">Get all appointments for doctor</p>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/{doctorId}/patients/{patientId}/appointments</span>
        </div>
        <p class="note">Get appointments for a specific patient</p>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <span>/api/doctor/{doctorId}/patients/{patientId}/appointments</span>
        </div>
        <p class="note">Create new appointment</p>
    </div>

    <h2>💊 Prescription Endpoints</h2>
    <div class="card">
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/{doctorId}/patients/{patientId}/prescriptions</span>
        </div>
        <p class="note">Get prescriptions for a patient</p>
        
        <div class="endpoint">
            <span class="method post">POST</span>
            <span>/api/doctor/{doctorId}/patients/{patientId}/prescriptions</span>
        </div>
        <p class="note">Create new prescription with medications</p>
        
        <div class="endpoint">
            <span class="method get">GET</span>
            <span>/api/doctor/medications</span>
        </div>
        <p class="note">Get all available medications (for dropdown)</p>
    </div>

    <h2>🔒 Security</h2>
    <div class="card">
        <p>All patient endpoints verify the doctor-patient relationship via <code>doctor_patient_mapping</code> table.</p>
        <p>Doctors can <strong>only</strong> access patients assigned to them.</p>
    </div>

    <hr style="margin-top: 40px;">
    <p style="color: #999; font-size: 0.9em;">
        Generated: <cfoutput>#dateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#</cfoutput>
    </p>
</body>
</html>
