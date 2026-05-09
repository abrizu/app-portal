import { fetchDraft, fetchResumes, createDraft, updateDraft, createApplication, deleteDraft, generatePassword } from '../../api.js';
import { SALARY_PRESETS, SOURCE_OPTIONS } from '../../constants.js';
import { showToast, setActiveNav } from '../../utils.js';
import { renderDraftsListView } from '../drafts.js';
import { renderDashboardView } from '../dashboard/dashboard.js';
import { getNewApplicationLayout } from './template.js';
import { initTechTagInput } from '../../techTagInput.js';

export async function renderNewApplicationView(draftId = null) {
  setActiveNav(null);
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  let app = {};
  if (draftId) {
    app = await fetchDraft(draftId) || {};
  }

  const resumesPromise = fetchResumes();
  const today = new Date().toISOString().split('T')[0];

  const salaryIsPreset = app.salary_range ? SALARY_PRESETS.includes(app.salary_range) : true;
  const _hourlyMatch = app.salary_range ? app.salary_range.match(/^\$(\d+(?:\.\d+)?)(?:\s*[–-]\s*\$(\d+(?:\.\d+)?))?\s*\/hr$/) : null;
  const salaryIsHourly = !!_hourlyMatch;
  if (_hourlyMatch) { app._hourly_min = _hourlyMatch[1]; app._hourly_max = _hourlyMatch[2] || ''; }
  const sourceIsPreset = app.source ? SOURCE_OPTIONS.includes(app.source) : true;

  mainContent.innerHTML = getNewApplicationLayout(draftId, app, today, salaryIsPreset, salaryIsHourly, sourceIsPreset);

  // Upgrade the Technologies field to the tag autocomplete widget
  initTechTagInput('technologies');

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
    const pct = ((slider.value - 1) / 9) * 100;
    slider.style.setProperty('--pct', `${pct}%`);
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
  document.querySelectorAll('input[name="work_type"]').forEach(r => {
    r.addEventListener('change', () => {
      document.querySelectorAll('input[name="work_type"]').forEach(other => {
        const lbl = other.closest('label');
        const selected = other.checked;
        lbl.style.background = selected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)';
        lbl.style.color = selected ? '#fff' : 'var(--text-secondary)';
        lbl.style.borderColor = selected ? 'var(--accent-primary)' : 'var(--border-color)';
      });
    });
  });

  document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(draftId);
  });

  document.getElementById('btn-save-draft').addEventListener('click', async () => {
    await handleSaveDraft(draftId);
  });
}

async function handleSaveDraft(draftId) {
  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value.trim();

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
    : salaryMode === 'custom' ? val('salary_range_custom') || null
      : val('salary_range_select') || null;

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
    work_type: document.querySelector('input[name="work_type"]:checked')?.value || null,
    job_type: val('job_type') || null,
    salary_range: salary_range,
    source: source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
    app_username: val('app_username') || null,
    app_password: val('app_password') || null,
  };

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
  document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => el.classList.remove('error'));

  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value.trim();

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
    : salaryMode === 'custom'
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
    work_type: document.querySelector('input[name="work_type"]:checked')?.value || null,
    job_type: val('job_type'),
    salary_range: salary_range,
    source: source,
    resume_used: val('resume_used') || null,
    priority_score: parseInt(get('priority_score').value, 10),
    notes: val('notes') || null,
    app_username: val('app_username') || null,
    app_password: val('app_password') || null,
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
