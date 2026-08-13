import { headerHTML } from './header-component.js';
import { sidebarHTML } from './sidebar-component.js';
import { viewsHTML } from './views-component.js';
import { modalsHTML } from './modals-component.js';

export function loadComponents() {
    const appHeader = document.getElementById('appHeader');
    const sidebarSlot = document.getElementById('sidebarSlot');
    const mainViewSlot = document.getElementById('mainViewSlot');
    const appModals = document.getElementById('appModals');

    if (appHeader) appHeader.innerHTML = headerHTML;
    if (sidebarSlot) sidebarSlot.innerHTML = sidebarHTML;
    if (mainViewSlot) mainViewSlot.innerHTML = viewsHTML;
    if (appModals) appModals.innerHTML = modalsHTML;
}
