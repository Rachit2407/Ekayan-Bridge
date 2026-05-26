// ============================================
// Ekayan Bridge — Dashboard View
// ============================================

const Dashboard = (() => {

  function render() {
    const students = DataStore.getAllStudents();
    const events = DataStore.getAllEvents();
    const stats = Utils.calculateStats(students, events);
    const recentEvents = DataStore.getRecentEvents(8);

    const content = document.getElementById('app-content');
    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card stat-card--total">
          <div class="stat-card__icon">👥</div>
          <div class="stat-card__value">${stats.total}</div>
          <div class="stat-card__label">Total Students</div>
        </div>
        <div class="stat-card stat-card--active">
          <div class="stat-card__icon">🚀</div>
          <div class="stat-card__value">${stats.activeCount}</div>
          <div class="stat-card__label">Currently Active</div>
        </div>
        <div class="stat-card stat-card--alumni">
          <div class="stat-card__icon">🎓</div>
          <div class="stat-card__value">${stats.alumniCount}</div>
          <div class="stat-card__label">Alumni</div>
        </div>
        <div class="stat-card stat-card--flagged">
          <div class="stat-card__icon">🔔</div>
          <div class="stat-card__value">${stats.flaggedCount}</div>
          <div class="stat-card__label">Need Follow-up</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
        <div>
          <div class="section-header">
            <div class="section-header__title">📊 Program Stage Funnel</div>
          </div>
          <div class="card">
            <div class="funnel" id="stage-funnel"></div>
          </div>
        </div>
        <div>
          <div class="section-header">
            <div class="section-header__title">🔔 Alerts & Follow-ups</div>
          </div>
          <div class="card" style="max-height:320px; overflow-y:auto;">
            <div class="alerts-panel" id="alerts-panel"></div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-header__title">📝 Recent Activity</div>
      </div>
      <div class="feed" id="recent-feed"></div>
    `;

    renderFunnel(stats, students.length);
    renderAlerts(stats, students);
    renderFeed(recentEvents, students);
  }

  function renderFunnel(stats, total) {
    const funnel = document.getElementById('stage-funnel');
    if (!funnel) return;
    const maxCount = Math.max(...Object.values(stats.byStage), 1);

    let html = '';
    Object.entries(Utils.STAGES).forEach(([key, info]) => {
      const count = stats.byStage[key] || 0;
      const pct = (count / maxCount) * 100;
      html += `
        <div class="funnel__bar-wrap">
          <div class="funnel__label">${info.icon} ${info.label}</div>
          <div class="funnel__bar-bg">
            <div class="funnel__bar" style="width:${Math.max(pct, 2)}%; background:${info.color};">${count}</div>
          </div>
        </div>
      `;
    });
    funnel.innerHTML = html;
  }

  function renderAlerts(stats, students) {
    const panel = document.getElementById('alerts-panel');
    if (!panel) return;

    let html = '';
    // Flagged students
    const flagged = students.filter(s => s.flagged);
    flagged.forEach(s => {
      html += `
        <div class="alert-item" onclick="App.navigate('profile', '${s.id}')">
          <span class="alert-item__icon">🚩</span>
          <span class="alert-item__text"><strong>${Utils.escapeHtml(s.name)}</strong> — ${Utils.escapeHtml(s.flagReason || 'Flagged for follow-up')}</span>
        </div>
      `;
    });

    // Inactive students (not flagged yet)
    stats.inactiveStudents.filter(s => !s.flagged).forEach(s => {
      html += `
        <div class="alert-item" onclick="App.navigate('profile', '${s.id}')">
          <span class="alert-item__icon">⏰</span>
          <span class="alert-item__text"><strong>${Utils.escapeHtml(s.name)}</strong> — No activity for 30+ days</span>
        </div>
      `;
    });

    if (!html) {
      html = '<div class="empty-state" style="padding:24px;"><div class="empty-state__icon">✅</div><div class="empty-state__text">No alerts — all students on track!</div></div>';
    }
    panel.innerHTML = html;
  }

  function renderFeed(recentEvents, students) {
    const feed = document.getElementById('recent-feed');
    if (!feed) return;

    if (recentEvents.length === 0) {
      feed.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📝</div><div class="empty-state__text">No activity yet. Start by adding students!</div></div>';
      return;
    }

    const studentMap = {};
    students.forEach(s => studentMap[s.id] = s);

    let html = '';
    recentEvents.forEach(e => {
      const student = studentMap[e.studentId];
      const typeInfo = Utils.EVENT_TYPES[e.type] || { icon: '📌', label: e.type };
      html += `
        <div class="feed__item" onclick="App.navigate('profile', '${e.studentId}')">
          <span class="feed__icon">${typeInfo.icon}</span>
          <div class="feed__text">
            <strong>${student ? Utils.escapeHtml(student.name) : 'Unknown'}</strong> — ${Utils.escapeHtml(e.title)}
            <div style="color:var(--text-muted); font-size:0.8rem; margin-top:3px;">${Utils.escapeHtml(e.details).substring(0, 80)}${e.details.length > 80 ? '...' : ''}</div>
          </div>
          <span class="feed__time">${Utils.timeAgo(e.createdAt)}</span>
        </div>
      `;
    });
    feed.innerHTML = html;
  }

  return { render };
})();
