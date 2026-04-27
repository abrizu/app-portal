import { fetchApplications, fetchApplication, updateApplication, deleteApplication, fetchResumes } from '../api.js';
import { STATUS_OPTIONS_GENERAL, JOB_TYPE_OPTIONS, SALARY_PRESETS, SOURCE_OPTIONS } from '../constants.js';
import { showToast, setActiveNav, getStatusColor, getUniqueLocations } from '../utils.js';
import { renderNewApplicationView } from './newApplication.js';
import { renderDraftsListView } from './drafts.js';

let _appCache = [];
let _appSort = { col: 'application_date', dir: 'desc' };

function applyFiltersAndSort(apps, search, status, location, type) {
  let filtered = apps;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      (a.job_title || '').toLowerCase().includes(q) ||
      (a.company_name || '').toLowerCase().includes(q) ||
      (a.technologies || '').toLowerCase().includes(q) ||
      (a.notes || '').toLowerCase().includes(q) ||
      (a.source || '').toLowerCase().includes(q)
    );
  }
  if (status) filtered = filtered.filter(a => a.status === status);
  if (location) {
    const loc = location.toLowerCase();
    filtered = filtered.filter(a => (a.location || '').toLowerCase().includes(loc));
  }
  if (type) filtered = filtered.filter(a => a.job_type === type);

  const { col, dir } = _appSort;
  filtered.sort((a, b) => {
    let va = a[col] ?? '', vb = b[col] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
  return filtered;
}

export async function renderApplicationsListView() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="page-enter">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
        <h1>Applications</h1>
        <div style="display:flex; gap:0.5rem;">
          <button id="btn-quick-status" class="btn btn-secondary">Quick Status</button>
          <button id="btn-drafts-list" class="btn btn-secondary">Drafts</button>
          <button id="btn-new-app-list" class="btn">+ New Application</button>
        </div>
      </header>

      <div class="app-toolbar">
        <input id="app-search" type="text" class="search-input" placeholder="Search by keyword, tech, company…" />
        <select id="filter-status" class="filter-select">
          <option value="">All Statuses</option>
          ${STATUS_OPTIONS_GENERAL.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="filter-location" class="filter-select">
          <option value="">All Locations</option>
        </select>
        <select id="filter-type" class="filter-select">
          <option value="">All Types</option>
          ${JOB_TYPE_OPTIONS.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>

      <div id="results-count" class="results-count"></div>

      <div id="app-table-wrap" class="glass-card-table" style="padding:1rem;overflow-x:auto;">
        <p style="color:var(--text-secondary);padding:2rem;text-align:center;animation:pulse 2s infinite;">Loading applications…</p>
      </div>
    </div>
  `;

  document.getElementById('btn-new-app-list').addEventListener('click', () => {
    setActiveNav(null);
    renderNewApplicationView();
  });
  document.getElementById('btn-drafts-list').addEventListener('click', () => {
    setActiveNav(null);
    renderDraftsListView();
  });
  document.getElementById('btn-quick-status').addEventListener('click', () => showQuickStatusUpdate());

  _appCache = await fetchApplications();
  populateLocationFilter(_appCache);
  renderAppTable();

  document.getElementById('app-search').addEventListener('input', () => renderAppTable());
  document.getElementById('filter-status').addEventListener('change', () => renderAppTable());
  document.getElementById('filter-location').addEventListener('change', () => renderAppTable());
  document.getElementById('filter-type').addEventListener('change', () => renderAppTable());
}

function populateLocationFilter(apps) {
  const sel = document.getElementById('filter-location');
  if (!sel) return;
  const locs = getUniqueLocations(apps);
  sel.innerHTML = `<option value="">All Locations</option>` +
    locs.map(l => `<option value="${l}">${l}</option>`).join('');
}

function renderAppTable() {
  const search = document.getElementById('app-search')?.value.trim() || '';
  const status = document.getElementById('filter-status')?.value || '';
  const location = document.getElementById('filter-location')?.value || '';
  const type = document.getElementById('filter-type')?.value || '';
  const apps = applyFiltersAndSort(_appCache, search, status, location, type);
  const wrap = document.getElementById('app-table-wrap');
  const countEl = document.getElementById('results-count');

  if (countEl) countEl.textContent = `${apps.length} application${apps.length !== 1 ? 's' : ''} found`;

  if (apps.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No applications match your filters.</p></div>`;
    return;
  }

  const sortIcon = (col) => {
    if (_appSort.col !== col) return '';
    return _appSort.dir === 'asc' ? ' ↑' : ' ↓';
  };

  const rows = apps.map(a => `
    <tr class="app-row" data-id="${a.id}">
      <td style="font-weight:500;">${a.company_name || 'N/A'}</td>
      <td style="color:var(--text-secondary);">${a.job_title || 'N/A'}</td>
      <td style="color:var(--text-secondary);">${a.location || '—'}</td>
      <td><span class="status-pill" style="color:${getStatusColor(a.status)}">${a.status || 'Applied'}</span></td>
      <td style="color:var(--text-secondary);">${a.job_type || '—'}</td>
      <td style="color:var(--text-secondary);">${a.application_date || '—'}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon act-edit" title="Edit" data-id="${a.id}">✎</button>
          <button class="btn-icon danger act-del" title="Delete" data-id="${a.id}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  wrap.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th class="sortable" data-col="company_name">Company${sortIcon('company_name')}</th>
        <th class="sortable" data-col="job_title">Role${sortIcon('job_title')}</th>
        <th class="sortable" data-col="location">Location${sortIcon('location')}</th>
        <th class="sortable" data-col="status">Status${sortIcon('status')}</th>
        <th class="sortable" data-col="job_type">Type${sortIcon('job_type')}</th>
        <th class="sortable" data-col="application_date">Applied${sortIcon('application_date')}</th>
        <th style="width:100px;"></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // Sort headers
  wrap.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (_appSort.col === col) _appSort.dir = _appSort.dir === 'asc' ? 'desc' : 'asc';
      else { _appSort.col = col; _appSort.dir = 'asc'; }
      renderAppTable();
    });
  });

  // Row click → view
  wrap.querySelectorAll('.app-row').forEach(tr => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-icon')) return;
      openDetailPanel(parseInt(tr.dataset.id));
    });
  });

  // Action buttons
  wrap.querySelectorAll('.act-view').forEach(btn => btn.addEventListener('click', () => openDetailPanel(parseInt(btn.dataset.id))));
  wrap.querySelectorAll('.act-edit').forEach(btn => btn.addEventListener('click', () => renderEditApplicationView(parseInt(btn.dataset.id))));
  wrap.querySelectorAll('.act-del').forEach(btn => btn.addEventListener('click', () => showDeleteConfirm(parseInt(btn.dataset.id))));
}

async function showQuickStatusUpdate() {
  const apps = _appCache;
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box" style="max-width: 500px; text-align: left;">
      <h3 style="margin-bottom: 1rem;">Quick Status Update</h3>
      
      <div class="form-group" style="margin-bottom: 1rem;">
        <label class="form-label">Search Application</label>
        <input id="quick-app-search" type="text" class="form-input" placeholder="Type company or role..." autocomplete="off">
        <div id="quick-app-results" class="glass-card" style="margin-top: 0.5rem; max-height: 200px; overflow-y: auto; display: none; padding: 0.5rem; border-color: var(--accent-primary);"></div>
      </div>

      <div id="quick-status-selector" style="display: none;">
        <label class="form-label" style="margin-bottom: 0.5rem; display: block;">New Status</label>
        <div class="status-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          ${STATUS_OPTIONS_GENERAL.map(s => `
            <button class="btn btn-secondary quick-status-btn" data-status="${s}" style="font-size: 0.8rem; padding: 0.5rem;">${s}</button>
          `).join('')}
        </div>
      </div>

      <div class="confirm-actions" style="margin-top: 1.5rem; justify-content: flex-end;">
        <button class="btn btn-secondary" id="quick-cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const searchInput = document.getElementById('quick-app-search');
  const resultsDiv = document.getElementById('quick-app-results');
  const statusSelector = document.getElementById('quick-status-selector');
  let selectedAppId = null;

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', handleEsc);
  };
  const handleEsc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', handleEsc);

  document.getElementById('quick-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    if (!q) {
      resultsDiv.style.display = 'none';
      return;
    }
    const matches = apps.filter(a =>
      (a.company_name || '').toLowerCase().includes(q) ||
      (a.job_title || '').toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length > 0) {
      resultsDiv.innerHTML = matches.map(a => `
        <div class="quick-app-item" data-id="${a.id}" style="padding: 0.5rem; cursor: pointer; border-radius: 4px; transition: background 0.2s;">
          <div style="font-weight: 500; font-size: 0.9rem;">${a.company_name}</div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">${a.job_title} • ${a.status}</div>
        </div>
      `).join('');
      resultsDiv.style.display = 'block';

      resultsDiv.querySelectorAll('.quick-app-item').forEach(item => {
        item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.05)');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
        item.addEventListener('click', () => {
          selectedAppId = parseInt(item.dataset.id);
          const app = apps.find(a => a.id === selectedAppId);
          searchInput.value = `${app.company_name} - ${app.job_title}`;
          resultsDiv.style.display = 'none';
          statusSelector.style.display = 'block';
        });
      });
    } else {
      resultsDiv.innerHTML = '<div style="padding: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">No matches found</div>';
      resultsDiv.style.display = 'block';
    }
  });

  overlay.querySelectorAll('.quick-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedAppId) return;
      const newStatus = btn.dataset.status;
      const app = apps.find(a => a.id === selectedAppId);

      btn.disabled = true;
      btn.textContent = 'Updating...';

      const result = await updateApplication(selectedAppId, { status: newStatus });
      if (result?.success) {
        showToast(`Updated "${app.company_name}" to ${newStatus}`, 'success');
        close();
        // Refresh cache and view
        _appCache = await fetchApplications();
        renderAppTable();
      } else {
        showToast(result?.error || 'Update failed', 'error');
        btn.disabled = false;
        btn.textContent = newStatus;
      }
    });
  });
}

async function openDetailPanel(id) {
  const app = _appCache.find(a => a.id === id) || await fetchApplication(id);
  if (!app) { showToast('Application not found.', 'error'); return; }

  const field = (label, value) => `
    <div>
      <div class="detail-field-label">${label}</div>
      <div class="detail-field-value">${value || '—'}</div>
    </div>`;

  const urlField = app.posting_url
    ? `<a href="${app.posting_url}" target="_blank" rel="noopener">${app.posting_url}</a>`
    : '—';

  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = `
    <div class="detail-panel">
      <div class="detail-header">
        <div>
          <div class="detail-title">${app.job_title || 'Untitled'}</div>
          <div class="detail-company">${app.company_name || ''}</div>
        </div>
        <button class="btn-icon close-panel" title="Close" style="font-size:1.2rem;">✕</button>
      </div>

      <div class="detail-grid">
        ${field('Status', `<span class="status-pill" style="color:${getStatusColor(app.status)}">${app.status || 'Applied'}</span>`)}
        ${field('Location', app.location)}
        ${field('Job Type', app.job_type)}
        ${field('Salary Range', app.salary_range)}
        ${field('Application Date', app.application_date)}
        ${field('Posting Date', app.posting_date)}
        ${field('Source', app.source)}
        ${field('Resume Used', app.resume_used)}
        ${field('Priority Score', app.priority_score != null ? `${app.priority_score} / 10` : null)}
        ${field('Attainability Score', app.attainability_score != null ? `${app.attainability_score} / 10` : null)}
      </div>

      ${field('Technologies', app.technologies)}
      <div style="margin-top:1rem;">${field('Posting URL', urlField)}</div>
      <div style="margin-top:1rem;">${field('Notes', app.notes)}</div>

      <div class="detail-actions">
        <button class="btn" id="detail-edit-btn">Edit</button>
        <button class="btn btn-secondary btn-danger" id="detail-delete-btn" style="margin-left:auto;">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', handleEsc);
  };
  const handleEsc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', handleEsc);

  overlay.querySelector('.close-panel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#detail-edit-btn').addEventListener('click', () => { close(); renderEditApplicationView(id); });
  overlay.querySelector('#detail-delete-btn').addEventListener('click', () => { close(); showDeleteConfirm(id); });
}

function showDeleteConfirm(id) {
  const app = _appCache.find(a => a.id === id);
  const name = app ? `${app.job_title} at ${app.company_name}` : `Application #${id}`;

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>Delete Application</h3>
      <p>Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone.</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', handleEsc);
  };
  const handleEsc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', handleEsc);

  overlay.querySelector('#confirm-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#confirm-delete').addEventListener('click', async () => {
    const result = await deleteApplication(id);
    close();
    if (result?.success) {
      showToast(`Deleted "${name}".`, 'success');
      _appCache = _appCache.filter(a => a.id !== id);
      renderAppTable();
    } else {
      showToast(result?.error || 'Failed to delete.', 'error');
    }
  });
}

