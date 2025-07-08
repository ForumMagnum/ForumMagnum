import ElasticClient from "@/server/search/elastic/ElasticClient";
import { collectionNameToConfig } from "../search/elastic/ElasticConfig";
import { KEYWORD_INTERVAL_HOURS } from "@/lib/keywordAlertHelpers";
import type { SearchIndexCollectionName } from "@/lib/search/searchUtil";

export const getDefaultKeywordStartDate = (currentTime = new Date()) =>
  new Date(currentTime.getTime() - (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

const getKeywordEndDate = (startDate: Date) =>
  new Date(startDate.getTime() + (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

const fetchContentIdsForKeyword = async (
  collectionName: SearchIndexCollectionName,
  fields: string[],
  keyword: string,
  startDate: Date = getDefaultKeywordStartDate(),
  endDate: Date = getKeywordEndDate(startDate),
): Promise<string[]> => {
  const defaultFilters = collectionNameToConfig(collectionName).filters ?? [];
  const results = await new ElasticClient().getClient().search<SearchPost>({
    index: collectionName.toLowerCase(),
    from: 0,
    size: 100,
    filter_path: [ "hits.hits._id" ],
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keyword,
                fields: fields.map((fieldName) => `${fieldName}.exact`),
                type: "phrase",
              },
            }
          ],
          should: [],
          filter: [
            ...defaultFilters,
            {
              range: {
                postedAt: {
                  gte: startDate.toISOString(),
                  lt: endDate.toISOString(),
                },
              },
            },
          ],
        },
      },
    },
  });
  return results?.hits?.hits?.map(({ _id }) => _id) ?? [];
}

export const fetchPostIdsForKeyword = async (
  keyword: string,
  startDate: Date = getDefaultKeywordStartDate(),
  endDate: Date = getKeywordEndDate(startDate),
) => fetchContentIdsForKeyword(
  "Posts",
  ["title", "body"],
  keyword,
  startDate,
  endDate,
);

export const fetchCommentIdsForKeyword = async (
  keyword: string,
  startDate: Date = getDefaultKeywordStartDate(),
  endDate: Date = getKeywordEndDate(startDate),
) =>  fetchContentIdsForKeyword(
  "Comments",
  ["body"],
  keyword,
  startDate,
  endDate,
);

const isValid = <T extends DbObject>(objOrError: T | Error): objOrError is T =>
  !(objOrError instanceof Error) && !!objOrError._id;

export const fetchPostsForKeyword = async (
  {loaders: {Posts}}: ResolverContext,
  keyword: string,
  startDate: Date,
  endDate: Date,
  limit = 100,
) => {
  const postIds = await fetchPostIdsForKeyword(keyword, startDate, endDate);
  const posts = await Posts.loadMany(postIds.slice(0, limit));
  return posts.filter(isValid);
}

export const fetchCommentsForKeyword = async (
  {loaders: {Comments}}: ResolverContext,
  keyword: string,
  startDate: Date,
  endDate: Date,
  limit = 100,
) => {
  const commentIds = await fetchCommentIdsForKeyword(keyword, startDate, endDate);
  const comments = await Comments.loadMany(commentIds.slice(0, limit));
  return comments.filter(isValid);
}

export type KeywordAlert = {
  _id: string,
  post: DbPost,
  comment?: never,
} | {
  _id: string,
  post?: never,
  comment: DbComment,
};

export const fetchContentForKeyword = async (
  context: ResolverContext,
  keyword: string,
  startDate: Date,
  endDate: Date,
  limit = 100,
): Promise<KeywordAlert[]> => {
  const [posts, comments] = await Promise.all([
    fetchPostsForKeyword(context, keyword, startDate, endDate, limit),
    fetchCommentsForKeyword(context, keyword, startDate, endDate, limit),
  ]);
  const results: KeywordAlert[] = [
    ...posts.map((post) => ({_id: post._id, post})),
    ...comments.map((comment) => ({_id: comment._id, comment})),
  ];
  return results.sort((a, b) => {
    const aTime = a.post?.postedAt ?? a.comment?.postedAt;
    const bTime = b.post?.postedAt ?? b.comment?.postedAt;
    return bTime!.getTime() - aTime!.getTime();
  });
}
