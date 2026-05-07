import { fetchApplications } from '../../api.js';
import { setActiveNav } from '../../utils.js';
import { renderNewApplicationView } from '../new_application/newApplication.js';
import { getDashboardLayout, getStatsHtml, getRecentAppsTableHtml } from './template.js';

export async function renderDashboardView() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = getDashboardLayout();

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

  const statsContainer = document.getElementById('stats-container');
  if (statsContainer) {
    statsContainer.innerHTML = getStatsHtml(total, interviewing, offers, rejected);
  }

  const tableContainer = document.getElementById('applications-table-container');
  if (tableContainer) {
    tableContainer.innerHTML = getRecentAppsTableHtml(apps);
  }
}
