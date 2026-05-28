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

  function applyRolePermissions(user) {
    const emailEl = document.getElementById('user-email');
    const roleEl = document.getElementById('user-role');
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) {
      roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Staff';
      roleEl.className = `badge badge--${user.role}`;
    }

    // Role-based visibility for sidebar import/export buttons
    const isStaff = user.role === 'staff';
    const navExport = document.getElementById('nav-export');
    const navImport = document.getElementById('nav-import');
    if (navExport) navExport.style.display = isStaff ? 'none' : 'flex';
    if (navImport) navImport.style.display = isStaff ? 'none' : 'flex';
  }

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (errorEl) errorEl.style.display = 'none';

    try {
      const session = DataStore.login(email, password);
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
      Utils.showErrorDialog('Login Failed', err.message || 'Incorrect email or password. Please try again.');
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
      profile: '👤 Student Profile'
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

  return { init, navigate, updateFlagBadge, handleLogin, handleLogout };
})();

// Start the app
document.addEventListener('DOMContentLoaded', App.init);
