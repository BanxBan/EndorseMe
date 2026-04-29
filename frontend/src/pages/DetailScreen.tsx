import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiWithCache, clearCache } from '../api';
import api from '../api';
import AddDetailModal from '../components/AddDetailModal';
import { showToast } from '../utils/toast';

const detailMeta: any = {
  diet: { title: 'Diet Orders', key: 'diet' },
  labs: { title: 'Laboratory', key: 'labs' },
  ivfluids: { title: 'IV Fluids', key: 'iv' },
  vs: { title: 'Vital Signs', key: 'vitals' },
  vitals: { title: 'Vital Signs', key: 'vitals' },
  io: { title: 'Intake & Output', key: 'io' },
  meds: { title: 'Medications', key: 'meds' },
  attachments: { title: 'Attachments & Documents', key: 'docs' },
  so: { title: 'SO Notes', key: 'so' },
  status: { title: 'Current Status', key: 'status' },
  sbar: { title: 'SBAR Summary', key: 'sbar' },
  alerts: { title: 'Alerts & Priority', key: 'alerts' },
  orders: { title: 'Important Orders', key: 'orders' },
};

const sortRecords = (records: any[]) =>
  [...records].sort((a, b) => new Date(b.ts || b.orderedAt || b.startTime || b.lastAdministered || 0).getTime() - new Date(a.ts || a.orderedAt || a.startTime || a.lastAdministered || 0).getTime());

const latestOf = (records: any[] = []) => sortRecords(records)[0];

const sumNumbers = (records: any[], key: string) =>
  records.reduce((total, record) => total + (Number(record[key]) || 0), 0);

