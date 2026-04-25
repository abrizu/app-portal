const API_URL = 'http://127.0.0.1:8000/api';

export async function fetchApplications() {
    try {
        const response = await fetch(`${API_URL}/applications`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Return the applications array from the response object
        return data.applications || [];
    } catch (error) {
        console.error("Could not fetch applications:", error);
        return [];
    }
}
