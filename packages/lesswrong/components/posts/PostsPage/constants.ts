export const MAX_COLUMN_WIDTH = 720;
export const CENTRAL_COLUMN_WIDTH = 682;

// EXPERIMENT (branch experiment/iframe-layout-ronny): an author-chosen text width for a post.
// The page's grid track is wider than the text by a fixed amount, which is kept at every width.
export const POST_TEXT_WIDTHS = { normal: CENTRAL_COLUMN_WIDTH, medium: 744, wide: 820 } as const;
export type PostTextWidth = keyof typeof POST_TEXT_WIDTHS;
export const TEXT_TRACK_EXTRA = MAX_COLUMN_WIDTH - CENTRAL_COLUMN_WIDTH;

export const RIGHT_COLUMN_WIDTH_WITH_SIDENOTES = 300;
export const RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES = 50;
export const RIGHT_COLUMN_WIDTH_XS = 5;
export const SHARE_POPUP_QUERY_PARAM = 'sharePopup';
export const RECOMBEE_RECOMM_ID_QUERY_PARAM = 'recombeeRecommId';

export const BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD = 800;

export const sidenotesHiddenBreakpoint = (theme: ThemeType) => theme.breakpoints.down('md');


// EXPERIMENT (branch experiment/iframe-layout-ronny): the shareable layout demo (see LayoutDemoTabs).
export const LAYOUT_DEMO_TITLE = "The AI Futures Model, explained with interactive widgets";
export const LAYOUT_DEMO_PATH = "/experiment-iframe-layout-tuito7fob8u0rzrbib0v16i1";
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2, the demo editor where widgets are
// placed by dragging (its /editor page; its Post tab is the demo post above).
export const WIDGET_DRAG_DEMO_PATH = "/experiment-widget-drag-rrjhoz6rhigvo14qsbixz68ut";
