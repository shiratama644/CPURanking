import * as S from '../state.js';
import * as C from '../constants.js';
import * as componentsUI from './components.js';
import * as tableUI from './table.js';
import * as tagService from '../data/tagService.js';
import { updateThemeSelectionUI } from '../theme.js';

let comparisonChart = null; 
let scatterPlotChart = null;
let statisticsCharts = {};

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        document.body.style.overflow = 'hidden';
        modal.style.display = 'block';
        requestAnimationFrame(() => { 
            modal.classList.add('visible');
        });
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal && modal.classList.contains('visible')) {
        document.body.style.overflow = '';
        if (modalId === 'comparisonModal' && comparisonChart) {
            comparisonChart.destroy();
            comparisonChart = null;
        }
        if (modalId === 'scatterPlotModal' && scatterPlotChart) {
            scatterPlotChart.destroy();
            scatterPlotChart = null;
        }
        if (modalId === 'statisticsModal') {
            for (const chartId in statisticsCharts) {
                if (statisticsCharts[chartId]) {
                    statisticsCharts[chartId].destroy();
                }
            }
            statisticsCharts = {};
        }
        modal.classList.add('closing'); 
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
        }, 300); 
    }
}

function formatValueForComparison(value, unit = '', isScore = false, scoreType = '') {
    if (value === null || value === undefined) return '<span class="comparison-na">未測定</span>';
    let displayValue = value.toLocaleString();
    if (unit) displayValue += ` ${unit}`;
    if (isScore) {
        const scoreClass = tableUI.getScoreClass(value, scoreType);
        return `<span class="${scoreClass}">${displayValue}</span>`;
    }
    return displayValue;
}

function compareValues(valA, valB, higherIsBetter = true, isVolume = false) {
    const aIsNull = valA === null || valA === undefined || String(valA).trim() === '';
    const bIsNull = valB === null || valB === undefined || String(valB).trim() === '';

    if (aIsNull && bIsNull) return { classA: 'comparison-na', classB: 'comparison-na', valADisplay: '未測定', valBDisplay: '未測定' };
    if (aIsNull) return { classA: 'comparison-na', classB: 'comparison-better', valADisplay: '未測定', valBDisplay: valB };
    if (bIsNull) return { classA: 'comparison-better', classB: 'comparison-na', valADisplay: valA, valBDisplay: '未測定' };

    if (valA instanceof Date && valB instanceof Date) {
         if (valA.getTime() === valB.getTime()) return { classA: 'comparison-equal', classB: 'comparison-equal', valADisplay: valA.toLocaleDateString(), valBDisplay: valB.toLocaleDateString() };
         let aIsBetterDate = higherIsBetter ? valA > valB : valA < valB; 
         return {
            classA: aIsBetterDate ? 'comparison-better' : 'comparison-worse',
            classB: aIsBetterDate ? 'comparison-worse' : 'comparison-better',
            valADisplay: valA.toLocaleDateString(), valBDisplay: valB.toLocaleDateString()
         }
    }
    
    if (isNaN(parseFloat(valA)) || isNaN(parseFloat(valB))) {
        if (String(valA).toLowerCase() === String(valB).toLowerCase()) return { classA: 'comparison-equal', classB: 'comparison-equal', valADisplay: valA, valBDisplay: valB };
        return { classA: '', classB: '', valADisplay: valA || 'N/A', valBDisplay: valB || 'N/A' };
    }

    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (numA === numB) return { classA: 'comparison-equal', classB: 'comparison-equal', valADisplay: valA, valBDisplay: valB };

    let aIsBetter;
    if (isVolume) { 
        aIsBetter = numA < numB;
    } else if (higherIsBetter) {
        aIsBetter = numA > numB;
    } else { 
        aIsBetter = numA < numB;
    }

    return {
        classA: aIsBetter ? 'comparison-better' : 'comparison-worse',
        classB: aIsBetter ? 'comparison-worse' : 'comparison-better',
        valADisplay: valA, valBDisplay: valB
    };
}

