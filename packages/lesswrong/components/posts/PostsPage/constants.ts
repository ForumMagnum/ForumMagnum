export const MAX_COLUMN_WIDTH = 720;
export const CENTRAL_COLUMN_WIDTH = 682;

// EXPERIMENT (branch experiment/iframe-layout-ronny): an author-chosen text width for a post.
// The page's grid track is wider than the text by a fixed amount, which is kept at every width.
export const POST_TEXT_WIDTHS = { normal: CENTRAL_COLUMN_WIDTH, wide: 820 } as const;
export type PostTextWidth = keyof typeof POST_TEXT_WIDTHS;
export const TEXT_TRACK_EXTRA = MAX_COLUMN_WIDTH - CENTRAL_COLUMN_WIDTH;

export const RIGHT_COLUMN_WIDTH_WITH_SIDENOTES = 300;
export const RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES = 50;
export const RIGHT_COLUMN_WIDTH_XS = 5;
export const SHARE_POPUP_QUERY_PARAM = 'sharePopup';
export const RECOMBEE_RECOMM_ID_QUERY_PARAM = 'recombeeRecommId';

export const BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD = 800;

export const sidenotesHiddenBreakpoint = (theme: ThemeType) => theme.breakpoints.down('md');

