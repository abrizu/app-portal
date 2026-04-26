export function showToast(message, type = 'success') {
  const icon = type === 'success' ? '✓' : '✕';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove());
  }, 3500);
}

export function setActiveNav(id) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
}

export function getStatusColor(s) {
  return `var(--status-${(s || 'applied').toLowerCase()}, var(--text-secondary))`;
}

export function getUniqueLocations(apps) {
  const set = new Set();
  apps.forEach(a => { if (a.location) set.add(a.location); });
  return [...set].sort();
}