function getTagClass(tagName) {
    // This is duplicated in table.js, ideally should be in a shared utility file
    // but for simplicity, we'll keep it here for now.
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

// --- Specific Modal Functions ---

export function showCPUDetails(cpuId) {
    const cpu = S.cpuData.find(c => c.id === cpuId);
    if (!cpu) return;

    document.getElementById('detailTitle').textContent = `${cpu.name} - 詳細情報`;
    const calculatedVolume = cpu.volume.x * cpu.volume.y * cpu.volume.z;
    const branchSpeedDisplay = (cpu.speeds.branch === null || cpu.speeds.branch === undefined) ? "未測定" : `${cpu.speeds.branch.toLocaleString()} OPS`;
    
    let scoreDetailsHtml = '';
    for (const key in cpu.scores) {
        const scoreValue = cpu.scores[key];
        const displayValue = (scoreValue === null || scoreValue === undefined) ? "未測定" : scoreValue.toLocaleString();
        const scoreClass = tableUI.getScoreClass(scoreValue, key);
        scoreDetailsHtml += `<div class="detail-item"><span class="detail-label">${key.toUpperCase()}:</span><span class="detail-value ${scoreClass}">${displayValue} RT</span></div>`;
    }

    const tagsHtml = cpu.tags && cpu.tags.length > 0 
        ? cpu.tags.map(tag => `<span class="tag-badge ${getTagClass(tag)}">${tag}</span>`).join('') 
        : "タグなし";
    
    const favoriteStar = cpu.isFavorite ? `<i class="fas fa-star" style="color: #ffc777; margin-left: 10px;"></i>` : '';

    document.getElementById('detailContent').innerHTML = `
        <div style="margin-bottom: 25px; font-size: 1.2em;"><strong>${cpu.name}</strong> ${favoriteStar}</div>
        <div class="cpu-detail-grid-main">
            <div class="cpu-detail-grid-sub"> <!-- Left Column -->
                <div class="detail-section">
                    <h3><i class="fas fa-trophy"></i> パフォーマンススコア</h3>
                    ${scoreDetailsHtml}
                    <div class="detail-item"><span class="detail-label">マルチ最大:</span><span class="detail-value">${cpu.speeds.multi.toLocaleString()} OPS</span></div>
                    <div class="detail-item"><span class="detail-label">シングル最大:</span><span class="detail-value">${cpu.speeds.single.toLocaleString()} OPS</span></div>
                    <div class="detail-item"><span class="detail-label">シングル条件分岐:</span><span class="detail-value">${branchSpeedDisplay}</span></div>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-tools"></i> 基本仕様</h3>
                    <div class="detail-item"><span class="detail-label">製作者:</span><span class="detail-value">${cpu.creator}</span></div>
                    <div class="detail-item"><span class="detail-label">マイクロアーキテクチャ:</span><span class="detail-value">${cpu.microarchitecture || "N/A"}</span></div>
                    <div class="detail-item"><span class="detail-label">コア/ユニット数:</span><span class="detail-value">${cpu.cores}</span></div>
                    <div class="detail-item"><span class="detail-label">スレッド/並列処理単位:</span><span class="detail-value">${cpu.threads}</span></div>
                    <div class="detail-item"><span class="detail-label">マイクラEdition:</span><span class="detail-value">${cpu.minecraftEdition}</span></div>
                    <div class="detail-item"><span class="detail-label">データ幅:</span><span class="detail-value">${cpu.bit}-bit</span></div>
                    <div class="detail-item"><span class="detail-label">体積 (X×Y×Z):</span><span class="detail-value">${cpu.volume.x}×${cpu.volume.y}×${cpu.volume.z} = ${calculatedVolume.toLocaleString()} ブロック³</span></div>
                    <div class="detail-item"><span class="detail-label">完成日:</span><span class="detail-value">${cpu.completionDate}</span></div>
                </div>
            </div>
            <div class="cpu-detail-grid-sub"> <!-- Right Column -->
                <div class="detail-section">
                    <h3><i class="fas fa-tags"></i> タグ</h3>
                    <div class="detail-tags-container">${tagsHtml}</div>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-file-alt"></i> 説明</h3>
                    <p style="line-height: 1.7;">${cpu.description ? cpu.description.replace(/\n/g, '<br>') : "記載なし"}</p>
                </div>
            </div>
        </div>
    `;

    const detailFooter = document.getElementById('detailFooter');
    if (detailFooter) {
        detailFooter.innerHTML = `
            <button class="action-btn edit-btn" onclick="openCpuFormModal(${cpu.id}); closeModal('detailModal');"><i class="fas fa-edit"></i> 編集</button>
        `;
    }

    openModal('detailModal');
}

export function openCpuFormModal(cpuId) {
    const form = document.getElementById('cpuForm');
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    updateCalculatedVolumeDisplay(); 
    
    const modalTitle = document.getElementById('cpuFormTitle');
    const submitBtn = document.getElementById('cpuFormSubmitBtn');
    document.getElementById('editingCpuId').value = cpuId || '';

    let currentTags = [];
    if (cpuId) { 
        const cpu = S.cpuData.find(c => c.id === cpuId);
        if (!cpu) return;
        modalTitle.textContent = 'デバイス情報を編集';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> 変更を保存';

        document.getElementById('creator').value = cpu.creator;
        document.getElementById('cpuName').value = cpu.name;
        
        for (const key in cpu.scores) {
            const input = document.getElementById(`${key}Score`);
            if (input) {
                input.value = (cpu.scores[key] === null || cpu.scores[key] === undefined) ? '' : cpu.scores[key];
            }
        }
        
        document.getElementById('multiSpeed').value = cpu.speeds.multi;
        document.getElementById('singleSpeed').value = cpu.speeds.single;
        document.getElementById('branchSpeed').value = (cpu.speeds.branch === null || cpu.speeds.branch === undefined) ? '' : cpu.speeds.branch;
        document.getElementById('microarchitecture').value = cpu.microarchitecture || ''; 
        document.getElementById('cores').value = cpu.cores;
        document.getElementById('threads').value = cpu.threads;
        document.getElementById('minecraftEdition').value = cpu.minecraftEdition;
        document.getElementById('bit').value = cpu.bit;
        document.getElementById('volumeX').value = cpu.volume.x;
        document.getElementById('volumeY').value = cpu.volume.y;
        document.getElementById('volumeZ').value = cpu.volume.z;
        document.getElementById('completionDate').value = cpu.completionDate;
        document.getElementById('description').value = cpu.description || '';
        currentTags = cpu.tags || [];
        updateCalculatedVolumeDisplay(); 
    } else { 
        modalTitle.textContent = '新しいデバイスを追加';
        submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> デバイスを追加';
        autoCheckCompactTag(); 
    }
    renderTagSelectionCheckboxes('tagSelectionCheckboxes', currentTags);
    openModal('cpuFormModal');
}

export function openComparisonModal() {
    if (S.selectedCpuIds.length !== 2) {
        componentsUI.showNotification('比較するにはデバイスを2つ選択してください。', 'error');
        return;
    }

    const cpu1 = S.cpuData.find(c => c.id === S.selectedCpuIds[0]);
    const cpu2 = S.cpuData.find(c => c.id === S.selectedCpuIds[1]);

    if (!cpu1 || !cpu2) {
        componentsUI.showNotification('選択されたデバイスの読み込みに失敗しました。', 'error');
        return;
    }
    
    document.getElementById('comparisonTitle').textContent = `${cpu1.name} vs ${cpu2.name}`;
    const contentDiv = document.getElementById('comparisonContent');
    
    let tableHtml = `<table class="comparison-table">
        <thead>
            <tr>
                <th>特性</th>
                <th>${cpu1.name} ${cpu1.isFavorite ? '<i class="fas fa-star" style="color:#ffc777;font-size:0.8em;"></i>' : ''}</th>
                <th>${cpu2.name} ${cpu2.isFavorite ? '<i class="fas fa-star" style="color:#ffc777;font-size:0.8em;"></i>' : ''}</th>
            </tr>
        </thead>
        <tbody>`;

    const fieldsToCompare = [
        { label: '製作者', keyA: cpu1.creator, keyB: cpu2.creator, compareFn: (a,b) => compareValues(a,b,false,false)}, 
    ];

    for (const key in C.SCORE_DEFINITIONS) {
        fieldsToCompare.push({
            label: key.toUpperCase(),
            keyA: cpu1.scores[key],
            keyB: cpu2.scores[key],
            unit: 't',
            higherIsBetter: S.scoreSettings[key].highIsBetter,
            isScore: true,
            scoreType: key
        });
    }

    fieldsToCompare.push(
        { label: `マルチ最大 (OPS)`, keyA: cpu1.speeds.multi, keyB: cpu2.speeds.multi, unit: '', higherIsBetter: true },
        { label: `シングル最大 (OPS)`, keyA: cpu1.speeds.single, keyB: cpu2.speeds.single, unit: '', higherIsBetter: true },
        { label: `シングル条件分岐 (OPS)`, keyA: cpu1.speeds.branch, keyB: cpu2.speeds.branch, unit: '', higherIsBetter: true },
        { label: 'コア', keyA: cpu1.cores, keyB: cpu2.cores, unit: '', higherIsBetter: true },
        { label: 'スレッド', keyA: cpu1.threads, keyB: cpu2.threads, unit: '', higherIsBetter: true },
        { label: 'データ幅', keyA: cpu1.bit, keyB: cpu2.bit, unit: '-bit', higherIsBetter: true },
        { label: '体積', keyA: cpu1.volume.x * cpu1.volume.y * cpu1.volume.z, keyB: cpu2.volume.x * cpu2.volume.y * cpu2.volume.z, unit: '', higherIsBetter: false, isVolume: true }, 
        { label: '完成日', keyA: new Date(cpu1.completionDate), keyB: new Date(cpu2.completionDate), compareFn: (a,b) => compareValues(a,b,true,false)}, 
        { label: 'マイクロアーキテクチャ', keyA: cpu1.microarchitecture, keyB: cpu2.microarchitecture, compareFn: (a,b) => compareValues(a,b,false,false)},
        { label: 'Edition', keyA: cpu1.minecraftEdition, keyB: cpu2.minecraftEdition, compareFn: (a,b) => compareValues(a,b,false,false)},
    );
    
    fieldsToCompare.forEach(field => {
        let comparisonResult;
        if(field.compareFn){
             comparisonResult = field.compareFn(field.keyA, field.keyB);
        } else {
             comparisonResult = compareValues(field.keyA, field.keyB, field.higherIsBetter, field.isVolume);
        }

        const valADisplay = field.isScore ? formatValueForComparison(comparisonResult.valADisplay, field.unit, true, field.scoreType) : formatValueForComparison(comparisonResult.valADisplay, field.unit);
        const valBDisplay = field.isScore ? formatValueForComparison(comparisonResult.valBDisplay, field.unit, true, field.scoreType) : formatValueForComparison(comparisonResult.valBDisplay, field.unit);


        tableHtml += `<tr>
                        <td>${field.label}</td>
                        <td class="cpu-value-cell ${comparisonResult.classA}">${valADisplay}</td>
                        <td class="cpu-value-cell ${comparisonResult.classB}">${valBDisplay}</td>
                      </tr>`;
    });

    const tagsA = cpu1.tags && cpu1.tags.length > 0 ? cpu1.tags.map(tag => `<span class="tag-badge ${getTagClass(tag)}">${tag}</span>`).join(' ') : 'タグなし';
    const tagsB = cpu2.tags && cpu2.tags.length > 0 ? cpu2.tags.map(tag => `<span class="tag-badge ${getTagClass(tag)}">${tag}</span>`).join(' ') : 'タグなし';
    tableHtml += `<tr>
                    <td>タグ</td>
                    <td class="tags-cell">${tagsA}</td>
                    <td class="tags-cell">${tagsB}</td>
                  </tr>`;

    const descA = cpu1.description ? cpu1.description.replace(/\n/g, '<br>') : "記載なし";
    const descB = cpu2.description ? cpu2.description.replace(/\n/g, '<br>') : "記載なし";
    tableHtml += `<tr>
                    <td>説明</td>
                    <td>${descA}</td>
                    <td>${descB}</td>
                  </tr>`;

    tableHtml += `</tbody></table>`;
    
    const grid = document.createElement('div');
    grid.className = 'comparison-grid';
    grid.innerHTML = `
        <div class="comparison-table-wrapper">${tableHtml}</div>
        <div class="comparison-chart-wrapper">
            <div id="comparisonChartContainer">
                <canvas id="comparisonChartCanvas"></canvas>
            </div>
        </div>
    `;

    contentDiv.innerHTML = '';
    contentDiv.appendChild(grid);
    
    openModal('comparisonModal');
    setTimeout(() => renderComparisonChart(cpu1, cpu2), 50);
}

// ... Rest of modal functions will go here ...
// Since the file is getting very long, I'll continue with the remaining functions for modals.js.
// Helper for scatter value
function getScatterValue(cpu, key) {
    if (!key || key === 'none') return null;
    if (key === 'volume') {
        return cpu.volume.x * cpu.volume.y * cpu.volume.z;
    } else if (C.SCORE_DEFINITIONS[key]) {
        return cpu.scores[key];
    } else if (key === 'multiSpeed') {
        return cpu.speeds.multi;
    } else if (key === 'singleSpeed') {
        return cpu.speeds.single;
    } else if (key === 'branchSpeed') {
        return cpu.speeds.branch;
    } else {
        return cpu[key];
    }
}
// Render functions for charts and modals
export function renderComparisonChart(cpu1, cpu2) {
    if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
    }
    const chartContainer = document.getElementById('comparisonChartContainer');
    const canvas = document.getElementById('comparisonChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark-theme');
    
    const labels = [];
    const originalData1 = [];
    const originalData2 = [];
    const dataSettings = [];

    for (const key in C.CHART_DEFINITIONS) {
        if (S.chartVisibility[key]) {
            labels.push(C.CHART_DEFINITIONS[key].label);
            let val1, val2, setting;
            if (C.SCORE_DEFINITIONS[key]) {
                val1 = cpu1.scores[key];
                val2 = cpu2.scores[key];
                setting = S.scoreSettings[key];
            } else {
                switch (key) {
                    case 'volume':
                        val1 = cpu1.volume.x * cpu1.volume.y * cpu1.volume.z;
                        val2 = cpu2.volume.x * cpu2.volume.y * cpu2.volume.z;
                        setting = { highIsBetter: false }; // Volume is always low is better
                        break;
                    default:
                        val1 = getScatterValue(cpu1, key);
                        val2 = getScatterValue(cpu2, key);
                        setting = { highIsBetter: true };
                        break;
                }
            }
            originalData1.push(val1);
            originalData2.push(val2);
            dataSettings.push(setting);
        }
    }

    if (labels.length < 3) {
        chartContainer.innerHTML = `<p style="text-align:center; padding: 40px 20px; font-size: 1.1rem;"><i class="fas fa-info-circle"></i> グラフを表示するには、設定で3つ以上の項目を選択してください。</p>`;
        return;
    }

    const normalizedData1 = [];
    const normalizedData2 = [];

    for (let i = 0; i < labels.length; i++) {
        const val1 = originalData1[i];
        const val2 = originalData2[i];
        const setting = dataSettings[i];

        const num1 = (val1 === null || val1 === undefined) ? 0 : val1;
        const num2 = (val2 === null || val2 === undefined) ? 0 : val2;

        if (setting && !setting.highIsBetter) { // Low is better
            if (num1 === 0 && num2 === 0) {
                normalizedData1.push(100);
                normalizedData2.push(100);
            } else if (num1 === 0) {
                normalizedData1.push(100);
                normalizedData2.push(0);
            } else if (num2 === 0) {
                normalizedData1.push(0);
                normalizedData2.push(100);
            } else {
                const minVal = Math.min(num1, num2);
                normalizedData1.push((minVal / num1) * 100);
                normalizedData2.push((minVal / num2) * 100);
            }
        } else { // High is better
            const maxVal = Math.max(num1, num2);
            if (maxVal > 0) {
                normalizedData1.push((num1 / maxVal) * 100);
                normalizedData2.push((num2 / maxVal) * 100);
            } else {
                normalizedData1.push(0);
                normalizedData2.push(0);
            }
        }
    }

    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: cpu1.name,
                    data: normalizedData1,
                    originalData: originalData1,
                    backgroundColor: isDark ? 'rgba(122, 162, 247, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                    borderColor: isDark ? '#7aa2f7' : 'rgba(102, 126, 234, 1)',
                    pointBackgroundColor: isDark ? '#7aa2f7' : 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: isDark ? '#7aa2f7' : 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                },
                {
                    label: cpu2.name,
                    data: normalizedData2,
                    originalData: originalData2,
                    backgroundColor: isDark ? 'rgba(187, 154, 247, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    borderColor: isDark ? '#bb9af7' : 'rgba(255, 107, 107, 1)',
                    pointBackgroundColor: isDark ? '#bb9af7' : 'rgba(255, 107, 107, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: isDark ? '#bb9af7' : 'rgba(255, 107, 107, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { display: true, color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 13, weight: '500' }, color: isDark ? '#c0caf5' : '#333' },
                    ticks: {
                        display: true,
                        backdropColor: 'transparent',
                        color: isDark ? '#a9b1d6' : '#666',
                        stepSize: 20,
                        callback: value => value + '%'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: '性能バランス比較',
                    font: { size: 16 },
                    padding: { bottom: 20 },
                    color: isDark ? '#c0caf5' : '#333'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            const datasetLabel = dataset.label || '';
                            const originalValue = dataset.originalData[context.dataIndex];
                            const displayValue = (originalValue === null || originalValue === undefined) ? '未測定' : originalValue.toLocaleString();
                            return `${datasetLabel}: ${displayValue}`;
                        }
                    }
                },
                legend: { position: 'top', labels: { color: isDark ? '#c0caf5' : '#333' } }
            }
        }
    });
}
export function renderScatterPlot() {
    if (scatterPlotChart) {
        scatterPlotChart.destroy();
        scatterPlotChart = null;
    }

    const ctx = document.getElementById('scatterPlotCanvas').getContext('2d');
    const isDark = document.body.classList.contains('dark-theme');

    const { x: xKey, y: yKey, r: rKey } = S.scatterPlotSettings;
    
    const dataPoints = S.cpuData.map(cpu => {
        const xVal = getScatterValue(cpu, xKey);
        const yVal = getScatterValue(cpu, yKey);
        
        if (xVal === null || xVal === undefined || yVal === null || yVal === undefined) {
            return null;
        }

        return {
            x: xVal,
            y: yVal,
            rVal: getScatterValue(cpu, rKey),
            cpu: cpu
        };
    }).filter(p => p !== null);

    const rValues = dataPoints.map(p => p.rVal).filter(v => v !== null && v !== undefined);
    const maxR = rValues.length > 0 ? Math.max(...rValues) : 0;

    dataPoints.forEach(p => {
        if (p.rVal !== null && p.rVal !== undefined && maxR > 0) {
            p.r = 5 + (p.rVal / maxR) * 20;
        } else {
            p.r = 5;
        }
    });

    const xLabel = C.SCATTER_PLOT_AXIS_DEFINITIONS[xKey]?.label || 'X軸';
    const yLabel = C.SCATTER_PLOT_AXIS_DEFINITIONS[yKey]?.label || 'Y軸';
    const rLabel = C.SCATTER_PLOT_AXIS_DEFINITIONS[rKey]?.label || '';

    scatterPlotChart = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'デバイス',
                data: dataPoints,
                backgroundColor: isDark ? 'rgba(115, 218, 202, 0.6)' : 'rgba(38, 222, 129, 0.6)',
                borderColor: isDark ? '#73daca' : 'rgba(38, 222, 129, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const firstElement = elements[0];
                    const cpu = dataPoints[firstElement.index].cpu;
                    closeModal('scatterPlotModal');
                    setTimeout(() => showCPUDetails(cpu.id), 300);
                }
            },
            scales: {
                x: {
                    title: { display: true, text: xLabel, font: { size: 14 }, color: isDark ? '#c0caf5' : '#333' },
                    ticks: { color: isDark ? '#a9b1d6' : '#666' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                },
                y: {
                    title: { display: true, text: yLabel, font: { size: 14 }, color: isDark ? '#c0caf5' : '#333' },
                    ticks: { color: isDark ? '#a9b1d6' : '#666' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: '性能散布図',
                    font: { size: 16 },
                    padding: { bottom: 20 },
                    color: isDark ? '#c0caf5' : '#333'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const data = context.raw;
                            const cpu = data.cpu;
                            let lines = [`${cpu.name} (${cpu.creator})`];
                            lines.push('--------------------');
                            lines.push(`${xLabel}: ${data.x.toLocaleString()}`);
                            lines.push(`${yLabel}: ${data.y.toLocaleString()}`);
                            if (rKey !== 'none' && data.rVal !== null) {
                                lines.push(`${rLabel}: ${data.rVal.toLocaleString()}`);
                            }
                            return lines;
                        }
                    }
                }
            }
        }
    });
}
export function calculateStatistics() {
    const stats = {
        totalDevices: S.cpuData.length,
        uniqueCreators: new Set(S.cpuData.map(c => c.creator)).size,
        totalTags: S.AVAILABLE_TAGS.length,
        avgMultiSpeed: 'N/A',
        avgVolume: 'N/A',
        topSpeedDevice: { name: 'N/A', value: 0 },
        mostCompactDevice: { name: 'N/A', value: Infinity },
        editionDistribution: {},
        tagUsage: {}
    };

    if (S.cpuData.length === 0) return stats;

    let totalMultiSpeed = 0;
    let multiSpeedCount = 0;
    let totalVolume = 0;
    let volumeCount = 0;

    S.cpuData.forEach(cpu => {
        if (cpu.speeds.multi !== null && cpu.speeds.multi !== undefined) {
            totalMultiSpeed += cpu.speeds.multi;
            multiSpeedCount++;
            if (cpu.speeds.multi > stats.topSpeedDevice.value) {
                stats.topSpeedDevice = { name: cpu.name, value: cpu.speeds.multi };
            }
        }

        const volume = cpu.volume.x * cpu.volume.y * cpu.volume.z;
        if (volume > 0) {
            totalVolume += volume;
            volumeCount++;
            if (volume < stats.mostCompactDevice.value) {
                stats.mostCompactDevice = { name: cpu.name, value: volume };
            }
        }
        
        const edition = cpu.minecraftEdition || '不明';
        stats.editionDistribution[edition] = (stats.editionDistribution[edition] || 0) + 1;
        
        (cpu.tags || []).forEach(tag => {
            stats.tagUsage[tag] = (stats.tagUsage[tag] || 0) + 1;
        });
    });

    if (multiSpeedCount > 0) {
        stats.avgMultiSpeed = totalMultiSpeed / multiSpeedCount;
    }
    if (volumeCount > 0) {
        stats.avgVolume = totalVolume / volumeCount;
    }
    
    if (stats.topSpeedDevice.name === 'N/A') stats.topSpeedDevice.value = 'N/A';
    if (stats.mostCompactDevice.name === 'N/A') stats.mostCompactDevice.value = 'N/A';

    stats.sortedTagUsage = Object.entries(stats.tagUsage).sort(([, a], [, b]) => b - a).slice(0, 10);

    return stats;
}
export function renderStatisticsCharts(stats) {
    const isDark = document.body.classList.contains('dark-theme');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#c0caf5' : '#333';
    const chartColors = isDark 
        ? ['#f7768e', '#9ece6a', '#7aa2f7', '#e0af68', '#bb9af7', '#ff9e64', '#73daca', '#c0caf5']
        : ['#ff6b6b', '#4ecdc4', '#feca57', '#54a0ff', '#9b59b6', '#1dd1a1', '#ff9f43', '#2e86de'];

    const editionCtx = document.getElementById('editionChartCanvas')?.getContext('2d');
    if (editionCtx) {
        const editionLabels = Object.keys(stats.editionDistribution);
        const editionData = Object.values(stats.editionDistribution);
        statisticsCharts.edition = new Chart(editionCtx, {
            type: 'doughnut',
            data: {
                labels: editionLabels,
                datasets: [{
                    data: editionData,
                    backgroundColor: chartColors,
                    borderColor: isDark ? '#24283b' : '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: textColor } },
                    title: { display: true, text: 'Minecraft Edition 分布', color: textColor, font: { size: 16 } }
                }
            }
        });
    }

    const tagCtx = document.getElementById('tagChartCanvas')?.getContext('2d');
    if (tagCtx && stats.sortedTagUsage.length > 0) {
        const tagLabels = stats.sortedTagUsage.map(item => item[0]);
        const tagData = stats.sortedTagUsage.map(item => item[1]);
        statisticsCharts.tag = new Chart(tagCtx, {
            type: 'bar',
            data: {
                labels: tagLabels,
                datasets: [{
                    label: '使用回数',
                    data: tagData,
                    backgroundColor: chartColors.slice(0, tagLabels.length),
                    borderColor: chartColors.slice(0, tagLabels.length),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor, precision: 0 }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'タグ使用率 Top 10', color: textColor, font: { size: 16 } }
                }
            }
        });
    } else if (tagCtx) {
         tagCtx.font = `16px ${getComputedStyle(document.body).fontFamily}`;
         tagCtx.fillStyle = textColor;
         tagCtx.textAlign = 'center';
         tagCtx.fillText('タグデータがありません', tagCtx.canvas.width / 2, tagCtx.canvas.height / 2);
    }
}
// Modal Openers that render content
export function openScatterPlotModal() {
    openModal('scatterPlotModal');
    setTimeout(renderScatterPlot, 50);
}
export function openStatisticsModal() {
    const stats = calculateStatistics();
    renderStatisticsModalContent(stats);
    openModal('statisticsModal');
    setTimeout(() => {
        renderStatisticsCharts(stats);
    }, 50);
}
export function openDescriptionModal() {
    renderDescriptionModalContent();
    openModal('descriptionModal');
}
export function openSettingsModal() {
    closeModal('settingsModal'); // Close if already open to reset state
    document.querySelectorAll('#columnSettingsList input[type="checkbox"]').forEach(cb => {
        cb.checked = S.columnVisibility[cb.dataset.columnKey];
    });
    document.querySelectorAll('#chartSettingsList input[type="checkbox"]').forEach(cb => {
        cb.checked = S.chartVisibility[cb.dataset.chartKey];
    });
    document.querySelectorAll('#previewSettingsList input[type="checkbox"]').forEach(cb => {
        cb.checked = S.previewSettings[cb.dataset.previewKey];
    });
    document.getElementById('scatterXAxis').value = S.scatterPlotSettings.x;
    document.getElementById('scatterYAxis').value = S.scatterPlotSettings.y;
    document.getElementById('scatterBubbleSize').value = S.scatterPlotSettings.r;
    document.getElementById('itemsPerPageInput').value = S.itemsPerPage;
    
    renderTagManagementTab();
    renderScoreSettingsTab();
    updateThemeSelectionUI();

    openModal('settingsModal');
    // Set default tab
    document.querySelector('.tab-link').click();
}

