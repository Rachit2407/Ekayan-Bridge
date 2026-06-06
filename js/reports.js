// ============================================
// Ekayan Bridge — Reports & Audit Logging Views
// ============================================

const Reports = (() => {

  let currentType = 'directory';
  let filterVillage = 'all';
  let filterStage = 'all';

  function render() {
    const students = DataStore.getAllStudents();
    
    // Extract unique villages for village filter
    const villages = [...new Set(students.map(s => s.village).filter(Boolean))].sort();

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="report-grid">
        <!-- Sidebar Controls -->
        <div class="report-sidebar">
          <h4 style="margin-top:0; margin-bottom:16px; color:var(--text-primary);">📊 Select Report Template</h4>
          
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:24px;">
            <button class="btn ${currentType === 'directory' ? 'btn--primary' : 'btn--secondary'}" onclick="Reports.setType('directory')" style="text-align:left; justify-content:flex-start;">
              👥 Student Directory
            </button>

            <button class="btn ${currentType === 'dropouts' ? 'btn--primary' : 'btn--secondary'}" onclick="Reports.setType('dropouts')" style="text-align:left; justify-content:flex-start;">
              ⚠️ Dropouts & Attrition
            </button>
            <button class="btn ${currentType === 'compliance' ? 'btn--primary' : 'btn--secondary'}" onclick="Reports.setType('compliance')" style="text-align:left; justify-content:flex-start;">
              🛡️ Data Compliance (Consent)
            </button>
          </div>

          <h4 style="margin-bottom:12px; color:var(--text-primary);">⚙️ Filter Report Dataset</h4>
          
          <div class="form-group" style="margin-bottom:12px;">
            <label>Village</label>
            <select id="rep-filter-village" onchange="Reports.setVillage(this.value)" style="width:100%; padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:6px; color:var(--text-primary);">
              <option value="all" ${filterVillage === 'all' ? 'selected' : ''}>All Villages</option>
              ${villages.map(v => `<option value="${v}" ${filterVillage === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom:20px;">
            <label>Program Stage</label>
            <select id="rep-filter-stage" onchange="Reports.setStage(this.value)" style="width:100%; padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:6px; color:var(--text-primary);">
              <option value="all" ${filterStage === 'all' ? 'selected' : ''}>All Stages</option>
              ${Object.entries(Utils.STAGES).map(([k, v]) => `<option value="${k}" ${filterStage === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>

          <h4 style="margin-bottom:12px; color:var(--text-primary);">📥 Export Actions</h4>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
            <button class="btn" onclick="Reports.exportReport('csv')" style="font-size:0.8rem; padding:8px;">CSV</button>
            <button class="btn" onclick="Reports.exportReport('excel')" style="font-size:0.8rem; padding:8px;">Excel</button>
            <button class="btn btn--primary" onclick="Reports.exportReport('pdf')" style="grid-column: span 2; font-size:0.85rem; padding:10px;">📄 Print / Export PDF</button>
          </div>
        </div>

        <!-- Report Table Preview -->
        <div class="report-results-card">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
            <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary);" id="report-title-label">Preview</h3>
            <span style="font-size:0.8rem; color:var(--text-secondary);" id="report-count-label">0 records</span>
          </div>
          <div style="overflow-x:auto;" id="report-preview-container"></div>
        </div>
      </div>
    `;

    updateReportPreview();
  }

  function setType(type) {
    currentType = type;
    render();
  }

  function setVillage(v) {
    filterVillage = v;
    updateReportPreview();
  }

  function setStage(s) {
    filterStage = s;
    updateReportPreview();
  }

  function getReportData() {
    let list = DataStore.getAllStudents();
    
    // Apply filters
    if (filterVillage !== 'all') {
      list = list.filter(s => s.village === filterVillage);
    }
    if (filterStage !== 'all') {
      list = list.filter(s => s.programStage === filterStage);
    }
    
    return list;
  }

  function generateReportTableHtml(students, forPrint = false) {
    let headers = [];
    let rowsHtml = '';

    if (currentType === 'directory') {
      headers = ['ID', 'Name', 'Village', 'Gender', 'Stage', 'Institution/Job', 'Enrolled'];
      rowsHtml = students.map(s => {
        const stage = Utils.STAGES[s.programStage]?.label || s.programStage;
        return `
          <tr>
            <td>${s.id}</td>
            <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
            <td>${Utils.escapeHtml(s.village || '—')}</td>
            <td style="text-transform:capitalize;">${s.gender || '—'}</td>
            <td>${stage}</td>
            <td>${Utils.escapeHtml(s.schoolCollegeJob || '—')}</td>
            <td>${Utils.formatDate(s.enrollmentDate)}</td>
          </tr>
        `;
      }).join('');

    } else if (currentType === 'dropouts') {
      headers = ['ID', 'Name', 'Village', 'Dropout Date', 'Dropout Cause', 'Last Activity Date'];
      rowsHtml = students
        .filter(s => s.programStage === 'dropped_out')
        .map(s => {
          const reason = {
            financial: 'Financial Constraints',
            academic: 'Academic Difficulties',
            family: 'Family Issues/Migration',
            employment: 'Employment/Job Needed',
            marriage: 'Marriage',
            other: 'Other Reason'
          }[s.dropoutReason] || s.dropoutReason || 'Other';
          
          return `
            <tr>
              <td>${s.id}</td>
              <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
              <td>${Utils.escapeHtml(s.village || '—')}</td>
              <td>${Utils.formatDate(s.dropoutDate)}</td>
              <td>${reason}</td>
              <td>${Utils.formatDate(s.lastContactDate)}</td>
            </tr>
          `;
        }).join('');
      
      // If we filtered and have no actual dropouts
      if (!rowsHtml) {
        rowsHtml = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No dropout records match current filters.</td></tr>';
      }
    } else if (currentType === 'compliance') {
      headers = ['ID', 'Name', 'Village', 'Contact', 'Consent Status', 'Consent Date'];
      rowsHtml = students.map(s => {
        // In preview on staff screen this would be masked, but reports is admin-only, so we render clean details.
        return `
          <tr>
            <td>${s.id}</td>
            <td><strong>${Utils.escapeHtml(s.name)}</strong></td>
            <td>${Utils.escapeHtml(s.village || '—')}</td>
            <td>${s.contact || '—'}</td>
            <td>${s.consentGiven ? '✅ Active Consent' : '⚠️ No signed consent'}</td>
            <td>${s.consentDate ? Utils.formatDate(s.consentDate) : '—'}</td>
          </tr>
        `;
      }).join('');
    }

    return `
      <table class="${forPrint ? '' : 'report-table'}">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  function updateReportPreview() {
    const previewContainer = document.getElementById('report-preview-container');
    const titleLabel = document.getElementById('report-title-label');
    const countLabel = document.getElementById('report-count-label');
    if (!previewContainer) return;

    const data = getReportData();
    const count = currentType === 'dropouts' ? data.filter(s => s.programStage === 'dropped_out').length : data.length;

    const titles = {
      directory: 'Student Register Directory',
      dropouts: 'Student Attrition & Dropout Tracking Report',
      compliance: 'Privacy Audit & Data Compliance Registry'
    };

    titleLabel.textContent = titles[currentType] || 'Report';
    countLabel.textContent = `${count} record${count !== 1 ? 's' : ''}`;

    if (count === 0) {
      previewContainer.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:48px 0;">No matching records found for this template & filter combo.</div>';
      return;
    }

    previewContainer.innerHTML = generateReportTableHtml(data);
  }

  function exportReport(format) {
    const data = getReportData();
    const titles = {
      directory: 'Student Register Directory',
      dropouts: 'Student Dropout Report',
      compliance: 'Consent Compliance Register'
    };
    
    const title = titles[currentType] || 'Report';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ekayan_report_${currentType}_${dateStr}`;

    const count = currentType === 'dropouts' ? data.filter(s => s.programStage === 'dropped_out').length : data.length;
    if (count === 0) {
      Utils.showToast('No record data to export.', 'warning');
      return;
    }

    // Add audit log
    DataStore.addAuditLog('EXPORT_REPORT', `Exported "${title}" template containing ${count} records to ${format.toUpperCase()}`);

    if (format === 'pdf') {
      const htmlTable = generateReportTableHtml(data, true);
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; color: #111827; background-color: #ffffff; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 16px; margin-bottom: 24px; }
              .logo { font-size: 1.6rem; font-weight: 800; color: #111827; }
              .meta { font-size: 0.85rem; text-align: right; line-height: 1.4; color: #4b5563; }
              h1 { font-size: 1.4rem; margin-top: 0; color: #111827; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 0.8rem; }
              th { background-color: #f3f4f6; color: #374151; font-weight: 600; }
              tr:nth-child(even) { background-color: #f9fafb; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">🎓 Ekayan Bridge</div>
                <div style="font-size:0.85rem; color:#6b7280; margin-top:2px;">Lifecycle Management & Analytics Registry</div>
              </div>
              <div class="meta">
                <strong>Template:</strong> ${title}<br>
                <strong>Generated:</strong> ${new Date().toLocaleDateString('en-IN')}<br>
                <strong>Auditor:</strong> ${DataStore.getCurrentUser()?.email || 'System'}
              </div>
            </div>
            <h1>${title}</h1>
            <p style="font-size:0.85rem; color:#4b5563; margin-top:-10px;">Filtered Dataset contains total ${count} records.</p>
            ${htmlTable}
            <div style="margin-top: 40px; font-size:0.75rem; color:#9ca3af; text-align:center; border-top:1px solid #e5e7eb; padding-top:16px;">
              Ekayan Bridge • Confidential Data Registry • Compliance Authorized
            </div>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 300);
              }
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } 
    else if (format === 'excel') {
      const htmlTable = generateReportTableHtml(data, true);
      const uri = 'data:application/vnd.ms-excel;base64,';
      const template = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Report Sheet</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta charset="utf-8">
            <style>
              table { border-collapse: collapse; }
              th { background-color: #f3f4f6; color: #111827; font-weight: bold; border: 1px solid #e5e7eb; padding: 8px; }
              td { border: 1px solid #e5e7eb; padding: 8px; }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <p>Generated: ${new Date().toLocaleDateString('en-IN')} | Auditor: ${DataStore.getCurrentUser()?.email}</p>
            ${htmlTable}
          </body>
        </html>
      `;
      const base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));
      const link = document.createElement('a');
      link.href = uri + base64(template);
      link.download = filename + '.xls';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Utils.showToast('Excel report spreadsheet downloaded!', 'success');
    } 
    else if (format === 'csv') {
      let headers = [];
      let csvContent = '';

      if (currentType === 'directory') {
        headers = ['Student ID', 'Name', 'Village', 'Gender', 'Program Stage', 'School/College/Job', 'Enrollment Date'];
        csvContent = data.map(s => [
          s.id, s.name, s.village, s.gender, s.programStage, s.schoolCollegeJob, s.enrollmentDate
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      } 
      else if (currentType === 'dropouts') {
        headers = ['Student ID', 'Name', 'Village', 'Dropout Date', 'Dropout Reason', 'Last Contact Date'];
        csvContent = data.filter(s => s.programStage === 'dropped_out').map(s => [
          s.id, s.name, s.village, s.dropoutDate, s.dropoutReason, s.lastContactDate
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      } 
      else if (currentType === 'compliance') {
        headers = ['Student ID', 'Name', 'Village', 'Contact', 'Consent Given', 'Consent Date'];
        csvContent = data.map(s => [
          s.id, s.name, s.village, s.contact, s.consentGiven ? 'Yes' : 'No', s.consentDate
        ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      }

      const fileContent = '\uFEFF' + headers.join(',') + '\n' + csvContent;
      const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename + '.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Utils.showToast('CSV report dataset downloaded!', 'success');
    }
  }

  return { render, setType, setVillage, setStage, exportReport };
})();

// ============================================
// Ekayan Bridge — System Audit Logs Console
// ============================================

const AuditLogs = (() => {

  let searchQuery = '';
  let actionFilter = 'all';

  function render() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="card" style="margin-bottom:24px;">
        <h3 class="card__title" style="margin-bottom:16px;">📜 System Log Queries</h3>
        <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
          <div class="search-box" style="flex:1 1 240px; margin:0;">
            <span class="search-box__icon">🔍</span>
            <input type="text" id="audit-search" class="search-box__input" placeholder="Search by email, details..." value="${Utils.escapeHtml(searchQuery)}">
          </div>
          <select id="audit-filter-action" class="filter-select">
            <option value="all" ${actionFilter === 'all' ? 'selected' : ''}>All System Actions</option>
            <option value="LOGIN" ${actionFilter === 'LOGIN' ? 'selected' : ''}>LOGIN</option>
            <option value="LOGOUT" ${actionFilter === 'LOGOUT' ? 'selected' : ''}>LOGOUT</option>
            <option value="CREATE_STUDENT" ${actionFilter === 'CREATE_STUDENT' ? 'selected' : ''}>CREATE STUDENT</option>
            <option value="UPDATE_STUDENT" ${actionFilter === 'UPDATE_STUDENT' ? 'selected' : ''}>UPDATE STUDENT</option>
            <option value="DELETE_STUDENT" ${actionFilter === 'DELETE_STUDENT' ? 'selected' : ''}>DELETE STUDENT</option>
            <option value="ADD_EVENT" ${actionFilter === 'ADD_EVENT' ? 'selected' : ''}>ADD EVENT</option>
            <option value="DELETE_EVENT" ${actionFilter === 'DELETE_EVENT' ? 'selected' : ''}>DELETE EVENT</option>
            <option value="EXPORT_REPORT" ${actionFilter === 'EXPORT_REPORT' ? 'selected' : ''}>EXPORT REPORT</option>
            <option value="EXPORT_DATA" ${actionFilter === 'EXPORT_DATA' ? 'selected' : ''}>BACKUP EXPORT</option>
            <option value="IMPORT_DATA" ${actionFilter === 'IMPORT_DATA' ? 'selected' : ''}>BACKUP IMPORT</option>
          </select>
          <button class="btn btn--secondary" onclick="AuditLogs.clearLogs()" style="margin-left:auto;">🧹 Clear Log Cache</button>
        </div>
      </div>

      <div class="card">
        <div class="audit-table-container">
          <table class="audit-table">
            <thead>
              <tr>
                <th style="width:160px;">Timestamp</th>
                <th style="width:200px;">User Account</th>
                <th style="width:100px;">System Role</th>
                <th style="width:160px;">Action Key</th>
                <th>Activity Details</th>
              </tr>
            </thead>
            <tbody id="audit-logs-body"></tbody>
          </table>
        </div>
      </div>
    `;

    bindControls();
    renderLogsList();
  }

  function bindControls() {
    const input = document.getElementById('audit-search');
    input.addEventListener('input', Utils.debounce((e) => {
      searchQuery = e.target.value;
      renderLogsList();
    }, 200));

    document.getElementById('audit-filter-action').addEventListener('change', (e) => {
      actionFilter = e.target.value;
      renderLogsList();
    });
  }

  function renderLogsList() {
    const body = document.getElementById('audit-logs-body');
    if (!body) return;

    let logs = DataStore.getAllAuditLogs();
    
    // Sort in reverse chronological order (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter by action type
    if (actionFilter !== 'all') {
      logs = logs.filter(l => l.action === actionFilter);
    }

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      logs = logs.filter(l => 
        (l.user && l.user.toLowerCase().includes(q)) ||
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
      );
    }

    if (logs.length === 0) {
      body.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:24px; color:var(--text-secondary);">
            No audit logs match current filters.
          </td>
        </tr>
      `;
      return;
    }

    body.innerHTML = logs.map(l => {
      const date = new Date(l.timestamp);
      const timeStr = date.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const badgeClass = l.role === 'admin' ? 'badge--admin' : 'badge--staff';
      
      return `
        <tr>
          <td style="color:var(--text-secondary); font-family:monospace;">${timeStr}</td>
          <td><strong>${Utils.escapeHtml(l.user || 'system')}</strong></td>
          <td><span class="badge ${badgeClass}">${l.role || 'system'}</span></td>
          <td><span style="font-weight:700; color:var(--accent);">${l.action}</span></td>
          <td style="color:var(--text-secondary);">${Utils.escapeHtml(l.details)}</td>
        </tr>
      `;
    }).join('');
  }

  function clearLogs() {
    if (confirm('Are you sure you want to clear local audit log cache? This will clear logs displayed in this browser tab. Remote logs (if synced) will be preserved.')) {
      localStorage.removeItem('eb_audit_logs');
      Utils.showToast('Local audit logs cleared', 'info');
      render();
    }
  }

  return { render, clearLogs };
})();
