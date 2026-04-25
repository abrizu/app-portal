import './style.css'

document.querySelector('#app').innerHTML = `
  <aside class="sidebar glass">
    <div style="margin-bottom: 2rem;">
      <h2 style="font-weight: 700; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">App Portal</h2>
    </div>
    <nav style="display: flex; flex-direction: column; gap: 0.5rem; height: 100%;">
      <a href="#" class="nav-link active">Dashboard</a>
      <a href="#" class="nav-link">Applications</a>
      <a href="#" class="nav-link">Users</a>
      <div style="flex-grow: 1;"></div>
      <a href="#" class="nav-link">Settings</a>
    </nav>
  </aside>
  <main class="main-content">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>Dashboard</h1>
      <button class="btn">New Application</button>
    </header>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
      <div class="glass-card" style="padding: 1.5rem;">
        <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Total Applications</h3>
        <p style="font-size: 2.5rem; font-weight: 700;">42</p>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Active Interviews</h3>
        <p style="font-size: 2.5rem; font-weight: 700; color: var(--status-interviewing);">5</p>
      </div>
      <div class="glass-card" style="padding: 1.5rem;">
        <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Offers</h3>
        <p style="font-size: 2.5rem; font-weight: 700; color: var(--status-offer);">2</p>
      </div>
    </div>

    <div style="margin-top: 2rem;">
      <h2 style="margin-bottom: 1rem; font-size: 1.25rem;">Recent Activity</h2>
      <div class="glass-card" style="padding: 1.5rem;">
        <p style="color: var(--text-secondary);">Connecting to API in Phase 3...</p>
      </div>
    </div>
  </main>
`
