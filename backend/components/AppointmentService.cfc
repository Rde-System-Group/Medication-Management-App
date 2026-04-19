/**
 * AppointmentService.cfc
 * Handles appointment-related database operations
 */
component displayname="AppointmentService" output="false" {

    // Inject patient service for authorization checks
    property name="patientService" type="components.PatientService";

    /**
     * Constructor
     */
    public AppointmentService function init() {
        variables.patientService = new components.PatientService();
        return this;
    }

    /**
     * Get all appointments for a doctor
     * @doctorId The doctor's ID
     * @startDate Optional start date filter
     * @endDate Optional end date filter
     * @return Query of appointments
     */
    public query function getDoctorAppointments(
        required numeric doctorId,
        date startDate = "",
        date endDate = ""
    ) {
        var sql = "
            SELECT 
                a.id AS appointment_id,
                a.patient_id,
                u.first_name AS patient_first_name,
                u.last_name AS patient_last_name,
                a.date,
                a.scheduled_start,
                a.scheduled_end,
                a.reason,
                a.created_at
            FROM appointment a
            INNER JOIN patient p ON a.patient_id = p.id
            INNER JOIN [user] u ON p.user_id = u.id
            WHERE a.doctor_id = :doctorId
        ";
        
        var params = {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" }
        };
        
        if (isDate(arguments.startDate)) {
            sql &= " AND a.date >= :startDate";
            params.startDate = { value: arguments.startDate, cfsqltype: "cf_sql_date" };
        }
        
        if (isDate(arguments.endDate)) {
            sql &= " AND a.date <= :endDate";
            params.endDate = { value: arguments.endDate, cfsqltype: "cf_sql_date" };
        }
        
        sql &= " ORDER BY a.date, a.scheduled_start";
        
        return queryExecute(sql, params);
    }

    /**
     * Get appointments for a specific patient (for a doctor)
     * @doctorId The doctor's ID
     * @patientId The patient's ID
     * @return Query of appointments
     */
    public query function getPatientAppointments(
        required numeric doctorId,
        required numeric patientId
    ) {
        // Verify authorization
        if (!variables.patientService.isPatientAssignedToDoctor(arguments.doctorId, arguments.patientId)) {
            return queryNew("appointment_id,date,scheduled_start,scheduled_end,reason");
        }
        
        var sql = "
            SELECT 
                a.id AS appointment_id,
                a.date,
                a.scheduled_start,
                a.scheduled_end,
                a.reason,
                a.created_at
            FROM appointment a
            WHERE a.doctor_id = :doctorId
              AND a.patient_id = :patientId
            ORDER BY a.date DESC, a.scheduled_start DESC
        ";
        
        return queryExecute(sql, {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" },
            patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" }
        });
    }

    /**
     * Create a new appointment
     * @doctorId The doctor's ID
     * @patientId The patient's ID
     * @date Appointment date
     * @scheduledStart Start time
     * @scheduledEnd End time
     * @reason Reason for visit
     * @return Struct with success status and new appointment ID
     */
    public struct function createAppointment(
        required numeric doctorId,
        required numeric patientId,
        required date date,
        required string scheduledStart,
        required string scheduledEnd,
        required string reason
    ) {
        // Verify authorization
        if (!variables.patientService.isPatientAssignedToDoctor(arguments.doctorId, arguments.patientId)) {
            return {
                "success": false,
                "message": "You are not authorized to create appointments for this patient"
            };
        }
        
        // Validate reason length
        if (len(arguments.reason) > 50) {
            return {
                "success": false,
                "message": "Reason must be 50 characters or less"
            };
        }
        
        var sql = "
            INSERT INTO appointment (doctor_id, patient_id, date, scheduled_start, scheduled_end, reason)
            OUTPUT INSERTED.id
            VALUES (:doctorId, :patientId, :date, :scheduledStart, :scheduledEnd, :reason)
        ";
        
        var result = queryExecute(sql, {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" },
            patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" },
            date: { value: arguments.date, cfsqltype: "cf_sql_date" },
            scheduledStart: { value: arguments.scheduledStart, cfsqltype: "cf_sql_time" },
            scheduledEnd: { value: arguments.scheduledEnd, cfsqltype: "cf_sql_time" },
            reason: { value: arguments.reason, cfsqltype: "cf_sql_varchar" }
        });
        
        return {
            "success": true,
            "message": "Appointment created successfully",
            "appointment_id": result.id
        };
    }
}