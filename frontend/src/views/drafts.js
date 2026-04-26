import { fetchDrafts, deleteDraft } from '../api.js';
import { setActiveNav } from '../utils.js';
import { renderApplicationsListView } from './applications.js';
import { renderNewApplicationView } from './newApplication.js';

export async function renderDraftsListView() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="page-enter">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <div>
          <button id="btn-back-drafts" class="btn-back" style="margin-bottom: 1rem;">← Back to Applications</button>
          <h1>Drafts</h1>
        </div>
      </header>
      <div id="draft-table-wrap" class="glass-card-table" style="padding:1rem;overflow-x:auto;">
        <p style="color:var(--text-secondary);padding:2rem;text-align:center;animation:pulse 2s infinite;">Loading drafts…</p>
      </div>
    </div>
  `;

  document.getElementById('btn-back-drafts').addEventListener('click', () => {
    setActiveNav('nav-applications');
    renderApplicationsListView();
  });

  const drafts = await fetchDrafts();
  const wrap = document.getElementById('draft-table-wrap');

  if (drafts.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><p>No drafts found.</p></div>`;
    return;
  }

  const rows = drafts.map(d => `
    <tr class="app-row" data-id="${d.id}">
      <td style="font-weight:500;">${d.company_name || '—'}</td>
      <td style="color:var(--text-secondary);">${d.job_title || '—'}</td>
      <td style="color:var(--text-secondary);">${d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon act-edit" title="Resume Draft" data-id="${d.id}">✎</button>
          <button class="btn-icon danger act-del" title="Discard Draft" data-id="${d.id}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th style="text-align: left;">Company</th>
        <th style="text-align: left;">Role</th>
        <th style="text-align: left;">Last Updated</th>
        <th style="width:100px;"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  wrap.querySelectorAll('.act-edit').forEach(btn => btn.addEventListener('click', () => renderNewApplicationView(parseInt(btn.dataset.id))));
  wrap.querySelectorAll('.act-del').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Discard this draft?')) {
      await deleteDraft(parseInt(btn.dataset.id));
      renderDraftsListView();
    }
  }));
}
