import './style.css'
import { fetchApplications } from './api.js'

async function init() {
  document.querySelector('#app').innerHTML = `
    <aside class="sidebar glass">
      <div style="margin-bottom: 2rem;">
        <h2 style="font-weight: 700; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">App Portal</h2>
      </div>
      <nav style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
        <a href="#" class="nav-link active">Dashboard</a>
        <a href="#" class="nav-link">Applications</a>
        <a href="#" class="nav-link">Users</a>
        <div style="flex-grow: 1;"></div>
        <a href="#" class="nav-link">Settings</a>
      </nav>
    </aside>
    <main class="main-content">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Dashboard</h1>
        <button class="btn">New Application</button>
      </header>
      
      <div id="stats-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: center; align-items: center; min-height: 120px;">
          <p style="color: var(--text-secondary); animation: pulse 2s infinite;">Loading metrics...</p>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">Recent Applications</h2>
        <div id="applications-table-container" class="glass-card" style="padding: 1.5rem; overflow-x: auto;">
          <p style="color: var(--text-secondary); animation: pulse 2s infinite;">Loading applications...</p>
        </div>
      </div>
    </main>
  `;

  // Fetch data from backend
  const apps = await fetchApplications();
  renderDashboard(apps);
}

function renderDashboard(apps) {
  // Compute metrics
  const total = apps.length;
  const interviewing = apps.filter(a => a.status === 'Interviewing' || a.status === 'Technical').length;
  const offers = apps.filter(a => a.status === 'Offer').length;

  const statsHtml = `
    <div class="glass-card" style="padding: 1.5rem;">
      <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Total Applications</h3>
      <p style="font-size: 2.5rem; font-weight: 700;">${total}</p>
    </div>
    <div class="glass-card" style="padding: 1.5rem;">
      <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Active Interviews</h3>
      <p style="font-size: 2.5rem; font-weight: 700; color: var(--status-interviewing);">${interviewing}</p>
    </div>
    <div class="glass-card" style="padding: 1.5rem;">
      <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Offers</h3>
      <p style="font-size: 2.5rem; font-weight: 700; color: var(--status-offer);">${offers}</p>
    </div>
  `;

  document.getElementById('stats-container').innerHTML = statsHtml;

  // Render table
  if (apps.length === 0) {
      document.getElementById('applications-table-container').innerHTML = `<p style="color: var(--text-secondary);">No applications found. Add one!</p>`;
      return;
  }

  // Get status color CSS variable mapping
  const getStatusColor = (status) => {
      const normalized = status ? status.toLowerCase() : 'applied';
      return `var(--status-${normalized}, var(--text-secondary))`;
  };

  const rows = apps.slice(0, 10).map(app => `
    <tr class="table-row">
      <td style="padding: 1rem; font-weight: 500;">${app.company_name || 'N/A'}</td>
      <td style="padding: 1rem; color: var(--text-secondary);">${app.job_title || 'N/A'}</td>
      <td style="padding: 1rem;">
        <span style="background-color: var(--glass-bg); border: 1px solid var(--border-color); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; color: ${getStatusColor(app.status)}; font-weight: 500;">
          ${app.status || 'Applied'}
        </span>
      </td>
    </tr>
  `).join('');

  const tableHtml = `
    <style>
      .table-row { border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; }
      .table-row:last-child { border-bottom: none; }
      .table-row:hover { background-color: rgba(255, 255, 255, 0.02); }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
    <table style="width: 100%; border-collapse: collapse; text-align: left;">
      <thead>
        <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">
          <th style="padding: 1rem; font-weight: 600;">Company</th>
          <th style="padding: 1rem; font-weight: 600;">Role</th>
          <th style="padding: 1rem; font-weight: 600;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  document.getElementById('applications-table-container').innerHTML = tableHtml;
}

init();
