/**
 * PatientService.cfc
 * Handles all patient-related database operations
 * Security: All methods validate doctor-patient relationship
 */
component displayname="PatientService" output="false" {

    /**
     * Search patients assigned to a doctor by first/last name
     * @doctorId The logged-in doctor's ID
     * @firstName Optional first name filter
     * @lastName Optional last name filter
     * @return Query of matching patients
     */
    public query function searchPatients(
        required numeric doctorId,
        string firstName = "",
        string lastName = ""
    ) {
        var sql = "
            SELECT 
                p.id AS patient_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                p.date_of_birth,
                p.gender,
                p.sex,
                p.ethnicity
            FROM patient p
            INNER JOIN [user] u ON p.user_id = u.id
            INNER JOIN doctor_patient_mapping dpm ON p.id = dpm.patient_id
            WHERE dpm.doctor_id = :doctorId
              AND dpm.is_active = 1
              AND p.is_active = 1
        ";
        
        // Add name filters if provided
        if (len(trim(arguments.firstName))) {
            sql &= " AND u.first_name LIKE :firstName";
        }
        if (len(trim(arguments.lastName))) {
            sql &= " AND u.last_name LIKE :lastName";
        }
        
        sql &= " ORDER BY u.last_name, u.first_name";
        
        var params = {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" }
        };
        
        if (len(trim(arguments.firstName))) {
            params.firstName = { value: "%#trim(arguments.firstName)#%", cfsqltype: "cf_sql_varchar" };
        }
        if (len(trim(arguments.lastName))) {
            params.lastName = { value: "%#trim(arguments.lastName)#%", cfsqltype: "cf_sql_varchar" };
        }
        
        return queryExecute(sql, params);
    }

    /**
     * Get a single patient's profile (only if assigned to doctor)
     * @doctorId The logged-in doctor's ID
     * @patientId The patient ID to retrieve
     * @return Struct with patient data or empty if not authorized
     */
    public struct function getPatientProfile(
        required numeric doctorId,
        required numeric patientId
    ) {
        // First verify the doctor-patient relationship
        if (!isPatientAssignedToDoctor(arguments.doctorId, arguments.patientId)) {
            return {};
        }
        
        var sql = "
            SELECT 
                p.id AS patient_id,
                p.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone_number,
                p.date_of_birth,
                p.gender,
                p.sex,
                p.ethnicity,
                p.is_active,
                dpm.granted_at AS assigned_date
            FROM patient p
            INNER JOIN [user] u ON p.user_id = u.id
            INNER JOIN doctor_patient_mapping dpm ON p.id = dpm.patient_id
            WHERE p.id = :patientId
              AND dpm.doctor_id = :doctorId
              AND dpm.is_active = 1
        ";
        
        var result = queryExecute(sql, {
            patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" },
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" }
        });
        
        if (result.recordCount == 0) {
            return {};
        }
        
        // Convert query row to struct
        return {
            "patient_id": result.patient_id,
            "user_id": result.user_id,
            "first_name": result.first_name,
            "last_name": result.last_name,
            "email": result.email,
            "phone_number": result.phone_number,
            "date_of_birth": dateFormat(result.date_of_birth, "yyyy-mm-dd"),
            "gender": result.gender,
            "sex": result.sex,
            "ethnicity": result.ethnicity ? "Hispanic/Latino" : "Not Hispanic/Latino",
            "is_active": result.is_active,
            "assigned_date": dateTimeFormat(result.assigned_date, "yyyy-mm-dd HH:nn:ss")
        };
    }

    /**
     * Check if a patient is assigned to a doctor
     * @doctorId Doctor's ID
     * @patientId Patient's ID
     * @return Boolean - true if assigned and active
     */
    public boolean function isPatientAssignedToDoctor(
        required numeric doctorId,
        required numeric patientId
    ) {
        var sql = "
            SELECT COUNT(*) AS cnt
            FROM doctor_patient_mapping
            WHERE doctor_id = :doctorId
              AND patient_id = :patientId
              AND is_active = 1
        ";
        
        var result = queryExecute(sql, {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" },
            patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" }
        });
        
        return result.cnt > 0;
    }
}