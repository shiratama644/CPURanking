import * as C from './constants.js';
import * as S from './state.js';

// --- Default Data Providers ---
function getDefaultCpuData() {
    return [
        { id: 1, creator: "水地", name: "NX RED V1 CPU", scores: { rcbsp: 100, rcbfa: 500, rcbmp: 200, rcbwm: 150, rcbrm: 160, rcbml: 120, rcbdv: 300, rcbsq: 600, rcbsh: 80 }, speeds: { multi: 5200000, single: 4200000, branch: 3800000 }, microarchitecture: "カスタム64bit", description: "高性能ゲーミング向けCPU。", minecraftEdition: "Java", bit: 64, threads: 16, cores: 8, volume: { x: 10, y: 10, z: 5 }, completionDate: "2023-10-20", tags: ["速度重視", "CPU"], isFavorite: false },
        { id: 2, creator: "テックマスター", name: "Quantum Core X9 CPU", scores: { rcbsp: 80, rcbfa: 400, rcbmp: 150, rcbwm: 100, rcbrm: 110, rcbml: 90, rcbdv: 250, rcbsq: 500, rcbsh: 60 }, speeds: { multi: 6000000, single: 5500000, branch: null }, microarchitecture: "Quantum-RISC", description: "次世代量子計算技術応用。", minecraftEdition: "Bedrock", bit: 64, threads: 32, cores: 16, volume: { x: 20, y: 15, z: 10 }, completionDate: "2024-01-15", tags: ["速度重視", "汎用性重視", "CPU"], isFavorite: true },
        { id: 3, creator: "CPUクリエイター", name: "ThunderBolt Pro CPU", scores: { rcbsp: 120, rcbfa: 600, rcbmp: 250, rcbwm: 200, rcbrm: 210, rcbml: 150, rcbdv: 350, rcbsq: 700, rcbsh: 100 }, speeds: { multi: 4800000, single: 3900000, branch: 4200000 }, microarchitecture: "ARM-V9カスタム", description: "省電力と高性能を両立。", minecraftEdition: "Java", bit: 32, threads: 24, cores: 12, volume: { x: 8, y: 8, z: 8 }, completionDate: "2023-05-01", tags: ["汎用性重視", "CPU", "64×64以下"], isFavorite: false },
        { id: 4, creator: "新人", name: "MyFirstCPU", scores: { rcbsp: 1000, rcbfa: 5000, rcbmp: 2000, rcbwm: null, rcbrm: null, rcbml: null, rcbdv: null, rcbsq: null, rcbsh: null }, speeds: { multi: 10, single: 5, branch: null }, microarchitecture: "Simple ALU", description: "初めて作ったCPUです！", minecraftEdition: "Java", bit: 8, threads: 1, cores: 1, volume: { x: 5, y: 5, z: 5 }, completionDate: "2024-03-01", tags: ["サイズ重視", "CPU", "64×64以下"], isFavorite: false },
        { id: 5, creator: "GPUマニア", name: "PixelBlaster 3000 GPU", scores: { rcbsp: null, rcbfa: null, rcbmp: null, rcbwm: null, rcbrm: null, rcbml: null, rcbdv: null, rcbsq: null, rcbsh: null }, speeds: { multi: 150000, single: 12000, branch: null }, microarchitecture: "Rasterizer Core v2", description: "超高速描画GPU。ただしCPU機能はなし。", minecraftEdition: "Java", bit: 128, threads: 1024, cores: 256, volume: { x: 15, y: 5, z: 20 }, completionDate: "2024-02-20", tags: ["速度重視", "GPU"], isFavorite: true }
    ];
}

function getDefaultColumnVisibility() {
    const defaultVisibility = {};
    for (const key in C.COLUMN_DEFINITIONS) {
        defaultVisibility[key] = C.COLUMN_DEFINITIONS[key].defaultVisible;
    }
    return defaultVisibility;
}

function getDefaultChartVisibility() {
    const defaultVisibility = {};
    for (const key in C.CHART_DEFINITIONS) {
        defaultVisibility[key] = true;
    }
    return defaultVisibility;
}

function getDefaultScatterPlotSettings() {
    return { x: 'volume', y: 'multiSpeed', r: 'cores' };
}

