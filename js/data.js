// ============================================
// Ekayan Bridge — Data Layer (localStorage)
// ============================================

const DataStore = (() => {

  const STUDENTS_KEY = 'cf_students';
  const EVENTS_KEY = 'cf_events';
  const SETTINGS_KEY = 'cf_settings';

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
    
    if (index >= 0) {
      students[index] = student;
    } else {
      student.createdAt = student.createdAt || new Date().toISOString();
      students.push(student);
    }
    
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    return student;
  }

  function deleteStudent(id) {
    const students = getAllStudents().filter(s => s.id !== id);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    // Also delete associated events
    const events = getAllEvents().filter(e => e.studentId !== id);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
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
      isActive: true,
      flagged: false,
      flagReason: '',
      followUpRequired: data.followUpRequired || false,
      followUpNotes: data.followUpNotes || '',
      followUpAssignedTo: data.followUpAssignedTo || '',
      followUpDate: data.followUpDate || '',
      assessments: data.assessments || [],
      lastContactDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    
    return event;
  }

  function deleteEvent(eventId) {
    const events = getAllEvents().filter(e => e.eventId !== eventId);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
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
      if (s.programStage === 'sampark') return;
      
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
    }
    return flagged;
  }

  // ---- Export / Import ----

  function exportData() {
    const data = {
      version: '1.0',
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
      if (!['enrolled', 'neev', 'disha', 'nirmaan', 'sampark'].includes(s.programStage)) {
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
        lastContactDate: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        name: 'Rahul Meena', village: 'Kherli', contact: '9123456789',
        email: '', dateOfBirth: '2004-08-22',
        enrollmentDate: '2025-01-15', programStage: 'sampark',
        careerInterests: ['IT', 'Data Entry'],
        schoolCollegeJob: 'Data Entry Operator — Jaipur District Office',
        alumniStatus: { outcome: 'Employed', details: 'Got govt. contract job after completing program' },
        lastContactDate: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        name: 'Sunita Kumari', village: 'Bansur', contact: '9988776655',
        email: 'sunita.k@email.com', dateOfBirth: '2006-11-05',
        enrollmentDate: '2025-09-10', programStage: 'enrolled',
        careerInterests: ['Nursing'],
        schoolCollegeJob: 'Class 10 — Bansur Public School',
        lastContactDate: new Date(Date.now() - 45 * 86400000).toISOString()
      },
      {
        name: 'Amit Yadav', village: 'Laxmangarh', contact: '9012345678',
        email: '', dateOfBirth: '2003-07-19',
        enrollmentDate: '2024-11-01', programStage: 'neev',
        careerInterests: ['Mechanics', 'Electrician'],
        schoolCollegeJob: 'ITI — Sikar',
        flagged: true, flagReason: 'Family financial issues, needs scholarship support',
        lastContactDate: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        name: 'Kavita Joshi', village: 'Mandawa', contact: '9876501234',
        email: 'kavita.j@email.com', dateOfBirth: '2005-01-30',
        enrollmentDate: '2025-03-20', programStage: 'disha',
        careerInterests: ['Fashion Design', 'Tailoring'],
        schoolCollegeJob: 'Class 11 — Mandawa Girls School',
        lastContactDate: new Date(Date.now() - 5 * 86400000).toISOString()
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
      { studentId: createdStudents[3].id, type: 'counseling', title: 'Financial support discussion', details: 'Family facing crop failure. Exploring scholarship options.', date: '2025-02-20' },
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

  function login(email, password) {
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const session = { email: user.email, role: user.role, name: user.name };
    localStorage.setItem(USER_KEY, JSON.stringify(session));
    return session;
  }

  function logout() {
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
    login,
    logout,
    getCurrentUser
  };

})();
