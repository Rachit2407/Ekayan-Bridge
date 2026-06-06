// ============================================
// Ekayan Bridge — Data Layer (localStorage)
// ============================================

const DataStore = (() => {

  const STUDENTS_KEY = 'cf_students';
  const EVENTS_KEY = 'cf_events';
  const SETTINGS_KEY = 'cf_settings';
  const AUDIT_KEY = 'eb_audit_logs';

  // ---- Audit Logs ----

  function getAllAuditLogs() {
    return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
  }

  function addAuditLog(action, details) {
    const logs = getAllAuditLogs();
    const currentUser = getCurrentUser();
    const log = {
      id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.email : 'system',
      role: currentUser ? currentUser.role : 'system',
      action: action,
      details: details
    };
    logs.push(log);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
    
    // Background sync to Supabase if config is active
    syncAuditLogToSupabase(log);
    return log;
  }

  // ---- Students ----

  function getAllStudents() {
    return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
  }

  function getStudent(id) {
    return getAllStudents().find(s => s.id === id) || null;
  }

  function saveStudent(student) {
    const students = getAllStudents();
    const index = students.findIndex(s => s.id === student.id);
    
    student.updatedAt = new Date().toISOString();
    
    let isNew = true;
    if (index >= 0) {
      students[index] = student;
      isNew = false;
    } else {
      student.createdAt = student.createdAt || new Date().toISOString();
      students.push(student);
    }
    
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    
    // Log audit event (avoid logging during initial seed to prevent spam)
    if (getCurrentUser()) {
      addAuditLog(
        isNew ? 'CREATE_STUDENT' : 'UPDATE_STUDENT', 
        `${isNew ? 'Created' : 'Updated'} student: ${student.name} (${student.id})`
      );
    }
    
    // Background sync to Supabase
    syncStudentToSupabase(student);
    
    return student;
  }

  function deleteStudent(id) {
    const student = getStudent(id);
    const studentName = student ? student.name : 'Unknown';
    
    const students = getAllStudents().filter(s => s.id !== id);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    // Also delete associated events
    const events = getAllEvents().filter(e => e.studentId !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    addAuditLog('DELETE_STUDENT', `Deleted student: ${studentName} (${id})`);
    
    // Background sync to Supabase
    syncDeleteStudentFromSupabase(id);
  }

  function createStudent(data) {
    const student = {
      id: Utils.generateStudentId(),
      name: data.name || '',
      village: data.village || '',
      contact: data.contact || '',
      email: data.email || '',
      dateOfBirth: data.dateOfBirth || '',
      enrollmentDate: data.enrollmentDate || new Date().toISOString().split('T')[0],
      programStage: data.programStage || 'enrolled',
      photo: data.photo || '',
      careerInterests: data.careerInterests || [],
      schoolCollegeJob: data.schoolCollegeJob || '',
      alumniStatus: data.alumniStatus || { outcome: '', details: '' },
      isActive: data.programStage !== 'dropped_out' && data.programStage !== 'sampark',
      flagged: false,
      flagReason: '',
      followUpRequired: data.followUpRequired || false,
      followUpNotes: data.followUpNotes || '',
      followUpAssignedTo: data.followUpAssignedTo || '',
      followUpDate: data.followUpDate || '',
      assessments: data.assessments || [],
      lastContactDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // New enhanced fields
      gender: data.gender || 'prefer_not_to_say',
      maritalStatus: data.maritalStatus || 'prefer_not_to_say',

      dropoutDate: data.dropoutDate || '',
      dropoutReason: data.dropoutReason || '',
      consentGiven: data.consentGiven === undefined ? false : data.consentGiven,
      consentDate: data.consentDate || ''
    };
    
    return saveStudent(student);
  }

  function updateStudent(id, updates) {
    const student = getStudent(id);
    if (!student) return null;
    Object.assign(student, updates);
    return saveStudent(student);
  }

  function addAssessment(studentId, assessmentData) {
    const student = getStudent(studentId);
    if (!student) return null;
    
    if (!student.assessments) {
      student.assessments = [];
    }
    
    const newAssessment = {
      id: 'asm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5),
      type: assessmentData.type || '',
      date: assessmentData.date || new Date().toISOString().split('T')[0],
      score: assessmentData.score || '',
      remarks: assessmentData.remarks || '',
      fileName: assessmentData.fileName || '',
      fileData: assessmentData.fileData || ''
    };
    
    student.assessments.push(newAssessment);
    
    // Also log this as a timeline event
    addEvent({
      studentId: studentId,
      type: 'assessment',
      title: `Assessment: ${newAssessment.type}`,
      details: `Score/Result: ${newAssessment.score}. ${newAssessment.remarks}`,
      date: newAssessment.date
    });
    
    saveStudent(student);
    addAuditLog('ADD_ASSESSMENT', `Added assessment (${newAssessment.type}) to student ID: ${studentId}`);
    
    return newAssessment;
  }

  // ---- Timeline Events ----

  function getAllEvents() {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  }

  function getStudentEvents(studentId) {
    return getAllEvents()
      .filter(e => e.studentId === studentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function addEvent(data) {
    const events = getAllEvents();
    const event = {
      eventId: Utils.generateEventId(),
      studentId: data.studentId,
      date: data.date || new Date().toISOString(),
      type: data.type || 'note',
      title: data.title || '',
      details: data.details || '',
      createdAt: new Date().toISOString()
    };
    events.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    // Update student's lastContactDate
    updateStudent(data.studentId, { lastContactDate: new Date().toISOString() });
    
    if (getCurrentUser()) {
      addAuditLog('ADD_EVENT', `Added timeline event: "${event.title}" for student ID: ${data.studentId}`);
    }
    
    // Background sync to Supabase
    syncEventToSupabase(event);
    
    return event;
  }

  function deleteEvent(eventId) {
    const events = getAllEvents().filter(e => e.eventId !== eventId);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    
    addAuditLog('DELETE_EVENT', `Deleted event ID: ${eventId}`);
    
    // Background sync to Supabase
    syncDeleteEventFromSupabase(eventId);
  }

  function getRecentEvents(limit = 10) {
    return getAllEvents()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // ---- Auto-flag inactive students ----

  function autoFlagInactive(daysThreshold = 30) {
    const students = getAllStudents();
    const now = new Date();
    const threshold = new Date(now - daysThreshold * 86400000);
    let flagged = 0;

    students.forEach(s => {
      if (s.programStage === 'sampark' || s.programStage === 'dropped_out') return;
      
      const lastContact = new Date(s.lastContactDate || s.enrollmentDate || s.createdAt);
      if (lastContact < threshold && !s.flagged) {
        s.flagged = true;
        s.flagReason = `No activity for ${daysThreshold}+ days`;
        s.updatedAt = new Date().toISOString();
        flagged++;
      }
    });

    if (flagged > 0) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
      // Sync modified students back to Supabase
      students.forEach(s => {
        if (s.flagged) syncStudentToSupabase(s);
      });
      addAuditLog('AUTO_FLAG_INACTIVE', `Auto-flagged ${flagged} inactive students`);
    }
    return flagged;
  }

  // ---- Export / Import ----

  function exportData() {
    const data = {
      version: '1.1',
      exportDate: new Date().toISOString(),
      students: getAllStudents(),
      events: getAllEvents(),
      settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekayan_bridge_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addAuditLog('EXPORT_DATA', 'Exported JSON backup file');
    Utils.showToast('Data exported successfully!', 'success');
  }

  function importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          if (!data.students || !Array.isArray(data.students)) {
            throw new Error('Invalid backup file format');
          }
          
          // Merge or replace
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(data.students));
          migrateStages();
          localStorage.setItem(EVENTS_KEY, JSON.stringify(data.events || []));
          if (data.settings) {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
          }
          
          addAuditLog('IMPORT_DATA', `Imported database containing ${data.students.length} students`);
          
          // Sync all imported data to Supabase
          if (typeof supabase !== 'undefined' && supabase) {
            data.students.forEach(s => syncStudentToSupabase(s));
            (data.events || []).forEach(evt => syncEventToSupabase(evt));
          }
          
          Utils.showToast(`Imported ${data.students.length} students successfully!`, 'success');
          resolve(data);
        } catch (err) {
          Utils.showToast('Failed to import: ' + err.message, 'error');
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // ---- Supabase Sync Helpers ----

  async function syncAuditLogToSupabase(log) {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      const { error } = await supabase.from('audit_logs').insert([log]);
      if (error) console.error('Error syncing audit log to Supabase:', error);
    } catch (err) {
      console.warn('Supabase audit log sync warning:', err);
    }
  }

  async function syncStudentToSupabase(student) {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      const dbStudent = {
        id: student.id,
        name: student.name,
        village: student.village,
        contact: student.contact,
        email: student.email,
        date_of_birth: student.dateOfBirth || null,
        enrollment_date: student.enrollmentDate,
        program_stage: student.programStage,
        school_college_job: student.schoolCollegeJob,
        career_interests: student.careerInterests || [],
        flagged: student.flagged,
        flag_reason: student.flagReason,
        follow_up_required: student.followUpRequired,
        follow_up_notes: student.followUpNotes,
        follow_up_assigned_to: student.followUpAssignedTo,
        follow_up_date: student.followUpDate || null,
        assessments: student.assessments || [],
        // New columns
        gender: student.gender || 'prefer_not_to_say',
        marital_status: student.maritalStatus || 'prefer_not_to_say',

        dropout_date: student.dropoutDate || null,
        dropout_reason: student.dropoutReason || '',
        consent_given: student.consentGiven || false,
        consent_date: student.consentDate || null
      };
      const { error } = await supabase.from('students').upsert(dbStudent);
      if (error) console.error('Error syncing student to Supabase:', error);
    } catch (err) {
      console.warn('Supabase sync warning:', err);
    }
  }

  async function syncDeleteStudentFromSupabase(id) {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) console.error('Error deleting student from Supabase:', error);
    } catch (err) {
      console.warn('Supabase delete warning:', err);
    }
  }

  async function syncEventToSupabase(event) {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      const dbEvent = {
        id: event.eventId,
        student_id: event.studentId,
        type: event.type,
        title: event.title,
        details: event.details,
        date: event.date,
        created_at: event.createdAt
      };
      const { error } = await supabase.from('events').upsert(dbEvent);
      if (error) console.error('Error syncing event to Supabase:', error);
    } catch (err) {
      console.warn('Supabase event sync warning:', err);
    }
  }

  async function syncDeleteEventFromSupabase(eventId) {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) console.error('Error deleting event from Supabase:', error);
    } catch (err) {
      console.warn('Supabase event delete warning:', err);
    }
  }

  async function pullFromSupabase() {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
      // 1. Fetch Students
      const { data: dbStudents, error: sErr } = await supabase.from('students').select('*');
      if (!sErr && dbStudents) {
        const localStudents = dbStudents.map(s => ({
          id: s.id,
          name: s.name,
          village: s.village,
          contact: s.contact,
          email: s.email,
          dateOfBirth: s.date_of_birth,
          enrollmentDate: s.enrollment_date,
          programStage: s.program_stage,
          schoolCollegeJob: s.school_college_job,
          careerInterests: s.career_interests,
          flagged: s.flagged,
          flagReason: s.flag_reason,
          followUpRequired: s.follow_up_required,
          followUpNotes: s.follow_up_notes,
          followUpAssignedTo: s.follow_up_assigned_to,
          followUpDate: s.follow_up_date,
          assessments: s.assessments || [],
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          // New Columns Scoped
          gender: s.gender || 'prefer_not_to_say',
          maritalStatus: s.marital_status || 'prefer_not_to_say',

          dropoutDate: s.dropout_date || '',
          dropoutReason: s.dropout_reason || '',
          consentGiven: s.consent_given || false,
          consentDate: s.consent_date || ''
        }));
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(localStudents));
      }

      // 2. Fetch Events
      const { data: dbEvents, error: eErr } = await supabase.from('events').select('*');
      if (!eErr && dbEvents) {
        const localEvents = dbEvents.map(e => ({
          eventId: e.id,
          studentId: e.student_id,
          type: e.type,
          title: e.title,
          details: e.details,
          date: e.date,
          createdAt: e.created_at
        }));
        localStorage.setItem(EVENTS_KEY, JSON.stringify(localEvents));
      }

      // Refresh currently active page UI
      if (typeof App !== 'undefined' && App.navigate && document.getElementById('app-content')) {
        const activeNav = document.querySelector('.sidebar__nav .nav-item--active');
        if (activeNav) {
          const currentView = activeNav.dataset.view || 'dashboard';
          App.navigate(currentView);
        }
      }
    } catch (err) {
      console.warn('Could not sync from Supabase, using local storage cache:', err);
    }
  }

  // ---- Migrate legacy program stages ----
  function migrateStages() {
    const students = getAllStudents();
    let modified = false;
    students.forEach(s => {
      if (s.programStage === 'active') {
        s.programStage = 'neev';
        modified = true;
      } else if (s.programStage === 'alumni') {
        s.programStage = 'sampark';
        modified = true;
      } else if (s.programStage === 'on_hold') {
        s.programStage = 'enrolled';
        modified = true;
      }
      if (!['enrolled', 'neev', 'disha', 'nirmaan', 'sampark', 'dropped_out'].includes(s.programStage)) {
        s.programStage = 'enrolled';
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    }
  }

  // ---- Seed demo data ----

  function seedDemoData() {
    // Trigger background sync from Supabase on startup
    pullFromSupabase();

    if (getAllStudents().length > 0) {
      // Still run migration on existing data to fix stages
      migrateStages();
      return;
    }

    const demoStudents = [
      {
        name: 'Priya Sharma', village: 'Rampur', contact: '9876543210',
        email: 'priya.s@email.com', dateOfBirth: '2005-03-15',
        enrollmentDate: '2025-06-01', programStage: 'disha',
        careerInterests: ['Teaching', 'Social Work'],
        schoolCollegeJob: 'Class 12 — Govt. Sr. Sec. School, Rampur',
        lastContactDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        gender: 'female', maritalStatus: 'single',
        consentGiven: true, consentDate: '2025-06-01'
      },
      {
        name: 'Rahul Meena', village: 'Kherli', contact: '9123456789',
        email: '', dateOfBirth: '2004-08-22',
        enrollmentDate: '2025-01-15', programStage: 'sampark',
        careerInterests: ['IT', 'Data Entry'],
        schoolCollegeJob: 'Data Entry Operator — Jaipur District Office',
        alumniStatus: { outcome: 'Employed', details: 'Got govt. contract job after completing program' },
        lastContactDate: new Date(Date.now() - 15 * 86400000).toISOString(),
        gender: 'male', maritalStatus: 'single',
        consentGiven: true, consentDate: '2025-01-15'
      },
      {
        name: 'Sunita Kumari', village: 'Bansur', contact: '9988776655',
        email: 'sunita.k@email.com', dateOfBirth: '2006-11-05',
        enrollmentDate: '2025-09-10', programStage: 'enrolled',
        careerInterests: ['Nursing'],
        schoolCollegeJob: 'Class 10 — Bansur Public School',
        lastContactDate: new Date(Date.now() - 45 * 86400000).toISOString(),
        gender: 'female', maritalStatus: 'single',
        consentGiven: false, consentDate: ''
      },
      {
        name: 'Amit Yadav', village: 'Laxmangarh', contact: '9012345678',
        email: '', dateOfBirth: '2003-07-19',
        enrollmentDate: '2024-11-01', programStage: 'neev',
        careerInterests: ['Mechanics', 'Electrician'],
        schoolCollegeJob: 'ITI — Sikar',
        gender: 'male', maritalStatus: 'single',
        consentGiven: true, consentDate: '2024-11-01'
      },
      {
        name: 'Kavita Joshi', village: 'Mandawa', contact: '9876501234',
        email: 'kavita.j@email.com', dateOfBirth: '2005-01-30',
        enrollmentDate: '2025-03-20', programStage: 'disha',
        careerInterests: ['Fashion Design', 'Tailoring'],
        schoolCollegeJob: 'Class 11 — Mandawa Girls School',
        lastContactDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        gender: 'female', maritalStatus: 'married',
        consentGiven: true, consentDate: '2025-03-20'
      },
      {
        name: 'Rajesh Patel', village: 'Kherli', contact: '9456712390',
        email: 'rajesh.patel@email.com', dateOfBirth: '2004-05-10',
        enrollmentDate: '2024-08-15', programStage: 'dropped_out',
        careerInterests: ['Agriculture', 'Business'],
        schoolCollegeJob: 'Helping in family farm',
        lastContactDate: new Date(Date.now() - 120 * 86400000).toISOString(),
        gender: 'male', maritalStatus: 'single',
        dropoutDate: '2025-10-12', dropoutReason: 'financial',
        consentGiven: true, consentDate: '2024-08-15'
      }
    ];

    const createdStudents = demoStudents.map(d => createStudent(d));

    // Add some demo events
    const demoEvents = [
      { studentId: createdStudents[0].id, type: 'class', title: 'English Communication Workshop', details: 'Attended 3-day workshop. Good participation.', date: '2025-07-15' },
      { studentId: createdStudents[0].id, type: 'assessment', title: 'Mid-term Assessment', details: 'Score: 78/100. Strong in verbal, needs improvement in written.', date: '2025-08-20' },
      { studentId: createdStudents[0].id, type: 'counseling', title: 'Career guidance session', details: 'Discussed teaching career path. Interested in B.Ed after 12th.', date: '2025-09-10' },
      { studentId: createdStudents[1].id, type: 'stage_change', title: 'Moved to Alumni', details: 'Successfully completed program. Placed in govt. data entry role.', date: '2025-12-15' },
      { studentId: createdStudents[1].id, type: 'milestone', title: 'Job Placement!', details: 'Secured Data Entry Operator position at Jaipur District Office.', date: '2026-01-10' },
      { studentId: createdStudents[2].id, type: 'class', title: 'Orientation Session', details: 'Attended introductory session. Quiet but attentive.', date: '2025-09-15' },
      { studentId: createdStudents[3].id, type: 'counseling', title: 'Financial support discussion', details: 'Family facing crop failure. Exploring external support options.', date: '2025-02-20' },
      { studentId: createdStudents[3].id, type: 'stage_change', title: 'Moved to On Hold', details: 'Taking break due to family situation. Will resume in 2 months.', date: '2025-03-01' },
      { studentId: createdStudents[4].id, type: 'class', title: 'Basic Stitching Class', details: 'First tailoring class. Very enthusiastic, picked up basics quickly.', date: '2025-04-05' },
      { studentId: createdStudents[4].id, type: 'assessment', title: 'Practical Skills Test', details: 'Made a simple kurta independently. Excellent craftsmanship.', date: '2025-05-10' }
    ];

    demoEvents.forEach(e => addEvent(e));
  }

  // ---- Authentication ----

  const USER_KEY = 'eb_current_user';
  const MOCK_USERS = [
    { email: 'admin@ekayan.org', password: 'admin123', role: 'admin', name: 'Admin User' },
    { email: 'staff@ekayan.org', password: 'staff123', role: 'staff', name: 'Staff Member' }
  ];

  function login(email, password, portalType) {
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (portalType === 'admin' && user.role !== 'admin') {
      throw new Error('Access denied: Staff members cannot access the Admin Console.');
    }
    if (portalType === 'staff' && user.role === 'admin') {
      throw new Error('Access denied: Administrators must sign in through the Admin Console.');
    }

    const session = { email: user.email, role: user.role, name: user.name };
    localStorage.setItem(USER_KEY, JSON.stringify(session));

    addAuditLog('LOGIN', `User signed in successfully via ${portalType === 'admin' ? 'Admin Console' : 'Staff Portal'}`);

    return session;
  }

  function logout() {
    addAuditLog('LOGOUT', 'User signed out');
    localStorage.removeItem(USER_KEY);
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  }

  return {
    getAllStudents,
    getStudent,
    saveStudent,
    deleteStudent,
    createStudent,
    updateStudent,
    addAssessment,
    getAllEvents,
    getStudentEvents,
    addEvent,
    deleteEvent,
    getRecentEvents,
    autoFlagInactive,
    exportData,
    importData,
    seedDemoData,
    migrateStages,
    pullFromSupabase,
    login,
    logout,
    getCurrentUser,
    getAllAuditLogs,
    addAuditLog
  };

})();
