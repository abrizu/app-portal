const API_URL = 'http://127.0.0.1:8000/api';

/*------------------------------- Applications -------------------------------*/

export async function fetchApplications() {
    try {
        const response = await fetch(`${API_URL}/applications`);
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

export async function fetchApplication(id) {
    try {
        const response = await fetch(`${API_URL}/applications/${id}`);
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
                'Content-Type': 'application/json'
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
                'Content-Type': 'application/json'
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
            method: 'DELETE'
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
        const response = await fetch(`${API_URL}/drafts`);
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
        const response = await fetch(`${API_URL}/drafts/${id}`);
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
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
            method: 'DELETE'
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
        const response = await fetch(`${API_URL}/resumes`);
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
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return { success: true };
    } catch (error) {
        console.error("Could not delete resume:", error);
        return { success: false, error: error.message };
    }
}
