import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { accessFilterSingle, accessFilterMultiple } from '../../lib/utils/schemaUtils';
import * as _ from 'underscore';

addGraphQLSchema(`
  type TagHistoryFeedType {
    type: String!
    tagCreated: Tag
    tagApplied: TagRel
    tagRevision: Revision
  }
`);

const DATE_MAX = new Date(8640000000000000);
const DATE_MIN = new Date(-8640000000000000);

addGraphQLQuery("TagHistoryFeed(tagId: String!, limit: Int, cutoff: Date, reverse: Boolean): [TagHistoryFeedType!]");
addGraphQLResolvers({
  Query: {
    async TagHistoryFeed(root, args: {tagId: string, limit?: number, cutoff?: Date, reverse?: boolean}, context: ResolverContext) {
      const {tagId, reverse} = args;
      const cutoff = args.cutoff || (reverse ? DATE_MAX : DATE_MIN)
      const limit = args.limit || 50;
      const {currentUser} = context;
      const tagRaw = Tags.findOne({_id: tagId});
      const tag = await accessFilterSingle(currentUser, Tags, tagRaw, context);
      if (!tag) throw new Error("Tag not found");
      
      // Sorted by date, tiebroken by _id.
      type SortKeyType = [Date,string]
      
      return await mergeFeedQueries<SortKeyType>({
        limit, reverse: !!reverse,
        cutoff: [cutoff, ""],
        subqueries: [
          // Tag creation
          feedSubquery({
            type: "tagCreated",
            getSortKey: (tag: DbTag): SortKeyType => [tag.createdAt, tag._id],
            doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbTag>> => {
              return [tag];
            }
          }),
          // Tag applications
          feedSubquery({
            type: "tagApplied",
            getSortKey: (rel: DbTagRel): SortKeyType => [rel.createdAt, rel._id],
            doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbTagRel>> => {
              const tagRelsRaw = await TagRels.find({
                ...TagRels.defaultView({}).selector,
                createdAt: {$gt: cutoff[0]},
                tagId,
              }, {
                sort: {createdAt: 1, _id: 1},
                limit, // FIXME:sort/limit doesn't handle the tiebreak
              }).fetch();
              return await accessFilterMultiple(currentUser, TagRels, tagRelsRaw, context);
            }
          }),
          // Tag revisions
          feedSubquery({
            type: "tagRevision",
            getSortKey: (revision: DbRevision): SortKeyType => [revision.editedAt, revision._id],
            doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbRevision>> => {
              const revisionsRaw = await Revisions.find({
                //...Revisions.defaultView({}).selector,
                createdAt: {$gt: cutoff[0]}
              },  {
                sort: {createdAt: 1, _id: 1},
                limit, // FIXME:sort/limit doesn't handle the tiebreak
              }).fetch();
              return await accessFilterMultiple(currentUser, Revisions, revisionsRaw, context);
            },
          }),
        ],
      });
    }
  },
});

function feedSubquery<ResultType, SortKeyType>(params: {
  type: string,
  getSortKey: (result: ResultType) => SortKeyType,
  doQuery: (limit: number, cutoff?: SortKeyType) => Promise<Array<ResultType>>
}) {
  return params;
}


async function mergeFeedQueries<SortKeyType>({limit, cutoff, reverse, subqueries}: {
  limit: number
  cutoff?: SortKeyType,
  reverse: boolean, // TODO: implement this
  subqueries: Array<any>
}) {
  // Perform the subqueries
  const unsortedSubqueryResults = await Promise.all(
    subqueries.map(async (subquery) => {
      const subqueryResults = await subquery.doQuery(limit, cutoff)
      return subqueryResults.map(result => ({
        type: subquery.type,
        sortKey: subquery.getSortKey(result),
        [subquery.type]: result,
      }))
    })
  );
  
  // Merge the result lists
  const unsortedResults = _.flatten(unsortedSubqueryResults);
  
  // Sort by shared sort key
  const sortedResults = _.sortBy(unsortedResults, r=>r.sortKey);
  
  // Apply limit and cutoff
  const withCutoffApplied = cutoff
    ? _.filter(sortedResults, r=>r.sortKey>=cutoff)
    : sortedResults;
  const withLimitApplied = _.first(withCutoffApplied, limit);
  
  return withLimitApplied;
}

