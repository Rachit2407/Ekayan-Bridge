// ============================================
// Ekayan Bridge — Student List View
// ============================================

const StudentList = (() => {

  let currentFilters = { 
    stage: 'all', 
    flagged: false, 
    followUp: false,
    gender: 'all',
    maritalStatus: 'all'
  };
  let currentSort = 'name';
  let currentSearch = '';

  function render(param) {
    if (param === 'followup') {
      currentFilters.followUp = true;
      currentFilters.flagged = false;
      currentFilters.stage = 'all';
    } else if (param === 'flagged') {
      currentFilters.flagged = true;
      currentFilters.followUp = false;
      currentFilters.stage = 'all';
    }

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <!-- Filters and Actions Toolbar -->
      <div class="list-controls" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
        <div class="search-box" style="flex: 1 1 200px;">
          <span class="search-box__icon">🔍</span>
          <input type="text" id="student-search" class="search-box__input" placeholder="Search name, ID, village..." value="${Utils.escapeHtml(currentSearch)}">
        </div>
        <select id="filter-stage" class="filter-select">
          <option value="all">All Stages</option>
          ${Object.entries(Utils.STAGES).map(([k, v]) => `<option value="${k}" ${currentFilters.stage === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
        </select>
        <select id="filter-gender" class="filter-select">
          <option value="all" ${currentFilters.gender === 'all' ? 'selected' : ''}>All Genders</option>
          <option value="male" ${currentFilters.gender === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${currentFilters.gender === 'female' ? 'selected' : ''}>Female</option>
          <option value="other" ${currentFilters.gender === 'other' ? 'selected' : ''}>Other</option>
          <option value="prefer_not_to_say" ${currentFilters.gender === 'prefer_not_to_say' ? 'selected' : ''}>N/A</option>
        </select>
        <select id="filter-marital" class="filter-select">
          <option value="all" ${currentFilters.maritalStatus === 'all' ? 'selected' : ''}>All Marital Statuses</option>
          <option value="single" ${currentFilters.maritalStatus === 'single' ? 'selected' : ''}>Single</option>
          <option value="married" ${currentFilters.maritalStatus === 'married' ? 'selected' : ''}>Married</option>
          <option value="divorced" ${currentFilters.maritalStatus === 'divorced' ? 'selected' : ''}>Divorced</option>
          <option value="widowed" ${currentFilters.maritalStatus === 'widowed' ? 'selected' : ''}>Widowed</option>
          <option value="prefer_not_to_say" ${currentFilters.maritalStatus === 'prefer_not_to_say' ? 'selected' : ''}>N/A</option>
        </select>

        <select id="sort-by" class="filter-select">
          <option value="name" ${currentSort === 'name' ? 'selected' : ''}>Sort: Name</option>
          <option value="enrollmentDate" ${currentSort === 'enrollmentDate' ? 'selected' : ''}>Sort: Enrollment</option>
          <option value="lastActivity" ${currentSort === 'lastActivity' ? 'selected' : ''}>Sort: Last Activity</option>
          <option value="stage" ${currentSort === 'stage' ? 'selected' : ''}>Sort: Stage</option>
        </select>
        
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
          <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer;">
            <input type="checkbox" id="filter-flagged" ${currentFilters.flagged ? 'checked' : ''}> 🚩 Flagged
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer;">
            <input type="checkbox" id="filter-followup" ${currentFilters.followUp ? 'checked' : ''}> ⚠️ Follow-up
          </label>
        </div>
        
        <div style="display:flex; gap:8px; margin-left:auto;">
          <button class="btn" onclick="StudentList.exportToCSV()">📤 Export CSV</button>
          <button class="btn btn--primary" onclick="Forms.showAddStudent()">+ Add Student</button>
        </div>
      </div>
      <div id="student-list-area" style="margin-top:20px;"></div>
    `;

    bindControls();
    renderList();
  }

  function bindControls() {
    const searchInput = document.getElementById('student-search');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      currentSearch = e.target.value;
      renderList();
    }, 250));

    document.getElementById('filter-stage').addEventListener('change', (e) => {
      currentFilters.stage = e.target.value;
      renderList();
    });
    document.getElementById('filter-gender').addEventListener('change', (e) => {
      currentFilters.gender = e.target.value;
      renderList();
    });
    document.getElementById('filter-marital').addEventListener('change', (e) => {
      currentFilters.maritalStatus = e.target.value;
      renderList();
    });

    document.getElementById('sort-by').addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderList();
    });
    document.getElementById('filter-flagged').addEventListener('change', (e) => {
      currentFilters.flagged = e.target.checked;
      renderList();
    });
    document.getElementById('filter-followup').addEventListener('change', (e) => {
      currentFilters.followUp = e.target.checked;
      renderList();
    });
  }

  function renderList() {
    let students = DataStore.getAllStudents();
    students = Utils.searchStudents(students, currentSearch);
    students = Utils.filterStudents(students, currentFilters);
    students = Utils.sortStudents(students, currentSort);

    const area = document.getElementById('student-list-area');

    if (students.length === 0) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📋</div>
          <div class="empty-state__text">${currentSearch || currentFilters.stage !== 'all' || currentFilters.gender !== 'all' || currentFilters.maritalStatus !== 'all' ? 'No students match your filters.' : 'No students yet. Add your first student!'}</div>
          ${!currentSearch ? '<button class="btn btn--primary" onclick="Forms.showAddStudent()">+ Add Student</button>' : ''}
        </div>
      `;
      return;
    }

    let html = `<div style="margin-bottom:12px;color:var(--text-secondary);font-size:0.85rem;">${students.length} student${students.length !== 1 ? 's' : ''}</div><div class="student-grid">`;

    students.forEach(s => {
      const stageInfo = Utils.STAGES[s.programStage] || { label: s.programStage, color: '#888', icon: '📋' };
      const initials = (s.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
      const events = DataStore.getStudentEvents(s.id);
      const classCount = events.filter(e => e.type === 'class').length;

      // PII masking for display in cards for staff users
      const currentUser = DataStore.getCurrentUser();
      const isStaff = currentUser && currentUser.role === 'staff';
      const displayContact = isStaff ? Utils.maskContact(s.contact) : s.contact;

      html += `
        <div class="student-card ${s.flagged ? 'student-card--flagged' : ''} ${s.followUpRequired ? 'student-card--followup' : ''}" onclick="App.navigate('profile', '${s.id}')">
          <div class="student-card__flags" style="position:absolute; top:14px; right:14px; display:flex; gap:6px; pointer-events:none;">
            ${s.flagged ? '<span style="font-size:1.1rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚩</span>' : ''}
            ${s.followUpRequired ? '<span style="font-size:1.1rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">⚠️</span>' : ''}
          </div>
          <div class="student-card__header">
            <div class="student-card__avatar">${initials}</div>
            <div>
              <div class="student-card__name">${Utils.escapeHtml(s.name)}</div>
              <div class="student-card__id">${s.id}</div>
            </div>
          </div>
          <div class="student-card__details">
            <div class="student-card__detail">📍 ${Utils.escapeHtml(s.village || '—')}</div>
            <div class="student-card__detail">📞 ${Utils.escapeHtml(displayContact || '—')}</div>
            <div class="student-card__detail">📅 Enrolled ${Utils.formatDate(s.enrollmentDate)}</div>
            <div class="student-card__detail">📚 ${classCount} classes attended</div>
            <div style="margin-top:10px; display:flex; gap:6px; align-items:center;">
              <span class="stage-badge" style="background:${stageInfo.color}22; color:${stageInfo.color}; border:1px solid ${stageInfo.color}44;">
                ${stageInfo.icon} ${stageInfo.label}
              </span>
              ${s.consentGiven ? '<span style="font-size:1.1rem;" title="Privacy Consent Granted">🛡️</span>' : '<span style="font-size:1.1rem;" title="No Signed Privacy Consent">⚠️</span>'}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    area.innerHTML = html;
  }

  function exportToCSV() {
    let students = DataStore.getAllStudents();
    students = Utils.searchStudents(students, currentSearch);
    students = Utils.filterStudents(students, currentFilters);
    students = Utils.sortStudents(students, currentSort);

    if (students.length === 0) {
      Utils.showToast('No student data to export.', 'warning');
      return;
    }

    const headers = [
      'Student ID',
      'Name',
      'Village',
      'Contact',
      'Email',
      'Date of Birth',
      'Gender',
      'Marital Status',
      'Enrollment Date',
      'Program Stage',
      'Last Contact Date',
      'Dropout Date',
      'Dropout Reason',
      'Consent Given',
      'Consent Date',
      'Flagged',
      'Flag Reason',
      'Follow-Up Required',
      'Follow-Up Notes',
      'Follow-Up Assigned To',
      'Follow-Up Date',
      'School/College/Job Updates',
      'Career Interests',
      'Classes Attended'
    ];

    const escapeCSV = (val) => {
      if (val === undefined || val === null) return '""';
      if (Array.isArray(val)) {
        return `"${val.join(', ').replace(/"/g, '""')}"`;
      }
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvRows = [headers.join(',')];

    students.forEach(s => {
      const events = DataStore.getStudentEvents(s.id);
      const classCount = events.filter(e => e.type === 'class').length;

      const row = [
        escapeCSV(s.id),
        escapeCSV(s.name),
        escapeCSV(s.village),
        escapeCSV(s.contact),
        escapeCSV(s.email),
        escapeCSV(s.dateOfBirth),
        escapeCSV(s.gender || 'prefer_not_to_say'),
        escapeCSV(s.maritalStatus || 'prefer_not_to_say'),
        escapeCSV(s.enrollmentDate),
        escapeCSV(s.programStage),
        escapeCSV(s.lastContactDate),
        escapeCSV(s.dropoutDate || ''),
        escapeCSV(s.dropoutReason || ''),
        escapeCSV(s.consentGiven ? 'Yes' : 'No'),
        escapeCSV(s.consentDate || ''),
        escapeCSV(s.flagged ? 'Yes' : 'No'),
        escapeCSV(s.flagReason || ''),
        escapeCSV(s.followUpRequired ? 'Yes' : 'No'),
        escapeCSV(s.followUpNotes || ''),
        escapeCSV(s.followUpAssignedTo || ''),
        escapeCSV(s.followUpDate || ''),
        escapeCSV(s.schoolCollegeJob || ''),
        escapeCSV(s.careerInterests || ''),
        escapeCSV(classCount)
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `ekayan_bridge_students_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    DataStore.addAuditLog('EXPORT_DATA', `Exported ${students.length} filtered student records to CSV`);
    Utils.showToast('CSV export downloaded successfully!', 'success');
  }

  return { render, renderList, exportToCSV };
})();
