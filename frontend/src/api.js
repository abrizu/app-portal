const API_URL = 'http://127.0.0.1:8000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
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

/*------------------------------- Applications -------------------------------*/

// batch fetching
export async function fetchApplications() {
    try {
        const response = await fetch(`${API_URL}/applications`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
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
        const response = await fetch(`${API_URL}/drafts`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
