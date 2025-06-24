import * as S from '../state.js';
import * as storage from '../storage.js';
import * as tableUI from '../ui/table.js';
import * as componentsUI from '../ui/components.js';
import * as modalsUI from '../ui/modals.js';
import * as C from '../constants.js';
import { updateThemeSelectionUI, loadTheme } from '../theme.js';

function validateForm(form) {
    let isValid = true;
    clearFormValidation(form);

    const requiredInputs = form.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        let hasError = false;
        if (input.type === 'text' || input.tagName.toLowerCase() === 'select') {
            if (!input.value.trim()) hasError = true;
        } else if (input.type === 'number') {
            const val = parseFloat(input.value);
            const min = parseFloat(input.min);
            if (input.value.trim() === '' || isNaN(val) || (input.min !== undefined && !isNaN(min) && val < min)) {
                 hasError = true;
            }
        } else if (input.type === 'date') {
             if (!input.value) hasError = true;
        }
        if(hasError){
            isValid = false;
            input.classList.add('is-invalid');
        }
    });

    const optionalNumberFields = [ { id: 'branchSpeed', min: 0 } ];
    for (const key in C.SCORE_DEFINITIONS) {
        optionalNumberFields.push({ id: `${key}Score`, min: 0 });
    }

    optionalNumberFields.forEach(field => {
        const input = form.querySelector(`#${field.id}`);
        if (input && input.value.trim() !== '') {
            const val = parseFloat(input.value);
            const minVal = parseFloat(field.min);
            if (isNaN(val) || (field.min !== undefined && !isNaN(minVal) && val < minVal)) {
                isValid = false;
                input.classList.add('is-invalid');
            }
        }
    });
    return isValid;
}

function clearFormValidation(form) {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

export function handleCpuFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
        componentsUI.showNotification('入力内容にエラーがあります。確認してください。', 'error');
        return;
    }

    const editingIdStr = document.getElementById('editingCpuId').value;
    const editingId = editingIdStr ? parseInt(editingIdStr) : null;
    
    const branchSpeedInput = document.getElementById('branchSpeed').value.trim();
    
    const newScores = {};
    for (const key in C.SCORE_DEFINITIONS) {
        const input = document.getElementById(`${key}Score`).value.trim();
        newScores[key] = input === '' ? null : parseInt(input);
    }

    const selectedTags = [];
    document.querySelectorAll('#tagSelectionCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        selectedTags.push(cb.value);
    });
    
    const cpuEntry = {
        creator: document.getElementById('creator').value.trim(),
        name: document.getElementById('cpuName').value.trim(),
        scores: newScores,
        speeds: {
            multi: parseFloat(document.getElementById('multiSpeed').value),
            single: parseFloat(document.getElementById('singleSpeed').value),
            branch: branchSpeedInput === '' ? null : parseFloat(branchSpeedInput)
        },
        microarchitecture: document.getElementById('microarchitecture').value.trim(), 
        description: document.getElementById('description').value.trim(),
        cores: parseInt(document.getElementById('cores').value),
        threads: parseInt(document.getElementById('threads').value),
        minecraftEdition: document.getElementById('minecraftEdition').value,
        bit: parseInt(document.getElementById('bit').value),
        volume: {
            x: parseInt(document.getElementById('volumeX').value),
            y: parseInt(document.getElementById('volumeY').value),
            z: parseInt(document.getElementById('volumeZ').value)
        },
        completionDate: document.getElementById('completionDate').value,
        tags: selectedTags
    };

    if (editingId !== null) { 
        const index = S.cpuData.findIndex(c => c.id === editingId);
        if (index > -1) {
            cpuEntry.isFavorite = S.cpuData[index].isFavorite;
            const updatedCpu = { ...S.cpuData[index], ...cpuEntry, id: editingId };
            S.cpuData.splice(index, 1, updatedCpu);
            componentsUI.showNotification('<i class="fas fa-check-circle"></i> デバイス情報が更新されました！', 'success');
        } else {
            componentsUI.showNotification('<i class="fas fa-exclamation-circle"></i> 更新対象のデバイスが見つかりません。', 'error');
            return;
        }
    } else { 
        cpuEntry.id = S.cpuData.length > 0 ? Math.max(0, ...S.cpuData.map(c => c.id)) + 1 : 1;
        while(S.cpuData.some(c => c.id === cpuEntry.id)) {
            cpuEntry.id++;
        }
        cpuEntry.isFavorite = false;
        S.cpuData.push(cpuEntry);
        componentsUI.showNotification('<i class="fas fa-plus-circle"></i> 新しいデバイスが追加されました！', 'success');
    }
    
    storage.saveDataToLocalStorage();
    tableUI.renderCPUTable(); 
    modalsUI.closeModal('cpuFormModal');
}

