import { fetchResumes, uploadResume, deleteResume, downloadResume, fetchCurrentUser, syncEmails } from './api.js';
import { renderProfileEditView } from './profileEdit.js';
import { renderEmailExtractorPanel } from '../emailExtractor.js';

export async function renderSettingsView() {
    const mainContent = document.getElementById('main-content');

    const user = await fetchCurrentUser();
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const initials = (firstName.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
    const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.username || 'User';

    mainContent.innerHTML = `
        <div class="page-enter">
            <div class="view-header" style="padding-bottom: 1.5rem;">
                <h1 class="view-title">Settings</h1>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 800px;">
            <!-- Profile Settings -->
            <div id="profile-settings-pill" class="glass" style="padding: 1.5rem; border-radius: 1rem; cursor: pointer; transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">Profile Settings</h2>
                    <svg style="width: 1.25rem; height: 1.25rem; color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 3rem; height: 3rem; border-radius: 50%; background: linear-gradient(to right, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem;">
                        ${initials}
                    </div>
                    <div>
                        <p style="font-weight: 500;">${displayName}</p>
                        <p style="font-size: 0.875rem; color: var(--text-secondary);">Manage your personal account</p>
                    </div>
                </div>
            </div>
            
            <!-- Resume Management -->
            <div class="glass" style="padding: 1.5rem; border-radius: 1rem;">
                <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">Resume Management</h2>
                
                <div id="resume-upload-zone" style="border: 2px dashed var(--border-color); border-radius: 0.5rem; padding: 2rem; text-align: center; margin-bottom: 1.5rem; cursor: pointer; transition: all 0.2s ease;">
                    <svg style="width: 3rem; height: 3rem; color: var(--text-secondary); margin: 0 auto 1rem auto;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p style="margin-bottom: 0.5rem; font-weight: 500;">Click or drag PDF to upload</p>
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">Only .pdf files are supported</p>
                    <input type="file" id="resume-file-input" accept=".pdf" style="display: none;">
                </div>
                
                <h3 style="font-size: 1rem; font-weight: 500; margin-bottom: 1rem; color: var(--text-secondary);">Uploaded Resumes</h3>
                <div id="resumes-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="text-align: center; color: var(--text-secondary); padding: 1rem;">Loading resumes...</div>
                </div>
                </div>

                <!-- Email Automation -->
                <div class="glass" style="padding: 1.5rem; border-radius: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 600;">Email Automation</h2>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">Scan your inbox for application confirmations and save them as drafts.</p>
                        </div>
                        <button id="btn-sync-emails" class="btn" style="background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; border-color: transparent; padding: 0.6rem 1.25rem; font-weight: 600; white-space: nowrap;">
                            ⟳ Sync Emails
                        </button>
                    </div>
                    <div id="email-sync-status" style="font-size: 0.82rem; color: var(--text-secondary); min-height: 1.2rem; margin-top: 0.5rem;"></div>
                    <div id="email-extractor-panel" style="margin-top: 1rem;"></div>
                </div>
            </div>
        </div>

        <div style="max-width: 800px; padding-top: 2.5rem; padding-bottom: 2rem; display: flex; justify-content: flex-end;">
            <button id="btn-logout" class="btn" style="background-color: #ef4444; color: #ffffff; border-color: transparent; padding: 0.75rem 2rem; font-weight: 600;">
                Logout
            </button>
        </div>
        </div>
    `;

    // Logout logic
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('auth_token');
        window.location.reload();
    });

    // Edit Profile Pill Click
    const profilePill = document.getElementById('profile-settings-pill');
    profilePill.addEventListener('click', () => {
        renderProfileEditView();
    });
    profilePill.addEventListener('mouseover', () => {
        profilePill.style.borderColor = '#3b82f6';
        profilePill.style.background = 'rgba(59, 130, 246, 0.05)';
    });
    profilePill.addEventListener('mouseout', () => {
        profilePill.style.borderColor = 'var(--border-color)';
        profilePill.style.background = 'var(--glass-bg)';
    });

    // Upload zone logic
    const uploadZone = document.getElementById('resume-upload-zone');
    const fileInput = document.getElementById('resume-file-input');

    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#3b82f6';
        uploadZone.style.background = 'rgba(59, 130, 246, 0.05)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--border-color)';
        uploadZone.style.background = 'transparent';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border-color)';
        uploadZone.style.background = 'transparent';

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    await renderResumesList();

    // Email Sync button
    const syncBtn = document.getElementById('btn-sync-emails');
    const syncStatus = document.getElementById('email-sync-status');
    const extractorPanel = document.getElementById('email-extractor-panel');

    // Auto-load extractor panel on settings open
    renderEmailExtractorPanel(extractorPanel);

    syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing…';
        syncStatus.textContent = 'Connecting to inbox…';
        syncStatus.style.color = 'var(--text-secondary)';

        const res = await syncEmails();

        syncBtn.disabled = false;
        syncBtn.textContent = '\u27f3 Sync Emails';

        if (res.success) {
            const s = res.summary;
            syncStatus.style.color = '#22c55e';
            syncStatus.textContent =
                `\u2713 Done — Scanned: ${s.scanned} | Confirmed: ${s.confirmed} | Rejected: ${s.rejected} | New drafts: ${s.drafts?.length ?? 0}`;
            // Refresh the extractor panel
            await renderEmailExtractorPanel(extractorPanel);
        } else {
            syncStatus.style.color = '#ef4444';
            syncStatus.textContent = `\u2717 ${res.error || 'Sync failed. Check your .env credentials.'}`;
        }
    });
}

async function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a valid PDF file.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadResume(formData);
    if (res.success) {
        await renderResumesList();
    } else {
        alert(res.error || 'Failed to upload resume.');
    }
}

async function renderResumesList() {
    const listContainer = document.getElementById('resumes-list');
    const resumes = await fetchResumes();

    if (resumes.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 0.5rem; border: 1px dashed var(--border-color);">
                No resumes uploaded yet.
            </div>
        `;
        return;
    }

    listContainer.innerHTML = resumes.map(filename => `
        <div class="glass" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-radius: 0.5rem; background: rgba(255, 255, 255, 0.03);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <svg style="width: 1.5rem; height: 1.5rem; color: #ffffff;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                </svg>
                <span style="font-weight: 500;">${filename}</span>
            </div>
            <button class="btn btn-delete-resume" data-filename="${filename}" style="padding: 0.35rem 0.6rem; background-color: #ef4444; color: #ffffff; border-color: transparent;">
                <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `).join('');

    // Attach delete listeners
    document.querySelectorAll('.btn-delete-resume').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const filename = e.currentTarget.dataset.filename;
            if (confirm(`Are you sure you want to delete ${filename}?`)) {
                const res = await deleteResume(filename);
                if (res.success) {
                    await renderResumesList();
                } else {
                    alert(res.error || 'Failed to delete resume.');
                }
            }
        });
    });
}
