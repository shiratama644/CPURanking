import { LOCAL_STORAGE_TOUR_KEY } from './constants.js';

export function initTour() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true,
                label: 'ツアーを閉じる'
            },
            buttons: [
                {
                    classes: 'shepherd-button-secondary',
                    text: '戻る',
                    action() { this.back(); }
                },
                {
                    text: '次へ',
                    action() { this.next(); }
                }
            ]
        }
    });

    tour.addStep({
        id: 'welcome',
        title: 'ようこそ！',
        text: '自作CPU/GPU性能比較サイトへようこそ！簡単な操作説明ツアーを開始します。',
        buttons: [{ text: 'ツアーを開始', action: tour.next }]
    });
    tour.addStep({
        id: 'add-cpu',
        title: '新規デバイス追加',
        text: 'ここから新しいCPUやGPUのデータを登録できます。フォームに必要な情報を入力してください。',
        attachTo: { element: '.add-cpu-btn', on: 'bottom' }
    });
    tour.addStep({
        id: 'search-and-filter',
        title: '検索とフィルター',
        text: 'デバイス名や製作者名での検索、タグを使った絞り込みができます。これらを組み合わせて目的のデバイスを素早く見つけましょう。',
        attachTo: { element: '.search-box-wrapper', on: 'bottom' }
    });
    tour.addStep({
        id: 'table-sort',
        title: 'データの並べ替え',
        text: 'テーブルのヘッダー（製作者名、スコアなど）をクリックすると、データを並べ替えられます。クリックするたびに昇順→降順→ソート解除と切り替わります。',
        attachTo: { element: '#cpuTable th[data-sort-key="name"]', on: 'top' }
    });
    tour.addStep({
        id: 'table-interaction',
        title: '便利なテーブル操作',
        text: 'テーブルの各セルには便利な機能があります。<br>・<b>星アイコン:</b> お気に入り登録/解除。ヘッダーの星で絞り込みもできます。<br>・<b>デバイス名:</b> マウスホバーで簡易プレビューが表示されます。<br>・<b>スコア/速度:</b> クリックで表示指標を切り替えられます。',
        attachTo: { element: '#cpuTableBody tr:first-child', on: 'bottom' }
    });
    tour.addStep({
        id: 'table-scroll',
        title: 'テーブルの横スクロール',
        text: 'テーブルは項目が多く横長です。マウスで左右にスクロールできます。<br>PCでは <b>Shiftキーを押しながらマウスホイールを回す</b>と、スムーズに横スクロールできて便利です。',
        attachTo: { element: '.table-wrapper', on: 'top' }
    });
    tour.addStep({
        id: 'bulk-actions',
        title: '複数選択での操作',
        text: 'チェックボックスでデバイスを選択すると、一括操作ができます。<br>・<b>2つ選択:</b> 詳細な性能比較<br>・<b>1つ以上選択:</b> まとめて削除、JSONエクスポート',
        attachTo: { element: '#compareSelectedBtn', on: 'bottom' }
    });
    tour.addStep({
        id: 'data-analysis',
        title: 'データ分析機能',
        text: '「散布図」や「統計情報」ボタンから、登録されたデータを様々な角度から視覚的に分析できます。',
        attachTo: { element: '.scatter-plot-btn', on: 'bottom' }
    });
    tour.addStep({
        id: 'data-management',
        title: 'データの保存と読込',
        text: '「エクスポート」で選択したデータをJSONファイルとして保存し、「インポート」で読み込むことができます。データのバックアップや共有に便利です。',
        attachTo: { element: '.export-btn', on: 'bottom' }
    });
    tour.addStep({
        id: 'keyboard-shortcuts',
        title: 'キーボードショートカット',
        text: 'キーボードの <strong>`Esc`</strong> キーを押すと、開いているモーダルウィンドウ（詳細、設定など）を閉じることができます。',
    });
    tour.addStep({
        id: 'settings',
        title: 'サイトのカスタマイズ',
        text: '「設定」から、表示列、比較グラフの項目、テーマ（ライト/ダーク）、タグの管理など、サイトの見た目や動作を自分好みにカスタマイズできます。「全リセット」で初期状態に戻すことも可能です。',
        attachTo: { element: '.settings-btn', on: 'bottom' }
    });
    tour.addStep({
        id: 'finish',
        title: 'ツアー終了',
        text: 'これで基本的な操作は完了です！このツアーはいつでもこの「ヒント」ボタンから再度見ることができます。',
        attachTo: { element: '#startTourBtn', on: 'bottom' },
        buttons: [{ text: '完了', action: tour.complete }]
    });

    const setTourCompleted = () => {
        localStorage.setItem(LOCAL_STORAGE_TOUR_KEY, 'true');
    };

    tour.on('complete', setTourCompleted);
    tour.on('cancel', setTourCompleted);

    document.getElementById('startTourBtn').addEventListener('click', () => {
        tour.start();
    });

    if (!localStorage.getItem(LOCAL_STORAGE_TOUR_KEY)) {
        setTimeout(() => tour.start(), 1200);
    }
}