export function deleteSelectedCPUs() {
    if (S.selectedCpuIds.length === 0) {
        componentsUI.showNotification('削除するデバイスが選択されていません。', 'info');
        return;
    }

    if (confirm(`選択された ${S.selectedCpuIds.length} 個のデバイスを本当に削除しますか？この操作は元に戻せません。`)) {
        const deletedCount = S.selectedCpuIds.length;
        const newData = S.cpuData.filter(cpu => !S.selectedCpuIds.includes(cpu.id));
        S.setCpuData(newData);
        S.setSelectedCpuIds([]);

        storage.saveDataToLocalStorage();
        tableUI.renderCPUTable();
        componentsUI.updateSelectionDependentButtons();
        componentsUI.showNotification(`<i class="fas fa-trash-alt"></i> ${deletedCount} 個のデバイスが削除されました。`, 'info');
    }
}

export function toggleFavorite(cpuId, event) {
    event.stopPropagation();
    const cpu = S.cpuData.find(c => c.id === cpuId);
    if (cpu) {
        cpu.isFavorite = !cpu.isFavorite;
        storage.saveDataToLocalStorage();
        tableUI.renderCPUTable(); 
        componentsUI.showNotification(cpu.isFavorite ? `<i class="fas fa-star"></i> 「${cpu.name}」をお気に入りに追加しました。` : `<i class="far fa-star"></i> 「${cpu.name}」をお気に入りから解除しました。`, 'info', 2000);
    }
}

export function exportDataAsJSON() {
    if (S.selectedCpuIds.length === 0) {
        componentsUI.showNotification('エクスポートするデバイスを選択してください。チェックボックスで選択できます。', 'info', 4000);
        return;
    }

    const dataToExport = S.cpuData.filter(cpu => S.selectedCpuIds.includes(cpu.id));
    
    if (dataToExport.length === 0) {
        componentsUI.showNotification('選択されたデバイスが見つかりませんでした。', 'error');
        return;
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpu-data-selected-${dataToExport.length}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    componentsUI.showNotification(`<i class="fas fa-check-circle"></i> 選択された ${dataToExport.length} 件のデータをJSONファイルにエクスポートしました。`, 'success');
}

export function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) {
                throw new Error('JSONが配列形式ではありません。');
            }
            if (importedData.length > 0 && (!importedData[0].id || !importedData[0].name)) {
                 throw new Error('JSONのデータ形式が正しくないようです。');
            }

            if (confirm('現在のデータをインポートしたデータで上書きしますか？この操作は元に戻せません。')) {
                S.setCpuData(importedData);
                storage.saveDataToLocalStorage();
                tableUI.renderCPUTable();
                componentsUI.showNotification('<i class="fas fa-check-circle"></i> データのインポートが完了しました。', 'success');
            }
        } catch (error) {
            componentsUI.showNotification(`<i class="fas fa-exclamation-triangle"></i> インポートに失敗しました: ${error.message}`, 'error', 5000);
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = function() {
        componentsUI.showNotification('<i class="fas fa-exclamation-triangle"></i> ファイルの読み込みに失敗しました。', 'error');
        event.target.value = '';
    };
    reader.readAsText(file);
}

