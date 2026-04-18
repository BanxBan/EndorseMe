import { useState } from 'react';
import api from '../api';

export default function AddDetailModal({ type, patientId, record, onClose, onSave }: { type: string, patientId: string, record?: any, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState<any>(record || { ts: new Date().toISOString().slice(0, 16) });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (record) {
        await api.put(`/records/${type}_${patientId}/${record.id}`, formData);
      } else {
        await api.post(`/records/${type}_${patientId}`, formData);
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert('Failed to save record');
    }
  };

  const renderFormFields = () => {
    if (type === 'diet') {
      return (
        <>
          <div className="form-group"><label>Diet Type</label>
            <select name="value" value={formData.value || ''} onChange={handleChange}>
              <option value="">Select...</option>
              <option>Low-sodium diet</option><option>Cardiac diet (DASH)</option><option>General diet</option>
            </select>
          </div>
          <div className="form-group"><label>Additional Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} placeholder="e.g. Small frequent feedings"></textarea>
          </div>
        </>
      );
    }
    if (type === 'labs') {
      return (
        <>
          <div className="form-group"><label>Test Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Status</label>
            <select name="status" value={formData.status || 'requested'} onChange={handleChange}>
              <option value="requested">Requested</option><option value="submitted">Submitted</option><option value="resulted">Resulted</option>
            </select>
          </div>
          <div className="form-group"><label>Result</label><input type="text" name="result" value={formData.result || ''} onChange={handleChange} /></div>
        </>
      );
    }
    if (type === 'ivfluids') {
      return (
        <>
          <div className="form-group"><label>IV Fluid</label><input type="text" name="fluid" value={formData.fluid || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Rate</label><input type="text" name="rate" value={formData.rate || ''} onChange={handleChange} /></div>
        </>
      );
    }
    if (type === 'vitals') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>BP</label><input type="text" name="bp" value={formData.bp || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>HR</label><input type="number" name="hr" value={formData.hr || ''} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Temp</label><input type="number" step="0.1" name="temp" value={formData.temp || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>RR</label><input type="number" name="rr" value={formData.rr || ''} onChange={handleChange} /></div>
          </div>
        </>
      );
    }
    if (type === 'meds') {
      return (
        <>
          <div className="form-group"><label>Medication</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Route</label><input type="text" name="route" value={formData.route || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Frequency</label><input type="text" name="freq" value={formData.freq || ''} onChange={handleChange} /></div>
        </>
      );
    }
    if (type === 'status') {
      return (
        <div className="form-group"><label>Status Update</label>
          <textarea name="value" value={formData.value || ''} onChange={handleChange} rows={5}></textarea>
        </div>
      );
    }
    if (type === 'sbar') {
      return (
        <>
          <div className="form-group"><label>Situation</label><textarea name="situation" value={formData.situation || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Background</label><textarea name="background" value={formData.background || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Assessment</label><textarea name="assessment" value={formData.assessment || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Recommendation</label><textarea name="recommendation" value={formData.recommendation || ''} onChange={handleChange} rows={2}></textarea></div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ transform: 'translateY(0)' }}>
        <div className="modal-handle"></div>
        <div className="modal-title">{record ? 'Edit Entry' : 'Add Entry'}</div>
        
        {renderFormFields()}
        
        <div className="form-row">
          <div className="form-group"><label>Date & Time</label><input type="datetime-local" name="ts" value={formData.ts ? new Date(formData.ts).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Endorsed by</label><input type="text" name="by" value={formData.by || ''} onChange={handleChange} /></div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSave}>💾 Save</button>
        </div>
      </div>
    </div>
  );
}
