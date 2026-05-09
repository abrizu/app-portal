export function getConnectionsLayout() {
  return `
    <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div>
        <h1 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin: 0;">Connections</h1>
        <p style="color: var(--text-secondary); margin: 0.25rem 0 0 0;">Manage your networking and professional contacts.</p>
      </div>
    </div>

    <div class="glass" style="padding: 3rem; text-align: center; border-radius: 1rem;">
      <h2 style="color: var(--text-primary); margin-bottom: 0.5rem;">Coming Soon</h2>
      <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">
        The Connections feature is currently under development. Soon you'll be able to track recruiters, hiring managers, and networking leads here.
      </p>
    </div>
  `;
}