function getDefaultScoreSettings() {
    return {
        rcbsp: { highIsBetter: false, highThreshold: 100, mediumThreshold: 200 },
        rcbfa: { highIsBetter: false, highThreshold: 500, mediumThreshold: 1000 },
        rcbmp: { highIsBetter: false, highThreshold: 200, mediumThreshold: 400 },
        rcbwm: { highIsBetter: false, highThreshold: 100, mediumThreshold: 200 },
        rcbrm: { highIsBetter: false, highThreshold: 100, mediumThreshold: 200 },
        rcbml: { highIsBetter: false, highThreshold: 100, mediumThreshold: 200 },
        rcbdv: { highIsBetter: false, highThreshold: 200, mediumThreshold: 400 },
        rcbsq: { highIsBetter: false, highThreshold: 500, mediumThreshold: 1000 },
        rcbsh: { highIsBetter: false, highThreshold: 50, mediumThreshold: 100 },
    };
}

function getDefaultPreviewSettings() {
    const defaultSettings = {};
    for (const key in C.PREVIEW_DEFINITIONS) {
        defaultSettings[key] = true;
    }
    return defaultSettings;
}

// --- LocalStorage Loaders ---
function loadDataFromLocalStorage() {
    const data = localStorage.getItem(C.LOCAL_STORAGE_DATA_KEY);
    try {
        const parsedData = data ? JSON.parse(data) : getDefaultCpuData();
        const sanitizedData = parsedData.map((item, index) => {
            const newScores = {};
            for (const key in C.SCORE_DEFINITIONS) {
                newScores[key] = (item.scores && item.scores[key] !== undefined) ? item.scores[key] : null;
            }
            
            return {
                ...item,
                id: item.id !== undefined ? item.id : Date.now() + index,
                isFavorite: item.isFavorite === true,
                scores: newScores,
                speeds: {
                    ...(item.speeds || {}),
                    branch: item.speeds && (item.speeds.branch === "" || item.speeds.branch === undefined) ? null : (item.speeds ? item.speeds.branch : null)
                },
                tags: Array.isArray(item.tags) ? item.tags : []
            };
        });
        S.setCpuData(sanitizedData);
    } catch (e) {
        console.error("Error loading data from localStorage:", e);
        S.setCpuData(getDefaultCpuData());
    }
}

function loadTagsFromLocalStorage() {
    const storedTags = localStorage.getItem(C.LOCAL_STORAGE_TAGS_KEY);
    if (storedTags) {
        try {
            S.setAvailableTags(JSON.parse(storedTags));
        } catch (e) {
            console.error("Error loading tags from localStorage:", e);
            S.setAvailableTags(["速度重視", "サイズ重視", "汎用性重視", "CPU", "GPU", "64×64以下"]);
        }
    } else {
        S.setAvailableTags(["速度重視", "サイズ重視", "汎用性重視", "CPU", "GPU", "64×64以下"]);
    }
}

function loadSortStateFromLocalStorage() {
    const storedSortState = localStorage.getItem(C.LOCAL_STORAGE_SORT_KEY);
    if (storedSortState) {
        try {
            S.setSortState(JSON.parse(storedSortState));
        } catch(e) {
            console.error("Error loading sort state from localStorage:", e);
            S.setSortState({ column: 'id', order: 'asc' });
        }
    } else {
        S.setSortState({ column: 'id', order: 'asc' });
    }
}

function loadFavoriteFilterStateFromLocalStorage() {
    const storedState = localStorage.getItem(C.LOCAL_STORAGE_FAVORITE_FILTER_KEY);
    S.setFavoriteFilterActive(storedState === 'true');
}

function loadColumnVisibilityFromLocalStorage() {
    const storedVisibility = localStorage.getItem(C.LOCAL_STORAGE_COLUMN_VISIBILITY_KEY);
    let visibility = getDefaultColumnVisibility();
    if (storedVisibility) {
        try {
            const parsedVisibility = JSON.parse(storedVisibility);
            // Ensure all keys are present
            for (const key in C.COLUMN_DEFINITIONS) {
                if (parsedVisibility[key] === undefined) {
                    parsedVisibility[key] = C.COLUMN_DEFINITIONS[key].defaultVisible;
                }
            }
            visibility = parsedVisibility;
        } catch (e) {
            console.error("Error loading column visibility from localStorage:", e);
        }
    }
    S.setColumnVisibility(visibility);
}

