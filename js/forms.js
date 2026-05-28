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
            <input type="date" name="dateOfBirth">
          </div>
          <div class="form-group">
            <label>Enrollment Date</label>
            <input type="date" name="enrollmentDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
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
        <div class="form-group">
          <label>Career Interests (comma-separated)</label>
          <input type="text" name="careerInterests" placeholder="e.g. Teaching, Social Work, Nursing">
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
    const data = {
      name: form.name.value.trim(),
      village: form.village.value.trim(),
      contact: form.contact.value.trim(),
      email: form.email.value.trim(),
      dateOfBirth: form.dateOfBirth.value,
      enrollmentDate: form.enrollmentDate.value,
      programStage: form.programStage.value,
      schoolCollegeJob: form.schoolCollegeJob.value.trim(),
      careerInterests: form.careerInterests.value.split(',').map(s => s.trim()).filter(Boolean)
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
          <div class="form-group"><label>Date of Birth</label><input type="date" name="dateOfBirth" value="${Utils.toInputDate(s.dateOfBirth)}"></div>
          <div class="form-group"><label>Enrollment Date</label><input type="date" name="enrollmentDate" value="${Utils.toInputDate(s.enrollmentDate)}"></div>
        </div>
        <div class="form-group"><label>School / College / Job</label><input type="text" name="schoolCollegeJob" value="${Utils.escapeHtml(s.schoolCollegeJob)}"></div>
        <div class="form-group"><label>Career Interests (comma-separated)</label><input type="text" name="careerInterests" value="${(s.careerInterests || []).join(', ')}"></div>
        ${s.programStage === 'alumni' ? `
        <div class="form-group"><label>Alumni Outcome</label><input type="text" name="alumniOutcome" value="${Utils.escapeHtml(s.alumniStatus?.outcome || '')}"></div>
        <div class="form-group"><label>Alumni Details</label><textarea name="alumniDetails">${Utils.escapeHtml(s.alumniStatus?.details || '')}</textarea></div>
        ` : ''}
        <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:24px;">
          <button type="button" class="btn" onclick="Forms.closeModal()">Cancel</button>
          <button type="submit" class="btn btn--primary">Save Changes</button>
        </div>
      </form>
    `;
    showModal('Edit Student', html);
  }

  function handleEditStudent(e, studentId) {
    e.preventDefault();
    const form = e.target;
    const updates = {
      name: form.name.value.trim(),
      village: form.village.value.trim(),
      contact: form.contact.value.trim(),
      email: form.email.value.trim(),
      dateOfBirth: form.dateOfBirth.value,
      enrollmentDate: form.enrollmentDate.value,
      schoolCollegeJob: form.schoolCollegeJob.value.trim(),
      careerInterests: form.careerInterests.value.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (form.alumniOutcome) {
      updates.alumniStatus = { outcome: form.alumniOutcome.value.trim(), details: form.alumniDetails.value.trim() };
    }

    DataStore.updateStudent(studentId, updates);
    closeModal();
    Utils.showToast('Student updated', 'success');
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
          <div style="padding:10px;font-size:1rem;">${Utils.STAGES[s.programStage]?.icon} ${Utils.STAGES[s.programStage]?.label}</div>
        </div>
        <div class="form-group">
          <label>New Stage</label>
          <select name="newStage">
            ${Object.entries(Utils.STAGES).filter(([k]) => k !== s.programStage).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
          </select>
        </div>
        ${`<div class="form-group" id="alumni-fields" style="display:none;">
          <label>Alumni Outcome</label>
          <input type="text" name="alumniOutcome" placeholder="e.g. Employed, Higher Studies">
          <label style="margin-top:10px;">Details</label>
          <textarea name="alumniDetails" placeholder="Details about placement or next steps..."></textarea>
        </div>`}
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

    // Show alumni fields when sampark (alumni) is selected
    setTimeout(() => {
      const sel = document.querySelector('#change-stage-form select[name="newStage"]');
      const alumniFields = document.getElementById('alumni-fields');
      if (sel && alumniFields) {
        const toggle = () => { alumniFields.style.display = sel.value === 'sampark' ? 'block' : 'none'; };
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
    }
    updates.isActive = (newStage !== 'sampark');

    DataStore.updateStudent(studentId, updates);

    // Log stage change as timeline event
    DataStore.addEvent({
      studentId,
      type: 'stage_change',
      title: `${Utils.STAGES[oldStage]?.label || oldStage} → ${Utils.STAGES[newStage]?.label || newStage}`,
      details: form.notes.value.trim() || `Stage changed from ${Utils.STAGES[oldStage]?.label} to ${Utils.STAGES[newStage]?.label}`,
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

  return {
    showModal, closeModal,
    showAddStudent, handleAddStudent,
    showEditStudent, handleEditStudent,
    showAddEvent, handleAddEvent,
    showChangeStage, handleChangeStage,
    showAddAssessment, handleAddAssessment,
    showFollowUpModal, handleFollowUp
  };
})();
