// ============================================
// Ekayan Bridge — Student List View
// ============================================

const StudentList = (() => {

  let currentFilters = { stage: 'all', flagged: false };
  let currentSort = 'name';
  let currentSearch = '';

  function render() {
    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="list-controls">
        <div class="search-box">
          <span class="search-box__icon">🔍</span>
          <input type="text" id="student-search" class="search-box__input" placeholder="Search by name, ID, village..." value="${Utils.escapeHtml(currentSearch)}">
        </div>
        <select id="filter-stage" class="filter-select">
          <option value="all">All Stages</option>
          ${Object.entries(Utils.STAGES).map(([k, v]) => `<option value="${k}" ${currentFilters.stage === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
        </select>
        <select id="sort-by" class="filter-select">
          <option value="name" ${currentSort === 'name' ? 'selected' : ''}>Sort: Name</option>
          <option value="enrollmentDate" ${currentSort === 'enrollmentDate' ? 'selected' : ''}>Sort: Enrollment</option>
          <option value="lastActivity" ${currentSort === 'lastActivity' ? 'selected' : ''}>Sort: Last Activity</option>
          <option value="stage" ${currentSort === 'stage' ? 'selected' : ''}>Sort: Stage</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" id="filter-flagged" ${currentFilters.flagged ? 'checked' : ''}> 🚩 Flagged only
        </label>
        <button class="btn" onclick="StudentList.exportToCSV()">📤 Export CSV</button>
        <button class="btn btn--primary" onclick="Forms.showAddStudent()">+ Add Student</button>
      </div>
      <div id="student-list-area"></div>
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
    document.getElementById('sort-by').addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderList();
    });
    document.getElementById('filter-flagged').addEventListener('change', (e) => {
      currentFilters.flagged = e.target.checked;
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
          <div class="empty-state__text">${currentSearch || currentFilters.stage !== 'all' ? 'No students match your filters.' : 'No students yet. Add your first student!'}</div>
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

      html += `
        <div class="student-card ${s.flagged ? 'student-card--flagged' : ''}" onclick="App.navigate('profile', '${s.id}')">
          ${s.flagged ? '<span class="student-card__flag">🚩</span>' : ''}
          <div class="student-card__header">
            <div class="student-card__avatar">${initials}</div>
            <div>
              <div class="student-card__name">${Utils.escapeHtml(s.name)}</div>
              <div class="student-card__id">${s.id}</div>
            </div>
          </div>
          <div class="student-card__details">
            <div class="student-card__detail">📍 ${Utils.escapeHtml(s.village || '—')}</div>
            <div class="student-card__detail">📅 Enrolled ${Utils.formatDate(s.enrollmentDate)}</div>
            <div class="student-card__detail">📚 ${classCount} classes attended</div>
            <div style="margin-top:6px;">
              <span class="stage-badge" style="background:${stageInfo.color}22; color:${stageInfo.color}; border:1px solid ${stageInfo.color}44;">
                ${stageInfo.icon} ${stageInfo.label}
              </span>
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
      'Enrollment Date',
      'Program Stage',
      'Last Contact Date',
      'Flagged',
      'Flag Reason',
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
        escapeCSV(s.enrollmentDate),
        escapeCSV(s.programStage),
        escapeCSV(s.lastContactDate),
        escapeCSV(s.flagged ? 'Yes' : 'No'),
        escapeCSV(s.flagReason || ''),
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
    
    Utils.showToast('CSV export downloaded successfully!', 'success');
  }

  return { render, renderList, exportToCSV };
})();
