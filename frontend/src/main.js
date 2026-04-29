import './style.css';
import { setActiveNav } from './utils.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderApplicationsListView } from './views/applications.js';
import { renderSettingsView } from './views/settings.js';
import { renderLoginView } from './views/login.js';

async function init() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return renderLoginView('app');
  }

  document.querySelector('#app').innerHTML = `
    <aside class="sidebar glass">
      <div style="margin-bottom: 2rem;">
        <h2 style="font-weight: 700; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">App Portal</h2>
      </div>
      <nav style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
        <a href="#" id="nav-dashboard" class="nav-link active">Dashboard</a>
        <a href="#" id="nav-applications" class="nav-link">Applications</a>
        <a href="#" class="nav-link">Users</a>
        <a href="#" class="nav-link">Stats</a>
        <div style="flex-grow: 1;"></div>
        <a href="#" id="nav-settings" class="nav-link">Settings</a>
      </nav>
    </aside>
    <main class="main-content" id="main-content"></main>
  `;

  document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('nav-dashboard');
    renderDashboardView();
  });

  document.getElementById('nav-applications').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('nav-applications');
    renderApplicationsListView();
  });

  document.getElementById('nav-settings').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('nav-settings');
    renderSettingsView();
  });

  await renderDashboardView();
}

init();