// Modal Content Renderers
export function renderNewScoreFields() {
    const container = document.getElementById('newScoreFieldsContainer');
    container.innerHTML = '';
    for (const key in C.SCORE_DEFINITIONS) {
        const score = C.SCORE_DEFINITIONS[key];
        const fieldHtml = `
            <div class="form-group">
                <label for="${key}Score">${score.label}</label>
                <input type="number" id="${key}Score" min="0" placeholder="未入力可">
                <div class="invalid-feedback">${score.label}は0以上の数値で入力してください。</div>
            </div>
        `;
        container.innerHTML += fieldHtml;
    }
}
export function renderTagSelectionCheckboxes(containerId, selectedTags = []) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    S.AVAILABLE_TAGS.forEach(tag => {
        const checkboxId = `tag-checkbox-${tag.replace(/\s|×/g, '-')}-${containerId}`; 
        const label = document.createElement('label');
        label.htmlFor = checkboxId;
        label.className = getTagClass(tag);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.value = tag;
        checkbox.checked = selectedTags.includes(tag);
        
        const span = document.createElement('span');
        span.textContent = tag;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);

        if (checkbox.checked) {
            label.classList.add('checked');
        }
        checkbox.addEventListener('change', () => {
            label.classList.toggle('checked', checkbox.checked);
        });
    });
}
function renderDescriptionModalContent() {
    const descriptions = {
        "RCBSP": { title: "Single Process Increment", text: "1スレッドのみ使用し、レジスタの値を0から8までインクリメントするのにかかった時間を測定します。単純な命令処理速度とパイプライン性能を評価します。" },
        "RCBFA": { title: "Single Process Factorial", text: "1スレッドのみ使用し、5の階乗（5!）を計算する処理が完了するまでの時間を測定します。ループ・分岐・乗算の組み合わせに対する処理性能を評価します。" },
        "RCBMP": { title: "Multi Process Increment", text: "すべてのスレッドを用いて、同時にそれぞれインクリメント処理を行い、合計16回分のインクリメント処理が完了するまでの時間を測定します。スレッド間の独立性と並列処理能力を評価します。" },
        "RCBWM": { title: "Write to Memory", text: "レジスタの値をメモリに連続で書き込む処理の速度を測定します。メモリ書き込み帯域とアドレス計算性能を評価します。" },
        "RCBRM": { title: "Read from Memory", text: "メモリから別のメモリ位置へと連続的に読み込み・コピーする処理の速度を測定します。メモリアクセスおよび内部バス帯域の性能を評価します。" },
        "RCBML": { title: "Integer Multiply", text: "2つの整数値を掛け算する命令の処理速度を測定します。FPUなしの固定長整数演算による乗算性能を評価します。" },
        "RCBDV": { title: "Integer Divide", text: "2つの整数値を割り算する命令の処理速度を測定します。除算回路（または逐次的演算）の実行速度を評価します。" },
        "RCBSQ": { title: "Integer Square Root", text: "整数の平方根を求める命令またはアルゴリズムの実行速度を測定します。繰り返し演算や比較処理の性能が反映されます。" },
        "RCBSH": { title: "Barrel Shift", text: "指定回数だけビットを右方向へシフトする処理の速度を測定します。バレルシフタ回路の有無やシフト実行時間に関する性能を評価します。" }
    };
    const container = document.getElementById('descriptionContent');
    container.innerHTML = '';
    for (const key in descriptions) {
        const desc = descriptions[key];
        const section = document.createElement('div');
        section.className = 'detail-section';
        section.innerHTML = `
            <h3><i class="fas fa-tachometer-alt"></i> ${key} : ${desc.title}</h3>
            <p style="line-height: 1.7;">${desc.text}</p>
        `;
        container.appendChild(section);
    }
}
function formatStatValue(value, precision = 2) {
    if (typeof value === 'number') {
        if (value % 1 === 0) {
            return value.toLocaleString();
        }
        return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision });
    }
    return value;
}
function renderStatisticsModalContent(stats) {
    const contentDiv = document.getElementById('statisticsContent');
    if (stats.totalDevices === 0) {
        contentDiv.innerHTML = `<p style="text-align:center; padding: 40px 20px; font-size: 1.1rem;"><i class="fas fa-info-circle"></i> 統計情報を表示するためのデータがありません。</p>`;
        return;
    }

    const topSpeedDeviceText = stats.topSpeedDevice.name !== 'N/A'
        ? `${stats.topSpeedDevice.name} (${formatStatValue(stats.topSpeedDevice.value, 0)} OPS)`
        : 'N/A';

    const mostCompactDeviceText = stats.mostCompactDevice.name !== 'N/A'
        ? `${stats.mostCompactDevice.name} (${formatStatValue(stats.mostCompactDevice.value, 0)} b³)`
        : 'N/A';

    contentDiv.innerHTML = `
        <div class="stats-main-container">
            <div class="stats-info-column">
                <div class="stats-card">
                    <h3><i class="fas fa-database"></i> 基本統計</h3>
                    <div class="stats-item"><span class="stats-label">登録デバイス数:</span><span class="stats-value">${stats.totalDevices}</span></div>
                    <div class="stats-item"><span class="stats-label">ユニーク製作者数:</span><span class="stats-value">${stats.uniqueCreators}</span></div>
                    <div class="stats-item"><span class="stats-label">登録タグ種類数:</span><span class="stats-value">${stats.totalTags}</span></div>
                    <hr>
                    <div class="stats-item"><span class="stats-label">平均マルチ最大速度:</span><span class="stats-value">${formatStatValue(stats.avgMultiSpeed, 0)} OPS</span></div>
                    <div class="stats-item"><span class="stats-label">平均体積:</span><span class="stats-value">${formatStatValue(stats.avgVolume, 0)} ブロック³</span></div>
                    <hr>
                    <div class="stats-item"><span class="stats-label">最高速度デバイス:</span><span class="stats-value">${topSpeedDeviceText}</span></div>
                    <div class="stats-item"><span class="stats-label">最小体積デバイス:</span><span class="stats-value">${mostCompactDeviceText}</span></div>
                </div>
            </div>
            <div class="stats-charts-column">
                <div class="stats-chart-wrapper">
                    <canvas id="editionChartCanvas"></canvas>
                </div>
                <div class="stats-chart-wrapper">
                    <canvas id="tagChartCanvas"></canvas>
                </div>
            </div>
        </div>
    `;
}
// --- Settings Modal specific renderers ---
export function renderSettingsModal() {
    // Column Settings
    const columnList = document.getElementById('columnSettingsList');
    columnList.innerHTML = '';
    for (const key in C.COLUMN_DEFINITIONS) {
        const column = C.COLUMN_DEFINITIONS[key];
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        label.htmlFor = `col-toggle-${key}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-toggle-${key}`;
        checkbox.dataset.columnKey = key;
        checkbox.checked = S.columnVisibility[key];
        const span = document.createElement('span');
        span.textContent = column.label;
        label.appendChild(checkbox);
        label.appendChild(span);
        listItem.appendChild(label);
        columnList.appendChild(listItem);
    }

    // Chart Settings
    const chartList = document.getElementById('chartSettingsList');
    chartList.innerHTML = '';
    for (const key in C.CHART_DEFINITIONS) {
        const chartItem = C.CHART_DEFINITIONS[key];
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        label.htmlFor = `chart-toggle-${key}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `chart-toggle-${key}`;
        checkbox.dataset.chartKey = key;
        checkbox.checked = S.chartVisibility[key];
        const span = document.createElement('span');
        span.textContent = chartItem.label;
        label.appendChild(checkbox);
        label.appendChild(span);
        listItem.appendChild(label);
        chartList.appendChild(listItem);
    }

    // Preview Settings
    const previewList = document.getElementById('previewSettingsList');
    previewList.innerHTML = '';
    for (const key in C.PREVIEW_DEFINITIONS) {
        const item = C.PREVIEW_DEFINITIONS[key];
        const listItem = document.createElement('li');
        const label = document.createElement('label');
        label.htmlFor = `preview-toggle-${key}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `preview-toggle-${key}`;
        checkbox.dataset.previewKey = key;
        checkbox.checked = S.previewSettings[key];
        const span = document.createElement('span');
        span.textContent = item.label;
        label.appendChild(checkbox);
        label.appendChild(span);
        listItem.appendChild(label);
        previewList.appendChild(listItem);
    }

    // Scatter Plot Settings
    const xSelect = document.getElementById('scatterXAxis');
    const ySelect = document.getElementById('scatterYAxis');
    const rSelect = document.getElementById('scatterBubbleSize');
    [xSelect, ySelect, rSelect].forEach(select => select.innerHTML = '');

    const noneOption = document.createElement('option');
    noneOption.value = 'none';
    noneOption.textContent = 'なし';
    rSelect.appendChild(noneOption);

    for (const key in C.SCATTER_PLOT_AXIS_DEFINITIONS) {
        const item = C.SCATTER_PLOT_AXIS_DEFINITIONS[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = item.label;
        xSelect.appendChild(option.cloneNode(true));
        ySelect.appendChild(option.cloneNode(true));
        rSelect.appendChild(option.cloneNode(true));
    }

    // Theme Settings
    const themeContainer = document.getElementById('themeSelectionContainer');
    themeContainer.innerHTML = `
        <label id="lightThemeLabel">
            <input type="radio" name="theme" value="light">
            <i class="fas fa-sun"></i>
            <span>ライト</span>
        </label>
        <label id="darkThemeLabel">
            <input type="radio" name="theme" value="dark">
            <i class="fas fa-moon"></i>
            <span>ダーク</span>
        </label>
    `;
    themeContainer.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            // This event is handled in app.js
        });
    });
}
export function openSettingsTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("settings-tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tab-link");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}
export function renderScoreSettingsTab() {
    const container = document.getElementById('scoreSettingsContainer');
    container.innerHTML = '';

    for (const key in S.scoreSettings) {
        const setting = S.scoreSettings[key];
        const item = document.createElement('div');
        item.className = 'score-setting-item';
        item.innerHTML = `
            <h4>${key.toUpperCase()}</h4>
            <div class="form-group">
                <label>評価基準</label>
                <button id="${key}-behavior-btn" class="behavior-toggle-btn" onclick="toggleScoreBehavior('${key}')"></button>
            </div>
            <div class="form-group">
                <label id="${key}-high-label"></label>
                <input type="number" id="${key}-high-threshold" value="${setting.highThreshold}">
            </div>
            <div class="form-group">
                <label id="${key}-medium-label"></label>
                <input type="number" id="${key}-medium-threshold" value="${setting.mediumThreshold}">
            </div>
        `;
        container.appendChild(item);
        updateScoreBehaviorUI(key);
    }
}
export function toggleScoreBehavior(key) {
    S.scoreSettings[key].highIsBetter = !S.scoreSettings[key].highIsBetter;
    updateScoreBehaviorUI(key);
}
export function updateScoreBehaviorUI(key) {
    const setting = S.scoreSettings[key];
    const btn = document.getElementById(`${key}-behavior-btn`);
    const highLabel = document.getElementById(`${key}-high-label`);
    const mediumLabel = document.getElementById(`${key}-medium-label`);

    if (setting.highIsBetter) {
        btn.textContent = '値が高いほど良い';
        btn.className = 'behavior-toggle-btn high-is-better';
        highLabel.textContent = '高スコアの閾値 (この値以上)';
        mediumLabel.textContent = '中スコアの閾値 (この値以上)';
    } else {
        btn.textContent = '値が低いほど良い';
        btn.className = 'behavior-toggle-btn low-is-better';
        highLabel.textContent = '高スコアの閾値 (この値以下)';
        mediumLabel.textContent = '中スコアの閾値 (この値以下)';
    }
}
export function renderTagManagementTab() {
    const list = document.getElementById('tagManagementList');
    list.innerHTML = '';
    S.AVAILABLE_TAGS.forEach(tag => {
        const listItem = document.createElement('li');
        listItem.className = 'tag-management-item';
        listItem.dataset.tagName = tag;
        listItem.innerHTML = `
            <span class="tag-item-name">${tag}</span>
            <div class="tag-item-actions">
                <button class="edit-tag-btn" title="編集" onclick="showEditTagInput('${tag}', this)"><i class="fas fa-pen"></i></button>
                <button class="delete-tag-btn" title="削除" onclick="deleteTag('${tag}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(listItem);
    });
}
// Form modal helpers
export function updateCalculatedVolumeDisplay() {
    const xInput = document.getElementById('volumeX');
    const yInput = document.getElementById('volumeY');
    const zInput = document.getElementById('volumeZ');
    const display = document.getElementById('calculatedVolumeDisplay');

    if (!xInput || !yInput || !zInput || !display) return; 

    const x = parseInt(xInput.value) || 0;
    const y = parseInt(yInput.value) || 0;
    const z = parseInt(zInput.value) || 0;
    
    const totalVolume = x * y * z;
    if (x > 0 && y > 0 && z > 0) {
        display.textContent = `合計体積: ${totalVolume.toLocaleString()} ブロック³`;
    } else {
        display.textContent = `合計体積: -`;
    }
}
export function autoCheckCompactTag() {
    const x = parseInt(document.getElementById('volumeX').value) || 0;
    const y = parseInt(document.getElementById('volumeY').value) || 0;
    const compactTagCheckbox = document.querySelector('#tagSelectionCheckboxes input[type="checkbox"][value="64×64以下"]');

    if (compactTagCheckbox) {
        if (x > 0 && y > 0 && x <= 64 && y <= 64) {
            compactTagCheckbox.checked = true;
            const label = compactTagCheckbox.closest('label');
            if (label) label.classList.add('checked');
        }
    }
}