import ElasticClient from "@/server/search/elastic/ElasticClient";
import {
  getDefaultKeywordStartDate,
  getKeywordEndDate,
} from "@/lib/keywordAlertHelpers";

export const fetchPostIdsForKeyword = async (
  keyword: string,
  startDate: Date = getDefaultKeywordStartDate(),
  endDate: Date = getKeywordEndDate(startDate),
): Promise<string[]> => {
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
                fuzziness: 0,
                max_expansions: 10,
                prefix_length: 3,
                minimum_should_match: "75%",
                operator: "or",
              },
            }
          ],
          should: [],
          filter: {
            range: {
              postedAt: {
                gte: startDate.toISOString(),
                lt: endDate.toISOString(),
              },
            },
          },
        },
      },
    },
  });
  return results?.hits?.hits?.map(({ _id }) => _id) ?? [];
}
