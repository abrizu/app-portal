import { JOB_TYPE_OPTIONS, STATUS_OPTIONS, SALARY_PRESETS, SOURCE_OPTIONS } from '../../constants.js';

export function getNewApplicationLayout(draftId, app, today, salaryIsPreset, sourceIsPreset) {
  return `
    <div class="form-page page-enter">
      <div class="form-page-header">
        <button id="btn-back" class="btn-back">← Back</button>
        <div>
          <div class="form-page-title">${draftId ? 'Resume Draft' : 'New Application'}</div>
          <div class="form-page-subtitle">Fill in the details below — fields marked <span style="color:#ef4444;">*</span> are required.</div>
        </div>
      </div>

      <form id="new-app-form" novalidate>
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
              <input id="technologies" name="technologies" type="text" value="${app.technologies || ''}" />
              <div class="form-helper">Start typing to search — press <kbd style="font-size:0.7rem;padding:1px 5px;border:1px solid var(--border-color);border-radius:4px;background:rgba(255,255,255,0.06);">Enter</kbd> or <kbd style="font-size:0.7rem;padding:1px 5px;border:1px solid var(--border-color);border-radius:4px;background:rgba(255,255,255,0.06);">,</kbd> to add. Unknown techs are accepted too.</div>
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

        <div class="form-card">
          <div class="form-section-label">Compensation &amp; Source</div>
          <div class="form-grid">
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
              <div class="form-helper">Optional login credentials for the job posting site.</div>
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
}
