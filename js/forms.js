// ============================================
// Ekayan Bridge — Forms (Add/Edit Student, Events)
// ============================================

const Forms = (() => {

  function showModal(title, bodyHtml) {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h3 class="modal__title">${title}</h3>
          <button class="modal__close" onclick="Forms.closeModal()">✕</button>
        </div>
        <div class="modal__body">${bodyHtml}</div>
      </div>
    `;
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--active'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) Forms.closeModal(); });
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('modal-overlay--active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ---- Add Student ----
  function showAddStudent() {
    const html = `
      <form id="add-student-form" onsubmit="Forms.handleAddStudent(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" required placeholder="e.g. Priya Sharma">
          </div>
          <div class="form-group">
            <label>Village *</label>
            <input type="text" name="village" required placeholder="e.g. Rampur">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Contact (Phone)</label>
            <input type="text" name="contact" placeholder="e.g. 9876543210">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="e.g. priya@email.com">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dateOfBirth" onchange="Forms.handleDobChange(this)">
          </div>
          <div class="form-group">
            <label>Enrollment Date</label>
            <input type="date" name="enrollmentDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Gender</label>
            <select name="gender">
              <option value="prefer_not_to_say" selected>Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Marital Status</label>
            <select name="maritalStatus">
              <option value="prefer_not_to_say" selected>Prefer not to say</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Program Stage</label>
            <select name="programStage">
              ${Object.entries(Utils.STAGES).map(([k, v]) => `<option value="${k}" ${k === 'enrolled' ? 'selected' : ''}>${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>School / College / Job</label>
            <input type="text" name="schoolCollegeJob" placeholder="e.g. Class 10 — Govt. School, Rampur">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Course Name</label>
            <input type="text" name="courseName" placeholder="e.g. B.A. English, Diploma in IT">
          </div>
          <div class="form-group">
            <label>Course Year</label>
            <select name="courseYear">
              <option value="" selected>Select Course Year...</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>


        <div class="form-group">
          <label>Career Interests (comma-separated)</label>
          <input type="text" name="careerInterests" placeholder="e.g. Teaching, Social Work, Nursing">
        </div>

        <div class="form-group" style="margin: 20px 0; background:rgba(0,230,118,0.05); padding:12px; border-radius:8px; border:1px solid rgba(0,230,118,0.1);">
          <div style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" name="consentGiven" id="consent-add-chk" style="width:18px; height:18px; cursor:pointer;">
            <label for="consent-add-chk" class="consent-label-text" style="margin:0; cursor:pointer; color:var(--text-primary); font-size:0.85rem;">
              Consent obtained from student for compliance & data processing
            </label>
            <a href="#" onclick="Forms.showPrivacyNotice(event)" style="margin-left: 5px; color: var(--accent); text-decoration: none; font-size: 0.85rem; font-weight: bold;">(ℹ️ View)</a>
          </div>
          
          <div class="parental-consent-fields" style="display: none; margin-top: 12px; border-top: 1px dashed rgba(0,230,118,0.2); padding-top: 12px;">
            <div class="form-row">
              <div class="form-group">
                <label>Parent/Guardian Name *</label>
                <input type="text" name="parentGuardianName" placeholder="e.g. Ramesh Sharma">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Parent/Guardian Contact</label>
                <input type="text" name="parentGuardianContact" placeholder="e.g. 9876500000">
              </div>
              <div class="form-group">
                <label>Relation</label>
                <select name="parentGuardianRelation">
                  <option value="parent" selected>Parent</option>
                  <option value="guardian">Guardian</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Add Student</button>
        </div>
      </form>
    `;
    showModal('Add New Student', html);
  }

  function handleAddStudent(e) {
    e.preventDefault();
    const form = e.target;
    const consent = form.consentGiven.checked;
    
    const data = {
      name: form.name.value.trim(),
      village: form.village.value.trim(),
      contact: form.contact.value.trim(),
      email: form.email.value.trim(),
      dateOfBirth: form.dateOfBirth.value,
      enrollmentDate: form.enrollmentDate.value,
      programStage: form.programStage.value,
      schoolCollegeJob: form.schoolCollegeJob.value.trim(),
      careerInterests: form.careerInterests.value.split(',').map(s => s.trim()).filter(Boolean),
      gender: form.gender.value,
      maritalStatus: form.maritalStatus.value,
      consentGiven: consent,
      consentDate: consent ? new Date().toISOString().split('T')[0] : '',
      parentGuardianName: form.parentGuardianName ? form.parentGuardianName.value.trim() : '',
      parentGuardianContact: form.parentGuardianContact ? form.parentGuardianContact.value.trim() : '',
      parentGuardianRelation: form.parentGuardianRelation ? form.parentGuardianRelation.value : 'parent',
      courseName: form.courseName ? form.courseName.value.trim() : '',
      courseYear: form.courseYear ? form.courseYear.value : ''
    };

    // Duplicate check
    const dup = Utils.checkDuplicate(DataStore.getAllStudents(), data.name, data.village);
    if (dup) {
      if (!confirm(`A student named "${dup.name}" from "${dup.village}" already exists (${dup.id}). Add anyway?`)) return;
    }

    const student = DataStore.createStudent(data);
    closeModal();
    Utils.showToast(`${student.name} added (${student.id})`, 'success');
    App.navigate('profile', student.id);
    App.updateFlagBadge();
  }

  // ---- Edit Student ----
  function showEditStudent(studentId) {
    const s = DataStore.getStudent(studentId);
    if (!s) return;
    const age = Utils.calculateAge(s.dateOfBirth);
    const isMinor = (typeof age === 'number' && age < 18);
    const html = `
      <form id="edit-student-form" onsubmit="Forms.handleEditStudent(event, '${studentId}')">
        <div class="form-row">
          <div class="form-group"><label>Full Name *</label><input type="text" name="name" required value="${Utils.escapeHtml(s.name)}"></div>
          <div class="form-group"><label>Village *</label><input type="text" name="village" required value="${Utils.escapeHtml(s.village)}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Contact</label><input type="text" name="contact" value="${Utils.escapeHtml(s.contact)}"></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" value="${Utils.escapeHtml(s.email)}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" value="${Utils.toInputDate(s.dateOfBirth)}" onchange="Forms.handleDobChange(this)"></div>
          <div class="form-group"><label>Enrollment Date</label><input type="date" name="enrollmentDate" value="${Utils.toInputDate(s.enrollmentDate)}"></div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Gender</label>
            <select name="gender">
              <option value="prefer_not_to_say" ${s.gender === 'prefer_not_to_say' ? 'selected' : ''}>Prefer not to say</option>
              <option value="male" ${s.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="female" ${s.gender === 'female' ? 'selected' : ''}>Female</option>
              <option value="other" ${s.gender === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Marital Status</label>
            <select name="maritalStatus">
              <option value="prefer_not_to_say" ${s.maritalStatus === 'prefer_not_to_say' ? 'selected' : ''}>Prefer not to say</option>
              <option value="single" ${s.maritalStatus === 'single' ? 'selected' : ''}>Single</option>
              <option value="married" ${s.maritalStatus === 'married' ? 'selected' : ''}>Married</option>
              <option value="divorced" ${s.maritalStatus === 'divorced' ? 'selected' : ''}>Divorced</option>
              <option value="widowed" ${s.maritalStatus === 'widowed' ? 'selected' : ''}>Widowed</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>School / College / Job</label><input type="text" name="schoolCollegeJob" value="${Utils.escapeHtml(s.schoolCollegeJob)}"></div>

        <div class="form-row">
          <div class="form-group">
            <label>Course Name</label>
            <input type="text" name="courseName" value="${Utils.escapeHtml(s.courseName || '')}" placeholder="e.g. B.A. English, Diploma in IT">
          </div>
          <div class="form-group">
            <label>Course Year</label>
            <select name="courseYear">
              <option value="" ${s.courseYear === '' ? 'selected' : ''}>Select Course Year...</option>
              <option value="1st Year" ${s.courseYear === '1st Year' ? 'selected' : ''}>1st Year</option>
              <option value="2nd Year" ${s.courseYear === '2nd Year' ? 'selected' : ''}>2nd Year</option>
              <option value="3rd Year" ${s.courseYear === '3rd Year' ? 'selected' : ''}>3rd Year</option>
              <option value="4th Year" ${s.courseYear === '4th Year' ? 'selected' : ''}>4th Year</option>
              <option value="5th Year" ${s.courseYear === '5th Year' ? 'selected' : ''}>5th Year</option>
              <option value="Other" ${s.courseYear === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>


        <div class="form-group"><label>Career Interests (comma-separated)</label><input type="text" name="careerInterests" value="${(s.careerInterests || []).join(', ')}"></div>
        
        ${s.programStage === 'sampark' ? `
        <div class="form-group">
          <label>Alumni Outcome</label>
          <select name="alumniOutcome">
            <option value="" ${!(s.alumniStatus?.outcome) ? 'selected' : ''}>Select Outcome...</option>
            <option value="Employed (Organised)" ${(s.alumniStatus?.outcome === 'Employed (Organised)') ? 'selected' : ''}>Employed (Organised Sector)</option>
            <option value="Employed (Unorganised)" ${(s.alumniStatus?.outcome === 'Employed (Unorganised)') ? 'selected' : ''}>Employed (Unorganised Sector)</option>
            <option value="Entrepreneur" ${(s.alumniStatus?.outcome === 'Entrepreneur') ? 'selected' : ''}>Entrepreneur</option>
            <option value="Higher Education" ${(s.alumniStatus?.outcome === 'Higher Education') ? 'selected' : ''}>Higher Education</option>
            <option value="Other" ${(s.alumniStatus?.outcome === 'Other') ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="form-group"><label>Alumni Details</label><textarea name="alumniDetails">${Utils.escapeHtml(s.alumniStatus?.details || '')}</textarea></div>
        ` : ''}

        ${s.programStage === 'dropped_out' ? `
        <div class="form-row">
          <div class="form-group"><label>Dropout Date</label><input type="date" name="dropoutDate" value="${Utils.toInputDate(s.dropoutDate)}"></div>
          <div class="form-group">
            <label>Dropout Reason</label>
            <select name="dropoutReason">
              <option value="financial" ${s.dropoutReason === 'financial' ? 'selected' : ''}>Financial Constraints</option>
              <option value="academic" ${s.dropoutReason === 'academic' ? 'selected' : ''}>Academic Difficulties</option>
              <option value="family" ${s.dropoutReason === 'family' ? 'selected' : ''}>Family Migration/Issues</option>
              <option value="employment" ${s.dropoutReason === 'employment' ? 'selected' : ''}>Employment/Job Need</option>
              <option value="marriage" ${s.dropoutReason === 'marriage' ? 'selected' : ''}>Marriage</option>
              <option value="other" ${s.dropoutReason === 'other' ? 'selected' : ''}>Other Reason</option>
            </select>
          </div>
        </div>
        ` : ''}

        <div class="form-group" style="margin: 20px 0; background:rgba(0,230,118,0.05); padding:12px; border-radius:8px; border:1px solid rgba(0,230,118,0.1);">
          <div style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" name="consentGiven" id="consent-edit-chk" ${s.consentGiven ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="consent-edit-chk" class="consent-label-text" style="margin:0; cursor:pointer; color:var(--text-primary); font-size:0.85rem;">
              ${isMinor ? 'Verifiable Parental/Guardian Consent obtained for compliance & data processing' : 'Consent obtained from student for compliance & data processing'}
            </label>
            <a href="#" onclick="Forms.showPrivacyNotice(event)" style="margin-left: 5px; color: var(--accent); text-decoration: none; font-size: 0.85rem; font-weight: bold;">(ℹ️ View)</a>
          </div>
          
          <div class="parental-consent-fields" style="display: ${isMinor ? 'block' : 'none'}; margin-top: 12px; border-top: 1px dashed rgba(0,230,118,0.2); padding-top: 12px;">
            <div class="form-row">
              <div class="form-group">
                <label>Parent/Guardian Name *</label>
                <input type="text" name="parentGuardianName" value="${Utils.escapeHtml(s.parentGuardianName || '')}" ${isMinor ? 'required' : ''} placeholder="e.g. Ramesh Sharma">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Parent/Guardian Contact</label>
                <input type="text" name="parentGuardianContact" value="${Utils.escapeHtml(s.parentGuardianContact || '')}" placeholder="e.g. 9876500000">
              </div>
              <div class="form-group">
                <label>Relation</label>
                <select name="parentGuardianRelation">
                  <option value="parent" ${s.parentGuardianRelation === 'parent' ? 'selected' : ''}>Parent</option>
                  <option value="guardian" ${s.parentGuardianRelation === 'guardian' ? 'selected' : ''}>Guardian</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Save Changes</button>
        </div>
      </form>
    `;
    showModal('Edit Student Details', html);
  }

  function handleEditStudent(e, studentId) {
    e.preventDefault();
    const form = e.target;
    const consent = form.consentGiven.checked;
    
    const updates = {
      name: form.name.value.trim(),
      village: form.village.value.trim(),
      contact: form.contact.value.trim(),
      email: form.email.value.trim(),
      dateOfBirth: form.dateOfBirth.value,
      enrollmentDate: form.enrollmentDate.value,
      schoolCollegeJob: form.schoolCollegeJob.value.trim(),
      careerInterests: form.careerInterests.value.split(',').map(s => s.trim()).filter(Boolean),
      gender: form.gender.value,
      maritalStatus: form.maritalStatus.value,
      consentGiven: consent,
      consentDate: consent ? (DataStore.getStudent(studentId).consentDate || new Date().toISOString().split('T')[0]) : '',
      parentGuardianName: form.parentGuardianName ? form.parentGuardianName.value.trim() : '',
      parentGuardianContact: form.parentGuardianContact ? form.parentGuardianContact.value.trim() : '',
      parentGuardianRelation: form.parentGuardianRelation ? form.parentGuardianRelation.value : 'parent',
      courseName: form.courseName ? form.courseName.value.trim() : '',
      courseYear: form.courseYear ? form.courseYear.value : ''
    };

    if (form.alumniOutcome) {
      updates.alumniStatus = { outcome: form.alumniOutcome.value.trim(), details: form.alumniDetails.value.trim() };
    }

    if (form.dropoutDate) {
      updates.dropoutDate = form.dropoutDate.value;
      updates.dropoutReason = form.dropoutReason.value;
    }

    DataStore.updateStudent(studentId, updates);
    closeModal();
    Utils.showToast('Student details updated', 'success');
    Profile.render(studentId);
  }

  // ---- Add Event ----
  function showAddEvent(studentId) {
    const html = `
      <form id="add-event-form" onsubmit="Forms.handleAddEvent(event, '${studentId}')">
        <div class="form-row">
          <div class="form-group">
            <label>Event Type</label>
            <select name="type">
              ${Object.entries(Utils.EVENT_TYPES).filter(([k]) => k !== 'stage_change').map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label>Title *</label>
          <input type="text" name="title" required placeholder="e.g. English Communication Workshop">
        </div>
        <div class="form-group">
          <label>Details</label>
          <textarea name="details" placeholder="Add notes, scores, observations..."></textarea>
        </div>
        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Add Event</button>
        </div>
      </form>
    `;
    showModal('Add Timeline Event', html);
  }

  function handleAddEvent(e, studentId) {
    e.preventDefault();
    const form = e.target;
    DataStore.addEvent({
      studentId,
      type: form.type.value,
      date: form.date.value,
      title: form.title.value.trim(),
      details: form.details.value.trim()
    });
    closeModal();
    Utils.showToast('Event added to timeline', 'success');
    Profile.render(studentId);
  }

  // ---- Change Stage ----
  function showChangeStage(studentId) {
    const s = DataStore.getStudent(studentId);
    if (!s) return;
    const html = `
      <form id="change-stage-form" onsubmit="Forms.handleChangeStage(event, '${studentId}')">
        <div class="form-group">
          <label>Current Stage</label>
          <div style="padding:10px;font-size:1rem;">${Utils.STAGES[s.programStage]?.icon || '📋'} ${Utils.STAGES[s.programStage]?.label || s.programStage}</div>
        </div>
        <div class="form-group">
          <label>New Stage</label>
          <select name="newStage" id="change-stage-select">
            ${Object.entries(Utils.STAGES).filter(([k]) => k !== s.programStage).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group" id="alumni-fields" style="display:none;">
          <label>Alumni Outcome</label>
          <select name="alumniOutcome">
            <option value="" ${!(s.alumniStatus?.outcome) ? 'selected' : ''}>Select Outcome...</option>
            <option value="Employed (Organised)" ${(s.alumniStatus?.outcome === 'Employed (Organised)') ? 'selected' : ''}>Employed (Organised Sector)</option>
            <option value="Employed (Unorganised)" ${(s.alumniStatus?.outcome === 'Employed (Unorganised)') ? 'selected' : ''}>Employed (Unorganised Sector)</option>
            <option value="Entrepreneur" ${(s.alumniStatus?.outcome === 'Entrepreneur') ? 'selected' : ''}>Entrepreneur</option>
            <option value="Higher Education" ${(s.alumniStatus?.outcome === 'Higher Education') ? 'selected' : ''}>Higher Education</option>
            <option value="Other" ${(s.alumniStatus?.outcome === 'Other') ? 'selected' : ''}>Other</option>
          </select>
          <label style="margin-top:10px;">Details</label>
          <textarea name="alumniDetails" placeholder="Details about placement or next steps...">${Utils.escapeHtml(s.alumniStatus?.details || '')}</textarea>
        </div>

        <div class="form-group" id="dropout-fields" style="display:none;">
          <div class="form-row">
            <div class="form-group">
              <label>Dropout Date *</label>
              <input type="date" name="dropoutDate" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Dropout Reason *</label>
              <select name="dropoutReason">
                <option value="financial">Financial Constraints</option>
                <option value="academic">Academic Difficulties</option>
                <option value="family">Family Migration/Issues</option>
                <option value="employment">Employment/Job Need</option>
                <option value="marriage">Marriage</option>
                <option value="other">Other Reason</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea name="notes" placeholder="Reason for stage change..."></textarea>
        </div>
        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Change Stage</button>
        </div>
      </form>
    `;
    showModal('Change Program Stage', html);

    // Show/hide fields dynamically depending on selection
    setTimeout(() => {
      const sel = document.getElementById('change-stage-select');
      const alumniFields = document.getElementById('alumni-fields');
      const dropoutFields = document.getElementById('dropout-fields');
      if (sel && alumniFields && dropoutFields) {
        const toggle = () => {
          alumniFields.style.display = sel.value === 'sampark' ? 'block' : 'none';
          dropoutFields.style.display = sel.value === 'dropped_out' ? 'block' : 'none';
        };
        sel.addEventListener('change', toggle);
        toggle();
      }
    }, 50);
  }

  function handleChangeStage(e, studentId) {
    e.preventDefault();
    const form = e.target;
    const newStage = form.newStage.value;
    const oldStage = DataStore.getStudent(studentId).programStage;

    const updates = { programStage: newStage };
    if (newStage === 'sampark' && form.alumniOutcome) {
      updates.alumniStatus = { outcome: form.alumniOutcome.value.trim(), details: form.alumniDetails.value.trim() };
      updates.dropoutDate = '';
      updates.dropoutReason = '';
    } else if (newStage === 'dropped_out' && form.dropoutDate) {
      updates.dropoutDate = form.dropoutDate.value;
      updates.dropoutReason = form.dropoutReason.value;
      updates.alumniStatus = { outcome: '', details: '' };
    } else {
      updates.dropoutDate = '';
      updates.dropoutReason = '';
      updates.alumniStatus = { outcome: '', details: '' };
    }
    updates.isActive = (newStage !== 'sampark' && newStage !== 'dropped_out');

    DataStore.updateStudent(studentId, updates);

    // Log stage change as timeline event
    DataStore.addEvent({
      studentId,
      type: 'stage_change',
      title: `${Utils.STAGES[oldStage]?.label || oldStage} → ${Utils.STAGES[newStage]?.label || newStage}`,
      details: form.notes.value.trim() || `Stage changed from ${Utils.STAGES[oldStage]?.label || oldStage} to ${Utils.STAGES[newStage]?.label || newStage}`,
      date: new Date().toISOString()
    });

    closeModal();
    Utils.showToast(`Stage changed to ${Utils.STAGES[newStage]?.label}`, 'success');
    Profile.render(studentId);
    App.updateFlagBadge();
  }

  // ---- Add Assessment ----
  function showAddAssessment(studentId) {
    const html = `
      <form id="add-assessment-form" onsubmit="Forms.handleAddAssessment(event, '${studentId}')">
        <div class="form-row">
          <div class="form-group">
            <label>Assessment Type *</label>
            <input type="text" name="type" required placeholder="e.g. Mid-term, Math Placement, English Oral">
          </div>
          <div class="form-group">
            <label>Date *</label>
            <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label>Score / Result *</label>
          <input type="text" name="score" required placeholder="e.g. 85/100, Grade A, Pass">
        </div>
        <div class="form-group">
          <label>Remarks / Notes</label>
          <textarea name="remarks" placeholder="Add observations, areas of improvement..."></textarea>
        </div>
        <div class="form-group">
          <label>Report Attachment (PDF or Image, max 1.5MB)</label>
          <input type="file" id="assessment-attachment" accept=".pdf,image/*">
          <div id="file-error" style="color:var(--danger); font-size:0.8rem; margin-top:4px; display:none;">File size exceeds 1.5MB limit. Please compress/resize.</div>
        </div>
        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Save Assessment</button>
        </div>
      </form>
    `;
    showModal('Add Assessment Report', html);
  }

  function handleAddAssessment(e, studentId) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('assessment-attachment');
    const fileError = document.getElementById('file-error');
    
    const assessmentData = {
      type: form.type.value.trim(),
      date: form.date.value,
      score: form.score.value.trim(),
      remarks: form.remarks.value.trim(),
      fileName: '',
      fileData: ''
    };
    
    const processSave = () => {
      DataStore.addAssessment(studentId, assessmentData);
      closeModal();
      Utils.showToast('Assessment report added successfully', 'success');
      Profile.render(studentId);
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      
      if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${studentId}/${Date.now()}.${fileExt}`;
        
        Utils.showToast('Uploading report...', 'info');
        
        supabaseClient.storage
          .from('assessment-reports')
          .upload(filePath, file)
          .then(({ data, error }) => {
            if (error) {
              Utils.showToast('Upload failed: ' + error.message, 'error');
              return;
            }
            
            const { data: { publicUrl } } = supabaseClient.storage
              .from('assessment-reports')
              .getPublicUrl(filePath);

            assessmentData.fileName = file.name;
            assessmentData.fileData = publicUrl;
            processSave();
          })
          .catch(err => {
            Utils.showToast('Upload failed: ' + err.message, 'error');
          });
      } else {
        if (file.size > 1.5 * 1024 * 1024) {
          if (fileError) fileError.style.display = 'block';
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(evt) {
          assessmentData.fileName = file.name;
          assessmentData.fileData = evt.target.result; // Base64 data URL
          processSave();
        };
        reader.readAsDataURL(file);
      }
    } else {
      processSave();
    }
  }

  // ---- Follow-Up Settings ----
  function showFollowUpModal(studentId) {
    const s = DataStore.getStudent(studentId);
    if (!s) return;
    
    const html = `
      <form id="follow-up-form" onsubmit="Forms.handleFollowUp(event, '${studentId}')">
        <div class="form-group" style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
          <input type="checkbox" id="follow-up-required" name="followUpRequired" ${s.followUpRequired ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
          <label for="follow-up-required" style="margin:0; font-weight:600; cursor:pointer;">Follow-Up Required</label>
        </div>
        
        <div id="follow-up-details" style="display: ${s.followUpRequired ? 'block' : 'none'};">
          <div class="form-row">
            <div class="form-group">
              <label>Assigned Staff Member</label>
              <input type="text" name="assignedTo" value="${Utils.escapeHtml(s.followUpAssignedTo || '')}" placeholder="e.g. Rahul, Priya">
            </div>
            <div class="form-group">
              <label>Target Follow-Up Date</label>
              <input type="date" name="followUpDate" value="${Utils.toInputDate(s.followUpDate)}">
            </div>
          </div>
          <div class="form-group">
            <label>Follow-Up Notes</label>
            <textarea name="notes" placeholder="Reason for follow-up, expected actions...">${Utils.escapeHtml(s.followUpNotes || '')}</textarea>
          </div>
        </div>
        
        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Save Follow-Up Status</button>
        </div>
      </form>
    `;
    showModal('Follow-Up Settings', html);
    
    // Toggle details section visibility based on checkbox status
    setTimeout(() => {
      const chk = document.getElementById('follow-up-required');
      const details = document.getElementById('follow-up-details');
      if (chk && details) {
        chk.addEventListener('change', () => {
          details.style.display = chk.checked ? 'block' : 'none';
        });
      }
    }, 50);
  }

  function handleDobChange(input) {
    const dobVal = input.value;
    const age = Utils.calculateAge(dobVal);
    const form = input.closest('form');
    if (!form) return;

    const parentalFields = form.querySelector('.parental-consent-fields');
    const consentLabel = form.querySelector('.consent-label-text');
    
    if (parentalFields && consentLabel) {
      if (typeof age === 'number' && age < 18) {
        parentalFields.style.display = 'block';
        const nameInput = parentalFields.querySelector('input[name="parentGuardianName"]');
        if (nameInput) nameInput.required = true;
        consentLabel.innerHTML = 'Verifiable Parental/Guardian Consent obtained for compliance & data processing';
      } else {
        parentalFields.style.display = 'none';
        const nameInput = parentalFields.querySelector('input[name="parentGuardianName"]');
        if (nameInput) nameInput.required = false;
        consentLabel.innerHTML = 'Consent obtained from student for compliance & data processing';
      }
    }
  }

  function showPrivacyNotice(e) {
    if (e) e.preventDefault();
    const noticeHtml = `
      <div style="font-size:0.95rem; line-height:1.6; color:var(--text-secondary);">
        <p><strong>Ekayan Foundation Data Privacy & Compliance Notice</strong></p>
        <p>We collect and process student personal data (such as name, contact details, date of birth, village, academic scores, and career outcomes) strictly for the following purposes:</p>
        <ul style="padding-left: 20px; margin: 10px 0;">
          <li>Monitoring student academic growth and program progression.</li>
          <li>Providing career counseling, mentorship, and fellowship assistance.</li>
          <li>Tracking alumni employment outcomes (organised/unorganised sector, entrepreneurship).</li>
          <li>Assisting with external scholarship coordination.</li>
        </ul>
        <p>All data is stored securely in our database. We do not share student personal information with external third parties without prior authorization. Under the <strong>DPDP Act 2023</strong>, you have the right to request access to, correction of, or erasure of your personal data at any time.</p>
        <div style="display:flex; justify-content:flex-end; margin-top:20px;">
          <button class="btn btn--primary" onclick="document.getElementById('dialog-overlay-notice').remove();">Close Notice</button>
        </div>
      </div>
    `;
    
    let overlay = document.getElementById('dialog-overlay-notice');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'dialog-overlay-notice';
      overlay.className = 'modal-overlay modal-overlay--active';
      overlay.style.zIndex = '10001';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="modal" style="max-width: 500px; border-top: 4px solid var(--accent); z-index: 10002;">
        <h3 class="modal__title" style="margin-bottom:15px; color:var(--text-primary);">Data Privacy Notice</h3>
        ${noticeHtml}
      </div>
    `;
  }

  function handleFollowUp(e, studentId) {
    e.preventDefault();
    const form = e.target;
    const required = form.followUpRequired.checked;
    
    const updates = {
      followUpRequired: required,
      followUpAssignedTo: required ? form.assignedTo.value.trim() : '',
      followUpDate: required ? form.followUpDate.value : '',
      followUpNotes: required ? form.notes.value.trim() : ''
    };
    
    DataStore.updateStudent(studentId, updates);
    closeModal();
    Utils.showToast(required ? 'Follow-up status active' : 'Follow-up resolved', 'success');
    Profile.render(studentId);
  }

  function showRotateMasterKey() {
    const html = `
      <form id="rotate-key-form" onsubmit="Forms.handleRotateMasterKey(event)">
        <div style="background:rgba(255,165,2,0.1); border:1px solid rgba(255,165,2,0.3); border-radius:8px; padding:12px; margin-bottom:16px; font-size:0.85rem; color:#fbc531; line-height:1.4;">
          ⚠️ <strong>Master Key Rotation</strong><br>
          This will re-encrypt all student records in Supabase with the new Master Key. All staff members must use the new key on their next login.
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:6px;">Current Master Key *</label>
          <div style="position:relative; display:flex; align-items:center;">
            <input type="password" name="currentKey" id="rotate-current-key" required placeholder="Enter active key" style="width:100%; padding:10px 40px 10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:6px; color:var(--text-primary); font-size:0.9rem;">
            <button type="button" onclick="const i=document.getElementById('rotate-current-key'); i.type = i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁️':'🙈';" style="position:absolute; right:10px; background:none; border:none; cursor:pointer; font-size:1rem; opacity:0.7; padding:2px;">👁️</button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:14px;">
          <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:6px;">New Master Key (min. 6 characters) *</label>
          <div style="position:relative; display:flex; align-items:center;">
            <input type="password" name="newKey" id="rotate-new-key" required minlength="6" placeholder="Enter new secret key" style="width:100%; padding:10px 40px 10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:6px; color:var(--text-primary); font-size:0.9rem;">
            <button type="button" onclick="const i=document.getElementById('rotate-new-key'); i.type = i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁️':'🙈';" style="position:absolute; right:10px; background:none; border:none; cursor:pointer; font-size:1rem; opacity:0.7; padding:2px;">👁️</button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:20px;">
          <label style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:6px;">Confirm New Master Key *</label>
          <div style="position:relative; display:flex; align-items:center;">
            <input type="password" name="confirmNewKey" id="rotate-confirm-key" required minlength="6" placeholder="Re-type new secret key" style="width:100%; padding:10px 40px 10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:6px; color:var(--text-primary); font-size:0.9rem;">
            <button type="button" onclick="const i=document.getElementById('rotate-confirm-key'); i.type = i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁️':'🙈';" style="position:absolute; right:10px; background:none; border:none; cursor:pointer; font-size:1rem; opacity:0.7; padding:2px;">👁️</button>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary" id="btn-submit-rotate-key" style="background:linear-gradient(135deg, #f59e0b, #d97706);">
            🔐 Re-encrypt & Rotate Key
          </button>
        </div>
      </form>
    `;
    showModal('🔑 Rotate Master Encryption Key', html);
  }

  async function handleRotateMasterKey(e) {
    e.preventDefault();
    const form = e.target;
    const currentKey = form.currentKey.value;
    const newKey = form.newKey.value;
    const confirmNewKey = form.confirmNewKey.value;

    if (newKey !== confirmNewKey) {
      Utils.showToast('New keys do not match. Please re-enter.', 'error');
      return;
    }

    if (newKey === currentKey) {
      Utils.showToast('New key must be different from current key.', 'error');
      return;
    }

    const btn = document.getElementById('btn-submit-rotate-key');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Rotating & Encrypting...';
    }

    try {
      const count = await DataStore.rotateMasterKey(currentKey, newKey);
      closeModal();
      Utils.showToast(`✅ Key rotated! ${count} records re-encrypted with the new key.`, 'success');
    } catch (err) {
      Utils.showToast(err.message || 'Key rotation failed.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔐 Re-encrypt & Rotate Key';
      }
    }
  }

  return {
    showModal, closeModal,
    showAddStudent, handleAddStudent,
    showEditStudent, handleEditStudent,
    showAddEvent, handleAddEvent,
    showChangeStage, handleChangeStage,
    showAddAssessment, handleAddAssessment,
    showFollowUpModal, handleFollowUp,
    handleDobChange, showPrivacyNotice,
    showRotateMasterKey, handleRotateMasterKey
  };
})();
