import { STATUS_OPTIONS_GENERAL, JOB_TYPE_OPTIONS, SALARY_PRESETS, SOURCE_OPTIONS } from '../../constants.js';
import { getStatusColor } from '../../utils.js';

const _TECH_CATS = [
  {
    items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'C', 'C++', 'C#', 'Go',
      'Golang', 'Rust', 'Ruby', 'PHP',
      'Swift', 'Kotlin', 'Scala',
      'R', 'MATLAB', 'Julia',
      'Perl', 'Bash', 'Shell',
      'SQL', 'NoSQL', 'HTML',
      'CSS', 'Sass', 'Less'], color: { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.45)', text: '#93c5fd' }
  },

  {
    items: ['React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask',
      'FastAPI', 'Spring', 'Spring Boot', '.NET', 'ASP.NET', 'Rails', 'Laravel', 'Svelte',
      'Nuxt', 'Pandas', 'NumPy', 'SciPy', 'scikit-learn', 'TensorFlow', 'PyTorch', 'Keras',
      'OpenCV', 'PySpark', 'Spark', 'Hadoop', 'Airflow'],
    color: { bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.45)', text: '#c4b5fd' }
  },

  {
    items: ['AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s', 'Terraform',
      'Ansible', 'Jenkins', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Linux', 'Unix'],
    color: { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.45)', text: '#6ee7b7' }
  },

  { items: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'BigQuery', 'Snowflake', 'Databricks', 'Tableau', 'Power BI', 'Looker'], color: { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.45)', text: '#fcd34d' } },
  { items: ['Machine Learning', 'Deep Learning', 'NLP', 'Natural Language Processing', 'Computer Vision', 'AI', 'AI/ML', 'LLM', 'Generative AI', 'Data Science', 'Data Engineering', 'Data Analysis'], color: { bg: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.45)', text: '#f9a8d4' } },
  { items: ['REST', 'RESTful', 'GraphQL', 'API', 'Microservices', 'Agile', 'Scrum', 'Jira'], color: { bg: 'rgba(6,182,212,0.18)', border: 'rgba(6,182,212,0.45)', text: '#67e8f9' } },
];
const _CUSTOM_COLOR = { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.4)', text: '#d1d5db' };
function _techColor(label) {
  const k = label.toLowerCase();
  const cat = _TECH_CATS.find(c => c.items.some(i => i.toLowerCase() === k));
  return cat ? cat.color : _CUSTOM_COLOR;
}
function _categoryIndexOf(label) {
  const k = label.toLowerCase();
  const idx = _TECH_CATS.findIndex(cat => cat.items.some(i => i.toLowerCase() === k));
  return idx === -1 ? 9999 : idx;
}

export function getApplicationsLayout() {
  return `
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
}

export function getAppTableHtml(apps, appSort) {
  if (apps.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon"></div><p>No applications match your filters.</p></div>`;
  }

  const sortIcon = (col) => {
    if (appSort.col !== col) return '';
    return appSort.dir === 'asc' ? ' ↑' : ' ↓';
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

  return `
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
}

export function getQuickStatusModalHtml() {
  return `
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
}

export function getDetailPanelHtml(app) {
  const field = (label, value) => `
    <div>
      <div class="detail-field-label">${label}</div>
      <div class="detail-field-value">${value || '—'}</div>
    </div>`;

  const urlField = app.posting_url
    ? `<a href="${app.posting_url}" target="_blank" rel="noopener">${app.posting_url}</a>`
    : '—';

  return `
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
        ${field('Resume Used', app.resume_used ? `<a href="#" class="resume-link" data-filename="${app.resume_used}" style="color:var(--accent-primary);text-decoration:none;">${app.resume_used}</a>` : null)}
        ${field('Priority Score', app.priority_score != null ? `${app.priority_score} / 10` : null)}
        ${field('Attainability Score', app.attainability_score != null ? `${app.attainability_score} / 10` : null)}
      </div>

      <div style="margin-top:1rem;">
        <div class="detail-field-label">Technologies</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.4rem;">
          ${app.technologies
      ? app.technologies.split(',').map(t => t.trim()).filter(Boolean)
          .sort((a, b) => {
            const ia = _categoryIndexOf(a), ib = _categoryIndexOf(b);
            return ia !== ib ? ia - ib : a.localeCompare(b);
          })
          .map(t => {
            const c = _techColor(t);
            return `<span style="display:inline-flex;align-items:center;padding:0.22rem 0.6rem;border-radius:999px;border:1px solid ${c.border};background:${c.bg};color:${c.text};font-size:0.78rem;font-weight:500;">${t}</span>`;
          }).join('')
      : '<span style="color:var(--text-secondary);">—</span>'}
        </div>
      </div>
      <div style="margin-top:1rem;">${field('Posting URL', urlField)}</div>
      <div style="margin-top:1rem;">${field('Notes', app.notes)}</div>

      ${(app.app_username || app.app_password) ? `
      <div style="margin-top:1.5rem; padding-top:1rem; border-top: 1px solid var(--border-color);">
        <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--accent-primary);margin-bottom:1rem;">Account Credentials</div>
        <div class="detail-grid">
          ${field('Username', app.app_username)}
          <div>
            <div class="detail-field-label">Password</div>
            <div class="detail-field-value" style="display:flex;align-items:center;gap:0.5rem;">
              <span id="detail-pw-display" style="font-family:monospace;">${app.app_password ? '•'.repeat(app.app_password.length) : '—'}</span>
              ${app.app_password ? '<button type="button" id="detail-pw-toggle" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:0.9rem;padding:0;">👁</button>' : ''}
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="detail-actions">
        <button class="btn" id="detail-edit-btn">Edit</button>
        <button class="btn btn-secondary btn-danger" id="detail-delete-btn" style="margin-left:auto;">Delete</button>
      </div>
    </div>
  `;
}

export function getDeleteConfirmHtml(name) {
  return `
    <div class="confirm-box">
      <h3>Delete Application</h3>
      <p>Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone.</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn-danger" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;
}

export function getEditApplicationLayout(app, salaryIsPreset, sourceIsPreset) {
  return `
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
              <input id="technologies" name="technologies" type="text" value="${app.technologies || ''}" />
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

        <div class="form-card">
          <div class="form-section-label">Account Credentials <span class="badge-optional" style="text-transform:none;letter-spacing:0;">optional</span></div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="app_username">Username</label>
              <input id="app_username" name="app_username" type="text" class="form-input" placeholder="e.g. johndoe" value="${app.app_username || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="app_password">Password</label>
              <div style="display:flex;gap:0.5rem;">
                <div style="position:relative;flex:1;">
                  <input id="app_password" name="app_password" type="password" class="form-input" placeholder="Enter or generate" value="${app.app_password || ''}" style="padding-right:2.5rem;" />
                  <button type="button" id="btn-toggle-pw" title="Show/Hide" style="position:absolute;right:0.6rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:1rem;padding:0;">👁</button>
                </div>
                <button type="button" id="btn-gen-pw" class="btn btn-secondary" style="white-space:nowrap;font-size:0.8rem;">Generate</button>
              </div>
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
}
