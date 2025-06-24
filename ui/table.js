import * as S from '../state.js';
import * as C from '../constants.js';
import * as storage from '../storage.js';
import * as componentsUI from './components.js';

function getTagClass(tagName) {
    switch (tagName) {
        case "速度重視": return "tag-speed";
        case "サイズ重視": return "tag-size";
        case "汎用性重視": return "tag-versatile";
        case "CPU": return "tag-cpu-tag";
        case "GPU": return "tag-gpu";
        case "64×64以下": return "tag-compact";
        default: return "";
    }
}

function getScoreClass(score, scoreType) {
    if (score === null || score === undefined) return '';
    const settings = S.scoreSettings[scoreType.toLowerCase()];
    if (!settings) return '';

    const { highIsBetter, highThreshold, mediumThreshold } = settings;

    if (highIsBetter) {
        if (score >= highThreshold) return 'high-score';
        if (score >= mediumThreshold) return 'medium-score';
    } else { // Lower is better
        if (score <= highThreshold) return 'high-score';
        if (score <= mediumThreshold) return 'medium-score';
    }
    return 'low-score';
}

function getSpeedUnit(type) {
    return 'OPS'; 
}

function getSpeedLabel(type) {
    const labels = { multi: 'マルチ最大', single: 'シングル最大', branch: 'シングル条件分岐' };
    return labels[type];
}

function getSelectedFilterTags() {
    const selectedTags = [];
    document.querySelectorAll('#tagFiltersContainer input[type="checkbox"]:checked').forEach(cb => {
        selectedTags.push(cb.value);
    });
    return selectedTags;
}

function getFilteredData() {
    const searchTerm = document.querySelector('.search-box').value.toLowerCase().trim();
    const selectedFilterTags = getSelectedFilterTags();

    return S.cpuData.filter(cpu => {
        const textContent = `${cpu.creator} ${cpu.name} ${cpu.microarchitecture}`.toLowerCase();
        const matchesText = searchTerm === '' || textContent.includes(searchTerm);

        let matchesTags = true; 
        if (selectedFilterTags.length > 0) {
            matchesTags = selectedFilterTags.every(filterTag => cpu.tags.includes(filterTag));
        }
        
        const matchesFavorite = !S.isFavoriteFilterActive || (S.isFavoriteFilterActive && cpu.isFavorite);

        return matchesText && matchesTags && matchesFavorite;
    });
}

function sortCPUData(data) {
    if (!S.sortState.column || S.sortState.order === 'none') {
        return data.sort((a, b) => (a.id || 0) - (b.id || 0)); 
    }

    return data.sort((a, b) => {
        let valA, valB;

        switch (S.sortState.column) {
            case 'creator': case 'name': case 'minecraftEdition':
                valA = String(a[S.sortState.column] || '').toLowerCase();
                valB = String(b[S.sortState.column] || '').toLowerCase();
                break;
            case 'microarchitecture': 
                valA = String(a.microarchitecture || '').toLowerCase();
                valB = String(b.microarchitecture || '').toLowerCase();
                break;
            case 'scores':
                valA = a.scores[S.currentScoreType];
                valB = b.scores[S.currentScoreType];
                valA = (valA === null || valA === undefined) ? Number.MIN_SAFE_INTEGER : valA; 
                valB = (valB === null || valB === undefined) ? Number.MIN_SAFE_INTEGER : valB;
                break;
            case 'speeds':
                valA = a.speeds[S.currentSpeedType];
                valB = b.speeds[S.currentSpeedType];
                if (S.currentSpeedType === 'branch') { 
                    valA = (valA === null || valA === undefined) ? Number.MIN_SAFE_INTEGER : valA; 
                    valB = (valB === null || valB === undefined) ? Number.MIN_SAFE_INTEGER : valB;
                }
                break;
            case 'cores': case 'threads': case 'bit':
                valA = parseFloat(a[S.sortState.column] || 0);
                valB = parseFloat(b[S.sortState.column] || 0);
                break;
            case 'volume':
                valA = (a.volume.x || 0) * (a.volume.y || 0) * (a.volume.z || 0);
                valB = (b.volume.x || 0) * (b.volume.y || 0) * (b.volume.z || 0);
                break;
            case 'completionDate': 
                valA = new Date(a.completionDate || 0);
                valB = new Date(b.completionDate || 0);
                break;
            default: return 0;
        }

        let comparison = 0;
        if (valA < valB) comparison = -1;
        if (valA > valB) comparison = 1;
        
        return S.sortState.order === 'asc' ? comparison : comparison * -1;
    });
}

