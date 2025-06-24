import * as S from '../state.js';
import * as C from '../constants.js';
import * as tableUI from './table.js';
import * as storage from '../storage.js';

let previewHideTimer; 

function getTagClass(tagName) {
    // This is duplicated in table.js, ideally should be in a shared utility file
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
function getSpeedLabel(type) {
    const labels = { multi: 'マルチ最大', single: 'シングル最大', branch: 'シングル条件分岐' };
    return labels[type];
}

export function renderTagFilters() {
    const container = document.getElementById('tagFiltersContainer');
    container.innerHTML = '';
    S.AVAILABLE_TAGS.forEach(tag => {
        const checkboxId = `filter-tag-${tag.replace(/\s|×/g, '-')}`;
        const label = document.createElement('label');
        label.htmlFor = checkboxId;
        label.className = getTagClass(tag);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.value = tag;
        checkbox.addEventListener('change', () => {
            label.classList.toggle('checked', checkbox.checked);
            S.setCurrentPage(1);
            tableUI.filterAndRender();
        });
        
        const span = document.createElement('span');
        span.textContent = tag;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

export function showNotification(message, type = 'info', duration = 3500) { 
    const notification = document.getElementById('notification');
    notification.innerHTML = message; 
    
    notification.className = 'notification'; 
    notification.classList.add(type); 

    requestAnimationFrame(() => {
        notification.classList.add('visible');
    });
    
    if (notification.timeoutId) clearTimeout(notification.timeoutId);

    notification.timeoutId = setTimeout(() => {
        notification.classList.remove('visible');
    }, duration);
}

export function toggleFavoriteFilter() {
    S.setFavoriteFilterActive(!S.isFavoriteFilterActive);
    S.setCurrentPage(1);
    storage.saveFavoriteFilterStateToLocalStorage();
    updateFavoriteFilterHeaderState();
    tableUI.filterAndRender();
}

export function updateFavoriteFilterHeaderState() {
    const th = document.querySelector('#cpuTable th.favorite-column');
    if (th) {
        th.classList.toggle('active', S.isFavoriteFilterActive);
    }
}

export function handleCheckboxChange(checkboxElement) {
    const cpuId = parseInt(checkboxElement.dataset.cpuId);
    let newSelectedIds = [...S.selectedCpuIds];
    if (checkboxElement.checked) {
        if (!newSelectedIds.includes(cpuId)) {
            newSelectedIds.push(cpuId);
        }
    } else {
        newSelectedIds = newSelectedIds.filter(id => id !== cpuId);
    }
    S.setSelectedCpuIds(newSelectedIds);
    updateSelectionDependentButtons();
    updateSelectAllCheckboxState();
}

export function toggleSelectAll(event) {
    const isChecked = event.target.checked;
    const visibleCheckboxes = document.querySelectorAll('.cpu-checkbox');
    let newSelectedIds = [...S.selectedCpuIds];
    
    visibleCheckboxes.forEach(cb => {
        const cpuId = parseInt(cb.dataset.cpuId);
        cb.checked = isChecked;
        if (isChecked) {
            if (!newSelectedIds.includes(cpuId)) {
                newSelectedIds.push(cpuId);
            }
        } else {
            newSelectedIds = newSelectedIds.filter(id => id !== cpuId);
        }
    });
    S.setSelectedCpuIds(newSelectedIds);
    updateSelectionDependentButtons();
}

export function updateSelectAllCheckboxState() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllCheckbox) return;

    const visibleCheckboxes = Array.from(document.querySelectorAll('.cpu-checkbox'));
    if (visibleCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }
    
    const checkedCount = visibleCheckboxes.filter(cb => cb.checked).length;
    
    if (checkedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCount === visibleCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

export function updateSelectionDependentButtons() {
    const selectedCount = S.selectedCpuIds.length;
    
    document.querySelectorAll('.selected-count').forEach(span => {
        span.textContent = selectedCount;
    });

    const compareBtn = document.getElementById('compareSelectedBtn');
    if (compareBtn) {
        compareBtn.disabled = selectedCount !== 2;
    }

    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        deleteBtn.disabled = selectedCount === 0;
    }
}

export function renderPagination(totalItems) {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';
    const totalPages = Math.ceil(totalItems / S.itemsPerPage);

    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    ul.appendChild(createPageItem('«', 1, S.currentPage === 1));
    ul.appendChild(createPageItem('‹', S.currentPage - 1, S.currentPage === 1));

    const maxPagesToShow = 5;
    let startPage = Math.max(1, S.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        ul.appendChild(createPageItem('...'));
    }

    for (let i = startPage; i <= endPage; i++) {
        ul.appendChild(createPageItem(i, i, false, i === S.currentPage));
    }

    if (endPage < totalPages) {
        ul.appendChild(createPageItem('...'));
    }

    ul.appendChild(createPageItem('›', S.currentPage + 1, S.currentPage === totalPages));
    ul.appendChild(createPageItem('»', totalPages, S.currentPage === totalPages));

    container.appendChild(ul);
}

function createPageItem(text, pageNumber = null, isDisabled = false, isActive = false) {
    const li = document.createElement('li');
    li.className = 'page-item';
    if (isDisabled) li.classList.add('disabled');
    if (isActive) li.classList.add('active');

    const a = document.createElement('button');
    a.className = 'page-link';
    a.innerHTML = text;
    if (pageNumber !== null && !isDisabled) {
        // changePage is exposed on window object from app.js
        a.onclick = () => window.changePage(pageNumber);
    } else {
        a.disabled = true;
    }
    
    if (text === '...') {
        a.disabled = true;
        li.classList.add('disabled');
    }

    li.appendChild(a);
    return li;
}

export function showPreview(event, cpuId) {
    clearTimeout(previewHideTimer);
    hidePreview(true); 

    const cpu = S.cpuData.find(c => c.id === cpuId);
    if (!cpu) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'cpu-preview-tooltip';
    
    let contentHtml = `<h4>${cpu.name}</h4>`;

    if (S.previewSettings.creator) contentHtml += `<p><strong>製作者:</strong> ${cpu.creator}</p>`;
    if (S.previewSettings.score) {
        const scoreValue = cpu.scores[S.currentScoreType];
        const displayValue = (scoreValue !== null && scoreValue !== undefined) ? scoreValue.toLocaleString() : '未測定';
        contentHtml += `<p><strong>スコア (${S.currentScoreType.toUpperCase()}):</strong> ${displayValue} RT</p>`;
    }
    if (S.previewSettings.speed) {
        const speedValue = cpu.speeds[S.currentSpeedType];
        const displayValue = (speedValue !== null && speedValue !== undefined) ? speedValue.toLocaleString() : '未測定';
        contentHtml += `<p><strong>速度 (${getSpeedLabel(S.currentSpeedType)}):</strong> ${displayValue} OPS</p>`;
    }
    if (S.previewSettings.volume) {
        const calculatedVolume = cpu.volume.x * cpu.volume.y * cpu.volume.z;
        contentHtml += `<p><strong>体積:</strong> ${calculatedVolume.toLocaleString()} ブロック³</p>`;
    }
    if (S.previewSettings.description) {
        const description = cpu.description ? (cpu.description.length > 100 ? cpu.description.substring(0, 100) + '...' : cpu.description) : '記載なし';
        contentHtml += `<p class="preview-desc">${description}</p>`;
    }
    
    contentHtml += `
        <div class="preview-actions">
            <button class="action-btn details-btn" onclick="showCPUDetails(${cpu.id}); hidePreview(true);"><i class="fas fa-eye"></i> 詳細を見る</button>
        </div>
    `;

    tooltip.innerHTML = contentHtml;
    document.body.appendChild(tooltip);

    tooltip.addEventListener('mouseenter', () => clearTimeout(previewHideTimer));
    tooltip.addEventListener('mouseleave', () => hidePreview());
    
    const tooltipRect = tooltip.getBoundingClientRect();
    let top = event.pageY + 15;
    let left = event.pageX + 15;

    if (left + tooltipRect.width > window.innerWidth) left = event.pageX - tooltipRect.width - 15;
    if (top + tooltipRect.height > window.innerHeight) top = event.pageY - tooltipRect.height - 15;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    requestAnimationFrame(() => {
        tooltip.classList.add('visible');
    });
}

export function hidePreview(immediate = false) {
    const tooltip = document.querySelector('.cpu-preview-tooltip');
    if (!tooltip) return;
    
    const hideAction = () => {
        if(tooltip) tooltip.remove();
    };

    clearTimeout(previewHideTimer);
    if (immediate) {
        hideAction();
    } else {
        previewHideTimer = setTimeout(hideAction, 300);
    }
}