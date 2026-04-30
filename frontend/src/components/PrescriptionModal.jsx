import { useState, useEffect } from 'react';
import { 
    Modal, ModalDialog, ModalClose, Typography, Divider, 
    FormControl, FormLabel, Input, Button, Stack, Select, Option, 
    Box, IconButton, Sheet, Autocomplete, Textarea, Alert, Grid
} from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MedicationIcon from '@mui/icons-material/Medication';
import { apiFetch } from '../lib/calls';
const API_BASE = import.meta.env.API_BASE ?? `/cfm`
const qtyOptions = [1, 2, 3, 4, 5, 6];
const freqOptions = [
    { value: 'daily', label: 'Daily', type: 1 },
    { value: 'weekly', label: 'Weekly', type: 2 },
    { value: 'monthly', label: 'Monthly', type: 3 },
    { value: 'as_needed', label: 'As Needed', type: 4 },
];

export default function PrescriptionModal({ patientId, patientName, editData, onClose, onSuccess, user }) {
    const [medOptions, setMedOptions] = useState([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [submitErr, setSubmitErr] = useState(null);
    const [rxEntries, setRxEntries] = useState([{ 
        medication_id: '', dosage: '', freqCount: 1, freqInterval: 'daily', 
        supply: '', refills: '0', start: '', end: '', instructions: '' 
    }]);

    useEffect(() => {
        async function getMedications() {
            try {
                // Fetching catalog using the correct /cfm proxy lane
                const response = await apiFetch('${API_BASE}/medications.cfm');
                const json = await response.json();
                if (json.success) {
                    setMedOptions(json.medications || []);
                }
            } catch (error) { 
                console.error("Failed to fetch meds", error); 
            }
        }
        getMedications();
    }, []);

    useEffect(() => {
        if (editData && editData.medications) {
            const mapTypeToVal = (typeId) => {
                const match = freqOptions.find(o => o.type === typeId);
                return match ? match.value : 'daily';
            };

            setRxEntries(editData.medications.map(med => ({
                medication_id: med.medication_id || med.MEDICATION_ID || '',
                dosage: med.dosage || med.DOSAGE || '',
                freqCount: med.freq_per_day || med.FREQ_PER_DAY || 1,
                freqInterval: mapTypeToVal(med.frequency_type || med.FREQUENCY_TYPE),
                supply: med.supply || med.SUPPLY || '',
                refills: String(med.refills ?? med.REFILLS ?? '0'),
                start: med.start_date || med.START_DATE || '',
                end: med.end_date || med.END_DATE || '',
                instructions: med.instructions || med.INSTRUCTIONS || ''
            })));
        }
    }, [editData]);

    const changeEntry = (index, key, val) => {
        const updated = [...rxEntries];
        updated[index][key] = val;
        setRxEntries(updated);
    };

    const addEntry = () => setRxEntries([...rxEntries, { 
        medication_id: '', dosage: '', freqCount: 1, freqInterval: 'daily', 
        supply: '', refills: '0', start: '', end: '', instructions: '' 
    }]);

    const removeEntry = (index) => rxEntries.length > 1 && setRxEntries(rxEntries.filter((_, i) => i !== index));

    const handleSubmission = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setSubmitErr(null);

        const activeDocId = user?.doctor_id || user?.DOCTOR_ID;

        try {
            const formattedData = rxEntries.map(entry => ({
                medication_id: parseInt(entry.medication_id),
                dosage: entry.dosage,
                freq_per_day: parseInt(entry.freqCount),
                frequency_type: freqOptions.find(opt => opt.value === entry.freqInterval).type,
                supply: parseInt(entry.supply),
                refills: parseInt(entry.refills) || 0,
                start_date: entry.start,
                end_date: entry.end,
                instructions: entry.instructions || ''
            }));

            // CRITICAL FIX: The submit path now correctly uses the /cfm proxy lane
            let targetUrl = `${API_BASE}/prescriptions.cfm?doctorId=${activeDocId}&patientId=${patientId}`;
            if (editData) {
                targetUrl += `&prescriptionId=${editData.prescription_id || editData.PRESCRIPTION_ID}`;
            }

            const postRes = await apiFetch(targetUrl, {
                method: editData ? 'PUT' : 'POST',
                body: JSON.stringify({ medications: formattedData })
            });

            const postJson = await postRes.json();
            if (postJson.success) {
                onSuccess();
            } else {
                setSubmitErr(postJson.message || "Failed to save prescription");
            }
        } catch (error) {
            setSubmitErr("Server connection error or invalid JSON response");
            console.error(error);
        }
        setIsProcessing(false);
    };

    return (
        <Modal open={true} onClose={onClose}>
            <ModalDialog sx={{ width: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                <ModalClose />
                <Typography level="h4" startDecorator={<MedicationIcon color="success" />}>
                    {editData ? 'Edit Prescription' : 'New Prescription'}
                </Typography>
                <Typography level="body-sm">
                    Patient: <strong>{patientName}</strong> (ID: {patientId})
                </Typography>
                
                <Divider sx={{ my: 2 }} />

                <form onSubmit={handleSubmission}>
                    <Stack spacing={3}>
                        {submitErr && <Alert color="danger">{submitErr}</Alert>}

                        {rxEntries.map((entry, index) => (
                            <Sheet key={index} variant="outlined" sx={{ p: 2, borderRadius: 'md', position: 'relative', bgcolor: 'background.level1' }}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography level="title-md">Medication #{index + 1}</Typography>
                                    {rxEntries.length > 1 && (
                                        <IconButton size="sm" variant="plain" color="danger" onClick={() => removeEntry(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Stack>

                                <Stack spacing={2}>
                                    <FormControl required>
                                        <FormLabel>Medication Name</FormLabel>
                                        <Autocomplete
                                            placeholder="Search medication..."
                                            options={medOptions}
                                            getOptionLabel={(o) => `${o.medication_name || o.MEDICATION_NAME} ($${o.price || o.PRICE})`}
                                            value={medOptions.find(m => String(m.id || m.ID) === String(entry.medication_id)) || null}
                                            onChange={(ev, val) => changeEntry(index, 'medication_id', val ? (val.id || val.ID) : '')}
                                        />
                                    </FormControl>

                                    <Grid container spacing={2}>
                                        <Grid xs={6}>
                                            <FormControl required>
                                                <FormLabel>Dosage</FormLabel>
                                                <Input placeholder="e.g. 500mg" value={entry.dosage} onChange={e => changeEntry(index, 'dosage', e.target.value)} />
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={3}>
                                            <FormControl required>
                                                <FormLabel>Daily Qty</FormLabel>
                                                <Select value={entry.freqCount} onChange={(e, val) => changeEntry(index, 'freqCount', val)}>
                                                    {qtyOptions.map(n => <Option key={n} value={n}>{n}x</Option>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={3}>
                                            <FormControl required>
                                                <FormLabel>Interval</FormLabel>
                                                <Select value={entry.freqInterval} onChange={(e, val) => changeEntry(index, 'freqInterval', val)}>
                                                    {freqOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>

                                    <Grid container spacing={2}>
                                        <Grid xs={6}>
                                            <FormControl required>
                                                <FormLabel>Total Qty (Supply)</FormLabel>
                                                <Input type="number" value={entry.supply} onChange={e => changeEntry(index, 'supply', e.target.value)} />
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={6}>
                                            <FormControl>
                                                <FormLabel>Refills</FormLabel>
                                                <Input type="number" value={entry.refills} onChange={e => changeEntry(index, 'refills', e.target.value)} />
                                            </FormControl>
                                        </Grid>
                                    </Grid>

                                    <Grid container spacing={2}>
                                        <Grid xs={6}>
                                            <FormControl required>
                                                <FormLabel>Start Date</FormLabel>
                                                <Input type="date" value={entry.start} onChange={e => changeEntry(index, 'start', e.target.value)} />
                                            </FormControl>
                                        </Grid>
                                        <Grid xs={6}>
                                            <FormControl required>
                                                <FormLabel>End Date</FormLabel>
                                                <Input type="date" value={entry.end} onChange={e => changeEntry(index, 'end', e.target.value)} />
                                            </FormControl>
                                        </Grid>
                                    </Grid>

                                    <FormControl>
                                        <FormLabel>Instructions</FormLabel>
                                        <Textarea minRows={2} placeholder="Take with food, etc." value={entry.instructions} onChange={e => changeEntry(index, 'instructions', e.target.value)} />
                                    </FormControl>
                                </Stack>
                            </Sheet>
                        ))}

                        <Button variant="dashed" color="neutral" startDecorator={<AddIcon />} onClick={addEntry}>
                            Add Another Medication
                        </Button>

                        <Divider sx={{ my: 1 }} />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="plain" color="neutral" onClick={onClose}>Cancel</Button>
                            <Button type="submit" color="success" loading={isProcessing}>
                                {editData ? 'Update Prescription' : 'Finalize Prescription'}
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </ModalDialog>
        </Modal>
    );
}