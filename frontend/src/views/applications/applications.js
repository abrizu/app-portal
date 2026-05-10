import { fetchApplications, fetchApplication, updateApplication, deleteApplication, fetchResumes, generatePassword, downloadResume } from '../../api.js';
import { SALARY_PRESETS, SOURCE_OPTIONS } from '../new_application/constants.js';
import { showToast, setActiveNav, getUniqueLocations } from '../../utils.js';
import { renderNewApplicationView } from '../new_application/newApplication.js';
import { renderDraftsListView } from '../new_application/drafts.js';
import { initTechTagInput } from '../new_application/techTagInput.js';
import {
  getApplicationsLayout,
  getAppTableHtml,
  getQuickStatusModalHtml,
  getDetailPanelHtml,
  getDeleteConfirmHtml,
  getEditApplicationLayout,
  getPaginationHtml
} from './template.js';
import { initLocationAutocomplete } from '../new_application/locationAutocomplete.js';

let _appCache = [];
let _appSort = { col: 'application_date', dir: 'desc' };
let _currentPage = 1;
let _itemsPerPage = 10;

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

  mainContent.innerHTML = getApplicationsLayout();

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

  document.getElementById('app-search').addEventListener('input', () => { _currentPage = 1; renderAppTable(); });
  document.getElementById('filter-status').addEventListener('change', () => { _currentPage = 1; renderAppTable(); });
  document.getElementById('filter-location').addEventListener('change', () => { _currentPage = 1; renderAppTable(); });
  document.getElementById('filter-type').addEventListener('change', () => { _currentPage = 1; renderAppTable(); });
}

function populateLocationFilter(apps) {
  const sel = document.getElementById('filter-location');
  if (!sel) return;
  const locs = getUniqueLocations(apps);
  const truncate = (str, max = 40) => str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
  sel.innerHTML = `<option value="">All Locations</option>` +
    locs.map(l => `<option value="${l}">${truncate(l)}</option>`).join('');
}

function renderAppTable() {
  const search = document.getElementById('app-search')?.value.trim() || '';
  const status = document.getElementById('filter-status')?.value || '';
  const location = document.getElementById('filter-location')?.value || '';
  const type = document.getElementById('filter-type')?.value || '';
  const apps = applyFiltersAndSort(_appCache, search, status, location, type);
  const wrap = document.getElementById('app-table-wrap');
  const countEl = document.getElementById('results-count');
  const pagWrap = document.getElementById('pagination-wrap');

  if (countEl) countEl.textContent = `${apps.length} application${apps.length !== 1 ? 's' : ''} found`;

  const totalPages = Math.ceil(apps.length / _itemsPerPage);
  if (_currentPage > totalPages && totalPages > 0) _currentPage = totalPages;
  if (_currentPage < 1) _currentPage = 1;

  const startIndex = (_currentPage - 1) * _itemsPerPage;
  const endIndex = startIndex + _itemsPerPage;
  const paginatedApps = apps.slice(startIndex, endIndex);

  wrap.innerHTML = getAppTableHtml(paginatedApps, _appSort);
  if (pagWrap) {
    pagWrap.innerHTML = getPaginationHtml(_currentPage, totalPages, _itemsPerPage, apps.length);
    
    const itemsSelect = document.getElementById('items-per-page');
    if (itemsSelect) {
      itemsSelect.addEventListener('change', (e) => {
        _itemsPerPage = parseInt(e.target.value, 10);
        _currentPage = 1;
        renderAppTable();
      });
    }

    const btnPrev = document.getElementById('btn-prev-page');
    if (btnPrev && !btnPrev.disabled) {
      btnPrev.addEventListener('click', () => {
        if (_currentPage > 1) { _currentPage--; renderAppTable(); }
      });
    }

    const btnNext = document.getElementById('btn-next-page');
    if (btnNext && !btnNext.disabled) {
      btnNext.addEventListener('click', () => {
        if (_currentPage < totalPages) { _currentPage++; renderAppTable(); }
      });
    }
  }

  if (paginatedApps.length === 0) return;

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
  wrap.querySelectorAll('.act-edit').forEach(btn => btn.addEventListener('click', () => renderEditApplicationView(parseInt(btn.dataset.id))));
  wrap.querySelectorAll('.act-del').forEach(btn => btn.addEventListener('click', () => showDeleteConfirm(parseInt(btn.dataset.id))));
}

async function showQuickStatusUpdate() {
  const apps = _appCache;
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = getQuickStatusModalHtml();
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

  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = getDetailPanelHtml(app);
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

  const pwToggle = overlay.querySelector('#detail-pw-toggle');
  if (pwToggle && app.app_password) {
    let revealed = false;
    pwToggle.addEventListener('click', () => {
      const display = overlay.querySelector('#detail-pw-display');
      revealed = !revealed;
      display.textContent = revealed ? app.app_password : '•'.repeat(app.app_password.length);
    });
  }

  const resumeLinks = overlay.querySelectorAll('.resume-link');
  resumeLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const filename = link.dataset.filename;
      if (!filename) return;

      const oldText = link.textContent;
      link.textContent = 'Opening...';
      link.style.pointerEvents = 'none';

      const blob = await downloadResume(filename);
      if (blob) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        showToast('Failed to download resume.', 'error');
      }

      link.textContent = oldText;
      link.style.pointerEvents = 'auto';
    });
  });
}

