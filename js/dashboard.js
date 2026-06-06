// ============================================
// Ekayan Bridge — Dashboard View
// ============================================

const Dashboard = (() => {

  function render() {
    const students = DataStore.getAllStudents();
    const events = DataStore.getAllEvents();
    const stats = Utils.calculateStats(students, events);
    const recentEvents = DataStore.getRecentEvents(8);

    // Calculate new KPIs
    const dropoutsCount = students.filter(s => s.programStage === 'dropped_out').length;


    const content = document.getElementById('app-content');
    content.innerHTML = `
      <!-- KPI Cards -->
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
        <div class="stat-card stat-card--total" onclick="App.navigate('students')" style="cursor:pointer;">
          <div class="stat-card__icon">👥</div>
          <div class="stat-card__value">${stats.total}</div>
          <div class="stat-card__label">Total Registered</div>
        </div>
        <div class="stat-card stat-card--active" onclick="App.navigate('students')" style="cursor:pointer;">
          <div class="stat-card__icon">🚀</div>
          <div class="stat-card__value">${stats.activeCount}</div>
          <div class="stat-card__label">Currently Active</div>
        </div>
        <div class="stat-card stat-card--alumni" onclick="App.navigate('students')" style="cursor:pointer;">
          <div class="stat-card__icon">🎓</div>
          <div class="stat-card__value">${stats.alumniCount}</div>
          <div class="stat-card__label">Alumni Outcomes</div>
        </div>
        <div class="stat-card" style="border-left: 3px solid var(--danger); cursor:pointer;" onclick="App.navigate('students')">
          <div class="stat-card__icon">⚠️</div>
          <div class="stat-card__value">${dropoutsCount}</div>
          <div class="stat-card__label">Total Dropouts</div>
        </div>

        <div class="stat-card stat-card--flagged" onclick="App.navigate('students', 'followup')" style="cursor:pointer;">
          <div class="stat-card__icon">🚩</div>
          <div class="stat-card__value">${stats.followUpCount}</div>
          <div class="stat-card__label">Action Required</div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="section-header">
        <div class="section-header__title">📈 Real-time Analytics & Trends</div>
      </div>
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-card__title">📊 Program Stage Distribution</div>
          <div class="chart-container-wrapper">
            <canvas id="stage-chart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card__title">📈 Student Cumulative Growth</div>
          <div class="chart-container-wrapper">
            <canvas id="growth-chart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card__title">📝 Academic Performance Scores</div>
          <div class="chart-container-wrapper">
            <canvas id="academic-chart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card__title">🛡️ Demographics: Gender & Marital Status</div>
          <div class="chart-container-wrapper" style="display:flex; justify-content:space-around; width:100%; height:100%;">
            <div style="width:45%; height:190px;"><canvas id="gender-chart"></canvas></div>
            <div style="width:45%; height:190px;"><canvas id="marital-chart"></canvas></div>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card__title">⚠️ Dropout Status & Causes</div>
          <div class="chart-container-wrapper">
            <canvas id="dropout-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Alerts and Recent Feed -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
        <div>
          <div class="section-header">
            <div class="section-header__title">🔔 Urgent Alerts & Flags</div>
          </div>
          <div class="card" style="max-height:360px; overflow-y:auto;">
            <div class="alerts-panel" id="alerts-panel"></div>
          </div>
        </div>
        <div>
          <div class="section-header">
            <div class="section-header__title">📝 Recent Updates Log</div>
          </div>
          <div class="feed" id="recent-feed" style="max-height:360px; overflow-y:auto;"></div>
        </div>
      </div>
    `;

    renderAlerts(stats, students);
    renderFeed(recentEvents, students);

    // Render Chart.js configurations
    setTimeout(() => {
      initializeCharts(students);
    }, 50);
  }

  function initializeCharts(students) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js CDN is unavailable. Visualizations omitted.');
      return;
    }

    // 1. Stage Distribution
    const stageLabels = ['Enrolled', 'Neev (9-10th)', 'Disha (11-12th)', 'Nirmaan (UG)', 'Sampark (Alumni)', 'Dropped Out'];
    const stageKeys = ['enrolled', 'neev', 'disha', 'nirmaan', 'sampark', 'dropped_out'];
    const stageColors = ['#74b9ff', '#ff9f43', '#a29bfe', '#00d2ff', '#00e676', '#ff4757'];
    
    const stageCounts = stageKeys.map(k => students.filter(s => s.programStage === k).length);

    new Chart(document.getElementById('stage-chart'), {
      type: 'doughnut',
      data: {
        labels: stageLabels,
        datasets: [{
          data: stageCounts,
          backgroundColor: stageColors,
          borderWidth: 1,
          borderColor: '#111827'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#8892a4', font: { size: 10 } } }
        }
      }
    });



    // 3. Student Cumulative Growth
    const enrollmentsByMonth = {};
    students.forEach(s => {
      if (s.enrollmentDate) {
        const m = s.enrollmentDate.substring(0, 7); // YYYY-MM
        enrollmentsByMonth[m] = (enrollmentsByMonth[m] || 0) + 1;
      }
    });

    const sortedMonths = Object.keys(enrollmentsByMonth).sort();
    let cumulative = 0;
    const growthLabels = [];
    const growthData = [];
    sortedMonths.forEach(m => {
      cumulative += enrollmentsByMonth[m];
      // Format YYYY-MM to MMM YY (e.g. Jun 25)
      const d = new Date(m + '-02');
      const formatted = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      growthLabels.push(formatted);
      growthData.push(cumulative);
    });

    new Chart(document.getElementById('growth-chart'), {
      type: 'line',
      data: {
        labels: growthLabels.length ? growthLabels : ['None'],
        datasets: [{
          label: 'Total Students',
          data: growthData.length ? growthData : [0],
          borderColor: '#a29bfe',
          backgroundColor: 'rgba(162, 155, 254, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892a4', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#8892a4' } }
        }
      }
    });

    // 4. Academic Scores Distribution
    const ranges = { 'Below 50%': 0, '50% - 70%': 0, '70% - 85%': 0, '85% - 100%': 0 };
    students.forEach(s => {
      (s.assessments || []).forEach(a => {
        let scoreVal = parseFloat(a.score);
        if (a.score && a.score.includes('/') && !isNaN(scoreVal)) {
          const parts = a.score.split('/');
          const obtained = parseFloat(parts[0]);
          const total = parseFloat(parts[1]);
          if (!isNaN(obtained) && !isNaN(total) && total > 0) {
            scoreVal = (obtained / total) * 100;
          }
        }
        if (!isNaN(scoreVal)) {
          if (scoreVal < 50) ranges['Below 50%']++;
          else if (scoreVal <= 70) ranges['50% - 70%']++;
          else if (scoreVal <= 85) ranges['70% - 85%']++;
          else if (scoreVal <= 100) ranges['85% - 100%']++;
        }
      });
    });

    new Chart(document.getElementById('academic-chart'), {
      type: 'bar',
      data: {
        labels: Object.keys(ranges),
        datasets: [{
          label: 'Assessments Count',
          data: Object.values(ranges),
          backgroundColor: '#ff9f43',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892a4', stepSize: 1 } },
          x: { grid: { display: false }, ticks: { color: '#8892a4' } }
        }
      }
    });

    // 5. Gender & Marital Status Doughnuts
    const genderData = { male: 0, female: 0, other: 0, prefer_not_to_say: 0 };
    students.forEach(s => {
      const g = s.gender || 'prefer_not_to_say';
      if (genderData.hasOwnProperty(g)) genderData[g]++;
    });

    new Chart(document.getElementById('gender-chart'), {
      type: 'doughnut',
      data: {
        labels: ['Male', 'Female', 'Other', 'N/A'],
        datasets: [{
          data: [genderData.male, genderData.female, genderData.other, genderData.prefer_not_to_say],
          backgroundColor: ['#74b9ff', '#fd79a8', '#ffeaa7', '#8892a4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8892a4', font: { size: 9 }, boxWidth: 10 } },
          title: { display: true, text: 'Gender', color: '#8892a4', font: { size: 10 } }
        }
      }
    });

    const maritalData = { single: 0, married: 0, divorced: 0, widowed: 0, prefer_not_to_say: 0 };
    students.forEach(s => {
      const m = s.maritalStatus || 'prefer_not_to_say';
      if (maritalData.hasOwnProperty(m)) maritalData[m]++;
    });

    new Chart(document.getElementById('marital-chart'), {
      type: 'doughnut',
      data: {
        labels: ['Single', 'Married', 'Divorced', 'Widowed', 'N/A'],
        datasets: [{
          data: [maritalData.single, maritalData.married, maritalData.divorced, maritalData.widowed, maritalData.prefer_not_to_say],
          backgroundColor: ['#2ed573', '#ffa502', '#ff4757', '#a4b0be', '#8892a4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8892a4', font: { size: 9 }, boxWidth: 10 } },
          title: { display: true, text: 'Marital Status', color: '#8892a4', font: { size: 10 } }
        }
      }
    });

    // 6. Dropout Causes
    const causes = { financial: 0, academic: 0, family: 0, employment: 0, marriage: 0, other: 0 };
    students.forEach(s => {
      if (s.programStage === 'dropped_out' && s.dropoutReason) {
        const r = s.dropoutReason.toLowerCase();
        if (causes.hasOwnProperty(r)) causes[r]++;
        else causes['other']++;
      }
    });

    const causeLabels = ['Financial', 'Academic', 'Family', 'Job', 'Marriage', 'Other'];
    const causeData = [causes.financial, causes.academic, causes.family, causes.employment, causes.marriage, causes.other];

    new Chart(document.getElementById('dropout-chart'), {
      type: 'polarArea',
      data: {
        labels: causeLabels,
        datasets: [{
          data: causeData,
          backgroundColor: [
            'rgba(255, 71, 87, 0.6)', 
            'rgba(255, 159, 67, 0.6)', 
            'rgba(253, 203, 110, 0.6)', 
            'rgba(0, 210, 255, 0.6)', 
            'rgba(162, 155, 254, 0.6)', 
            'rgba(136, 136, 136, 0.6)'
          ],
          borderColor: '#111827',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#8892a4', font: { size: 9 } } }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            angleLines: { color: 'rgba(255,255,255,0.05)' },
            pointLabels: { color: '#8892a4' }
          }
        }
      }
    });
  }

  function renderAlerts(stats, students) {
    const panel = document.getElementById('alerts-panel');
    if (!panel) return;

    let html = '';

    // Follow-up Required students
    const followUps = students.filter(s => s.followUpRequired);
    followUps.forEach(s => {
      html += `
        <div class="alert-item" onclick="App.navigate('profile', '${s.id}')" style="border-left: 3px solid var(--warning);">
          <span class="alert-item__icon">⚠️</span>
          <span class="alert-item__text"><strong>${Utils.escapeHtml(s.name)}</strong> — Follow-up required ${s.followUpDate ? `by ${Utils.formatDate(s.followUpDate)}` : ''}<br>
          <span style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-top:2px;">"${Utils.escapeHtml(s.followUpNotes || 'No notes')}"${s.followUpAssignedTo ? ` (Assigned: ${Utils.escapeHtml(s.followUpAssignedTo)})` : ''}</span>
          </span>
        </div>
      `;
    });

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
    stats.inactiveStudents.filter(s => !s.flagged && !s.followUpRequired).forEach(s => {
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
