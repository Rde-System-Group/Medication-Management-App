/**
 * PrescriptionService.cfc
 * Handles prescription-related database operations
 */
component displayname="PrescriptionService" output="false" {

    // Inject patient service for authorization checks
    property name="patientService" type="components.PatientService";

    /**
     * Constructor
     */
    public PrescriptionService function init() {
        variables.patientService = new components.PatientService();
        return this;
    }

    /**
     * Get all prescriptions for a patient (authorized check)
     * @doctorId The doctor's ID
     * @patientId The patient's ID
     * @return Array of prescriptions with medications
     */
    public array function getPatientPrescriptions(
        required numeric doctorId,
        required numeric patientId
    ) {
        // Verify authorization
        if (!variables.patientService.isPatientAssignedToDoctor(arguments.doctorId, arguments.patientId)) {
            return [];
        }
        
        // Get prescriptions
        var prescriptionSql = "
            SELECT 
                pr.id AS prescription_id,
                pr.prescription_date,
                pr.is_active,
                pr.created_at
            FROM prescription pr
            WHERE pr.doctor_id = :doctorId
              AND pr.patient_id = :patientId
            ORDER BY pr.prescription_date DESC
        ";
        
        var prescriptions = queryExecute(prescriptionSql, {
            doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" },
            patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" }
        });
        
        var result = [];
        
        // For each prescription, get medications
        for (var rx in prescriptions) {
            var medications = getPrescriptionMedications(rx.prescription_id);
            
            arrayAppend(result, {
                "prescription_id": rx.prescription_id,
                "prescription_date": dateFormat(rx.prescription_date, "yyyy-mm-dd"),
                "is_active": rx.is_active,
                "created_at": dateTimeFormat(rx.created_at, "yyyy-mm-dd HH:nn:ss"),
                "medications": medications
            });
        }
        
        return result;
    }

    /**
     * Get medications for a specific prescription
     * @prescriptionId The prescription ID
     * @return Array of medication details
     */
    private array function getPrescriptionMedications(required numeric prescriptionId) {
        var sql = "
            SELECT 
                pm.id AS prescription_medication_id,
                pm.medication_id,
                m.medication_name,
                pm.dosage,
                pm.supply,
                pm.frequency_type,
                pm.freq_per_day,
                pm.freq_days_per_week,
                pm.freq_by_x_week,
                pm.start_date,
                pm.end_date,
                pm.refills,
                pm.instructions,
                pm.is_active
            FROM prescription_medication pm
            INNER JOIN medication m ON pm.medication_id = m.id
            WHERE pm.prescription_id = :prescriptionId
        ";
        
        var meds = queryExecute(sql, {
            prescriptionId: { value: arguments.prescriptionId, cfsqltype: "cf_sql_bigint" }
        });
        
        var result = [];
        for (var med in meds) {
            arrayAppend(result, {
                "id": med.prescription_medication_id,
                "medication_id": med.medication_id,
                "medication_name": med.medication_name,
                "dosage": med.dosage,
                "supply": med.supply,
                "frequency": formatFrequency(med.frequency_type, med.freq_per_day, med.freq_days_per_week, med.freq_by_x_week),
                "frequency_type": med.frequency_type,
                "freq_per_day": med.freq_per_day,
                "freq_days_per_week": med.freq_days_per_week,
                "freq_by_x_week": med.freq_by_x_week,
                "start_date": dateFormat(med.start_date, "yyyy-mm-dd"),
                "end_date": dateFormat(med.end_date, "yyyy-mm-dd"),
                "refills": med.refills,
                "instructions": med.instructions,
                "is_active": med.is_active
            });
        }
        
        return result;
    }

    /**
     * Format frequency into human-readable string
     */
    private string function formatFrequency(
        required numeric frequencyType,
        required numeric freqPerDay,
        any freqDaysPerWeek = "",
        any freqByXWeek = ""
    ) {
        var freq = arguments.freqPerDay & " time(s) ";
        
        switch (arguments.frequencyType) {
            case 1:
                freq &= "daily";
                break;
            case 2:
                freq &= "weekly (" & arguments.freqDaysPerWeek & " days/week)";
                break;
            case 3:
                freq &= "every " & arguments.freqByXWeek & " week(s)";
                break;
            default:
                freq &= "as directed";
        }
        
        return freq;
    }

    /**
     * Create a new prescription with medications
     * @doctorId The doctor's ID
     * @patientId The patient's ID
     * @medications Array of medication objects
     * @return Struct with success status and prescription ID
     */
    public struct function createPrescription(
        required numeric doctorId,
        required numeric patientId,
        required array medications
    ) {
        // Verify authorization
        if (!variables.patientService.isPatientAssignedToDoctor(arguments.doctorId, arguments.patientId)) {
            return {
                "success": false,
                "message": "You are not authorized to prescribe for this patient"
            };
        }
        
        // Validate medications array
        if (arrayLen(arguments.medications) == 0) {
            return {
                "success": false,
                "message": "At least one medication is required"
            };
        }
        
        transaction {
            try {
                // Create prescription header
                var prescriptionSql = "
                    INSERT INTO prescription (doctor_id, patient_id, prescription_date, is_active)
                    OUTPUT INSERTED.id
                    VALUES (:doctorId, :patientId, CAST(GETDATE() AS DATE), 1)
                ";
                
                var prescriptionResult = queryExecute(prescriptionSql, {
                    doctorId: { value: arguments.doctorId, cfsqltype: "cf_sql_bigint" },
                    patientId: { value: arguments.patientId, cfsqltype: "cf_sql_bigint" }
                });
                
                var prescriptionId = prescriptionResult.id;
                
                // Insert each medication
                for (var med in arguments.medications) {
                    var medSql = "
                        INSERT INTO prescription_medication (
                            prescription_id, medication_id, dosage, supply,
                            frequency_type, freq_per_day, freq_days_per_week, freq_by_x_week,
                            start_date, end_date, refills, instructions, is_active
                        )
                        VALUES (
                            :prescriptionId, :medicationId, :dosage, :supply,
                            :frequencyType, :freqPerDay, :freqDaysPerWeek, :freqByXWeek,
                            :startDate, :endDate, :refills, :instructions, 1
                        )
                    ";
                    
                    queryExecute(medSql, {
                        prescriptionId: { value: prescriptionId, cfsqltype: "cf_sql_bigint" },
                        medicationId: { value: med.medication_id, cfsqltype: "cf_sql_bigint" },
                        dosage: { value: med.dosage, cfsqltype: "cf_sql_varchar" },
                        supply: { value: med.supply, cfsqltype: "cf_sql_integer" },
                        frequencyType: { value: med.frequency_type ?: 1, cfsqltype: "cf_sql_integer" },
                        freqPerDay: { value: med.freq_per_day ?: 1, cfsqltype: "cf_sql_integer" },
                        freqDaysPerWeek: { value: med.freq_days_per_week ?: "", cfsqltype: "cf_sql_integer", null: !len(med.freq_days_per_week ?: "") },
                        freqByXWeek: { value: med.freq_by_x_week ?: "", cfsqltype: "cf_sql_integer", null: !len(med.freq_by_x_week ?: "") },
                        startDate: { value: med.start_date, cfsqltype: "cf_sql_date" },
                        endDate: { value: med.end_date, cfsqltype: "cf_sql_date" },
                        refills: { value: med.refills ?: 0, cfsqltype: "cf_sql_integer" },
                        instructions: { value: med.instructions ?: "", cfsqltype: "cf_sql_varchar", null: !len(med.instructions ?: "") }
                    });
                }
                
                transaction action="commit";
                
                return {
                    "success": true,
                    "message": "Prescription created successfully",
                    "prescription_id": prescriptionId
                };
                
            } catch (any e) {
                transaction action="rollback";
                return {
                    "success": false,
                    "message": "Failed to create prescription: " & e.message
                };
            }
        }
    }

    /**
     * Get all available medications (for dropdown)
     * @return Query of medications
     */
    public query function getAllMedications() {
        var sql = "
            SELECT id, medication_name, side_effects, price
            FROM medication
            ORDER BY medication_name
        ";
        
        return queryExecute(sql);
    }
}