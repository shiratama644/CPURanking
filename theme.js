import { LOCAL_STORAGE_THEME_KEY } from './constants.js';
import * as modalsUI from './ui/modals.js';
import * as S from './state.js';

export function loadTheme(theme = null, save = false) {
    if (theme) {
        setTheme(theme, save);
        return;
    }
    
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only change if no theme is explicitly set by the user
        if (!localStorage.getItem(LOCAL_STORAGE_THEME_KEY)) {
            setTheme(e.matches ? 'dark' : 'light', false);
            updateThemeSelectionUI();
        }
    });

    if (storedTheme) {
        setTheme(storedTheme, false);
    } else {
        setTheme(systemPrefersDark ? 'dark' : 'light', false);
    }
}

function setTheme(theme, save = false) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('shepherd-dark-theme', theme === 'dark');
    
    if (save) {
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    }
    
    // Re-render charts if they are visible
    if (document.getElementById('comparisonModal').classList.contains('visible')) {
        const cpus = S.selectedCpuIds.map(id => S.cpuData.find(c => c.id === id));
        if (cpus.length === 2 && cpus[0] && cpus[1]) modalsUI.renderComparisonChart(cpus[0], cpus[1]);
    }
    if (document.getElementById('scatterPlotModal').classList.contains('visible')) {
        modalsUI.renderScatterPlot();
    }
    if (document.getElementById('statisticsModal').classList.contains('visible')) {
        const stats = modalsUI.calculateStatistics();
        modalsUI.renderStatisticsCharts(stats);
    }
}

export function updateThemeSelectionUI() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const lightRadio = document.querySelector('input[name="theme"][value="light"]');
    const darkRadio = document.querySelector('input[name="theme"][value="dark"]');
    
    if (lightRadio && darkRadio) {
        lightRadio.checked = (currentTheme === 'light');
        darkRadio.checked = (currentTheme === 'dark');
        
        document.getElementById('lightThemeLabel').classList.toggle('checked', currentTheme === 'light');
        document.getElementById('darkThemeLabel').classList.toggle('checked', currentTheme === 'dark');
    }
}