export const HIDE_TOC_WORDCOUNT_LIMIT = 300;
export const MAX_COLUMN_WIDTH = 720;
export const CENTRAL_COLUMN_WIDTH = 682;

export const RIGHT_COLUMN_WIDTH_WITH_SIDENOTES = 300;
export const RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES = 50;
export const RIGHT_COLUMN_WIDTH_XS = 5;
export const sidenotesHiddenBreakpoint = (theme: ThemeType) => theme.breakpoints.down('md');


export const SHARE_POPUP_QUERY_PARAM = 'sharePopup';
export const RECOMBEE_RECOMM_ID_QUERY_PARAM = 'recombeeRecommId';
export const VERTEX_ATTRIBUTION_ID_QUERY_PARAM = 'vertexAttributionId';
export const MAX_ANSWERS_AND_REPLIES_QUERIED = 10000;
export const POST_DESCRIPTION_EXCLUSIONS: RegExp[] = [
  /cross-? ?posted/i,
  /epistemic status/i,
  /acknowledgements/i
];
