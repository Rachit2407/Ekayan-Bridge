// ============================================
// Ekayan Bridge — App Shell & Routing
// ============================================

const App = (() => {

  let currentView = 'dashboard';
  let currentParam = null;

  function init() {
    const user = DataStore.getCurrentUser();
    if (!user) {
      showLoginScreen();
      return;
    }

    hideLoginScreen();
    applyRolePermissions(user);

    // Auto-flag inactive students on load
    DataStore.autoFlagInactive(30);
    // Seed demo data if empty
    DataStore.seedDemoData();

    renderShell();
    navigate('dashboard');
  }

  function showLoginScreen() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.querySelector('.app').style.display = 'none';

    // Default to staff portal on launch
    setLoginPortal('staff');

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    if (emailInput && passwordInput && errorEl) {
      const clearError = () => { errorEl.style.display = 'none'; };
      emailInput.addEventListener('input', clearError);
      passwordInput.addEventListener('input', clearError);
    }
  }

  function hideLoginScreen() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app').style.display = 'flex';
  }

  function setLoginPortal(portalType) {
    const card = document.getElementById('login-card-container');
    const hiddenPortalInput = document.getElementById('login-portal-type');
    const btnStaff = document.getElementById('btn-staff-portal');
    const btnAdmin = document.getElementById('btn-admin-console');
    const emailLabel = document.getElementById('login-email-label');
    const submitBtn = document.getElementById('login-submit-btn');
    
    const helpStaff = document.getElementById('help-credentials-staff');
    const helpAdmin = document.getElementById('help-credentials-admin');
    
    if (!card || !hiddenPortalInput) return;
    
    hiddenPortalInput.value = portalType;
    
    if (portalType === 'admin') {
      card.classList.add('login-card--admin');
      btnAdmin.classList.add('login-tab--active');
      btnStaff.classList.remove('login-tab--active');
      emailLabel.textContent = 'Administrator Email Address';
      submitBtn.textContent = 'Sign In to Admin Console';
      submitBtn.style.background = 'linear-gradient(135deg, #ff4757, #ff6b81)';
      helpStaff.style.display = 'none';
      helpAdmin.style.display = 'block';
    } else {
      card.classList.remove('login-card--admin');
      btnStaff.classList.add('login-tab--active');
      btnAdmin.classList.remove('login-tab--active');
      emailLabel.textContent = 'Staff Email Address';
      submitBtn.textContent = 'Sign In to Staff Portal';
      submitBtn.style.background = 'var(--gradient)';
      helpStaff.style.display = 'block';
      helpAdmin.style.display = 'none';
    }
    
    // Clear inputs and hide error
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').style.display = 'none';
  }

  function applyRolePermissions(user) {
    const emailEl = document.getElementById('user-email');
    const roleEl = document.getElementById('user-role');
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) {
      roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Staff';
      roleEl.className = `badge badge--${user.role}`;
    }

    const isAdmin = user.role === 'admin';

    // Role-based visibility for sidebar import/export and logs
    const navExport = document.getElementById('nav-export');
    const navImport = document.getElementById('nav-import');
    const navReports = document.getElementById('nav-reports');
    const navAudit = document.getElementById('nav-audit');
    
    if (navExport) navExport.style.display = isAdmin ? 'flex' : 'none';
    if (navImport) navImport.style.display = isAdmin ? 'flex' : 'none';
    if (navReports) navReports.style.display = isAdmin ? 'flex' : 'none';
    if (navAudit) navAudit.style.display = isAdmin ? 'flex' : 'none';
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const portalType = document.getElementById('login-portal-type').value;
    const errorEl = document.getElementById('login-error');

    if (errorEl) errorEl.style.display = 'none';

    try {
      const session = DataStore.login(email, password, portalType);
      Utils.showToast(`Welcome back, ${session.name}!`, 'success');

      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';

      hideLoginScreen();
      applyRolePermissions(session);

      // Auto-flag inactive students on load
      DataStore.autoFlagInactive(30);
      // Seed demo data if empty
      DataStore.seedDemoData();

      renderShell();
      navigate('dashboard');
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message || 'Incorrect email or password. Please try again.';
        errorEl.style.display = 'block';
      }
    }
  }

  function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      DataStore.logout();
      showLoginScreen();
      Utils.showToast('Signed out successfully.', 'info');
    }
  }

  function renderShell() {
    // Shell is already in HTML, just bind events
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      // Remove any existing listeners first to prevent duplicates if logged out/in
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      newItem.addEventListener('click', () => {
        navigate(newItem.dataset.view);
      });
    });

    // Sidebar toggle for mobile
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar--open');
      });
    }

    updateFlagBadge();
  }

  function navigate(view, param = null) {
    // Enforce view authorization: staff cannot navigate directly to reports or audit
    const currentUser = DataStore.getCurrentUser();
    if (currentUser && currentUser.role === 'staff' && (view === 'reports' || view === 'audit')) {
      Utils.showToast('Access denied: Admins only.', 'error');
      navigate('dashboard');
      return;
    }

    currentView = view;
    currentParam = param;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('nav-item--active', item.dataset.view === view || (view === 'profile' && item.dataset.view === 'students'));
    });

    // Update topbar title
    const titles = {
      dashboard: '📊 Dashboard',
      students: '👥 Students',
      profile: '👤 Student Profile',
      reports: '📈 Reports & Export Dashboard',
      audit: '📜 System Audit Logs'
    };
    const topbarTitle = document.getElementById('topbar-title');
    if (topbarTitle) topbarTitle.textContent = titles[view] || 'Ekayan Bridge';

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('sidebar--open');

    // Render view
    switch (view) {
      case 'dashboard': Dashboard.render(); break;
      case 'students': StudentList.render(param); break;
      case 'profile': Profile.render(param); break;
      case 'reports': Reports.render(); break;
      case 'audit': AuditLogs.render(); break;
      default: Dashboard.render();
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  function updateFlagBadge() {
    const badge = document.getElementById('flag-badge');
    if (!badge) return;
    const flagged = DataStore.getAllStudents().filter(s => s.flagged).length;
    badge.textContent = flagged;
    badge.style.display = flagged > 0 ? 'inline' : 'none';
  }

  return { init, navigate, updateFlagBadge, handleLogin, handleLogout, setLoginPortal };
})();

// Start the app
document.addEventListener('DOMContentLoaded', App.init);