function showDeleteConfirm(id) {
  const app = _appCache.find(a => a.id === id);
  const name = app ? `${app.job_title} at ${app.company_name}` : `Application #${id}`;

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = getDeleteConfirmHtml(name);
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
  const _hourlyMatch = app.salary_range ? app.salary_range.match(/^\$(\d+(?:\.\d+)?)(?:\s*[–-]\s*\$(\d+(?:\.\d+)?))?\s*\/hr$/) : null;
  const salaryIsHourly = !!_hourlyMatch;
  if (_hourlyMatch) { app._hourly_min = _hourlyMatch[1]; app._hourly_max = _hourlyMatch[2] || ''; }
  const sourceIsPreset = SOURCE_OPTIONS.includes(app.source);

  mainContent.innerHTML = getEditApplicationLayout(app, salaryIsPreset, salaryIsHourly, sourceIsPreset);

  // Upgrade the Technologies field to the tag autocomplete widget
  initTechTagInput('technologies');

  // Upgrade the Location field to the autocomplete widget
  initLocationAutocomplete('location');

  const goBack = () => { setActiveNav('nav-applications'); renderApplicationsListView(); };
  document.getElementById('btn-back').addEventListener('click', goBack);
  document.getElementById('btn-cancel').addEventListener('click', goBack);

  resumesPromise.then(resumes => {
    const sel = document.getElementById('resume_used');
    if (sel) {
      sel.innerHTML = `<option value="">— None —</option>` +
        resumes.map(r => `<option value="${r}"${r === app.resume_used ? ' selected' : ''}>${r}</option>`).join('');
    }
  });

  const slider = document.getElementById('priority_score');
  const display = document.getElementById('priority-display');
  slider.addEventListener('input', () => {
    slider.style.setProperty('--pct', `${((slider.value - 1) / 9) * 100}%`);
    display.textContent = slider.value;
  });

  document.querySelectorAll('input[name="salary_mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const v = r.value;
      document.getElementById('salary-preset-wrap').style.display = v === 'preset' ? '' : 'none';
      document.getElementById('salary-hourly-wrap').style.display = v === 'hourly' ? '' : 'none';
      document.getElementById('salary-custom-wrap').style.display = v === 'custom' ? '' : 'none';
    });
  });

  document.querySelectorAll('input[name="source_mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const isCustom = r.value === 'custom';
      document.getElementById('source-preset-wrap').style.display = isCustom ? 'none' : '';
      document.getElementById('source-custom-wrap').style.display = isCustom ? '' : 'none';
    });
  });

  // Work type pill toggle — update label highlight on selection
  const updateWorkTypePills = () => {
    document.querySelectorAll('input[name="work_type"]').forEach(other => {
      const lbl = other.closest('label');
      const selected = other.checked;
      lbl.style.background = selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)';
      lbl.style.color = selected ? '#fff' : 'var(--text-secondary)';
      lbl.style.borderColor = selected ? 'var(--accent-primary)' : 'var(--border-color)';
    });
  };

  document.querySelectorAll('input[name="work_type"]').forEach(r => {
    // Initialize state
    if (r.checked) r.dataset.wasChecked = 'true';

    r.addEventListener('click', () => {
      if (r.dataset.wasChecked === 'true') {
        r.checked = false;
        r.dataset.wasChecked = 'false';
      } else {
        // Clear others
        document.querySelectorAll('input[name="work_type"]').forEach(i => i.dataset.wasChecked = 'false');
        r.dataset.wasChecked = 'true';
      }
      updateWorkTypePills();
    });
  });

  document.getElementById('edit-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleEditSubmit(id);
  });

  document.getElementById('btn-toggle-pw').addEventListener('click', () => {
    const pwInput = document.getElementById('app_password');
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('btn-gen-pw').addEventListener('click', async () => {
    const btn = document.getElementById('btn-gen-pw');
    btn.disabled = true;
    btn.textContent = '...';
    const pw = await generatePassword();
    if (pw) {
      document.getElementById('app_password').value = pw;
      document.getElementById('app_password').type = 'text';
    }
    btn.disabled = false;
    btn.textContent = 'Generate';
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
  if (salaryMode === 'hourly') {
    const mn = parseFloat(val('hourly_min'));
    const mx = parseFloat(val('hourly_max'));
    if (val('hourly_max') && !isNaN(mn) && !isNaN(mx) && mx < mn) {
      get('hourly_max').classList.add('error');
      showToast('Max rate cannot be less than the min rate.', 'error');
      return;
    }
  }
  const salary_range = salaryMode === 'hourly'
    ? (() => { const mn = val('hourly_min'); const mx = val('hourly_max'); const mxf = parseFloat(mx); const mnf = parseFloat(mn); return mn ? (mx && mxf !== mnf ? `$${mn}\u2013$${mx}/hr` : `$${mn}/hr`) : null; })()
    : salaryMode === 'custom' ? val('salary_range_custom') || null : val('salary_range_select') || null;
  const sourceMode = document.querySelector('input[name="source_mode"]:checked')?.value;
  const source = sourceMode === 'custom' ? val('source_custom') || null : val('source_select') || null;

  const payload = {
    job_title: val('job_title'), company_name: val('company_name'),
    posting_date: val('posting_date') || null, application_date: val('application_date') || null,
    status: val('status'), technologies: val('technologies') || null,
    posting_url: val('posting_url') || null, location: val('location') || null,
    work_type: document.querySelector('input[name="work_type"]:checked')?.value || null,
    job_type: val('job_type'), salary_range, source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
    app_username: val('app_username') || null,
    app_password: val('app_password') || null,
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

// Global keyboard shortcut for pagination
document.addEventListener('keydown', (e) => {
  const pagWrap = document.getElementById('pagination-wrap');
  if (!pagWrap) return; // Only active when pagination is rendered

  // Ignore if user is typing in an input, textarea, or select
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (['input', 'textarea', 'select'].includes(activeTag)) return;

  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
    if (btnPrev && !btnPrev.disabled) {
      btnPrev.click();
    }
  } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
    if (btnNext && !btnNext.disabled) {
      btnNext.click();
    }
  }
});
