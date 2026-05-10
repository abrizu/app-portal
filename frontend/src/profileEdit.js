import { fetchCurrentUser, updateCurrentUser } from './api.js';
import { renderSettingsView } from './settings.js';
import { initLocationAutocomplete } from './views/new_application/locationAutocomplete.js';
import { showToast } from './utils.js';

export async function renderProfileEditView() {
    const mainContent = document.getElementById('main-content');

    // Fetch the current user to pre-fill the form
    const user = await fetchCurrentUser();
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const homeLocation = user?.home_location || '';
    const initials = (firstName.charAt(0) || user?.username?.charAt(0) || 'U').toUpperCase();
    const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.username || 'User';

    mainContent.innerHTML = `
        <div class="page-enter">
            <div class="view-header" style="padding-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                <button id="btn-back-settings" class="btn" style="padding: 0.5rem; background: transparent; border-color: var(--border-color); color: var(--text-primary);">
                    <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                </button>
                <h1 class="view-title" style="margin: 0;">Edit Profile</h1>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 800px;">
                <div class="glass" style="padding: 2rem; border-radius: 1rem;">
                    
                    <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
                        <div style="width: 4rem; height: 4rem; border-radius: 50%; background: linear-gradient(to right, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.75rem;">
                            ${initials}
                        </div>
                        <div>
                            <p style="font-weight: 600; font-size: 1.125rem;">${displayName}</p>
                            <p style="font-size: 0.875rem; color: var(--text-secondary);">Update your personal details below</p>
                        </div>
                    </div>

                    <form id="profile-edit-form" style="display: flex; flex-direction: column; gap: 1.5rem;">
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label" for="edit-first-name">First Name</label>
                                <input type="text" id="edit-first-name" class="form-input" placeholder="Jane" value="${firstName}">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="edit-last-name">Last Name</label>
                                <input type="text" id="edit-last-name" class="form-input" placeholder="Doe" value="${lastName}">
                            </div>
                        </div>

                        <div class="form-group" style="position: relative;">
                            <label class="form-label" for="edit-home-location">Home Location</label>
                            <input type="text" id="edit-home-location" class="form-input" placeholder="e.g., San Francisco, CA" value="${homeLocation}">
                            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Used for geospatial abilities and location-based features.</p>
                        </div>

                        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                            <button type="button" id="btn-cancel-edit" class="btn-back" style="border:none;">Cancel</button>
                            <button type="submit" class="btn-submit">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Initialize the location autocomplete dropdown
    initLocationAutocomplete('edit-home-location');

    // Event Listeners
    document.getElementById('btn-back-settings').addEventListener('click', () => {
        renderSettingsView();
    });

    document.getElementById('btn-cancel-edit').addEventListener('click', () => {
        renderSettingsView();
    });

    document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const updatedData = {
            first_name: document.getElementById('edit-first-name').value.trim() || null,
            last_name: document.getElementById('edit-last-name').value.trim() || null,
            home_location: document.getElementById('edit-home-location').value.trim() || null
        };

        const result = await updateCurrentUser(updatedData);

        if (result && result.success) {
            showToast('Profile updated successfully!', 'success');
            setTimeout(() => {
                renderSettingsView();
            }, 700);
        } else {
            showToast(result?.error || 'Failed to update profile.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    });
}