export default function DetailScreen() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [relatedRecords, setRelatedRecords] = useState<any>({});
  const [allSbarSummaries, setAllSbarSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const buildAlerts = (p: any, bundle: any = relatedRecords) => {
    const latestVitals = latestOf(bundle.vitals);
    const dueMeds = (bundle.meds || []).filter((m: any) => (m.medStatus || 'active') === 'due');
    const pendingLabs = (bundle.labs || []).filter((l: any) => (l.status || 'pending') === 'pending');
    const removedDocs = (bundle.docs || []).filter((d: any) => d.docStatus === 'removed');
    const alerts: any[] = [];

    if (String(p?.status || '').toLowerCase() === 'critical') {
      alerts.push({ level: 'urgent', title: 'Critical patient', detail: 'Patient status is marked critical.' });
    }
    if (latestVitals && (Number(latestVitals.o2sat) < 94 || Number(latestVitals.temp) >= 38 || Number(latestVitals.hr) > 120)) {
      alerts.push({ level: 'urgent', title: 'Abnormal findings', detail: `Latest VS: HR ${latestVitals.hr || '-'}, Temp ${latestVitals.temp || '-'}, O2 ${latestVitals.o2sat || '-'}%.` });
    }
    if (dueMeds.length) alerts.push({ level: 'warning', title: 'Due medications', detail: `${dueMeds.length} medication(s) marked due.` });
    if (pendingLabs.length) alerts.push({ level: 'warning', title: 'Pending urgent tasks', detail: `${pendingLabs.length} lab task(s) pending.` });
    const activeOrders = (bundle.orders || []).filter((order: any) => (order.orderStatus || 'Pending') !== 'Completed');
    if (activeOrders.length) alerts.push({ level: 'warning', title: 'Important orders pending', detail: `${activeOrders.length} important order(s) need follow-up.` });
    if (removedDocs.length) alerts.push({ level: 'routine', title: 'Removed document history', detail: `${removedDocs.length} removed document(s) retained in the log.` });
    return alerts;
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const pRes = await apiWithCache.get('/patients');
      const foundPatient = pRes.data.find((p: any) => p.id === id);
      setPatient(foundPatient);

      if (foundPatient && type) {
        const meta = detailMeta[type as string];
        const res = await apiWithCache.get(`/records/${meta.key}_${id}`);
        setRecords(res.data || []);

        if (type === 'alerts') {
          const keys = ['vitals', 'iv', 'io', 'meds', 'labs', 'docs', 'orders'];
          const settled = await Promise.all(keys.map(key => apiWithCache.get(`/records/${key}_${id}`).catch(() => ({ data: [] }))));
          const bundle = keys.reduce((acc: any, key, index) => {
            acc[key] = settled[index].data || [];
            return acc;
          }, {});
          setRelatedRecords(bundle);
          setAllSbarSummaries([]);
        } else if (type === 'sbar') {
          const summaries = await Promise.all((pRes.data || []).map(async (p: any) => {
            const patientSbar = await apiWithCache.get(`/records/sbar_${p.id}`).catch(() => ({ data: [] }));
            const patientOrders = await apiWithCache.get(`/records/orders_${p.id}`).catch(() => ({ data: [] }));
            return { patient: p, record: latestOf(patientSbar.data || []), orders: patientOrders.data || [] };
          }));
          setAllSbarSummaries(summaries);
          const currentOrders = summaries.find((summary: any) => summary.patient.id === id)?.orders || [];
          setRelatedRecords({ orders: currentOrders });
        } else {
          setRelatedRecords({});
          setAllSbarSummaries([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [id, type]);

  const handleDelete = async (recordId: string) => {
    const meta = detailMeta[type as string];
    await api.delete(`/records/${meta.key}_${id}/${recordId}`);
    clearCache(`/records/${meta.key}_${id}`);
    showToast('Record removed successfully');
    fetchRecords();
  };

  const formatRecordValue = (record: any) => {
    if (record.value) return record.value;
    if (record.name) return record.name;
    if (record.fluid) return `${record.fluid}${record.rate ? ` @ ${record.rate}` : ''}`;
    if (record.bp) return `BP: ${record.bp}`;
    if (record.situation || record.background || record.assessment || record.recommendation) {
      return `S: ${record.situation || '-'} | B: ${record.background || '-'} | A: ${record.assessment || '-'} | R: ${record.recommendation || '-'}`;
    }
    return 'Record entry';
  };

  const formatOrdersForSbar = (orders: any[] = []) => {
    const activeOrders = orders.filter(order => (order.orderStatus || 'Pending') !== 'Completed');
    if (!activeOrders.length) return 'No active important orders.';
    return activeOrders.map(order => {
      const bloodInfo = order.orderType === 'Blood Transfusion'
        ? ` Units required: ${order.bloodUnitsRequired || 0}, available: ${order.bloodUnitsAvailable || 0}.`
        : '';
      const dressingInfo = order.orderType === 'Wound Dressing' && order.frequency ? ` Frequency: ${order.frequency}.` : '';
      return `${order.orderType || 'Other'} (${order.orderStatus || 'Pending'}): ${order.description || '-'}${bloodInfo}${dressingInfo}`;
    }).join(' ');
  };

  const getSbarSummary = (p: any, record?: any, orders: any[] = []) => {
    const room = p.ward_name ? `${p.ward_name} Bed ${p.bed_number || '-'}` : `Room ${p.room || '-'}`;
    const patientType = ['Post CS', 'NSVD', 'Gyne'].includes(String(p.patientType || '')) ? p.patientType : String(p.ward_type || '').toLowerCase().includes('ob') ? 'NSVD' : 'Gyne';
    const scheduleText = `VS ${p.vitalsSchedule || 'Q4'}, I&O ${p.ioSchedule || 'QShift'}.`;
    const orderText = formatOrdersForSbar(orders);
    return {
      situation: record?.situation || `${p.fname} ${p.lname}, ${p.age || '-'} y/o ${p.sex || '-'}, ${patientType}, ${room}. Diagnosis: ${p.diag || '-'}.`,
      background: record?.background || `Patient type: ${patientType}. Monitoring schedule: ${scheduleText} Admitted ${p.admit ? new Date(p.admit).toLocaleDateString('en-PH') : '-'} under ${p.doctor || '-'}. Allergy: ${p.allergy || 'NKDA'}.`,
      assessment: record?.assessment || `Important orders: ${orderText}`,
      recommendation: record?.recommendation || (orders.some(order => (order.orderStatus || 'Pending') !== 'Completed') ? 'Continue follow-up on pending/ongoing important orders.' : '-'),
      by: record?.by || 'No manual SBAR entry',
      ts: record?.ts,
    };
  };

  const handleSbarAction = (action: string) => {
    console.log(`${action} SBAR clicked`);
    showToast(`${action} SBAR button clicked`);
  };

  if (loading) {
    const meta = detailMeta[type as string];
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div className="topbar-logo">{meta?.title || 'Loading...'}</div>
            <div className="topbar-subtitle">Fetching data...</div>
          </div>
        </div>
        <div className="content">
          <div className="empty-state">
            <div className="empty-text">Loading patient data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient || !type || !detailMeta[type]) {
    return (
      <div className="screen active">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div>
            <div className="topbar-logo">Page Not Found</div>
            <div className="topbar-subtitle">Invalid patient or module</div>
          </div>
        </div>
        <div className="content">
          <div className="empty-state">
            <div className="empty-text">The patient or module does not exist.</div>
            <button className="btn btn-primary" style={{ margin: '20px auto 0' }} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const meta = detailMeta[type];
  const sortedRecords = sortRecords(records);

  const recordActions = (r: any) => (
    <>
      <button className="edit-btn" onClick={() => { setEditingRecord(r); setShowModal(true); }}>Edit</button>
      <button className="delete-btn" onClick={() => handleDelete(r.id)}>Delete</button>
    </>
  );

  const renderDefaultHistory = () => (
    <div className="history-list">
      {sortedRecords.map(r => (
        <div key={r.id} className="history-item">
          <div className="history-value">{formatRecordValue(r)}</div>
          <div className="history-time">{new Date(r.ts).toLocaleString()} | {r.by || 'N/A'}</div>
          {recordActions(r)}
        </div>
      ))}
    </div>
  );

  const renderIvModule = () => (
    <div className="history-list">
      {sortedRecords.map(r => (
        <div key={r.id} className="history-item" style={{ borderLeftColor: '#00A896' }}>
          <div className="history-value">Bottle #{r.bottleNo || '-'} | {r.fluid || 'IV Fluid'}</div>
          <div className="history-time">Mixture: {r.mixture || 'None'} | Rate: {r.rate || '-'}</div>
          <div className="history-time">Status: {(r.ivStatus || 'ongoing').toUpperCase()} | Site: {r.site || '-'}</div>
          <div className="history-time">Start: {r.startTime ? new Date(r.startTime).toLocaleString() : '-'} | End: {r.endTime ? new Date(r.endTime).toLocaleString() : '-'}</div>
          {recordActions(r)}
        </div>
      ))}
    </div>
  );

  const renderLabsModule = () => {
    const groups = {
      pending: sortedRecords.filter(r => (r.status || 'pending') === 'pending'),
      submitted: sortedRecords.filter(r => r.status === 'submitted'),
      received: sortedRecords.filter(r => r.status === 'received'),
    };

    const renderLabList = (label: string, list: any[]) => (
      <div style={{ marginBottom: '14px' }}>
        <div className="section-label">{label}</div>
        {list.length === 0 ? <div className="empty-text">No items</div> : list.map(r => (
          <div key={r.id} className="history-item">
            <div className="history-value">{r.name || 'Lab test'}</div>
            <div className="history-time">Ordered: {new Date(r.orderedAt || r.ts).toLocaleString()}</div>
            <div className="history-time">Status: {(r.status || 'pending').toUpperCase()} {r.result ? `| Result: ${r.result}` : ''}</div>
            {recordActions(r)}
          </div>
        ))}
      </div>
    );

    return <>{renderLabList('Pending', groups.pending)}{renderLabList('Submitted', groups.submitted)}{renderLabList('Results Received', groups.received)}</>;
  };

  const renderDietModule = () => {
    const currentDiet = sortedRecords[0];
    const history = sortedRecords.slice(1);
    return (
      <>
        {currentDiet && (
          <div className="current-card">
            <div className="current-label">Current Diet</div>
            <div className="current-value">{currentDiet.value || '-'}</div>
            <div className="current-meta">{currentDiet.notes || 'No additional notes'} | {new Date(currentDiet.ts).toLocaleString()}</div>
          </div>
        )}
        <div className="section-label">Diet History</div>
        {history.length === 0 ? <div className="empty-text">No previous diet history.</div> : (
          <div className="history-list">
            {history.map(r => (
              <div key={r.id} className="history-item">
                <div className="history-value">{r.value}</div>
                <div className="history-time">{new Date(r.ts).toLocaleString()} | {r.notes || 'No notes'}</div>
                {recordActions(r)}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderVitalsModule = () => {
    const latest = sortedRecords[0];
    const trend = sortedRecords.slice(0, 3);
    return (
      <>
        <div className="module-schedule-strip">
          <span className="schedule-badge">Vital Signs: {patient.vitalsSchedule || 'Q4'}</span>
          <span className="due-badge">Due by schedule</span>
        </div>
        {latest && (
          <div className="current-card">
            <div className="current-label">Latest Vital Signs</div>
            <div className="vitals-grid">
              <div className="vital-box"><div className="vital-label">BP</div><div className="vital-value">{latest.bp || '-'}</div></div>
              <div className="vital-box"><div className="vital-label">HR</div><div className="vital-value">{latest.hr || '-'}</div></div>
              <div className="vital-box"><div className="vital-label">RR</div><div className="vital-value">{latest.rr || '-'}</div></div>
              <div className="vital-box"><div className="vital-label">Temp</div><div className="vital-value">{latest.temp || '-'}</div></div>
              <div className="vital-box"><div className="vital-label">O2 Sat</div><div className="vital-value">{latest.o2sat ? `${latest.o2sat}%` : '-'}</div></div>
            </div>
            <div className="current-meta">{new Date(latest.ts).toLocaleString()} | {latest.by || 'N/A'}</div>
          </div>
        )}
        <div className="section-label">Trend - Last 3 Entries</div>
        {trend.length === 0 ? <div className="empty-text">No trend data yet.</div> : (
          <div className="history-list">
            {trend.map(r => (
              <div key={r.id} className="history-item">
                <div className="history-value">BP {r.bp || '-'} | HR {r.hr || '-'} | RR {r.rr || '-'} | Temp {r.temp || '-'} | O2 {r.o2sat ? `${r.o2sat}%` : '-'}</div>
                <div className="history-time">{new Date(r.ts).toLocaleString()} | {r.by || 'N/A'}</div>
                {recordActions(r)}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderIoModule = () => (
    <>
      <div className="module-schedule-strip">
        <span className="schedule-badge">I&O: {patient.ioSchedule || 'QShift'}</span>
        <span className="due-badge">Due by schedule</span>
      </div>
      <div className="summary-grid">
        <div className="metric-card"><div className="metric-label">Oral Fluids</div><div className="metric-value">{sumNumbers(sortedRecords, 'oralFluids')} mL</div></div>
        <div className="metric-card"><div className="metric-label">IVF Total</div><div className="metric-value">{sumNumbers(sortedRecords, 'ivfTotal')} mL</div></div>
        <div className="metric-card"><div className="metric-label">Urine</div><div className="metric-value">{sumNumbers(sortedRecords, 'urineAmount')} mL</div><div className="metric-sub">{sumNumbers(sortedRecords, 'urineFrequency')} time(s)</div></div>
        <div className="metric-card"><div className="metric-label">Stool</div><div className="metric-value">{sumNumbers(sortedRecords, 'stoolFrequency')}</div><div className="metric-sub">time(s)</div></div>
      </div>
      <div className="section-label">Shift Entries</div>
      <div className="history-list">
        {sortedRecords.map(r => (
          <div key={r.id} className="history-item">
            <div className="history-value">Oral {r.oralFluids || 0} mL | IVF {r.ivfTotal || 0} mL | Urine {r.urineAmount || 0} mL ({r.urineFrequency || 0}x) | Stool {r.stoolFrequency || 0}x</div>
            <div className="history-time">{r.shift || patient.shift || 'Current'} shift | {r.notes || 'No notes'}</div>
            <div className="history-time">{new Date(r.ts).toLocaleString()} | {r.by || 'N/A'}</div>
            {recordActions(r)}
          </div>
        ))}
      </div>
    </>
  );

  const renderMedsModule = () => {
    const groups = [
      ['Active Medications', sortedRecords.filter(r => (r.medStatus || 'active') === 'active')],
      ['Due Medications', sortedRecords.filter(r => r.medStatus === 'due')],
      ['PRN Medications', sortedRecords.filter(r => r.medStatus === 'prn')],
      ['Discontinued Medications', sortedRecords.filter(r => r.medStatus === 'discontinued')],
    ];

    return (
      <>
        {groups.map(([label, list]: any) => (
          <div key={label} style={{ marginBottom: '14px' }}>
            <div className="section-label">{label}</div>
            {list.length === 0 ? <div className="empty-text">No entries</div> : list.map((r: any) => (
              <div key={r.id} className="history-item">
                <div className="history-value">{r.name || 'Medication'} | {r.dose || '-'} {r.route ? `via ${r.route}` : ''} | {r.freq || '-'}</div>
                <div className="history-time">Last administered: {r.lastAdministered ? new Date(r.lastAdministered).toLocaleString() : '-'}</div>
                <div className="history-time">Status: {(r.medStatus || 'active').toUpperCase()} | {r.by || 'N/A'}</div>
                {recordActions(r)}
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  const renderDocsModule = () => {
    const active = sortedRecords.filter(r => (r.docStatus || 'active') === 'active');
    const removed = sortedRecords.filter(r => r.docStatus === 'removed');
    const renderDocs = (label: string, list: any[]) => (
      <div style={{ marginBottom: '14px' }}>
        <div className="section-label">{label}</div>
        {list.length === 0 ? <div className="empty-text">No documents</div> : list.map(r => (
          <div key={r.id} className="history-item">
            <div className="history-value">{r.docType || 'Document'} | {r.name || 'Uploaded document'}</div>
            <div className="history-time">Status: {(r.docStatus || 'active').toUpperCase()} | Uploaded: {new Date(r.ts).toLocaleString()}</div>
            {r.removedAt && <div className="history-time">Removed: {new Date(r.removedAt).toLocaleString()} | {r.removalReason || 'No reason logged'}</div>}
            <div className="history-time">{r.notes || 'No notes'} | {r.by || 'N/A'}</div>
            {recordActions(r)}
          </div>
        ))}
      </div>
    );
    return <>{renderDocs('Active Documents', active)}{renderDocs('Removed History', removed)}</>;
  };

  const renderOrdersModule = () => {
    const pending = sortedRecords.filter(r => (r.orderStatus || 'Pending') === 'Pending');
    const ongoing = sortedRecords.filter(r => r.orderStatus === 'Ongoing');
    const completed = sortedRecords.filter(r => r.orderStatus === 'Completed');
    const groups = [
      ['Pending', pending],
      ['Ongoing', ongoing],
      ['Completed', completed],
    ];

    const renderOrder = (r: any) => {
      const isBlood = r.orderType === 'Blood Transfusion';
      const isPriority = isBlood || (r.orderStatus || 'Pending') !== 'Completed';
      return (
        <div key={r.id} className={`order-card ${isPriority ? 'order-priority' : ''}`}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span className={`order-type-badge ${isBlood ? 'order-blood' : r.orderType === 'Wound Dressing' ? 'order-wound' : 'order-other'}`}>{r.orderType || 'Other'}</span>
            <span className={`order-status-badge status-${String(r.orderStatus || 'Pending').toLowerCase()}`}>{r.orderStatus || 'Pending'}</span>
          </div>
          <div className="history-value">{r.description || 'Important order'}</div>
          {isBlood && <div className="history-time">Blood units: {r.bloodUnitsAvailable || 0} available / {r.bloodUnitsRequired || 0} required</div>}
          {r.orderType === 'Wound Dressing' && r.frequency && <div className="history-time">Frequency: {r.frequency}</div>}
          <div className="history-time">{r.notes || 'No notes'} | {new Date(r.ts).toLocaleString()} | {r.by || 'N/A'}</div>
          {recordActions(r)}
        </div>
      );
    };

    return (
      <>
        {patient.patientType === 'Post CS' && (
          <div className="alert-card alert-routine" style={{ marginBottom: '12px' }}>
            <div className="history-value">Post CS reminder</div>
            <div className="history-time">Review wound dressing orders and incision care notes.</div>
          </div>
        )}
        {groups.map(([label, list]: any) => (
          <div key={label} style={{ marginBottom: '14px' }}>
            <div className="section-label">{label} Orders</div>
            {list.length === 0 ? <div className="empty-text">No {String(label).toLowerCase()} orders</div> : list.map(renderOrder)}
          </div>
        ))}
      </>
    );
  };

  const renderSbarCard = (summary: any, title: string, record?: any) => (
    <div className="endorse-view">
      <div className="endorse-view-header">
        <span className="sbar-chip chip-s">SBAR</span>
        <div>
          <div className="history-value">{title}</div>
          <div className="history-time">{summary.by}{summary.ts ? ` | ${new Date(summary.ts).toLocaleString()}` : ''}</div>
        </div>
      </div>
      <div className="sbar-summary-grid">
        <div className="sbar-summary-block"><div className="sbar-title">Situation</div><div className="history-time">{summary.situation}</div></div>
        <div className="sbar-summary-block"><div className="sbar-title">Background</div><div className="history-time">{summary.background}</div></div>
        <div className="sbar-summary-block"><div className="sbar-title">Assessment</div><div className="history-time">{summary.assessment}</div></div>
        <div className="sbar-summary-block"><div className="sbar-title">Recommendation</div><div className="history-time">{summary.recommendation}</div></div>
      </div>
      {record && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <button className="edit-btn" onClick={() => { setEditingRecord(record); setShowModal(true); }}>Edit</button>
          <button className="delete-btn" onClick={() => handleDelete(record.id)}>Delete</button>
        </div>
      )}
    </div>
  );

  const renderSbarModule = () => {
    const latestRecord = sortedRecords[0];
    const patientOrders = relatedRecords.orders || [];
    const patientSummary = getSbarSummary(patient, latestRecord, patientOrders);

    return (
      <>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <button className="btn btn-primary" onClick={() => handleSbarAction('Print')}>Print SBAR</button>
          <button className="btn btn-ghost" onClick={() => handleSbarAction('Send')}>Send SBAR</button>
        </div>

        <div className="section-label">Single Patient SBAR</div>
        {renderSbarCard(patientSummary, `${patient.fname} ${patient.lname}`, latestRecord)}

        {sortedRecords.length > 1 && (
          <>
            <div className="section-label">Previous Manual Entries</div>
            <div className="history-list">
              {sortedRecords.slice(1).map(r => renderSbarCard(getSbarSummary(patient, r, patientOrders), `${patient.fname} ${patient.lname}`, r))}
            </div>
          </>
        )}

        <div className="section-label">Multiple Patient SBAR Summary</div>
        <div className="history-list">
          {allSbarSummaries.map(({ patient: summaryPatient, record, orders }) => (
            <div key={summaryPatient.id}>
              {renderSbarCard(getSbarSummary(summaryPatient, record, orders || []), `${summaryPatient.fname} ${summaryPatient.lname}`, undefined)}
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderAlertsModule = () => {
    const generatedAlerts = [
      ...buildAlerts(patient, relatedRecords),
      ...sortedRecords.map(r => ({ level: r.alertLevel || 'warning', title: r.title || 'Manual alert', detail: r.detail || r.value || 'No details', id: r.id, manual: true })),
    ];
    return (
      <div className="history-list">
        {generatedAlerts.length === 0 ? <div className="empty-state"><div className="empty-text">No active alerts.</div></div> : generatedAlerts.map((alert: any, index: number) => (
          <div key={alert.id || index} className={`alert-card alert-${alert.level}`}>
            <div className="history-value">{alert.title}</div>
            <div className="history-time">{alert.detail}</div>
            {alert.manual && (
              <>
                <button className="edit-btn" onClick={() => { const record = sortedRecords.find(r => r.id === alert.id); setEditingRecord(record); setShowModal(true); }}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(alert.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderModuleContent = () => {
    if (type === 'sbar') return renderSbarModule();
    if (type === 'alerts') return renderAlertsModule();
    if (type === 'vs' || type === 'vitals') return renderVitalsModule();
    if (type === 'io') return renderIoModule();
    if (type === 'orders') return renderOrdersModule();

    if (sortedRecords.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-text">No records found.</div>
        </div>
      );
    }

    if (type === 'ivfluids') return renderIvModule();
    if (type === 'labs') return renderLabsModule();
    if (type === 'diet') return renderDietModule();
    if (type === 'meds') return renderMedsModule();
    if (type === 'attachments') return renderDocsModule();
    return renderDefaultHistory();
  };

  return (
    <div className="screen active">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div>
          <div className="topbar-logo">{meta.title}</div>
          <div className="topbar-subtitle">{patient.fname} {patient.lname} | Rm {patient.room}</div>
        </div>
      </div>
      <div className="content">
        {renderModuleContent()}
      </div>
      <button className="fab" onClick={() => {
        setEditingRecord(null);
        setShowModal(true);
      }}>+</button>

      {showModal && (
        <AddDetailModal
          type={meta.key}
          patientId={id as string}
          record={editingRecord}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchRecords();
          }}
        />
      )}
    </div>
  );
}
