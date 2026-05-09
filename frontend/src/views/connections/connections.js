import { setActiveNav } from '../../utils.js';
import { getConnectionsLayout } from './template.js';

export async function renderConnectionsView() {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  mainContent.innerHTML = getConnectionsLayout();

  // Any future initialization logic for the connections page will go here
}