export function saveAllSettingsAndCloseModal() {
    // Save column visibility
    document.querySelectorAll('#columnSettingsList input[type="checkbox"]').forEach(cb => {
        S.columnVisibility[cb.dataset.columnKey] = cb.checked;
    });
    storage.saveColumnVisibilityToLocalStorage();
    tableUI.applyColumnVisibility();

    // Save chart visibility
    document.querySelectorAll('#chartSettingsList input[type="checkbox"]').forEach(cb => {
        S.chartVisibility[cb.dataset.chartKey] = cb.checked;
    });
    storage.saveChartVisibilityToLocalStorage();
    
    // Save preview settings
    document.querySelectorAll('#previewSettingsList input[type="checkbox"]').forEach(cb => {
        S.previewSettings[cb.dataset.previewKey] = cb.checked;
    });
    storage.savePreviewSettingsToLocalStorage();

    // Save score settings
    for (const key in S.scoreSettings) {
        const highThresholdInput = document.getElementById(`${key}-high-threshold`);
        const mediumThresholdInput = document.getElementById(`${key}-medium-threshold`);
        if (highThresholdInput && mediumThresholdInput) {
            S.scoreSettings[key].highThreshold = parseInt(highThresholdInput.value, 10);
            S.scoreSettings[key].mediumThreshold = parseInt(mediumThresholdInput.value, 10);
        }
    }
    storage.saveScoreSettingsToLocalStorage();

    // Save scatter plot settings
    S.setScatterPlotSetting('x', document.getElementById('scatterXAxis').value);
    S.setScatterPlotSetting('y', document.getElementById('scatterYAxis').value);
    S.setScatterPlotSetting('r', document.getElementById('scatterBubbleSize').value);
    storage.saveScatterPlotSettingsToLocalStorage();

    // Save pagination settings
    const newItemsPerPage = parseInt(document.getElementById('itemsPerPageInput').value, 10);
    if (newItemsPerPage >= 5 && newItemsPerPage <= 100) {
        S.setItemsPerPage(newItemsPerPage);
        storage.savePaginationSettingsToLocalStorage();
        S.setCurrentPage(1);
    } else {
        componentsUI.showNotification('1ページあたりの表示件数は5～100の間で設定してください。', 'error');
    }
    
    tableUI.renderCPUTable();
    modalsUI.closeModal('settingsModal');
    componentsUI.showNotification('<i class="fas fa-check-circle"></i> 設定を保存しました。', 'success');
}

export function resetAllSettings() {
    if (!confirm('「全リセット」を実行しますか？\nすべての設定（表示列、ソート、フィルター、テーマなど）を初期状態に戻します。この操作は元に戻せません。')) {
        return;
    }

    // Clear settings from localStorage
    localStorage.removeItem(C.LOCAL_STORAGE_COLUMN_VISIBILITY_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_CHART_VISIBILITY_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_THEME_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_SCATTER_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_SCORE_SETTINGS_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_PAGINATION_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_SORT_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_FAVORITE_FILTER_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_PREVIEW_SETTINGS_KEY);
    localStorage.removeItem(C.LOCAL_STORAGE_TOUR_KEY); // Reset tour as well

    // Reload state from scratch (it will use defaults)
    storage.loadStateFromStorage();
    
    // Re-apply settings and re-render UI
    loadTheme();
    tableUI.applyColumnVisibility();
    componentsUI.updateFavoriteFilterHeaderState();
    tableUI.renderCPUTable();
    
    // Update the settings modal UI if it's open
    if (document.getElementById('settingsModal').classList.contains('visible')) {
        modalsUI.renderSettingsModal(); // Re-render the whole modal to reflect defaults
        modalsUI.openSettingsModal(); // Re-open with correct tab
    }

    componentsUI.showNotification('<i class="fas fa-undo"></i> すべての設定がリセットされました。', 'success');
}