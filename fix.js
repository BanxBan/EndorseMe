const fs = require('fs');
const p = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(p, 'utf8');

// 1. Remove "My Patients" block from left sidebar (lines 125-128)
content = content.replace(
  /          <div id="patient-list">\r\n            <div className="home-title">My Patients<\/div>\r\n            <div className="home-date">\{new Date\(\)\.toLocaleDateString\('en-PH', \{ weekday:'long', year:'numeric', month:'long', day:'numeric' \}\)\}<\/div>\r\n          <\/div>\r\n/,
  ''
);

// 2. Add "My Patients" header with + Add Patient button back into dashboard-main, before Quick Actions
const dashMainMarker = `<div className="dashboard-main">`;
const replacement = `<div className="dashboard-main">\r\n        <div className="home-header" id="patient-list">\r\n          <div>\r\n            <div className="home-title">My Patients</div>\r\n            <div className="home-date">{new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>\r\n          </div>\r\n          <button className="add-patient-btn" onClick={() => setShowAddModal(true)}>\r\n            ＋ Add Patient\r\n          </button>\r\n        </div>`;

content = content.replace(dashMainMarker, replacement);

fs.writeFileSync(p, content);
console.log('done - My Patients moved back to right side');
