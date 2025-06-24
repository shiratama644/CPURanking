export const LOCAL_STORAGE_DATA_KEY = 'customCpuSiteData_v2_5_scores';
export const LOCAL_STORAGE_SORT_KEY = 'customCpuSiteSortState_v2_4_favorite';
export const LOCAL_STORAGE_FAVORITE_FILTER_KEY = 'customCpuSiteFavoriteFilterState_v2_4';
export const LOCAL_STORAGE_COLUMN_VISIBILITY_KEY = 'customCpuSiteColumnVisibility_v1';
export const LOCAL_STORAGE_CHART_VISIBILITY_KEY = 'customCpuSiteChartVisibility_v1';
export const LOCAL_STORAGE_THEME_KEY = 'customCpuSiteTheme_v1';
export const LOCAL_STORAGE_SCATTER_KEY = 'customCpuSiteScatterSettings_v1';
export const LOCAL_STORAGE_TAGS_KEY = 'customCpuSiteTags_v1';
export const LOCAL_STORAGE_SCORE_SETTINGS_KEY = 'customCpuSiteScoreSettings_v2';
export const LOCAL_STORAGE_PAGINATION_KEY = 'customCpuSitePaginationSettings_v1';
export const LOCAL_STORAGE_PREVIEW_SETTINGS_KEY = 'customCpuSitePreviewSettings_v1';
export const LOCAL_STORAGE_TOUR_KEY = 'customCpuSiteTourCompleted_v2'; // Updated tour version

export const SCORE_DEFINITIONS = {
    rcbsp: { label: 'RCBSP' },
    rcbfa: { label: 'RCBFA' },
    rcbmp: { label: 'RCBMP' },
    rcbwm: { label: 'RCBWM' },
    rcbrm: { label: 'RCBRM' },
    rcbml: { label: 'RCBML' },
    rcbdv: { label: 'RCBDV' },
    rcbsq: { label: 'RCBSQ' },
    rcbsh: { label: 'RCBSH' },
};

export const COLUMN_DEFINITIONS = {
    favorite: { label: 'お気に入り', defaultVisible: true },
    checkbox: { label: '選択', defaultVisible: true },
    creator: { label: '製作者', defaultVisible: true },
    name: { label: 'デバイス名', defaultVisible: true },
    scores: { label: 'スコア (RT)', defaultVisible: true },
    speeds: { label: '速度 (OPS)', defaultVisible: true },
    cores: { label: 'コア数', defaultVisible: true },
    threads: { label: 'スレッド数', defaultVisible: true },
    bit: { label: 'データ幅', defaultVisible: true },
    volume: { label: '体積', defaultVisible: true },
    completionDate: { label: '完成日', defaultVisible: true },
    tags: { label: 'タグ', defaultVisible: true }
};

export const CHART_DEFINITIONS = {
    ...SCORE_DEFINITIONS,
    multiSpeed: { label: 'マルチ速度' },
    singleSpeed: { label: 'シングル速度' },
    cores: { label: 'コア数' },
    threads: { label: 'スレッド数' },
    bit: { label: 'データ幅' },
    volume: { label: '合計体積' }
};

export const SCATTER_PLOT_AXIS_DEFINITIONS = {
    ...SCORE_DEFINITIONS,
    multiSpeed: { label: 'マルチ最大速度' },
    singleSpeed: { label: 'シングル最大速度' },
    branchSpeed: { label: 'シングル条件分岐速度' },
    cores: { label: 'コア数' },
    threads: { label: 'スレッド数' },
    bit: { label: 'データ幅' },
    volume: { label: '合計体積' }
};

export const PREVIEW_DEFINITIONS = {
    creator: { label: '製作者' },
    score: { label: 'スコア' },
    speed: { label: '速度' },
    volume: { label: '体積' },
    description: { label: '説明' }
};