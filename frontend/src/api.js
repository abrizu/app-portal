const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_URL = `${API_BASE}/api`;

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Clear stale token and force the login screen on any 401. */
function handleUnauthorized() {
    localStorage.removeItem('auth_token');
    window.location.reload();
}

/** Shared fetch wrapper that automatically handles 401. */
async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        handleUnauthorized();
        return null; // execution stops after reload, but satisfy linter
    }
    return response;
}

/*------------------------------- Auth -------------------------------*/

export async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/check`);
        if (!response.ok) throw new Error('HTTP error');
        return await response.json();
    } catch (e) {
        return { has_users: false };
    }
}

export async function register(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Registration failed');
        return data;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');
        return data;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function fetchCurrentUser() {
    try {
        const response = await apiFetch(`${API_URL}/users/me`, {
            headers: getAuthHeaders()
        });
        if (!response || !response.ok) throw new Error(`HTTP error! status: ${response?.status}`);
        const data = await response.json();
        return data.user || null;
    } catch (error) {
        console.error("Could not fetch current user:", error);
        return null;
    }
}

export async function updateCurrentUser(userData) {
    try {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Update failed');
        return data;
    } catch (error) {
        console.error("Could not update current user:", error);
        return { success: false, error: error.message };
    }
}

/*------------------------------- Applications -------------------------------*/

// batch fetching
export async function fetchApplications() {
    try {
        const response = await apiFetch(`${API_URL}/applications`, {
            headers: getAuthHeaders()
        });
        if (!response || !response.ok) {
            throw new Error(`HTTP error! status: ${response?.status}`);
        }
        const data = await response.json();
        return data.applications || [];
    } catch (error) {
        console.error("Could not fetch applications:", error);
        return [];
    }
}

// fetch single application
export async function fetchApplication(id) {
    try {
        const response = await fetch(`${API_URL}/applications/${id}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.application || null;
    } catch (error) {
        console.error("Could not fetch application:", error);
        return null;
    }
}

export async function createApplication(appData) {
    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(appData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not create application:", error);
        return { success: false, error: error.message };
    }
}

export async function updateApplication(id, appData) {
    try {
        const response = await fetch(`${API_URL}/applications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(appData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not update application:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteApplication(id) {
    try {
        const response = await fetch(`${API_URL}/applications/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { success: true };
    } catch (error) {
        console.error("Could not delete application:", error);
        return { success: false, error: error.message };
    }
}

/*------------------------------- Drafts -------------------------------*/

export async function fetchDrafts() {
    try {
        const response = await apiFetch(`${API_URL}/drafts`, {
            headers: getAuthHeaders()
        });
        if (!response || !response.ok) throw new Error(`HTTP error! status: ${response?.status}`);
        const data = await response.json();
        return data.drafts || [];
    } catch (error) {
        console.error("Could not fetch drafts:", error);
        return [];
    }
}

export async function fetchDraft(id) {
    try {
        const response = await fetch(`${API_URL}/drafts/${id}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.draft || null;
    } catch (error) {
        console.error("Could not fetch draft:", error);
        return null;
    }
}

export async function createDraft(draftData) {
    try {
        const response = await fetch(`${API_URL}/drafts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(draftData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not create draft:", error);
        return { success: false, error: error.message };
    }
}

export async function updateDraft(id, draftData) {
    try {
        const response = await fetch(`${API_URL}/drafts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(draftData)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not update draft:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteDraft(id) {
    try {
        const response = await fetch(`${API_URL}/drafts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { success: true };
    } catch (error) {
        console.error("Could not delete draft:", error);
        return { success: false, error: error.message };
    }
}

/*------------------------------- Resumes -------------------------------*/

export async function fetchResumes() {
    try {
        const response = await fetch(`${API_URL}/resumes`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.resumes || [];
    } catch (error) {
        console.error("Could not fetch resumes:", error);
        return [];
    }
}

export async function uploadResume(formData) {
    try {
        const response = await fetch(`${API_URL}/resumes/upload`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Could not upload resume:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteResume(id) {
    try {
        const response = await fetch(`${API_URL}/resumes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { success: true };
    } catch (error) {
        console.error("Could not delete resume:", error);
        return { success: false, error: error.message };
    }
}

export async function downloadResume(filename) {
    try {
        const response = await fetch(`${API_URL}/resumes/download/${filename}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.blob();
    } catch (error) {
        console.error("Could not download resume:", error);
        return null;
    }
}

/*------------------------------- Password Generation -------------------------------*/

export async function generatePassword() {
    try {
        const response = await fetch(`${API_URL}/generate-password`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.password || '';
    } catch (error) {
        console.error("Could not generate password:", error);
        return '';
    }
}
