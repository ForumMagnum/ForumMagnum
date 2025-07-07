import ElasticClient from "@/server/search/elastic/ElasticClient";
import { collectionNameToConfig } from "../search/elastic/ElasticConfig";
import { KEYWORD_INTERVAL_HOURS } from "@/lib/keywordAlertHelpers";

export const getDefaultKeywordStartDate = (currentTime = new Date()) =>
  new Date(currentTime.getTime() - (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

const getKeywordEndDate = (startDate: Date) =>
  new Date(startDate.getTime() + (KEYWORD_INTERVAL_HOURS * 60 * 60 * 1000));

export const fetchPostIdsForKeyword = async (
  keyword: string,
  startDate: Date = getDefaultKeywordStartDate(),
  endDate: Date = getKeywordEndDate(startDate),
): Promise<string[]> => {
  const defaultFilters = collectionNameToConfig("Posts").filters ?? [];
  const client = new ElasticClient();
  const results = await client.getClient().search<SearchPost>({
    index: "posts",
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
                fields: [ "title", "body" ],
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

const isValidPost = (postOrError: DbPost | Error): postOrError is DbPost =>
  !(postOrError instanceof Error) && !!postOrError._id;

export const fetchPostsForKeyword = async (
  context: ResolverContext,
  keyword: string,
  startDate: Date,
  endDate: Date,
  limit = 100,
) => {
  const postIds = await fetchPostIdsForKeyword(keyword, startDate, endDate);
  const posts = await context.loaders.Posts.loadMany(postIds.slice(0, limit));
  const validPosts = posts.filter(isValidPost);
  return validPosts.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}