async function renderEditApplicationView(id) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const app = _appCache.find(a => a.id === id) || await fetchApplication(id);
  if (!app) { showToast('Application not found.', 'error'); return; }

  const resumesPromise = fetchResumes();

  const salaryIsPreset = SALARY_PRESETS.includes(app.salary_range);
  const sourceIsPreset = SOURCE_OPTIONS.includes(app.source);

  mainContent.innerHTML = `
    <div class="form-page page-enter">
      <div class="form-page-header">
        <button id="btn-back" class="btn-back">← Back</button>
        <div>
          <div class="form-page-title">Edit Application</div>
          <div class="form-page-subtitle">Editing: ${app.job_title} at ${app.company_name}</div>
        </div>
      </div>

      <form id="edit-app-form" novalidate>

        <div class="form-card">
          <div class="form-section-label">Job Details</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="job_title">Job Title <span class="required">*</span></label>
              <input id="job_title" name="job_title" type="text" class="form-input" value="${app.job_title || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="company_name">Company <span class="required">*</span></label>
              <input id="company_name" name="company_name" type="text" class="form-input" value="${app.company_name || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="location">Location</label>
              <input id="location" name="location" type="text" class="form-input" value="${app.location || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="job_type">Job Type</label>
              <select id="job_type" name="job_type" class="form-select">
                ${JOB_TYPE_OPTIONS.map(o => `<option value="${o}"${o === app.job_type ? ' selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="posting_url">Posting URL</label>
              <input id="posting_url" name="posting_url" type="url" class="form-input" value="${app.posting_url || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="technologies">Technologies</label>
              <input id="technologies" name="technologies" type="text" class="form-input" value="${app.technologies || ''}" />
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="form-section-label">Dates &amp; Status</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="posting_date">Posting Date</label>
              <input id="posting_date" name="posting_date" type="date" class="form-input" value="${app.posting_date || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="application_date">Application Date</label>
              <input id="application_date" name="application_date" type="date" class="form-input" value="${app.application_date || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="status">Status <span class="required">*</span></label>
              <select id="status" name="status" class="form-select">
                ${STATUS_OPTIONS_GENERAL.map(s => `<option value="${s}"${s === app.status ? ' selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="form-section-label">Compensation &amp; Source</div>
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Salary Range</label>
              <div class="pill-toggle" id="salary-toggle">
                <input type="radio" id="salary-preset" name="salary_mode" value="preset" ${salaryIsPreset || !app.salary_range ? 'checked' : ''}>
                <label for="salary-preset">Preset Range</label>
                <input type="radio" id="salary-custom" name="salary_mode" value="custom" ${!salaryIsPreset && app.salary_range ? 'checked' : ''}>
                <label for="salary-custom">Custom / Other</label>
              </div>
              <div id="salary-preset-wrap" style="${!salaryIsPreset && app.salary_range ? 'display:none;' : ''}">
                <select id="salary_range_select" class="form-select">
                  <option value="">— Select a range —</option>
                  ${SALARY_PRESETS.map(s => `<option value="${s}"${s === app.salary_range ? ' selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div id="salary-custom-wrap" style="${!salaryIsPreset && app.salary_range ? '' : 'display:none;'}">
                <input id="salary_range_custom" type="text" class="form-input" value="${!salaryIsPreset ? (app.salary_range || '') : ''}" />
              </div>
            </div>
            <div class="form-group span-2">
              <label class="form-label">Source</label>
              <div class="pill-toggle" id="source-toggle">
                <input type="radio" id="source-preset" name="source_mode" value="preset" ${sourceIsPreset || !app.source ? 'checked' : ''}>
                <label for="source-preset">Platform</label>
                <input type="radio" id="source-custom" name="source_mode" value="custom" ${!sourceIsPreset && app.source ? 'checked' : ''}>
                <label for="source-custom">Other</label>
              </div>
              <div id="source-preset-wrap" style="${!sourceIsPreset && app.source ? 'display:none;' : ''}">
                <select id="source_select" class="form-select">
                  <option value="">— Select a source —</option>
                  ${SOURCE_OPTIONS.map(s => `<option value="${s}"${s === app.source ? ' selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div id="source-custom-wrap" style="${!sourceIsPreset && app.source ? '' : 'display:none;'}">
                <input id="source_custom" type="text" class="form-input" value="${!sourceIsPreset ? (app.source || '') : ''}" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="form-section-label">Tracking</div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="resume_used">Resume Used</label>
              <select id="resume_used" name="resume_used" class="form-select">
                <option value="">Loading resumes…</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority Score</label>
              <div class="priority-row">
                <input id="priority_score" type="range" min="1" max="10" value="${app.priority_score || 5}" step="1"
                  class="priority-slider" style="--pct: ${(((app.priority_score || 5) - 1) / 9) * 100}%;" />
                <span id="priority-display" class="priority-value">${app.priority_score || 5}</span>
              </div>
            </div>
            <div class="form-group span-2">
              <label class="form-label" for="notes">Notes <span class="badge-optional">optional</span></label>
              <textarea id="notes" name="notes" class="form-textarea">${app.notes || ''}</textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" id="btn-cancel" class="btn btn-secondary">Cancel</button>
          <button type="submit" id="btn-submit" class="btn-submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  // Back / Cancel → return to list
  const goBack = () => { setActiveNav('nav-applications'); renderApplicationsListView(); };
  document.getElementById('btn-back').addEventListener('click', goBack);
  document.getElementById('btn-cancel').addEventListener('click', goBack);

  // Populate resumes
  resumesPromise.then(resumes => {
    const sel = document.getElementById('resume_used');
    sel.innerHTML = `<option value="">— None —</option>` +
      resumes.map(r => `<option value="${r}"${r === app.resume_used ? ' selected' : ''}>${r}</option>`).join('');
  });

  // Priority slider
  const slider = document.getElementById('priority_score');
  const display = document.getElementById('priority-display');
  slider.addEventListener('input', () => {
    slider.style.setProperty('--pct', `${((slider.value - 1) / 9) * 100}%`);
    display.textContent = slider.value;
  });

  // Salary toggle
  document.querySelectorAll('input[name="salary_mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const isCustom = r.value === 'custom';
      document.getElementById('salary-preset-wrap').style.display = isCustom ? 'none' : '';
      document.getElementById('salary-custom-wrap').style.display = isCustom ? '' : 'none';
    });
  });

  // Source toggle
  document.querySelectorAll('input[name="source_mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const isCustom = r.value === 'custom';
      document.getElementById('source-preset-wrap').style.display = isCustom ? 'none' : '';
      document.getElementById('source-custom-wrap').style.display = isCustom ? '' : 'none';
    });
  });

  // Submit
  document.getElementById('edit-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEditSubmit(id);
  });
}

async function handleEditSubmit(id) {
  document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => el.classList.remove('error'));
  const get = (i) => document.getElementById(i);
  const val = (i) => get(i)?.value.trim();

  let valid = true;
  ['job_title', 'company_name', 'status'].forEach(i => {
    if (!val(i)) { get(i).classList.add('error'); valid = false; }
  });
  if (!valid) { showToast('Please fill in all required fields.', 'error'); return; }

  // Date validation: posting_date cannot be in the future
  const postingDate = val('posting_date');
  if (postingDate) {
    const today = new Date().toISOString().split('T')[0];
    if (postingDate > today) {
      get('posting_date').classList.add('error');
      showToast('Posting date cannot be in the future.', 'error');
      return;
    }
  }

  const salaryMode = document.querySelector('input[name="salary_mode"]:checked')?.value;
  const salary_range = salaryMode === 'custom' ? val('salary_range_custom') || null : val('salary_range_select') || null;
  const sourceMode = document.querySelector('input[name="source_mode"]:checked')?.value;
  const source = sourceMode === 'custom' ? val('source_custom') || null : val('source_select') || null;

  const payload = {
    job_title: val('job_title'), company_name: val('company_name'),
    posting_date: val('posting_date') || null, application_date: val('application_date') || null,
    status: val('status'), technologies: val('technologies') || null,
    posting_url: val('posting_url') || null, location: val('location') || null,
    job_type: val('job_type'), salary_range, source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
  };

  const submitBtn = document.getElementById('btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  const result = await updateApplication(id, payload);
  if (result?.success) {
    showToast(`Updated "${payload.company_name}" successfully!`, 'success');
    setTimeout(() => { setActiveNav('nav-applications'); renderApplicationsListView(); }, 700);
  } else {
    showToast(result?.error || 'Something went wrong.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
}
