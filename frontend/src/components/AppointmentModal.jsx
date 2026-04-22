import { useState, useEffect } from 'react';
import { 
    Modal, ModalDialog, ModalClose, Typography, Divider, 
    FormControl, FormLabel, Input, Button, Stack, Textarea 
} from '@mui/joy';
import { apiFetch } from '../lib/calls';

export default function AppointmentModal({ patientId, editData, onClose, onSuccess, user }) {
  const [apptFields, setApptFields] = useState({
    visitDate: '',
    beginTime: '',
    finishTime: '',
    visitPurpose: ''
  });

  useEffect(() => {
    if (editData) {
        let safeDate = '';
        const rawD = editData.date || editData.DATE;
        if (rawD) {
            const cleanStr = rawD.split('T')[0]; 
            if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                safeDate = cleanStr;
            } else if (cleanStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                const [m, d, y] = cleanStr.split('-');
                safeDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }

        const safeTime = (tStr) => {
            if (!tStr) return '';
            if (tStr.match(/^\d{2}:\d{2}$/)) return tStr; 
            const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
            if (match) {
                let h = parseInt(match[1]);
                const m = match[2];
                const ampm = (match[3] || '').toUpperCase();
                if (ampm === 'PM' && h < 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return `${h.toString().padStart(2, '0')}:${m}`;
            }
            return tStr;
        };

        setApptFields({
            visitDate: safeDate,
            beginTime: safeTime(editData.scheduled_start || editData.SCHEDULED_START),
            finishTime: safeTime(editData.scheduled_end || editData.SCHEDULED_END),
            visitPurpose: editData.reason || editData.REASON || ''
        });
    }
  }, [editData]);

  const dispatchAppointmentRequest = async (e) => {
    e.preventDefault();
    try {
      const currentPhysician = user?.doctor_id || user?.DOCTOR_ID;
      const rawTargetId = editData ? (editData.appointment_id || editData.APPOINTMENT_ID) : null;
      const targetApptId = rawTargetId ? parseInt(rawTargetId, 10) : null;
      const isEditing = !!targetApptId;

      let apiEndpoint = `/cfm/appointments.cfm?doctorId=${currentPhysician}&patientId=${patientId}`;
      if (isEditing) {
          apiEndpoint += `&appointmentId=${targetApptId}`;
      }

      const payload = {
        action: isEditing ? 'UPDATE' : 'CREATE',
        doctorId: currentPhysician,
        doctor_id: currentPhysician,
        patientId: parseInt(patientId),
        patient_id: parseInt(patientId),
        date: apptFields.visitDate,
        scheduledStart: apptFields.beginTime,
        scheduledEnd: apptFields.finishTime,
        reason: apptFields.visitPurpose
      };
      if (isEditing) {
        payload.appointmentId = targetApptId;
        payload.appointment_id = targetApptId;
      }

      const serverResponse = await apiFetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const decodedData = await serverResponse.json();
      
      if (decodedData.success) {
          onSuccess();
      } else {
          alert(decodedData.message || "Unable to process the appointment request.");
      }
    } catch (networkError) {
      console.error(networkError);
      alert("A network or parsing error occurred. Review the console logs.");
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <ModalDialog sx={{ width: '400px' }}>
        <ModalClose />
        <Typography level="h4">{editData ? 'Edit' : 'Set'} Appointment</Typography>
        <Typography level="body-sm" sx={{ mb: 2 }}>Patient ID: {patientId}</Typography>
        <Divider />
        
        <form onSubmit={dispatchAppointmentRequest}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl required>
              <FormLabel>Date</FormLabel>
              <Input type="date" value={apptFields.visitDate} onChange={e => setApptFields({...apptFields, visitDate: e.target.value})} />
            </FormControl>
            
            <Stack direction="row" spacing={2}>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>Start Time</FormLabel>
                <Input type="time" value={apptFields.beginTime} onChange={e => setApptFields({...apptFields, beginTime: e.target.value})} />
              </FormControl>
              <FormControl required sx={{ flex: 1 }}>
                <FormLabel>End Time</FormLabel>
                <Input type="time" value={apptFields.finishTime} onChange={e => setApptFields({...apptFields, finishTime: e.target.value})} />
              </FormControl>
            </Stack>

            <FormControl required>
              <FormLabel>Reason for Visit</FormLabel>
              <Textarea 
                minRows={2} 
                placeholder="e.g. Annual Checkup" 
                value={apptFields.visitPurpose} 
                onChange={e => setApptFields({...apptFields, visitPurpose: e.target.value})} 
              />
            </FormControl>

            <Button type="submit" fullWidth sx={{ mt: 1 }}>
                {editData ? 'Update' : 'Schedule'} Appointment
            </Button>
          </Stack>
        </form>
      </ModalDialog>
    </Modal>
  );
}