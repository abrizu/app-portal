import { fetchDraft, fetchResumes, createDraft, updateDraft, createApplication, deleteDraft } from '../api.js';
import { SALARY_PRESETS, SOURCE_OPTIONS, JOB_TYPE_OPTIONS, STATUS_OPTIONS } from '../constants.js';
import { showToast, setActiveNav } from '../utils.js';
import { renderDraftsListView } from './drafts.js';
import { renderDashboardView } from './dashboard.js';

export async function renderNewApplicationView(draftId = null) {
  setActiveNav(null); // Unhighlight nav bar
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let app = {};
  if (draftId) {
    app = await fetchDraft(draftId) || {};
  }

  // Pre-fetch resumes while rendering the skeleton
  const resumesPromise = fetchResumes();
  const today = new Date().toISOString().split('T')[0];

  const salaryIsPreset = app.salary_range ? SALARY_PRESETS.includes(app.salary_range) : true;
  const sourceIsPreset = app.source ? SOURCE_OPTIONS.includes(app.source) : true;

  mainContent.innerHTML = `
    <div class="form-page page-enter">

      <div class="form-page-header">
        <button id="btn-back" class="btn-back">← Back</button>
        <div>
          <div class="form-page-title">${draftId ? 'Resume Draft' : 'New Application'}</div>
          <div class="form-page-subtitle">Fill in the details below — fields marked <span style="color:#ef4444;">*</span> are required.</div>
        </div>
      </div>

      <form id="new-app-form" novalidate>

        <!-- ── Job Details ── -->
        <div class="form-card">
          <div class="form-section-label">Job Details</div>
          <div class="form-grid">

            <div class="form-group">
              <label class="form-label" for="job_title">Job Title <span class="required">*</span></label>
              <input id="job_title" name="job_title" type="text" class="form-input" placeholder="e.g. Software Engineer Intern" value="${app.job_title || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="company_name">Company <span class="required">*</span></label>
              <input id="company_name" name="company_name" type="text" class="form-input" placeholder="e.g. Acme Corp" value="${app.company_name || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="location">Location</label>
              <input id="location" name="location" type="text" class="form-input" placeholder="e.g. New York, NY / Remote" value="${app.location || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="job_type">Job Type</label>
              <select id="job_type" name="job_type" class="form-select">
                ${JOB_TYPE_OPTIONS.map(o => `<option value="${o}"${o === (app.job_type || 'Full-time') ? ' selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="posting_url">Posting URL</label>
              <input id="posting_url" name="posting_url" type="url" class="form-input" placeholder="https://…" value="${app.posting_url || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="technologies">Technologies</label>
              <input id="technologies" name="technologies" type="text" class="form-input" placeholder="e.g. Python, React, SQL" value="${app.technologies || ''}" />
            </div>

          </div>
        </div>

        <!-- ── Dates & Status ── -->
        <div class="form-card">
          <div class="form-section-label">Dates &amp; Status</div>
          <div class="form-grid">

            <div class="form-group">
              <label class="form-label" for="posting_date">Posting Date</label>
              <input id="posting_date" name="posting_date" type="date" class="form-input" value="${app.posting_date || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="application_date">Application Date</label>
              <input id="application_date" name="application_date" type="date" class="form-input" value="${app.application_date || today}" readonly />
            </div>

            <div class="form-group">
              <label class="form-label" for="status">Status <span class="required">*</span></label>
              <select id="status" name="status" class="form-select">
                ${STATUS_OPTIONS.map(s => `<option value="${s}"${s === (app.status || 'Applied') ? ' selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>

          </div>
        </div>

        <!-- ── Compensation & Source ── -->
        <div class="form-card">
          <div class="form-section-label">Compensation &amp; Source</div>
          <div class="form-grid">

            <!-- Salary Range -->
            <div class="form-group span-2">
              <label class="form-label">Salary Range</label>
              <div class="pill-toggle" id="salary-toggle">
                <input type="radio" id="salary-preset" name="salary_mode" value="preset" ${salaryIsPreset ? 'checked' : ''}>
                <label for="salary-preset">Preset Range</label>
                <input type="radio" id="salary-custom" name="salary_mode" value="custom" ${!salaryIsPreset ? 'checked' : ''}>
                <label for="salary-custom">Custom / Other</label>
              </div>
              <div id="salary-preset-wrap" style="${!salaryIsPreset ? 'display:none;' : ''}">
                <select id="salary_range_select" class="form-select">
                  <option value="">— Select a range —</option>
                  ${SALARY_PRESETS.map(s => `<option value="${s}"${s === app.salary_range ? ' selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div id="salary-custom-wrap" style="${!salaryIsPreset ? '' : 'display:none;'}">
                <input id="salary_range_custom" type="text" class="form-input" placeholder="e.g. $55,000 – $65,000 or Competitive" value="${!salaryIsPreset ? (app.salary_range || '') : ''}" />
              </div>
            </div>

            <!-- Source -->
            <div class="form-group span-2">
              <label class="form-label">Source</label>
              <div class="pill-toggle" id="source-toggle">
                <input type="radio" id="source-preset" name="source_mode" value="preset" ${sourceIsPreset ? 'checked' : ''}>
                <label for="source-preset">Platform</label>
                <input type="radio" id="source-custom" name="source_mode" value="custom" ${!sourceIsPreset ? 'checked' : ''}>
                <label for="source-custom">Other</label>
              </div>
              <div id="source-preset-wrap" style="${!sourceIsPreset ? 'display:none;' : ''}">
                <select id="source_select" class="form-select">
                  <option value="">— Select a source —</option>
                  ${SOURCE_OPTIONS.map(s => `<option value="${s}"${s === app.source ? ' selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>
              <div id="source-custom-wrap" style="${!sourceIsPreset ? '' : 'display:none;'}">
                <input id="source_custom" type="text" class="form-input" placeholder="e.g. Professor referral, Discord community…" value="${!sourceIsPreset ? (app.source || '') : ''}" />
              </div>
            </div>

          </div>
        </div>

        <!-- ── Tracking ── -->
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
              <div class="form-helper">* 1 (Low Interest/Fit) to 10 (High Priority/Dream Job)</div>
            </div>

            <div class="form-group span-2">
              <label class="form-label" for="notes">Notes <span class="badge-optional">optional</span></label>
              <textarea id="notes" name="notes" class="form-textarea"
                placeholder="Any additional notes, recruiter contacts, follow-up reminders…">${app.notes || ''}</textarea>
            </div>

          </div>
        </div>

        <div class="form-actions">
          <button type="button" id="btn-cancel" class="btn btn-secondary">Cancel</button>
          <button type="button" id="btn-save-draft" class="btn btn-secondary">Save as Draft</button>
          <button type="submit" id="btn-submit" class="btn-submit">Submit Application</button>
        </div>

      </form>
    </div>
  `;

  function isNewAppFormDirty() {
    const val = (id) => document.getElementById(id)?.value.trim() || '';

    if (draftId) {
      const salaryMode = document.querySelector('input[name="salary_mode"]:checked')?.value;
      const salary_range = salaryMode === 'custom' ? val('salary_range_custom') : val('salary_range_select');
      const sourceMode = document.querySelector('input[name="source_mode"]:checked')?.value;
      const source = sourceMode === 'custom' ? val('source_custom') : val('source_select');

      return val('job_title') !== (app.job_title || '') ||
        val('company_name') !== (app.company_name || '') ||
        val('location') !== (app.location || '') ||
        val('posting_url') !== (app.posting_url || '') ||
        val('technologies') !== (app.technologies || '') ||
        val('notes') !== (app.notes || '') ||
        val('status') !== (app.status || 'Applied') ||
        val('job_type') !== (app.job_type || 'Full-time') ||
        document.getElementById('priority_score')?.value != (app.priority_score || 5) ||
        salary_range !== (app.salary_range || '') ||
        source !== (app.source || '');
    } else {
      const hasText = val('job_title') || val('company_name') || val('location') ||
        val('posting_url') || val('technologies') || val('notes') ||
        val('salary_range_custom') || val('source_custom') ||
        val('salary_range_select') || val('source_select');

      const statusChanged = val('status') !== 'Applied';
      const typeChanged = val('job_type') !== 'Full-time';
      const priorityChanged = document.getElementById('priority_score')?.value !== "5";

      return !!hasText || statusChanged || typeChanged || priorityChanged;
    }
  }

  // Back / Cancel
  const goBack = () => {
    if (isNewAppFormDirty()) {
      if (!confirm('Leave this page? Unsaved changes will be lost.')) {
        return;
      }
    }
    if (draftId) {
      setActiveNav('nav-applications');
      renderDraftsListView();
    } else {
      setActiveNav('nav-dashboard');
      renderDashboardView();
    }
  };
  document.getElementById('btn-back').addEventListener('click', goBack);
  document.getElementById('btn-cancel').addEventListener('click', goBack);

  // Populate resumes async
  resumesPromise.then(resumes => {
    const sel = document.getElementById('resume_used');
    sel.innerHTML = `<option value="">— None —</option>` +
      resumes.map(r => `<option value="${r}"${r === app.resume_used ? ' selected' : ''}>${r}</option>`).join('');
  });

  // Priority slider live update
  const slider = document.getElementById('priority_score');
  const display = document.getElementById('priority-display');
  slider.addEventListener('input', () => {
    const pct = ((slider.value - 1) / 9) * 100;
    slider.style.setProperty('--pct', `${pct}%`);
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

  // Form submit
  document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(draftId);
  });

  // Save as Draft
  document.getElementById('btn-save-draft').addEventListener('click', async () => {
    await handleSaveDraft(draftId);
  });
}

async function handleSaveDraft(draftId) {
  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value.trim();

  const salaryMode = document.querySelector('input[name="salary_mode"]:checked')?.value;
  const salary_range = salaryMode === 'custom' ? val('salary_range_custom') || null : val('salary_range_select') || null;

  const sourceMode = document.querySelector('input[name="source_mode"]:checked')?.value;
  const source = sourceMode === 'custom' ? val('source_custom') || null : val('source_select') || null;

  const payload = {
    job_title: val('job_title') || null,
    company_name: val('company_name') || null,
    posting_date: val('posting_date') || null,
    application_date: val('application_date') || null,
    status: val('status') || 'Draft',
    technologies: val('technologies') || null,
    posting_url: val('posting_url') || null,
    location: val('location') || null,
    job_type: val('job_type') || null,
    salary_range: salary_range,
    source: source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
  };

  // Date validation: posting_date cannot be in the future
  if (payload.posting_date) {
    const today = new Date().toISOString().split('T')[0];
    if (payload.posting_date > today) {
      get('posting_date').classList.add('error');
      showToast('Posting date cannot be in the future.', 'error');
      return;
    }
  }

  const btn = document.getElementById('btn-save-draft');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  let result;
  if (draftId) {
    result = await updateDraft(draftId, payload);
  } else {
    result = await createDraft(payload);
  }

  if (result?.success) {
    showToast('Draft saved successfully!', 'success');
    setTimeout(() => {
      setActiveNav(null);
      renderDraftsListView();
    }, 700);
  } else {
    showToast(result?.error || 'Failed to save draft.', 'error');
    btn.disabled = false;
    btn.textContent = 'Save as Draft';
  }
}

async function handleFormSubmit(draftId) {
  // Clear previous errors
  document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => el.classList.remove('error'));

  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value.trim();

  // Required field validation
  let valid = true;
  ['job_title', 'company_name', 'status'].forEach(id => {
    if (!val(id)) {
      get(id).classList.add('error');
      valid = false;
    }
  });
  if (!valid) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

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

  // Resolve salary & source based on toggle mode
  const salaryMode = document.querySelector('input[name="salary_mode"]:checked')?.value;
  const salary_range = salaryMode === 'custom'
    ? val('salary_range_custom') || null
    : val('salary_range_select') || null;

  const sourceMode = document.querySelector('input[name="source_mode"]:checked')?.value;
  const source = sourceMode === 'custom'
    ? val('source_custom') || null
    : val('source_select') || null;

  const payload = {
    job_title: val('job_title'),
    company_name: val('company_name'),
    posting_date: val('posting_date') || null,
    application_date: val('application_date') || null,
    status: val('status'),
    technologies: val('technologies') || null,
    posting_url: val('posting_url') || null,
    location: val('location') || null,
    job_type: val('job_type'),
    salary_range: salary_range,
    source: source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
  };

  const submitBtn = document.getElementById('btn-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const result = await createApplication(payload);

  if (result?.success) {
    if (draftId) {
      await deleteDraft(draftId);
    }
    showToast(`Application to ${payload.company_name} submitted!`, 'success');
    setTimeout(() => {
      setActiveNav('nav-dashboard');
      renderDashboardView();
    }, 700);
  } else {
    showToast(result?.error || 'Something went wrong. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
}
