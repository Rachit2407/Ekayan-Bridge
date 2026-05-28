// ============================================
// Ekayan Bridge — Utility Functions
// ============================================

const Utils = (() => {

  /**
   * Generate a unique student ID in format CF-YYYY-NNNN
   * Reads existing students to find the next sequential number
   */
  function generateStudentId() {
    const year = new Date().getFullYear();
    const students = JSON.parse(localStorage.getItem('cf_students') || '[]');
    const prefix = `CF-${year}-`;
    
    let maxNum = 0;
    students.forEach(s => {
      if (s.id && s.id.startsWith(prefix)) {
        const num = parseInt(s.id.replace(prefix, ''), 10);
        if (num > maxNum) maxNum = num;
      }
    });
    
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  }

  /**
   * Generate a unique event ID
   */
  function generateEventId() {
    return 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Format a date string for display
   */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Format a date as relative time ("2 days ago", "just now")
   */
  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
  }

  /**
   * Format datetime for inputs (YYYY-MM-DD)
   */
  function toInputDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }

  /**
   * Search students by query across multiple fields
   */
  function searchStudents(students, query) {
    if (!query || !query.trim()) return students;
    const q = query.toLowerCase().trim();
    return students.filter(s => {
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.village && s.village.toLowerCase().includes(q)) ||
        (s.contact && s.contact.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.schoolCollegeJob && s.schoolCollegeJob.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Filter students by criteria
   */
  function filterStudents(students, filters) {
    let result = [...students];
    
    if (filters.stage && filters.stage !== 'all') {
      result = result.filter(s => s.programStage === filters.stage);
    }
    if (filters.flagged === true) {
      result = result.filter(s => s.flagged);
    }
    if (filters.followUp === true) {
      result = result.filter(s => s.followUpRequired);
    }
    if (filters.enrolledAfter) {
      result = result.filter(s => new Date(s.enrollmentDate) >= new Date(filters.enrolledAfter));
    }
    if (filters.enrolledBefore) {
      result = result.filter(s => new Date(s.enrollmentDate) <= new Date(filters.enrolledBefore));
    }
    
    return result;
  }

  /**
   * Sort students
   */
  function sortStudents(students, sortBy, order = 'asc') {
    const sorted = [...students];
    sorted.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'enrollmentDate':
          valA = new Date(a.enrollmentDate || 0).getTime();
          valB = new Date(b.enrollmentDate || 0).getTime();
          break;
        case 'lastActivity':
          valA = new Date(a.updatedAt || 0).getTime();
          valB = new Date(b.updatedAt || 0).getTime();
          break;
        case 'stage':
          const stageOrder = ['enrolled', 'neev', 'disha', 'nirmaan', 'sampark'];
          valA = stageOrder.indexOf(a.programStage);
          valB = stageOrder.indexOf(b.programStage);
          break;
        default:
          valA = a.name || '';
          valB = b.name || '';
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  /**
   * Calculate dashboard statistics
   */
  function calculateStats(students, events) {
    const total = students.length;
    const byStage = {};
    const stages = ['enrolled', 'neev', 'disha', 'nirmaan', 'sampark'];
    stages.forEach(s => byStage[s] = 0);
    
    let flaggedCount = 0;
    let followUpCount = 0;
    let activeCount = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 86400000);
    let inactiveStudents = [];

    students.forEach(s => {
      if (byStage.hasOwnProperty(s.programStage)) {
        byStage[s.programStage]++;
      }
      if (s.flagged) flaggedCount++;
      if (s.followUpRequired) followUpCount++;
      if (s.programStage !== 'sampark') activeCount++;
      
      // Check for inactivity
      const lastContact = new Date(s.lastContactDate || s.enrollmentDate || s.createdAt);
      if (lastContact < thirtyDaysAgo && s.programStage !== 'sampark') {
        inactiveStudents.push(s);
      }
    });

    // Count events by type
    const eventsByType = {};
    events.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });

    return {
      total,
      byStage,
      flaggedCount,
      followUpCount,
      activeCount,
      inactiveStudents,
      eventsByType,
      alumniCount: byStage.sampark || 0
    };
  }

  /**
   * Check for duplicate students (same name + village)
   */
  function checkDuplicate(students, name, village, excludeId = null) {
    const n = (name || '').toLowerCase().trim();
    const v = (village || '').toLowerCase().trim();
    return students.find(s => {
      if (excludeId && s.id === excludeId) return false;
      return (s.name || '').toLowerCase().trim() === n && 
             (s.village || '').toLowerCase().trim() === v;
    });
  }

  /**
   * Stage display info
   */
  const STAGES = {
    enrolled: { label: 'Enrolled',            color: '#74b9ff', icon: '📝' },
    neev:     { label: 'Neev (9th & 10th)',   color: '#ff9f43', icon: '📖' },
    disha:    { label: 'Disha (Junior College)', color: '#a29bfe', icon: '🏫' },
    nirmaan:  { label: 'Nirmaan (Undergraduates)', color: '#00d2ff', icon: '🎓' },
    sampark:  { label: 'Sampark (Alumni)',    color: '#00e676', icon: '🤝' }
  };

  /**
   * Event type display info
   */
  const EVENT_TYPES = {
    class:        { label: 'Class',         color: '#74b9ff', icon: '📚' },
    assessment:   { label: 'Assessment',    color: '#a29bfe', icon: '📝' },
    counseling:   { label: 'Counseling',    color: '#fd79a8', icon: '💬' },
    stage_change: { label: 'Stage Change',  color: '#ffeaa7', icon: '🔄' },
    note:         { label: 'Note',          color: '#81ecec', icon: '📌' },
    milestone:    { label: 'Milestone',     color: '#55efc4', icon: '🏆' }
  };

  /**
   * Debounce utility
   */
  function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Show a toast notification
   */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span class="toast__message">${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Show a beautiful error dialog box
   */
  function showErrorDialog(title, message) {
    let overlay = document.getElementById('dialog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'dialog-overlay';
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '10000'; // Sits above login-overlay (z-index 9999)
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="modal" style="max-width: 400px; border-top: 4px solid var(--danger); text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
        <h3 class="modal__title" style="margin-bottom: 12px; color: var(--text-primary); font-size: 1.3rem;">${escapeHtml(title)}</h3>
        <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5;">${escapeHtml(message)}</p>
        <button class="btn btn--primary" style="width: 100%; justify-content: center;" onclick="document.getElementById('dialog-overlay').classList.remove('modal-overlay--active'); setTimeout(() => document.getElementById('dialog-overlay').remove(), 300);">Okay</button>
      </div>
    `;
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--active'));
  }

  return {
    generateStudentId,
    generateEventId,
    formatDate,
    timeAgo,
    toInputDate,
    searchStudents,
    filterStudents,
    sortStudents,
    calculateStats,
    checkDuplicate,
    STAGES,
    EVENT_TYPES,
    debounce,
    escapeHtml,
    showToast,
    showErrorDialog
  };

})();