export function renderCPUTable() {
    const tbody = document.getElementById('cpuTableBody');
    tbody.innerHTML = '';

    const filteredData = getFilteredData();
    const sortedData = sortCPUData(filteredData);

    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / S.itemsPerPage);
    if (S.currentPage > totalPages && totalPages > 0) {
        S.setCurrentPage(totalPages);
    }

    const startIndex = (S.currentPage - 1) * S.itemsPerPage;
    const endIndex = startIndex + S.itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    if (paginatedData.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.className = 'no-data';
        const cell = document.createElement('td');
        if (S.cpuData.length === 0) {
            cell.innerHTML = `<i class="fas fa-info-circle"></i> データがありません。最初のデバイスを追加してみましょう！`;
        } else {
            cell.innerHTML = `<i class="fas fa-search-minus"></i> フィルタに一致するデバイスが見つかりませんでした。`;
        }
        noDataRow.appendChild(cell);
        tbody.appendChild(noDataRow);
    } else {
        paginatedData.forEach(cpu => {
            const row = document.createElement('tr');
            row.dataset.cpuId = cpu.id; 
            const calculatedVolume = cpu.volume.x * cpu.volume.y * cpu.volume.z;
            
            let displaySpeedValue;
            let currentSpeed = cpu.speeds[S.currentSpeedType];

            if (S.currentSpeedType === 'branch' && (currentSpeed === null || currentSpeed === undefined)) {
                displaySpeedValue = '未測定';
            } else {
                displaySpeedValue = (currentSpeed !== null && currentSpeed !== undefined) ? currentSpeed.toLocaleString() : 'N/A';
            }
            const speedUnitDisplay = (S.currentSpeedType === 'branch' && (currentSpeed === null || currentSpeed === undefined)) ? '' : ` ${getSpeedUnit(S.currentSpeedType)}`;

            let currentScoreValue = cpu.scores[S.currentScoreType];
            let displayScoreValue;
            let scoreCssClass = '';

            if (currentScoreValue === null || currentScoreValue === undefined) {
                displayScoreValue = '未測定';
            } else {
                displayScoreValue = currentScoreValue.toLocaleString();
                scoreCssClass = getScoreClass(currentScoreValue, S.currentScoreType);
            }

            const tagsHtml = cpu.tags && cpu.tags.length > 0 
                ? cpu.tags.map(tag => `<span class="tag-badge ${getTagClass(tag)}">${tag}</span>`).join('') 
                : 'タグなし';

            const isChecked = S.selectedCpuIds.includes(cpu.id);
            const favoriteIconClass = cpu.isFavorite ? 'fas fa-star is-favorite' : 'far fa-star';

            row.innerHTML = `
                <td data-column-key="favorite" class="favorite-cell">
                    <i class="favorite-toggle ${favoriteIconClass}" onclick="toggleFavorite(${cpu.id}, event)"></i>
                </td>
                <td data-column-key="checkbox" class="checkbox-cell">
                    <input type="checkbox" class="cpu-checkbox" data-cpu-id="${cpu.id}" onchange="handleCheckboxChange(this)" ${isChecked ? 'checked' : ''}>
                </td>
                <td data-column-key="creator" class="creator-name">${cpu.creator}</td>
                <td data-column-key="name" class="cpu-name" onmouseenter="showPreview(event, ${cpu.id})" onmouseleave="hidePreview()">${cpu.name}</td>
                <td data-column-key="scores" class="score-cell" onclick="cycleScoreTypeAndUpdate(${cpu.id})">
                    <div class="metric-value ${scoreCssClass}">${displayScoreValue}</div>
                    <div class="metric-label">${S.currentScoreType.toUpperCase()}<i class="fas fa-sync-alt"></i></div>
                </td>
                <td data-column-key="speeds" class="speed-cell" onclick="cycleSpeedTypeAndUpdate(${cpu.id})">
                    <div class="metric-value">${displaySpeedValue}${speedUnitDisplay}</div>
                    <div class="metric-label">${getSpeedLabel(S.currentSpeedType)}<i class="fas fa-sync-alt"></i></div>
                </td>
                <td data-column-key="cores">${cpu.cores}</td>
                <td data-column-key="threads">${cpu.threads}</td>
                <td data-column-key="bit">${cpu.bit}-bit</td>
                <td data-column-key="volume">${calculatedVolume.toLocaleString()}</td>
                <td data-column-key="completionDate">${cpu.completionDate}</td>
                <td data-column-key="tags" class="tags-cell">${tagsHtml}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateSortIndicators();
    applyColumnVisibility(); 
    componentsUI.updateSelectAllCheckboxState();
    componentsUI.renderPagination(totalItems);
}

export function applyColumnVisibility() {
    const table = document.getElementById('cpuTable');
    if (!table) return;

    const headers = table.querySelectorAll('thead th');
    headers.forEach(th => {
        const key = th.dataset.columnKey;
        if (key) {
            th.style.display = S.columnVisibility[key] ? '' : 'none';
        }
    });

    const rows = table.querySelectorAll('tbody tr');
    const columnKeysOrder = Array.from(headers).map(th => th.dataset.columnKey);

    rows.forEach(row => {
        if (row.classList.contains('no-data')) return;
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            const key = columnKeysOrder[index];
            if (key) {
                cell.style.display = S.columnVisibility[key] ? '' : 'none';
            }
        });
    });
    updateTableColspan();
}

function updateTableColspan() {
    const noDataRow = document.querySelector('#cpuTableBody tr.no-data');
    if (noDataRow) {
        const visibleColumnCount = Object.values(S.columnVisibility).filter(visible => visible).length;
        const noDataCell = noDataRow.querySelector('td');
        if (noDataCell) {
            noDataCell.colSpan = Math.max(1, visibleColumnCount);
        }
    }
}

export function handleSort(columnKey) {
    const currentSort = S.sortState;
    if (currentSort.column === columnKey) {
        if (currentSort.order === 'asc') S.setSortState({ ...currentSort, order: 'desc' });
        else if (currentSort.order === 'desc') S.setSortState({ ...currentSort, order: 'none' });
        else S.setSortState({ ...currentSort, order: 'asc' });
    } else {
        S.setSortState({ column: columnKey, order: 'asc' });
    }
    storage.saveSortStateToLocalStorage();
    renderCPUTable();
}

function updateSortIndicators() {
    document.querySelectorAll('#cpuTable th[data-sort-key]').forEach(th => {
        const key = th.dataset.sortKey;
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            if (S.sortState.column === key && S.sortState.order !== 'none') {
                indicator.innerHTML = S.sortState.order === 'asc' ? '<i class="fas fa-sort-up"></i>' : '<i class="fas fa-sort-down"></i>';
            } else if (S.sortState.column === key && S.sortState.order === 'none') {
                 indicator.innerHTML = '<i class="fas fa-sort" style="opacity:0.5;"></i>';
            }
             else {
                indicator.innerHTML = '<i class="fas fa-sort" style="opacity:0.5;"></i>'; 
            }
        }
    });
}

export function cycleScoreTypeAndUpdate(cpuId) {
    const types = Object.keys(C.SCORE_DEFINITIONS);
    S.setCurrentScoreType(types[(types.indexOf(S.currentScoreType) + 1) % types.length]);
    renderCPUTable(); 
}

export function cycleSpeedTypeAndUpdate(cpuId) {
    const types = ['multi', 'single', 'branch'];
    S.setCurrentSpeedType(types[(types.indexOf(S.currentSpeedType) + 1) % types.length]);
    renderCPUTable(); 
}

export function filterAndRender() {
    renderCPUTable();
}