function loadChartVisibilityFromLocalStorage() {
    const storedVisibility = localStorage.getItem(C.LOCAL_STORAGE_CHART_VISIBILITY_KEY);
    let visibility = getDefaultChartVisibility();
    if (storedVisibility) {
        try {
            const parsedVisibility = JSON.parse(storedVisibility);
             for (const key in C.CHART_DEFINITIONS) {
                if (parsedVisibility[key] === undefined) {
                    parsedVisibility[key] = true;
                }
            }
            visibility = parsedVisibility;
        } catch (e) {
            console.error("Error loading chart visibility from localStorage:", e);
        }
    }
    S.setChartVisibility(visibility);
}

function loadScatterPlotSettingsFromLocalStorage() {
    const storedSettings = localStorage.getItem(C.LOCAL_STORAGE_SCATTER_KEY);
    if (storedSettings) {
        try {
            S.setScatterPlotSettings(JSON.parse(storedSettings));
        } catch (e) {
            console.error("Error loading scatter plot settings from localStorage:", e);
            S.setScatterPlotSettings(getDefaultScatterPlotSettings());
        }
    } else {
        S.setScatterPlotSettings(getDefaultScatterPlotSettings());
    }
}

function loadScoreSettingsFromLocalStorage() {
    const storedSettings = localStorage.getItem(C.LOCAL_STORAGE_SCORE_SETTINGS_KEY);
    const defaultSettings = getDefaultScoreSettings();
    let settings = defaultSettings;
    if (storedSettings) {
        try {
            const parsedSettings = JSON.parse(storedSettings);
            // Ensure all keys are present
            for (const key in defaultSettings) {
                if (!parsedSettings[key]) {
                    parsedSettings[key] = defaultSettings[key];
                }
            }
            settings = parsedSettings;
        } catch (e) {
            console.error("Error loading score settings from localStorage:", e);
        }
    }
    S.setScoreSettings(settings);
}

function loadPaginationSettingsFromLocalStorage() {
    const storedSettings = localStorage.getItem(C.LOCAL_STORAGE_PAGINATION_KEY);
    S.setItemsPerPage(parseInt(storedSettings, 10) || 20);
}

function loadPreviewSettingsFromLocalStorage() {
    const storedSettings = localStorage.getItem(C.LOCAL_STORAGE_PREVIEW_SETTINGS_KEY);
    let settings = getDefaultPreviewSettings();
    if (storedSettings) {
        try {
            const parsedSettings = JSON.parse(storedSettings);
            const defaults = getDefaultPreviewSettings();
            for (const key in defaults) {
                if (parsedSettings[key] === undefined) {
                    parsedSettings[key] = defaults[key];
                }
            }
            settings = parsedSettings;
        } catch (e) {
            console.error("Error loading preview settings from localStorage:", e);
        }
    }
    S.setPreviewSettings(settings);
}

// --- LocalStorage Savers ---
export const saveDataToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_DATA_KEY, JSON.stringify(S.cpuData));
export const saveTagsToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_TAGS_KEY, JSON.stringify(S.AVAILABLE_TAGS));
export const saveSortStateToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_SORT_KEY, JSON.stringify(S.sortState));
export const saveFavoriteFilterStateToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_FAVORITE_FILTER_KEY, S.isFavoriteFilterActive);
export const saveColumnVisibilityToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_COLUMN_VISIBILITY_KEY, JSON.stringify(S.columnVisibility));
export const saveChartVisibilityToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_CHART_VISIBILITY_KEY, JSON.stringify(S.chartVisibility));
export const saveScatterPlotSettingsToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_SCATTER_KEY, JSON.stringify(S.scatterPlotSettings));
export const saveScoreSettingsToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_SCORE_SETTINGS_KEY, JSON.stringify(S.scoreSettings));
export const savePaginationSettingsToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_PAGINATION_KEY, S.itemsPerPage);
export const savePreviewSettingsToLocalStorage = () => localStorage.setItem(C.LOCAL_STORAGE_PREVIEW_SETTINGS_KEY, JSON.stringify(S.previewSettings));

// --- Main loader function ---
export function loadStateFromStorage() {
    loadTagsFromLocalStorage();
    loadScoreSettingsFromLocalStorage();
    loadPaginationSettingsFromLocalStorage();
    loadPreviewSettingsFromLocalStorage();
    loadDataFromLocalStorage();
    loadSortStateFromLocalStorage();
    loadFavoriteFilterStateFromLocalStorage();
    loadColumnVisibilityFromLocalStorage();
    loadChartVisibilityFromLocalStorage();
    loadScatterPlotSettingsFromLocalStorage();
}