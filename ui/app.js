import { loadStateFromStorage } from './storage.js';
import { loadTheme, updateThemeSelectionUI } from './theme.js';
import { initTour } from './tour.js';
import * as tableUI from './ui/table.js';
import * as componentsUI from './ui/components.js';
import * as modalsUI from './ui/modals.js';
import * as cpuService from './data/cpuService.js';
import * as tagService from './data/tagService.js';
import * as state from './state.js';

// --- HTMLのonclick属性から呼び出せるようにグローバルスコープに登録 ---
// これにより、HTMLの大幅な変更なしにモジュール化を実現します。
window.openCpuFormModal = modalsUI.openCpuFormModal;
window.openComparisonModal = modalsUI.openComparisonModal;
window.deleteSelectedCPUs = cpuService.deleteSelectedCPUs;
window.openDescriptionModal = modalsUI.openDescriptionModal;
window.openScatterPlotModal = modalsUI.openScatterPlotModal;
window.openStatisticsModal = modalsUI.openStatisticsModal;
window.openSettingsModal = modalsUI.openSettingsModal;
window.exportDataAsJSON = cpuService.exportDataAsJSON;
window.filterCPUs = tableUI.filterAndRender;
window.closeModal = modalsUI.closeModal;
window.toggleFavorite = cpuService.toggleFavorite;
window.handleCheckboxChange = componentsUI.handleCheckboxChange;
window.cycleScoreTypeAndUpdate = tableUI.cycleScoreTypeAndUpdate;
window.cycleSpeedTypeAndUpdate = tableUI.cycleSpeedTypeAndUpdate;
window.showCPUDetails = modalsUI.showCPUDetails;
window.showPreview = componentsUI.showPreview;
window.hidePreview = componentsUI.hidePreview;
window.addNewTag = tagService.addNewTag;
window.showEditTagInput = tagService.showEditTagInput;
window.saveTagEdit = tagService.saveTagEdit;
window.cancelTagEdit = tagService.cancelTagEdit;
window.deleteTag = tagService.deleteTag;
window.openSettingsTab = modalsUI.openSettingsTab;
window.toggleScoreBehavior = modalsUI.toggleScoreBehavior;
window.resetAllSettings = cpuService.resetAllSettings;
window.saveAllSettingsAndCloseModal = cpuService.saveAllSettingsAndCloseModal;
window.changePage = (page) => {
    state.setCurrentPage(page);
    tableUI.renderCPUTable();
};


function initApp() {
    loadTheme(); // テーマを最初に読み込み
    loadStateFromStorage(); // 全ての状態をLocalStorageから読み込み

    componentsUI.renderTagFilters();
    modalsUI.renderNewScoreFields();
    modalsUI.renderSettingsModal();
    tableUI.renderCPUTable();
    
    setupEventListeners();
    initTour(); 
    
    componentsUI.updateSelectionDependentButtons();
    componentsUI.updateFavoriteFilterHeaderState();
}

function setupEventListeners() {
    document.getElementById('cpuForm').addEventListener('submit', cpuService.handleCpuFormSubmit);
    
    document.querySelectorAll('#cpuTable th[data-sort-key]').forEach(th => {
        th.addEventListener('click', () => tableUI.handleSort(th.dataset.sortKey));
    });

    document.getElementById('selectAllCheckbox').addEventListener('click', componentsUI.toggleSelectAll);
    document.querySelector('#cpuTable th.favorite-column').addEventListener('click', componentsUI.toggleFavoriteFilter);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.visible');
            activeModals.forEach(modal => modalsUI.closeModal(modal.id));
            componentsUI.hidePreview(true); // プレビューも消す
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal') && event.target.classList.contains('visible')) {
            modalsUI.closeModal(event.target.id);
        }
    });

    ['volumeX', 'volumeY', 'volumeZ'].forEach(id => {
        const element = document.getElementById(id);
        if(element) element.addEventListener('input', () => {
            modalsUI.updateCalculatedVolumeDisplay();
            if (document.getElementById('cpuFormModal').classList.contains('visible')) {
                 modalsUI.autoCheckCompactTag();
            }
        });
    });
    
    document.querySelector('.search-box').addEventListener('input', () => {
        state.setCurrentPage(1);
        tableUI.filterAndRender();
    });
    document.getElementById('import-json-input').addEventListener('change', cpuService.handleImportJSON);
    
    // Scatter plot settings change listeners
    document.getElementById('scatterXAxis').addEventListener('change', (e) => { state.setScatterPlotSetting('x', e.target.value); });
    document.getElementById('scatterYAxis').addEventListener('change', (e) => { state.setScatterPlotSetting('y', e.target.value); });
    document.getElementById('scatterBubbleSize').addEventListener('change', (e) => { state.setScatterPlotSetting('r', e.target.value); });

    // Theme radio buttons in settings modal
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            loadTheme(event.target.value, true); 
            updateThemeSelectionUI();
        });
    });
}

document.addEventListener('DOMContentLoaded', initApp);