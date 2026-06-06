// ============================================
// Ekayan Bridge — Student Profile View
// ============================================

const Profile = (() => {

  function render(studentId) {
    const student = DataStore.getStudent(studentId);
    if (!student) {
      document.getElementById('app-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__text">Student not found</div>
          <button class="btn btn--primary" onclick="App.navigate('students')">Back to Students</button>
        </div>
      `;
      return;
    }

    const events = DataStore.getStudentEvents(studentId);
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
      <div class="profile-grid">
        <!-- Left Column: Header, Info, Stats -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <div id="profile-header-container"></div>
          <div id="profile-info-container"></div>
          <div id="profile-assessments-container"></div>
        </div>
        
        <!-- Right Column: Timeline & Notes -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          <div id="profile-followup-container"></div>
          <div id="profile-timeline-container"></div>
        </div>
      </div>
    `;

    renderHeader(student);
    renderInfoPanel(student);
    renderAssessmentsPanel(student);
    renderFollowUpPanel(student);
    renderTimeline(student, events);
  }

  function renderHeader(s) {
    const container = document.getElementById('profile-header-container');
    if (!container) return;

    const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const stage = Utils.STAGES[s.programStage] || { label: s.programStage, color: '#95a5a6', icon: '📋' };
    
    // Check role for actions visibility
    const currentUser = DataStore.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-header__avatar">
          ${s.photo ? `<img src="${s.photo}" alt="${Utils.escapeHtml(s.name)}">` : initials}
        </div>
        <div class="profile-header__details">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <h2 class="profile-header__name">${Utils.escapeHtml(s.name)}</h2>
            <span class="stage-tag" style="background:${stage.color}; font-size:0.8rem; padding:4px 8px; border-radius:12px; color:#fff; font-weight:600;">
              ${stage.icon} ${stage.label}
            </span>
            ${s.flagged ? `<span class="badge badge--danger" title="Flagged: ${Utils.escapeHtml(s.flagReason)}">🚩 Flagged</span>` : ''}
          </div>
          <p class="profile-header__id">ID: ${s.id} • Registered: ${Utils.formatDate(s.enrollmentDate)}</p>
        </div>
        <div class="profile-header__actions">
          <button class="btn btn--secondary" onclick="Forms.showEditStudent('${s.id}')">✏️ Edit Details</button>
          ${isAdmin ? `<button class="btn btn--danger" onclick="Profile.handleDelete('${s.id}')">🗑️ Delete Student</button>` : ''}
        </div>
      </div>
    `;
  }

  function renderInfoPanel(s) {
    const container = document.getElementById('profile-info-container');
    if (!container) return;

    const currentUser = DataStore.getCurrentUser();
    const isStaff = currentUser && currentUser.role === 'staff';

    // Mask sensitive fields if the current user is a regular staff member
    const displayContact = isStaff ? Utils.maskContact(s.contact) : s.contact;
    const displayEmail = isStaff ? Utils.maskEmail(s.email) : s.email;
    const displayDob = isStaff ? Utils.maskDateOfBirth(s.dateOfBirth) : s.dateOfBirth;

    // Consent Badge
    const consentBadgeHtml = s.consentGiven
      ? `<span class="consent-shield" title="Consent Date: ${s.consentDate ? Utils.formatDate(s.consentDate) : 'N/A'}">🛡️ Consent Active</span>`
      : `<span class="consent-shield consent-shield--revoked" title="Compliance Warning: No privacy consent signed.">⚠️ No Signed Consent</span>`;



    let dropoutHtml = '';
    if (s.programStage === 'dropped_out' && s.dropoutDate) {
      const reasonLabel = {
        financial: 'Financial Constraints',
        academic: 'Academic Difficulties',
        family: 'Family Issues/Migration',
        employment: 'Employment/Job Needed',
        marriage: 'Marriage',
        other: 'Other/Unspecified'
      }[s.dropoutReason] || s.dropoutReason || 'Other';
      
      dropoutHtml = `
        <div style="margin-top:16px; padding:12px; background:rgba(255,71,87,0.05); border:1px solid rgba(255,71,87,0.1); border-radius:8px;">
          <div style="font-weight:600; color:var(--danger); font-size:0.85rem; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
            <span>⚠️ Dropout Logged:</span>
          </div>
          <div style="font-size:0.85rem; color:var(--text-secondary);">
            Date: <strong>${Utils.formatDate(s.dropoutDate)}</strong><br>
            Reason: <strong>${Utils.escapeHtml(reasonLabel)}</strong>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
          <h3 class="card__title" style="margin:0;">📋 Student Information</h3>
          ${consentBadgeHtml}
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-item__label">Village</span>
            <span class="info-item__value">${Utils.escapeHtml(s.village || 'Not specified')}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Contact Number</span>
            <span class="info-item__value">${Utils.escapeHtml(displayContact || 'Not specified')}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Email Address</span>
            <span class="info-item__value">${Utils.escapeHtml(displayEmail || 'Not specified')}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Date of Birth (Age)</span>
            <span class="info-item__value">
              ${displayDob ? `${Utils.escapeHtml(displayDob)} (${Utils.calculateAge(s.dateOfBirth)} yrs)` : 'Not specified'}
            </span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Gender</span>
            <span class="info-item__value" style="text-transform: capitalize;">${s.gender ? Utils.escapeHtml(s.gender).replace(/_/g, ' ') : 'Not specified'}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Marital Status</span>
            <span class="info-item__value" style="text-transform: capitalize;">${s.maritalStatus ? Utils.escapeHtml(s.maritalStatus).replace(/_/g, ' ') : 'Not specified'}</span>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <span class="info-item__label">Current Institution / Job Role</span>
            <span class="info-item__value">${Utils.escapeHtml(s.schoolCollegeJob || 'Not specified')}</span>
          </div>
          <div class="info-item" style="grid-column: span 2;">
            <span class="info-item__label">Career Interests</span>
            <div style="margin-top: 6px; display:flex; gap:6px; flex-wrap:wrap;">
              ${(s.careerInterests || []).map(interest => `<span class="interest-tag">${Utils.escapeHtml(interest)}</span>`).join('') || '<span style="color:var(--text-muted); font-size:0.85rem;">None listed</span>'}
            </div>
          </div>
        </div>

        ${dropoutHtml}

        ${s.programStage === 'sampark' && s.alumniStatus ? `
        <div style="margin-top:16px; padding:12px; background:rgba(0,230,118,0.05); border:1px solid rgba(0,230,118,0.1); border-radius:8px;">
          <div style="font-weight:600; color:var(--success); font-size:0.85rem; margin-bottom:4px;">🎓 Alumni Outcome: ${Utils.escapeHtml(s.alumniStatus.outcome)}</div>
          <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">${Utils.escapeHtml(s.alumniStatus.details || 'No details added.')}</p>
        </div>
        ` : ''}
      </div>
    `;
  }

  function renderAssessmentsPanel(s) {
    const container = document.getElementById('profile-assessments-container');
    if (!container) return;

    const list = s.assessments || [];
    let listHtml = '';
    
    if (list.length === 0) {
      listHtml = '<div style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:12px;">No assessments recorded.</div>';
    } else {
      listHtml = list.map(a => `
        <div style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div>
            <div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">${Utils.escapeHtml(a.type)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${Utils.formatDate(a.date)}</div>
            ${a.remarks ? `<div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">"${Utils.escapeHtml(a.remarks)}"</div>` : ''}
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
            <div class="badge" style="background:rgba(253,203,110,0.1); color:var(--warning); font-size:0.85rem; border:none; padding:4px 10px;">${Utils.escapeHtml(a.score)}</div>
            ${a.fileData ? `<a href="${a.fileData}" download="${a.fileName || 'Report'}" style="font-size:0.75rem; color:var(--accent); text-decoration:none;">💾 Attachment</a>` : ''}
          </div>
        </div>
      `).join('');
    }

    container.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
          <h3 class="card__title" style="margin:0;">📝 Assessment Reports</h3>
          <button class="btn btn--small" onclick="Forms.showAddAssessment('${s.id}')">+ Add Assessment</button>
        </div>
        <div style="max-height:300px; overflow-y:auto;">
          ${listHtml}
        </div>
      </div>
    `;
  }

  function renderFollowUpPanel(s) {
    const container = document.getElementById('profile-followup-container');
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="border-left:4px solid ${s.followUpRequired ? 'var(--warning)' : 'var(--border)'};">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 class="card__title" style="margin:0; display:flex; align-items:center; gap:8px;">
              <span>Follow-Up Action</span>
              <span class="badge" style="background:${s.followUpRequired ? 'rgba(253,203,110,0.1)' : 'rgba(255,255,255,0.05)'}; color:${s.followUpRequired ? 'var(--warning)' : 'var(--text-muted)'}; border:none;">
                ${s.followUpRequired ? 'ACTIVE' : 'NONE'}
              </span>
            </h3>
            ${s.followUpRequired ? `
              <p style="font-size:0.85rem; color:var(--text-secondary); margin: 8px 0 0 0;">
                Assigned to: <strong>${Utils.escapeHtml(s.followUpAssignedTo || 'Unassigned')}</strong><br>
                Target Date: <strong>${s.followUpDate ? Utils.formatDate(s.followUpDate) : 'Not specified'}</strong><br>
                Reason: <em style="color:var(--text-muted);">"${Utils.escapeHtml(s.followUpNotes || '')}"</em>
              </p>
            ` : `<p style="font-size:0.8rem; color:var(--text-muted); margin: 6px 0 0 0;">No follow-up action required at this stage.</p>`}
          </div>
          <button class="btn btn--secondary" onclick="Forms.showFollowUpModal('${s.id}')">Configure</button>
        </div>
      </div>
    `;
  }

  function renderTimeline(s, events) {
    const container = document.getElementById('profile-timeline-container');
    if (!container) return;

    const currentUser = DataStore.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    let timelineHtml = '';
    if (events.length === 0) {
      timelineHtml = `
        <div class="empty-state" style="padding:24px 0;">
          <div class="empty-state__icon">📌</div>
          <div class="empty-state__text">Timeline is empty. Log an event to start tracking progress.</div>
        </div>
      `;
    } else {
      timelineHtml = events.map(e => {
        const typeInfo = Utils.EVENT_TYPES[e.type] || { icon: '📌', label: e.type, color: 'var(--text-secondary)' };
        return `
          <div class="timeline-item">
            <div class="timeline-item__badge" style="background: ${typeInfo.color || 'var(--border)'}; font-size: 0.9rem;">
              ${typeInfo.icon}
            </div>
            <div class="timeline-item__card">
              <div class="timeline-item__header">
                <span class="timeline-item__title">${Utils.escapeHtml(e.title)}</span>
                <span class="timeline-item__date">${Utils.formatDate(e.date)}</span>
              </div>
              <div class="timeline-item__details">
                ${Utils.escapeHtml(e.details || '')}
              </div>
              <div class="timeline-item__footer">
                <span style="font-size:0.75rem; color:var(--text-muted);">Logged ${Utils.timeAgo(e.createdAt)}</span>
                ${isAdmin ? `<button class="btn-text btn-text--danger" onclick="Profile.handleDeleteEvent('${e.eventId}', '${s.id}')" style="margin-left:auto; font-size:0.75rem;">Delete</button>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
          <h3 class="card__title" style="margin:0;">📌 Journey Map & Timeline</h3>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--small btn--secondary" onclick="Forms.showChangeStage('${s.id}')">🔄 Change Stage</button>
            <button class="btn btn--small" onclick="Forms.showAddEvent('${s.id}')">+ Add Note</button>
          </div>
        </div>
        <div class="timeline">
          ${timelineHtml}
        </div>
      </div>
    `;
  }

  function handleDelete(studentId) {
    if (confirm('CRITICAL: Are you sure you want to permanently delete this student record? This action will also delete all associated assessments and timeline events, and cannot be undone.')) {
      DataStore.deleteStudent(studentId);
      Utils.showToast('Student record deleted.', 'info');
      App.navigate('students');
      App.updateFlagBadge();
    }
  }

  function handleDeleteEvent(eventId, studentId) {
    if (confirm('Are you sure you want to delete this event from the student timeline?')) {
      DataStore.deleteEvent(eventId);
      Utils.showToast('Timeline event deleted.', 'info');
      render(studentId);
    }
  }

  return { render, handleDelete, handleDeleteEvent };
})();
