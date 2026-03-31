import { useState, useEffect } from 'react';
import Select from 'react-select';
import { createPrescription, getMedications } from '../services/api';

export default function PrescriptionModal({ patientId, patientName, onClose, onSuccess }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meds, setMeds] = useState([{ medication_id: '', dosage: '', freq: '1', supply: '30', refills: '0', start: '', end: '', instructions: '' }]);

  useEffect(() => {
    getMedications().then(data => setMedications(data.medications || [])).catch(console.error);
  }, []);

  const updateMed = (i, field, value) => {
    const updated = [...meds];
    updated[i][field] = value;
    setMeds(updated);
  };

  const addMed = () => setMeds([...meds, { medication_id: '', dosage: '', freq: '1', supply: '30', refills: '0', start: '', end: '', instructions: '' }]);
  const removeMed = (i) => meds.length > 1 && setMeds(meds.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meds.every(m => m.medication_id && m.dosage && m.start && m.end)) {
      setError('Please fill all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = meds.map(m => ({
        medication_id: parseInt(m.medication_id),
        dosage: m.dosage,
        freq_per_day: parseInt(m.freq),
        frequency_type: 1,
        supply: parseInt(m.supply),
        refills: parseInt(m.refills),
        start_date: m.start,
        end_date: m.end,
        instructions: m.instructions
      }));
      await createPrescription(patientId, payload);
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
          <h2>💊 Prescribe Medication</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-info">Patient: {patientName} (ID: {patientId}) · Doctor: Dr. Smith (ID: 1)</div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{maxHeight: '50vh', overflowY: 'auto'}}>
            {error && <div className="error">{error}</div>}
            {meds.map((m, i) => (
              <div key={i} className="med-entry">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <h4>Medication #{i + 1}</h4>
                  {meds.length > 1 && <button type="button" onClick={() => removeMed(i)} style={{background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}>Remove</button>}
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
                    placeholder="Search medication..."
                    isClearable
                    styles={{
                      control: (base) => ({ ...base, minHeight: '42px' }),
                      menu: (base) => ({ ...base, zIndex: 9999 })
                    }}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Dosage *</label><input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="e.g. 10mg" required /></div>
                  <div className="form-group"><label>Frequency (per day)</label><input type="number" min="1" value={m.freq} onChange={e => updateMed(i, 'freq', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Supply (days)</label><input type="number" min="1" value={m.supply} onChange={e => updateMed(i, 'supply', e.target.value)} /></div>
                  <div className="form-group"><label>Refills</label><input type="number" min="0" value={m.refills} onChange={e => updateMed(i, 'refills', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Start Date *</label><input type="date" value={m.start} onChange={e => updateMed(i, 'start', e.target.value)} required /></div>
                  <div className="form-group"><label>End Date *</label><input type="date" value={m.end} onChange={e => updateMed(i, 'end', e.target.value)} required /></div>
                </div>
                <div className="form-group"><label>Instructions</label><textarea value={m.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} placeholder="Special instructions..." rows={2} /></div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addMed} style={{width: '100%'}}>+ Add Another Medication</button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
