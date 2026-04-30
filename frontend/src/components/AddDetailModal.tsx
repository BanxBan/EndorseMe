import { useState } from 'react';
import api from '../api';
import { clearCache } from '../api';
import { showToast } from '../utils/toast';

export default function AddDetailModal({ type, patientId, record, onClose, onSave }: { type: string, patientId: string, record?: any, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState<any>(record || { ts: new Date().toISOString().slice(0, 16) });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      if (record) {
        await api.put(`/records/${type}_${patientId}/${record.id}`, formData);
        showToast('Record updated successfully');
      } else {
        await api.post(`/records/${type}_${patientId}`, formData);
        showToast('Record added successfully');
      }
      clearCache(`/records/${type}_${patientId}`);
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
          <div className="form-group"><label>Current Diet</label>
            <select name="value" value={formData.value || ''} onChange={handleChange}>
              <option value="">Select...</option>
              <option>Low-sodium diet</option><option>Cardiac diet (DASH)</option><option>General diet</option>
              <option>NPO</option><option>Soft diet</option><option>Clear liquid diet</option>
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
          <div className="form-group"><label>Date/Time Ordered</label><input type="datetime-local" name="orderedAt" value={formData.orderedAt ? new Date(formData.orderedAt).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Status</label>
            <select name="status" value={formData.status || 'pending'} onChange={handleChange}>
              <option value="pending">Pending</option><option value="submitted">Submitted</option><option value="received">Results Received</option>
            </select>
          </div>
          <div className="form-group"><label>Result Preview (Optional)</label><input type="text" name="result" value={formData.result || ''} onChange={handleChange} /></div>
        </>
      );
    }
    if (type === 'ivfluids' || type === 'iv') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Bottle Number</label><input type="text" name="bottleNo" value={formData.bottleNo || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Flow Rate</label><input type="text" name="rate" value={formData.rate || ''} onChange={handleChange} placeholder="e.g. 20 gtts/min" /></div>
          </div>
          <div className="form-group"><label>Type of Fluid</label><input type="text" name="fluid" value={formData.fluid || ''} onChange={handleChange} /></div>
          <div className="form-group"><label>Mixture</label><input type="text" name="mixture" value={formData.mixture || ''} onChange={handleChange} placeholder="e.g. with Oxytocin" /></div>
          <div className="form-row">
            <div className="form-group"><label>Status</label>
              <select name="ivStatus" value={formData.ivStatus || 'ongoing'} onChange={handleChange}>
                <option value="ongoing">Ongoing</option>
                <option value="to follow">To Follow</option>
                <option value="heplock">Heplock</option>
              </select>
            </div>
            <div className="form-group"><label>IV Insertion Site</label><input type="text" name="site" value={formData.site || ''} onChange={handleChange} placeholder="e.g. Left forearm" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Time</label><input type="datetime-local" name="startTime" value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
            <div className="form-group"><label>End Time</label><input type="datetime-local" name="endTime" value={formData.endTime ? new Date(formData.endTime).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
          </div>
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
          <div className="form-group"><label>O2 Sat</label><input type="number" name="o2sat" value={formData.o2sat || ''} onChange={handleChange} placeholder="e.g. 98" /></div>
        </>
      );
    }
    if (type === 'io') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Shift</label>
              <select name="shift" value={formData.shift || 'AM'} onChange={handleChange}>
                <option>AM</option><option>PM</option><option>NOC</option>
              </select>
            </div>
            <div className="form-group"><label>Oral Fluids (mL)</label><input type="number" name="oralFluids" value={formData.oralFluids || ''} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>IVF Total (mL)</label><input type="number" name="ivfTotal" value={formData.ivfTotal || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Urine Amount (mL)</label><input type="number" name="urineAmount" value={formData.urineAmount || ''} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Urine Frequency</label><input type="number" name="urineFrequency" value={formData.urineFrequency || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Stool Frequency</label><input type="number" name="stoolFrequency" value={formData.stoolFrequency || ''} onChange={handleChange} /></div>
          </div>
          <div className="form-group"><label>Notes</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}></textarea>
          </div>
        </>
      );
    }
    if (type === 'meds') {
      return (
        <>
          <div className="form-group"><label>Medication</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} /></div>
          <div className="form-row">
            <div className="form-group"><label>Dose</label><input type="text" name="dose" value={formData.dose || ''} onChange={handleChange} placeholder="e.g. 500 mg" /></div>
            <div className="form-group"><label>Route</label><input type="text" name="route" value={formData.route || ''} onChange={handleChange} placeholder="e.g. PO, IV" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Frequency</label><input type="text" name="freq" value={formData.freq || ''} onChange={handleChange} placeholder="e.g. q8h" /></div>
            <div className="form-group"><label>Status</label>
              <select name="medStatus" value={formData.medStatus || 'active'} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="due">Due</option>
                <option value="prn">PRN</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Last Administered Time</label><input type="datetime-local" name="lastAdministered" value={formData.lastAdministered ? new Date(formData.lastAdministered).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
        </>
      );
    }
    if (type === 'docs') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Document Type</label>
              <select name="docType" value={formData.docType || 'Lab result'} onChange={handleChange}>
                <option>Lab result</option>
                <option>Doctor's order</option>
                <option>Consent form</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select name="docStatus" value={formData.docStatus || 'active'} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="removed">Removed</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Document Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. FBC result" /></div>
          {formData.docStatus === 'removed' && (
            <>
              <div className="form-group"><label>Removed At</label><input type="datetime-local" name="removedAt" value={formData.removedAt ? new Date(formData.removedAt).toISOString().slice(0, 16) : ''} onChange={handleChange} /></div>
              <div className="form-group"><label>Removal Reason / Log</label><textarea name="removalReason" value={formData.removalReason || ''} onChange={handleChange} rows={2}></textarea></div>
            </>
          )}
          <div className="form-group"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}></textarea></div>
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
    if (type === 'so') {
      return (
        <div className="form-group"><label>Subjective / Objective Notes</label>
          <textarea name="value" value={formData.value || ''} onChange={handleChange} rows={5}></textarea>
        </div>
      );
    }
    if (type === 'sbar') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Send To</label>
              <select name="recipient" value={formData.recipient || 'next_shift'} onChange={handleChange}>
                <option value="next_shift">Next Shift</option>
                <option value="assigned_nurse">Assigned Nurse</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>
            <div className="form-group"><label>Priority</label>
              <select name="priority" value={formData.priority || 'routine'} onChange={handleChange}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Situation</label><textarea name="situation" value={formData.situation || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Background</label><textarea name="background" value={formData.background || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Assessment</label><textarea name="assessment" value={formData.assessment || ''} onChange={handleChange} rows={2}></textarea></div>
          <div className="form-group"><label>Recommendation</label><textarea name="recommendation" value={formData.recommendation || ''} onChange={handleChange} rows={2}></textarea></div>
        </>
      );
    }
    if (type === 'alerts') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Alert Title</label><input type="text" name="title" value={formData.title || ''} onChange={handleChange} /></div>
            <div className="form-group"><label>Level</label>
              <select name="alertLevel" value={formData.alertLevel || 'warning'} onChange={handleChange}>
                <option value="routine">Routine</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Details</label><textarea name="detail" value={formData.detail || ''} onChange={handleChange} rows={3}></textarea></div>
        </>
      );
    }
    if (type === 'orders') {
      return (
        <>
          <div className="form-row">
            <div className="form-group"><label>Order Type</label>
              <select name="orderType" value={formData.orderType || 'Other'} onChange={handleChange}>
                <option>Blood Transfusion</option>
                <option>Wound Dressing</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select name="orderStatus" value={formData.orderStatus || 'Pending'} onChange={handleChange}>
                <option>Pending</option>
                <option>Ongoing</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} placeholder="e.g. Transfuse packed RBC as ordered"></textarea></div>
          {formData.orderType === 'Blood Transfusion' && (
            <div className="form-row">
              <div className="form-group"><label>Units Required</label><input type="number" name="bloodUnitsRequired" value={formData.bloodUnitsRequired || ''} onChange={handleChange} /></div>
              <div className="form-group"><label>Units Available</label><input type="number" name="bloodUnitsAvailable" value={formData.bloodUnitsAvailable || ''} onChange={handleChange} /></div>
            </div>
          )}
          {formData.orderType === 'Wound Dressing' && (
            <div className="form-group"><label>Frequency</label><input type="text" name="frequency" value={formData.frequency || ''} onChange={handleChange} placeholder="e.g. Daily, BID" /></div>
          )}
          <div className="form-group"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={2}></textarea></div>
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
