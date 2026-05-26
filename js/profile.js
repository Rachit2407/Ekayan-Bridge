// ============================================
// Ekayan Bridge — Student Profile View
// ============================================

const Profile = (() => {

  let currentStudentId = null;

  function render(studentId) {
    currentStudentId = studentId;
    const student = DataStore.getStudent(studentId);
    if (!student) {
      document.getElementById('app-content').innerHTML = '<div class="empty-state"><div class="empty-state__icon">❌</div><div class="empty-state__text">Student not found.</div><button class="btn" onclick="App.navigate(\'students\')">← Back to List</button></div>';
      return;
    }

    const events = DataStore.getStudentEvents(studentId);
    const classCount = events.filter(e => e.type === 'class').length;
    const assessmentCount = events.filter(e => e.type === 'assessment').length;
    const counselingCount = events.filter(e => e.type === 'counseling').length;
    const stageInfo = Utils.STAGES[student.programStage] || { label: student.programStage, color: '#888', icon: '📋' };
    const initials = (student.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    const currentUser = DataStore.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <button class="btn btn--ghost" onclick="App.navigate('students')" style="margin-bottom:16px;">← Back to Students</button>

      ${renderJourneyMap(student)}

      <div class="profile-header">
        <div class="profile-header__avatar">${initials}</div>
        <div class="profile-header__info">
          <div class="profile-header__name">${Utils.escapeHtml(student.name)}</div>
          <span class="stage-badge" style="background:${stageInfo.color}22; color:${stageInfo.color}; border:1px solid ${stageInfo.color}44;">
            ${stageInfo.icon} ${stageInfo.label}
          </span>
          <div class="profile-header__meta">
            <span>🆔 ${student.id}</span>
            <span>📍 ${Utils.escapeHtml(student.village || '—')}</span>
            <span>📞 ${Utils.escapeHtml(student.contact || '—')}</span>
            ${student.email ? `<span>✉️ ${Utils.escapeHtml(student.email)}</span>` : ''}
          </div>
        </div>
        <div class="profile-header__actions">
          <button class="btn btn--primary btn--sm" onclick="Forms.showAddEvent('${student.id}')">+ Add Event</button>
          <button class="btn btn--sm" onclick="Forms.showEditStudent('${student.id}')">✏️ Edit</button>
          <button class="btn btn--sm" onclick="Profile.toggleFlag('${student.id}')">${student.flagged ? '🚩 Unflag' : '🏳️ Flag'}</button>
          <button class="btn btn--sm" onclick="Forms.showChangeStage('${student.id}')">🔄 Stage</button>
          ${isAdmin ? `<button class="btn btn--danger btn--sm" onclick="Profile.confirmDelete('${student.id}')">🗑️</button>` : ''}
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat"><div class="profile-stat__value">${classCount}</div><div class="profile-stat__label">Classes</div></div>
        <div class="profile-stat"><div class="profile-stat__value">${assessmentCount}</div><div class="profile-stat__label">Assessments</div></div>
        <div class="profile-stat"><div class="profile-stat__value">${counselingCount}</div><div class="profile-stat__label">Counseling</div></div>
        <div class="profile-stat"><div class="profile-stat__value">${Utils.timeAgo(student.lastContactDate) || '—'}</div><div class="profile-stat__label">Last Contact</div></div>
      </div>

      ${student.flagged ? `<div class="alert-item" style="margin-bottom:20px;"><span class="alert-item__icon">🚩</span><span class="alert-item__text"><strong>Flagged:</strong> ${Utils.escapeHtml(student.flagReason || 'Needs follow-up')}</span></div>` : ''}

      <div class="profile-grid">
        <div>
          <div class="section-header">
            <div class="section-header__title">📅 Timeline</div>
            <button class="btn btn--sm btn--primary" onclick="Forms.showAddEvent('${student.id}')">+ Add</button>
          </div>
          ${renderTimeline(events)}
        </div>
        <div>
          ${renderInfoPanel(student)}
        </div>
      </div>
    `;
  }

  function renderJourneyMap(student) {
    const stages = ['enrolled', 'active', 'on_hold', 'completed', 'alumni'];
    const currentIndex = stages.indexOf(student.programStage);
    const isDropped = student.programStage === 'dropped_out';

    let html = '<div class="journey-map">';
    stages.forEach((stage, i) => {
      const info = Utils.STAGES[stage];
      let cls = 'journey-step';
      if (isDropped) {
        cls += i === 0 ? ' journey-step--completed' : '';
      } else if (i < currentIndex) {
        cls += ' journey-step--completed';
      } else if (i === currentIndex) {
        cls += ' journey-step--current';
      }

      html += `<div class="${cls}"><div class="journey-step__dot"></div><span>${info.icon} ${info.label}</span></div>`;
      if (i < stages.length - 1) {
        html += `<div class="journey-connector ${i < currentIndex && !isDropped ? 'journey-connector--completed' : ''}"></div>`;
      }
    });

    if (isDropped) {
      html += `<div class="journey-connector"></div><div class="journey-step journey-step--current"><div class="journey-step__dot" style="background:var(--danger);box-shadow:0 0 8px var(--danger);"></div><span>⚠️ Dropped Out</span></div>`;
    }
    html += '</div>';
    return html;
  }

  function renderTimeline(events) {
    if (events.length === 0) {
      return '<div class="empty-state" style="padding:32px;"><div class="empty-state__icon">📝</div><div class="empty-state__text">No events yet.</div></div>';
    }

    const currentUser = DataStore.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    let html = '<div class="timeline">';
    events.forEach(e => {
      const typeInfo = Utils.EVENT_TYPES[e.type] || { icon: '📌', label: e.type, color: '#888' };
      html += `
        <div class="timeline__item">
          <div class="timeline__dot" style="border-color:${typeInfo.color}; background:${typeInfo.color};"></div>
          <div class="timeline__card">
            ${isAdmin ? `<button class="timeline__delete btn btn--ghost btn--sm" onclick="event.stopPropagation(); Profile.deleteEvent('${e.eventId}')">✕</button>` : ''}
            <div class="timeline__type" style="color:${typeInfo.color};">${typeInfo.icon} ${typeInfo.label}</div>
            <div class="timeline__title">${Utils.escapeHtml(e.title)}</div>
            <div class="timeline__details">${Utils.escapeHtml(e.details)}</div>
            <div class="timeline__date">${Utils.formatDate(e.date)}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderInfoPanel(student) {
    const interests = (student.careerInterests || []);
    return `
      <div class="info-panel" style="margin-bottom:20px;">
        <div class="section-header" style="margin-top:0;"><div class="section-header__title">ℹ️ Details</div></div>
        <div class="info-row"><span class="info-row__label">Date of Birth</span><span class="info-row__value">${Utils.formatDate(student.dateOfBirth)}</span></div>
        <div class="info-row"><span class="info-row__label">Enrollment Date</span><span class="info-row__value">${Utils.formatDate(student.enrollmentDate)}</span></div>
        <div class="info-row"><span class="info-row__label">Contact</span><span class="info-row__value">${Utils.escapeHtml(student.contact || '—')}</span></div>
        <div class="info-row"><span class="info-row__label">Email</span><span class="info-row__value">${Utils.escapeHtml(student.email || '—')}</span></div>
        <div class="info-row"><span class="info-row__label">School/College/Job</span><span class="info-row__value">${Utils.escapeHtml(student.schoolCollegeJob || '—')}</span></div>
      </div>

      <div class="info-panel" style="margin-bottom:20px;">
        <div class="section-header" style="margin-top:0;"><div class="section-header__title">🎯 Career Interests</div></div>
        <div class="tags">
          ${interests.length ? interests.map(t => `<span class="tag">${Utils.escapeHtml(t)}</span>`).join('') : '<span style="color:var(--text-muted);font-size:0.85rem;">None specified</span>'}
        </div>
      </div>

      ${student.programStage === 'alumni' ? `
      <div class="info-panel">
        <div class="section-header" style="margin-top:0;"><div class="section-header__title">🎓 Alumni Outcome</div></div>
        <div class="info-row"><span class="info-row__label">Outcome</span><span class="info-row__value">${Utils.escapeHtml(student.alumniStatus?.outcome || '—')}</span></div>
        <div class="info-row"><span class="info-row__label">Details</span><span class="info-row__value">${Utils.escapeHtml(student.alumniStatus?.details || '—')}</span></div>
      </div>` : ''}
    `;
  }

  function toggleFlag(studentId) {
    const student = DataStore.getStudent(studentId);
    if (!student) return;
    if (student.flagged) {
      DataStore.updateStudent(studentId, { flagged: false, flagReason: '' });
      Utils.showToast('Flag removed', 'success');
    } else {
      const reason = prompt('Reason for flagging (optional):') || 'Manual follow-up flag';
      DataStore.updateStudent(studentId, { flagged: true, flagReason: reason });
      Utils.showToast('Student flagged for follow-up', 'warning');
    }
    render(studentId);
    App.updateFlagBadge();
  }

  function deleteEvent(eventId) {
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      Utils.showToast('Access denied: Only Admins can delete events.', 'error');
      return;
    }
    if (confirm('Delete this event?')) {
      DataStore.deleteEvent(eventId);
      Utils.showToast('Event deleted', 'success');
      render(currentStudentId);
    }
  }

  function confirmDelete(studentId) {
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      Utils.showToast('Access denied: Only Admins can delete students.', 'error');
      return;
    }
    const student = DataStore.getStudent(studentId);
    if (!student) return;
    if (confirm(`Delete ${student.name}? This cannot be undone.`)) {
      DataStore.deleteStudent(studentId);
      Utils.showToast('Student deleted', 'success');
      App.navigate('students');
    }
  }

  return { render, toggleFlag, deleteEvent, confirmDelete };
})();
