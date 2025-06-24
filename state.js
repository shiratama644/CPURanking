// Application State Management
export let cpuData = [];
export let AVAILABLE_TAGS = [];

export let currentScoreType = 'rcbsp'; 
export let currentSpeedType = 'multi';
export let sortState = { column: 'id', order: 'asc' }; 
export let selectedCpuIds = []; 
export let isFavoriteFilterActive = false;

export let columnVisibility = {}; 
export let chartVisibility = {}; 
export let scatterPlotSettings = {};
export let scoreSettings = {};
export let previewSettings = {};

export let currentPage = 1;
export let itemsPerPage = 20;

// State Modifiers
export const setCpuData = (data) => { cpuData = data; };
export const setAvailableTags = (tags) => { AVAILABLE_TAGS = tags; };
export const setCurrentScoreType = (type) => { currentScoreType = type; };
export const setCurrentSpeedType = (type) => { currentSpeedType = type; };
export const setSortState = (state) => { sortState = state; };
export const setSelectedCpuIds = (ids) => { selectedCpuIds = ids; };
export const setFavoriteFilterActive = (isActive) => { isFavoriteFilterActive = isActive; };
export const setColumnVisibility = (visibility) => { columnVisibility = visibility; };
export const setChartVisibility = (visibility) => { chartVisibility = visibility; };
export const setScatterPlotSettings = (settings) => { scatterPlotSettings = settings; };
export const setScatterPlotSetting = (key, value) => { scatterPlotSettings[key] = value; };
export const setScoreSettings = (settings) => { scoreSettings = settings; };
export const setPreviewSettings = (settings) => { previewSettings = settings; };
export const setCurrentPage = (page) => { currentPage = page; };
export const setItemsPerPage = (count) => { itemsPerPage = count; };