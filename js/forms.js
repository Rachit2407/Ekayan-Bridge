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

    // Show alumni fields when alumni is selected
    setTimeout(() => {
      const sel = document.querySelector('#change-stage-form select[name="newStage"]');
      const alumniFields = document.getElementById('alumni-fields');
      if (sel && alumniFields) {
        const toggle = () => { alumniFields.style.display = sel.value === 'alumni' ? 'block' : 'none'; };
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
    if (newStage === 'alumni' && form.alumniOutcome) {
      updates.alumniStatus = { outcome: form.alumniOutcome.value.trim(), details: form.alumniDetails.value.trim() };
    }
    if (newStage === 'dropped_out' || newStage === 'completed' || newStage === 'alumni') {
      updates.isActive = false;
    } else {
      updates.isActive = true;
    }

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

  return {
    showModal, closeModal,
    showAddStudent, handleAddStudent,
    showEditStudent, handleEditStudent,
    showAddEvent, handleAddEvent,
    showChangeStage, handleChangeStage
  };
})();
