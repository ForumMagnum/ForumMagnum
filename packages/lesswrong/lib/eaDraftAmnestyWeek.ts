import moment from "moment";

export const isDraftAmnestyWeek = () => {
  const now = moment.utc().unix();
  const start = moment.utc("2024-03-11").unix();
  const end = moment.utc("2024-03-18").unix();
  return now > start && now < end;
}

export const draftAmnestyWeekTagId = "A4eiAauprRuqA6kCx";
export const draftAmnestyWeekTagSlug = "draft-amnesty-week-2024";

export const isDraftAmnestyPost = (post: PostsList) =>
  (post.tagRelevance?.[draftAmnestyWeekTagId] ?? 0) >= 1;
