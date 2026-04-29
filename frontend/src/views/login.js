import { login, register, checkAuth } from '../api.js';
import { renderDashboardView } from './dashboard.js';
import { setActiveNav } from '../utils.js';

export async function renderLoginView(containerId = 'app') {
    const appContainer = document.getElementById(containerId);
    
    // Check if there are any users in the database
    const authStatus = await checkAuth();
    const isRegister = !authStatus.has_users;
    
    appContainer.innerHTML = `
        <div style="display: flex; justify-content: center; alignItems: center; height: 100vh; width: 100vw; background: var(--bg-primary);">
            <div class="glass" style="width: 100%; max-width: 400px; margin: auto; padding: 2.5rem; border-radius: 1rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="font-size: 1.875rem; font-weight: 700; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">App Portal</h1>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                        ${isRegister ? 'Create your admin account to get started.' : 'Welcome back! Please login.'}
                    </p>
                </div>
                
                <form id="auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" for="username">Username</label>
                        <input type="text" id="username" class="form-input glass" required autofocus>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-input glass" required>
                    </div>
                    <div id="auth-error" style="color: #ef4444; font-size: 0.875rem; display: none;"></div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">
                        ${isRegister ? 'Create Account' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');
        
        try {
            if (isRegister) {
                const res = await register(username, password);
                if (res.success) {
                    // Registration success, now login
                    const loginRes = await login(username, password);
                    if (loginRes.access_token) {
                        localStorage.setItem('auth_token', loginRes.access_token);
                        window.location.reload(); // Reload to initialize full app
                    }
                } else {
                    errorDiv.textContent = res.error || 'Registration failed.';
                    errorDiv.style.display = 'block';
                }
            } else {
                const res = await login(username, password);
                if (res.access_token) {
                    localStorage.setItem('auth_token', res.access_token);
                    window.location.reload(); // Reload to initialize full app
                } else {
                    errorDiv.textContent = res.error || 'Invalid credentials.';
                    errorDiv.style.display = 'block';
                }
            }
        } catch (err) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}
