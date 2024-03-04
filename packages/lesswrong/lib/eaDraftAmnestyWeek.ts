export const isDraftAmnestyWeek = true;

export const draftAmnestyWeekTagId = "A4eiAauprRuqA6kCx";
export const draftAmnestyWeekTagSlug = "draft-amnesty-week-2024";

export const isDraftAmnestyPost = (post: PostsList) =>
  (post.tagRelevance?.[draftAmnestyWeekTagId] ?? 0) >= 1;
