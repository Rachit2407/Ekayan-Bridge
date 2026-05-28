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
          <button class="btn btn--sm ${student.followUpRequired ? 'btn--warning' : ''}" onclick="Forms.showFollowUpModal('${student.id}')">⚠️ Follow-Up</button>
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

      ${student.flagged ? `<div class="alert-item" style="margin-bottom:12px;"><span class="alert-item__icon">🚩</span><span class="alert-item__text"><strong>Flagged:</strong> ${Utils.escapeHtml(student.flagReason || 'Needs follow-up')}</span></div>` : ''}

      ${student.followUpRequired ? `
        <div class="alert-item" style="margin-bottom:20px; border-left: 4px solid var(--warning); background: rgba(253, 203, 110, 0.1);">
          <span class="alert-item__icon">⚠️</span>
          <span class="alert-item__text" style="color: var(--text-primary);">
            <strong>Follow-Up Required:</strong> ${Utils.escapeHtml(student.followUpNotes || 'No notes provided.')}<br>
            <span style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px; display:block;">
              Assigned to: <strong>${Utils.escapeHtml(student.followUpAssignedTo || 'Unassigned')}</strong> | Target Date: <strong>${Utils.formatDate(student.followUpDate)}</strong>
            </span>
          </span>
        </div>
      ` : ''}

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
          ${renderAssessmentsPanel(student)}
        </div>
      </div>
    `;
  }

  function renderJourneyMap(student) {
    const stages = ['enrolled', 'neev', 'disha', 'nirmaan', 'sampark'];
    const currentIndex = stages.indexOf(student.programStage);
    const isDropped = student.programStage === 'dropped_out';

    let html = '<div class="journey-map">';
    stages.forEach((stage, i) => {
      const info = Utils.STAGES[stage] || { label: stage, color: '#888', icon: '📋' };
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

      ${student.programStage === 'sampark' ? `
      <div class="info-panel" style="margin-bottom:20px;">
        <div class="section-header" style="margin-top:0;"><div class="section-header__title">🤝 Alumni Outcome</div></div>
        <div class="info-row"><span class="info-row__label">Outcome</span><span class="info-row__value">${Utils.escapeHtml(student.alumniStatus?.outcome || '—')}</span></div>
        <div class="info-row"><span class="info-row__label">Details</span><span class="info-row__value">${Utils.escapeHtml(student.alumniStatus?.details || '—')}</span></div>
      </div>` : ''}
    `;
  }

  function renderAssessmentsPanel(student) {
    const assessments = student.assessments || [];
    const sorted = [...assessments].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = `
      <div class="info-panel" style="margin-bottom:20px;">
        <div class="section-header" style="margin-top:0; display:flex; justify-content:space-between; align-items:center;">
          <div class="section-header__title">📝 Assessments</div>
          <button class="btn btn--primary btn--sm" onclick="Forms.showAddAssessment('${student.id}')">+ Add</button>
        </div>
    `;
    
    if (sorted.length === 0) {
      html += `<div style="color:var(--text-secondary); font-size:0.85rem; padding:8px 0;">No assessment reports recorded yet.</div>`;
    } else {
      html += `<div class="assessments-list" style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">`;
      sorted.forEach(asm => {
        html += `
          <div class="assessment-item" style="border-left: 3px solid var(--primary); padding-left:10px; padding-bottom:8px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
               <div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">${Utils.escapeHtml(asm.type)}</div>
               <div style="font-size:0.8rem; color:var(--text-muted);">${Utils.formatDate(asm.date)}</div>
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">Result/Score: <strong style="color:var(--primary);">${Utils.escapeHtml(asm.score)}</strong></div>
            ${asm.remarks ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; font-style:italic;">"${Utils.escapeHtml(asm.remarks)}"</div>` : ''}
            ${asm.fileData ? `
              <div style="margin-top:6px; display:flex; align-items:center; gap:6px;">
                <span style="font-size:0.8rem;">📎</span>
                <a href="${asm.fileData}" download="${Utils.escapeHtml(asm.fileName || 'report')}" class="link" style="font-size:0.8rem; text-decoration:underline;">
                  Download ${Utils.escapeHtml(asm.fileName || 'Report')}
                </a>
              </div>
            ` : ''}
          </div>
        `;
      });
      html += `</div>`;
    }
    
    html += `</div>`;
    return html;
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
