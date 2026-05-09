import { setActiveNav } from '../../utils.js';
import { getStatsLayout } from './template.js';

export async function renderStatsView() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = getStatsLayout();

    // Any future initialization logic for the connections page will go here
}
