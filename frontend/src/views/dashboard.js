import { fetchApplications } from '../api.js';
import { setActiveNav, getStatusColor } from '../utils.js';
import { renderNewApplicationView } from './newApplication.js';

export async function renderDashboardView() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="page-enter">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Dashboard</h1>
        <button id="btn-new-app" class="btn">+ New Application</button>
      </header>

      <div id="stats-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
        <div class="glass-card" style="padding: 1.5rem; display: flex; justify-content: center; align-items: center; min-height: 120px;">
          <p style="color: var(--text-secondary); animation: pulse 2s infinite;">Loading metrics…</p>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">Recent Applications</h2>
        <div id="applications-table-container" class="glass-card-table" style="padding: 1.5rem; overflow-x: auto;">
          <p style="color: var(--text-secondary); animation: pulse 2s infinite;">Loading applications…</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-new-app').addEventListener('click', () => {
    setActiveNav(null);
    renderNewApplicationView();
  });

  const apps = await fetchApplications();
  populateDashboardData(apps);
}

function populateDashboardData(apps) {
  const total = apps.length;
  const interviewing = apps.filter(a => a.status === 'Interviewing' || a.status === 'Technical').length;
  const offers = apps.filter(a => a.status === 'Offer').length;
  const rejected = apps.filter(a => a.status === 'Rejected').length;

  document.getElementById('stats-container').innerHTML = `
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
    <div class="glass-card" style="padding: 1.5rem;">
      <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Rejected</h3>
      <p style="font-size: 2.5rem; font-weight: 700; color: var(--status-rejected);">${rejected}</p>
    </div>
  `;

  if (apps.length === 0) {
    document.getElementById('applications-table-container').innerHTML =
      `<p style="color: var(--text-secondary);">No applications yet. Click <strong>+ New Application</strong> to get started!</p>`;
    return;
  }

  const rows = apps.slice(0, 10).map(a => `
    <tr class="table-row">
      <td style="padding: 1rem; font-weight: 500;">${a.company_name || 'N/A'}</td>
      <td style="padding: 1rem; color: var(--text-secondary);">${a.job_title || 'N/A'}</td>
      <td style="padding: 1rem; color: var(--text-secondary);">${a.location || '—'}</td>
      <td style="padding: 1rem;">
        <span style="background-color: var(--glass-bg); border: 1px solid var(--border-color); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; color: ${getStatusColor(a.status)}; font-weight: 500;">
          ${a.status || 'Applied'}
        </span>
      </td>
      <td style="padding: 1rem; color: var(--text-secondary);">${a.application_date || '—'}</td>
    </tr>
  `).join('');

  document.getElementById('applications-table-container').innerHTML = `
    <style>
      .table-row { border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; }
      .table-row:last-child { border-bottom: none; }
      .table-row:hover { background-color: rgba(255,255,255,0.02); }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
    <table style="width: 100%; border-collapse: collapse; text-align: left;">
      <thead>
        <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">
          <th style="padding: 1rem; font-weight: 600;">Company</th>
          <th style="padding: 1rem; font-weight: 600;">Role</th>
          <th style="padding: 1rem; font-weight: 600;">Location</th>
          <th style="padding: 1rem; font-weight: 600;">Status</th>
          <th style="padding: 1rem; font-weight: 600;">Applied</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
