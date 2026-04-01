import { useState, useEffect } from 'react';
import Select from 'react-select';
import { createPrescription, updatePrescription, getMedications } from '../services/api';

const frequencyCountOptions = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
];

const frequencyIntervalOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As Needed' },
];

const freqTypeToInterval = (type) => {
  switch(type) {
    case 1: return 'daily';
    case 2: return 'weekly';
    case 3: return 'monthly';
    default: return 'as_needed';
  }
};

const selectStyles = {
  control: (base) => ({ ...base, minHeight: '42px', borderColor: '#e2e8f0', '&:hover': { borderColor: '#cbd5e1' } }),
  menu: (base) => ({ ...base, zIndex: 9999 })
};

export default function PrescriptionModal({ patientId, patientName, editData, onClose, onSuccess }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meds, setMeds] = useState([{ 
    medication_id: '', 
    dosage: '', 
    freqCount: '', 
    freqInterval: '', 
    supply: '', 
    refills: '0', 
    start: '', 
    end: '', 
    instructions: '' 
  }]);

  useEffect(() => {
    getMedications().then(data => setMedications(data.medications || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (editData && editData.medications) {
      setMeds(editData.medications.map(m => ({
        medication_id: m.medication_id || medications.find(med => med.medication_name === m.medication_name)?.id || '',
        dosage: m.dosage || '',
        freqCount: m.freq_per_day || '',
        freqInterval: freqTypeToInterval(m.frequency_type),
        supply: m.supply?.toString() || '',
        refills: m.refills?.toString() || '0',
        start: m.start_date || '',
        end: m.end_date || '',
        instructions: m.instructions || ''
      })));
    }
  }, [editData, medications]);

  const updateMed = (i, field, value) => {
    const updated = [...meds];
    updated[i][field] = value;
    setMeds(updated);
  };

  const addMed = () => setMeds([...meds, { 
    medication_id: '', 
    dosage: '', 
    freqCount: '', 
    freqInterval: '', 
    supply: '', 
    refills: '0', 
    start: '', 
    end: '', 
    instructions: '' 
  }]);
  const removeMed = (i) => meds.length > 1 && setMeds(meds.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meds.every(m => m.medication_id && m.dosage && m.freqCount && m.freqInterval && m.supply && m.start && m.end)) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = meds.map(m => ({
        medication_id: parseInt(m.medication_id),
        dosage: m.dosage,
        freq_per_day: parseInt(m.freqCount),
        frequency_type: m.freqInterval === 'daily' ? 1 : m.freqInterval === 'weekly' ? 2 : m.freqInterval === 'monthly' ? 3 : 4,
        supply: parseInt(m.supply),
        refills: parseInt(m.refills),
        start_date: m.start,
        end_date: m.end,
        instructions: m.instructions
      }));
      if (editData) {
        await updatePrescription(patientId, editData.prescription_id, payload);
      } else {
        await createPrescription(patientId, payload);
      }
      onSuccess();
    } catch (err) {
      setError('Failed to create prescription');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{width: '600px'}}>
        <div className="modal-header">
          <h2><span style={{color: '#10b981'}}>✎</span> {editData ? 'Edit Prescription' : 'Prescribe Medication'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-info">Patient: {patientName} (ID: {patientId}) · Doctor: Dr. Smith (ID: 1)</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
            {error && <div className="error">{error}</div>}
            {meds.map((m, i) => (
              <div key={i} className="med-entry">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  <h4 style={{margin: 0, fontWeight: 500}}>Medication #{i + 1}</h4>
                  {meds.length > 1 && <button type="button" onClick={() => removeMed(i)} style={{background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>Remove</button>}
                </div>

                <div className="form-group">
                  <label>Medication *</label>
                  <Select
                    options={medications.map(med => ({
                      value: med.id,
                      label: `${med.medication_name} ($${med.price})`
                    }))}
                    value={m.medication_id ? {
                      value: m.medication_id,
                      label: medications.find(med => med.id == m.medication_id)?.medication_name + ` ($${medications.find(med => med.id == m.medication_id)?.price})`
                    } : null}
                    onChange={(selected) => updateMed(i, 'medication_id', selected ? selected.value : '')}
                    placeholder="Select medication..."
                    isClearable
                    styles={selectStyles}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Dosage *</label>
                    <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div className="form-group">
                    <label>Frequency Count *</label>
                    <Select
                      options={frequencyCountOptions}
                      value={m.freqCount ? frequencyCountOptions.find(o => o.value == m.freqCount) : null}
                      onChange={(selected) => updateMed(i, 'freqCount', selected ? selected.value : '')}
                      placeholder="Select count..."
                      styles={selectStyles}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Frequency Interval *</label>
                    <Select
                      options={frequencyIntervalOptions}
                      value={m.freqInterval ? frequencyIntervalOptions.find(o => o.value === m.freqInterval) : null}
                      onChange={(selected) => updateMed(i, 'freqInterval', selected ? selected.value : '')}
                      placeholder="Select interval..."
                      styles={selectStyles}
                    />
                  </div>
                  <div className="form-group">
                    <label>Supply (qty) *</label>
                    <input type="number" min="1" value={m.supply} onChange={e => updateMed(i, 'supply', e.target.value)} placeholder="" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Refills</label>
                    <input type="number" min="0" value={m.refills} onChange={e => updateMed(i, 'refills', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" value={m.start} onChange={e => updateMed(i, 'start', e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{maxWidth: '48%'}}>
                  <label>End Date *</label>
                  <input type="date" value={m.end} onChange={e => updateMed(i, 'end', e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Instructions</label>
                  <textarea value={m.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} placeholder="Special instructions for the patient..." rows={3} />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addMed} style={{width: '100%'}}>+ Add Another Medication</button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Prescription' : 'Create Prescription')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
