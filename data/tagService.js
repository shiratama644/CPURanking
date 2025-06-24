import * as S from '../state.js';
import * as storage from '../storage.js';
import * as modalsUI from '../ui/modals.js';
import * as componentsUI from '../ui/components.js';
import * as tableUI from '../ui/table.js';

function updateAllTagUIs() {
    if (document.getElementById('settingsModal').classList.contains('visible')) {
        modalsUI.renderTagManagementTab();
    }
    componentsUI.renderTagFilters();
    tableUI.renderCPUTable();
    if (document.getElementById('cpuFormModal').classList.contains('visible')) {
        const editingIdStr = document.getElementById('editingCpuId').value;
        const editingId = editingIdStr ? parseInt(editingIdStr) : null;
        let currentTags = [];
        if (editingId) {
            const cpu = S.cpuData.find(c => c.id === editingId);
            if (cpu) currentTags = cpu.tags;
        }
        modalsUI.renderTagSelectionCheckboxes('tagSelectionCheckboxes', currentTags);
    }
}

export function addNewTag() {
    const input = document.getElementById('newTagName');
    const newTagName = input.value.trim();

    if (!newTagName) {
        componentsUI.showNotification('タグ名を入力してください。', 'error');
        return;
    }
    if (S.AVAILABLE_TAGS.some(tag => tag.toLowerCase() === newTagName.toLowerCase())) {
        componentsUI.showNotification(`タグ「${newTagName}」は既に存在します。`, 'error');
        return;
    }

    S.AVAILABLE_TAGS.push(newTagName);
    storage.saveTagsToLocalStorage();
    updateAllTagUIs();
    input.value = '';
    componentsUI.showNotification(`タグ「${newTagName}」を追加しました。`, 'success');
}

export function showEditTagInput(tagName, buttonElement) {
    const listItem = buttonElement.closest('.tag-management-item');
    const originalContent = listItem.innerHTML;

    listItem.innerHTML = `
        <form class="tag-edit-form" onsubmit="event.preventDefault(); saveTagEdit('${tagName}', this.querySelector('.tag-edit-input'));">
            <input type="text" class="tag-edit-input" value="${tagName}">
            <div class="tag-item-actions">
                <button type="submit" class="save-tag-btn" title="保存"><i class="fas fa-check"></i></button>
                <button type="button" class="cancel-tag-btn" title="キャンセル" onclick="cancelTagEdit('${tagName}', '${encodeURIComponent(originalContent)}')"><i class="fas fa-times"></i></button>
            </div>
        </form>
    `;
    listItem.querySelector('.tag-edit-input').focus();
}

export function saveTagEdit(oldTagName, inputElement) {
    const newTagName = inputElement.value.trim();

    if (!newTagName) {
        componentsUI.showNotification('タグ名は空にできません。', 'error');
        return;
    }
    if (newTagName.toLowerCase() !== oldTagName.toLowerCase() && S.AVAILABLE_TAGS.some(tag => tag.toLowerCase() === newTagName.toLowerCase())) {
        componentsUI.showNotification(`タグ「${newTagName}」は既に存在します。`, 'error');
        return;
    }

    const tagIndex = S.AVAILABLE_TAGS.findIndex(t => t === oldTagName);
    if (tagIndex > -1) {
        S.AVAILABLE_TAGS[tagIndex] = newTagName;
    }

    S.cpuData.forEach(cpu => {
        const cpuTagIndex = cpu.tags.indexOf(oldTagName);
        if (cpuTagIndex > -1) {
            cpu.tags[cpuTagIndex] = newTagName;
        }
    });

    storage.saveTagsToLocalStorage();
    storage.saveDataToLocalStorage();
    updateAllTagUIs();
    componentsUI.showNotification(`タグ「${oldTagName}」を「${newTagName}」に更新しました。`, 'success');
}

export function cancelTagEdit(tagName, encodedOriginalContent) {
    const listItem = document.querySelector(`.tag-management-item[data-tag-name="${tagName}"]`);
    if (listItem) {
        listItem.innerHTML = decodeURIComponent(encodedOriginalContent);
    }
}

export function deleteTag(tagName) {
    if (confirm(`本当にタグ「${tagName}」を削除しますか？\nこのタグはすべてのデバイスからも削除されます。`)) {
        S.setAvailableTags(S.AVAILABLE_TAGS.filter(t => t !== tagName));

        S.cpuData.forEach(cpu => {
            cpu.tags = cpu.tags.filter(t => t !== tagName);
        });

        storage.saveTagsToLocalStorage();
        storage.saveDataToLocalStorage();
        updateAllTagUIs();
        componentsUI.showNotification(`タグ「${tagName}」を削除しました。`, 'info');
    }
}