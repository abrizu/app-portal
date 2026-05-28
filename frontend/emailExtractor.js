/**
 * emailExtractor.js
 * 
 * Renders the Email Extractor panel — shows extracted drafts from the last
 * email sync and lets the user review / discard each one before it goes live.
 *
 * Used by settings.js after the user triggers a sync.
 * Also exposes renderEmailExtractorPanel() for standalone use.
 */

import { fetchDrafts, deleteDraft, createApplication, updateDraft } from './src/api.js';

// ─────────────────── CSS (injected once) ────────────────────────

const STYLES_ID = 'email-extractor-styles';

function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    const style = document.createElement('style');
    style.id = STYLES_ID;
    style.textContent = `
        .ee-panel {
            max-width: 860px;
        }
        .ee-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .ee-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        .ee-subtitle {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 0.15rem;
        }
        .ee-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 1.25rem 1.5rem;
            margin-bottom: 0.75rem;
            transition: border-color 0.2s ease;
        }
        .ee-card:hover {
            border-color: #3b82f6;
        }
        .ee-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
        }
        .ee-badge {
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
        }
        .ee-badge-confirm {
            background: rgba(34, 197, 94, 0.15);
            color: #22c55e;
        }
        .ee-badge-reject {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
        }
        .ee-badge-other {
            background: rgba(156, 163, 175, 0.15);
            color: #9ca3af;
        }
        .ee-job-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        .ee-company {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.15rem;
        }
        .ee-note {
            font-size: 0.78rem;
            color: var(--text-secondary);
            margin-top: 0.6rem;
            white-space: pre-wrap;
            border-left: 2px solid var(--border-color);
            padding-left: 0.75rem;
            max-height: 80px;
            overflow: hidden;
        }
        .ee-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        .ee-btn {
            padding: 0.4rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            transition: opacity 0.15s ease, transform 0.1s ease;
        }
        .ee-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .ee-btn:active { transform: translateY(0); }
        .ee-btn-approve {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: #fff;
        }
        .ee-btn-discard {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border-color: rgba(239, 68, 68, 0.3);
        }
        .ee-empty {
            text-align: center;
            color: var(--text-secondary);
            padding: 2rem;
            font-size: 0.9rem;
        }
        .ee-toast {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            background: #1e293b;
            color: #fff;
            border-radius: 0.5rem;
            padding: 0.75rem 1.25rem;
            font-size: 0.85rem;
            z-index: 9999;
            box-shadow: 0 4px 24px rgba(0,0,0,0.4);
            animation: ee-fadein 0.2s ease;
        }
        @keyframes ee-fadein {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}


// ─────────────────── helpers ────────────────────────

function showToast(msg, color = '#22c55e') {
    const t = document.createElement('div');
    t.className = 'ee-toast';
    t.style.borderLeft = `4px solid ${color}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

/** Pull the subject line out of the auto-import note stored in draft.notes */
function parseNoteSubject(notes) {
    if (!notes) return null;
    const m = notes.match(/Subject:\s*(.+)/);
    return m ? m[1].trim() : null;
}

// ─────────────────── render ────────────────────────

/**
 * Renders the email extractor draft review panel into `container`.
 * Only shows drafts that were auto-imported from email (notes contains [AUTO-IMPORTED]).
 *
 * @param {HTMLElement} container  - DOM element to render into
 */
export async function renderEmailExtractorPanel(container) {
    injectStyles();

    container.innerHTML = `<div class="ee-panel">
        <div class="ee-header">
            <div>
                <div class="ee-title">📬 Extracted Drafts</div>
                <div class="ee-subtitle">Auto-imported from email sync — review before approving.</div>
            </div>
            <button id="ee-refresh-btn" class="ee-btn ee-btn-approve" style="font-size:0.75rem;">↻ Refresh</button>
        </div>
        <div id="ee-list">
            <div class="ee-empty">Loading drafts…</div>
        </div>
    </div>`;

    document.getElementById('ee-refresh-btn').addEventListener('click', () => loadDrafts(container));
    await loadDrafts(container);
}

async function loadDrafts(container) {
    const list = container.querySelector('#ee-list');
    list.innerHTML = `<div class="ee-empty">Loading drafts…</div>`;

    const allDrafts = await fetchDrafts();
    // Only show auto-imported ones
    const emailDrafts = allDrafts.filter(d => d.notes && d.notes.includes('[AUTO-IMPORTED'));

    if (emailDrafts.length === 0) {
        list.innerHTML = `<div class="ee-empty">No email-extracted drafts found.<br><span style="font-size:0.78rem;">Run a sync from Settings to populate this list.</span></div>`;
        return;
    }

    list.innerHTML = emailDrafts.map(draft => {
        const subject = parseNoteSubject(draft.notes) || '(no subject)';
        return `
        <div class="ee-card" id="ee-card-${draft.id}">
            <div class="ee-card-header">
                <div>
                    <div class="ee-job-title">${draft.job_title || 'Unknown Position'}</div>
                    <div class="ee-company">${draft.company_name || 'Unknown Company'}</div>
                </div>
                <span class="ee-badge ee-badge-confirm">Confirmation</span>
            </div>
            <div class="ee-note">${subject}</div>
            <div class="ee-actions">
                <button class="ee-btn ee-btn-approve" data-id="${draft.id}" id="ee-approve-${draft.id}">
                    ✓ Approve & Add Application
                </button>
                <button class="ee-btn ee-btn-discard" data-id="${draft.id}" id="ee-discard-${draft.id}">
                    ✕ Discard
                </button>
            </div>
        </div>`;
    }).join('');

    // Approve buttons
    list.querySelectorAll('[id^="ee-approve-"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await approveDraft(id, container);
        });
    });

    // Discard buttons
    list.querySelectorAll('[id^="ee-discard-"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await discardDraft(id, container);
        });
    });
}

async function approveDraft(draftId, container) {
    const btn = document.getElementById(`ee-approve-${draftId}`);
    if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

    // Find the draft data from the rendered card
    const allDrafts = await fetchDrafts();
    const draft = allDrafts.find(d => d.id === draftId);
    if (!draft) {
        showToast('Draft not found.', '#ef4444');
        return;
    }

    // Create a real application from the draft
    const result = await createApplication({
        job_title:    draft.job_title    || 'Unknown Position',
        company_name: draft.company_name || 'Unknown Company',
        application_date: draft.application_date || new Date().toISOString().split('T')[0],
        status:       'Applied',
        source:       'Email Sync',
        notes:        draft.notes,
    });

    if (result.success) {
        // Delete the draft
        await deleteDraft(draftId);
        document.getElementById(`ee-card-${draftId}`)?.remove();
        showToast(`✓ Application added: ${draft.job_title} at ${draft.company_name}`);

        // If list is now empty, refresh
        const remaining = document.querySelectorAll('[id^="ee-card-"]');
        if (remaining.length === 0) {
            await loadDrafts(container);
        }
    } else {
        showToast('Failed to create application.', '#ef4444');
        if (btn) { btn.textContent = '✓ Approve & Add Application'; btn.disabled = false; }
    }
}

async function discardDraft(draftId, container) {
    const result = await deleteDraft(draftId);
    if (result.success) {
        document.getElementById(`ee-card-${draftId}`)?.remove();
        showToast('Draft discarded.', '#9ca3af');
        const remaining = document.querySelectorAll('[id^="ee-card-"]');
        if (remaining.length === 0) {
            await loadDrafts(container);
        }
    } else {
        showToast('Failed to discard draft.', '#ef4444');
    }
}
