import { addGraphQLResolvers, addGraphQLQuery, addGraphQLSchema } from '../../lib/vulcan-lib/graphql';
import { Comments } from '../../lib/collections/comments/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Revisions } from '../../lib/collections/revisions/collection';
import { accessFilterSingle, accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { defineFeedResolver, feedSubquery, mergeFeedQueries } from '../utils/feedUtil';
import * as _ from 'underscore';

defineFeedResolver<Date>({
  name: "TagHistoryFeed",
  args: "tagId: String!",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    tagCreated: Tag
    tagApplied: TagRel
    tagRevision: Revision
    tagDiscussionComment: Comment
  `,
  resolver: async ({limit=50, cutoff, args, context}: {
    limit?: number,
    cutoff?: Date,
    args: {tagId: string},
    context: ResolverContext
  }) => {
    const {tagId} = args;
    const {currentUser} = context;
    
    const tagRaw = Tags.findOne({_id: tagId});
    const tag = await accessFilterSingle(currentUser, Tags, tagRaw, context);
    if (!tag) throw new Error("Tag not found");
    
    type SortKeyType = Date
    
    const result = await mergeFeedQueries<SortKeyType>({
      limit,
      cutoff,
      subqueries: [
        // Tag creation
        feedSubquery({
          type: "tagCreated",
          getSortKey: (tag: DbTag): SortKeyType => tag.createdAt,
          doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbTag>> => {
            return [tag];
          }
        }),
        // Tag applications
        feedSubquery({
          type: "tagApplied",
          getSortKey: (rel: DbTagRel): SortKeyType => rel.createdAt,
          doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbTagRel>> => {
            const tagRelsRaw = await TagRels.find({
              ...TagRels.defaultView({}).selector,
              ...(cutoff && {createdAt: {$lt: cutoff}}),
              tagId,
            }, {
              sort: {createdAt: -1, _id: 1},
              limit,
            }).fetch();
            return await accessFilterMultiple(currentUser, TagRels, tagRelsRaw, context);
          }
        }),
        // Tag revisions
        feedSubquery({
          type: "tagRevision",
          getSortKey: (revision: DbRevision): SortKeyType => revision.editedAt,
          doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbRevision>> => {
            const revisionsRaw = await Revisions.find({
              //...Revisions.defaultView({}).selector,
              ...(cutoff && {createdAt: {$lt: cutoff}}),
              documentId: tagId,
              fieldName: "description",
            },  {
              sort: {createdAt: -1, _id: 1},
              limit,
            }).fetch();
            return await accessFilterMultiple(currentUser, Revisions, revisionsRaw, context);
          },
        }),
        // Tag discussion comments
        feedSubquery({
          type: "tagDiscussionComment",
          getSortKey: (comment: DbComment): SortKeyType => comment.postedAt,
          doQuery: async (limit: number, cutoff: SortKeyType): Promise<Array<DbComment>> => {
            const commentsRaw = await Comments.find({
              ...Comments.defaultView({}).selector,
              ...(cutoff && {postedAt: {$lt: cutoff}}),
              parentCommentId: null,
              tagId,
            }, {
              sort: {postedAt: -1, _id: 1},
              limit,
            }).fetch();
            return await accessFilterMultiple(currentUser, Comments, commentsRaw, context);
          }
        }),
      ],
    });
    console.log(result);
    return result;
  }
});

