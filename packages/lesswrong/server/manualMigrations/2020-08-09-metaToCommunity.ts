/*
 * The EA Forum has been using the meta flag on posts to indicate that they are
 * community posts. We will now treat the community section as a tag.
 *
 * These migrations assume you have a tag with the slug "community", and an
 * admin with the slug "jpaddison"
 */
import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils'
import { FilterTag, getDefaultFilterSettings } from '../../lib/filterSettings'
import Users from '../../server/collections/users/collection'
import Tags from '../../server/collections/tags/collection'
import Posts from '../../server/collections/posts/collection';
import { postStatuses } from '../../lib/collections/posts/constants';
import TagRels from '../../server/collections/tagRels/collection';
import { createMutator } from '../vulcan-lib/mutators';

// Your frontpage settings are shaped like:
// ```
// {
//   personalBlog: <weight>,
//   tags: [
//     {
//       tagId: <id>,
//       tagName: <name>,
//       filterMode: <weight>
//     }, ...
//   ]
// }
// ```
// Previously, the personalBlog weight was being hackily used to refer to the
// community section on the EA Forum. We'll now move that weight into the tags
// section.
// Also reset personalBlog filtering back to 'Default'
export const metaToCommunityUserSettings = registerMigration({
  name: 'metaToCommunityUserSettings',
  dateWritten: '2020-08-11',
  idempotent: true,
  action: async () => {
    const communityTagId = (await Tags.find({slug: 'community'}).fetch())[0]._id

    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch")
        
        const changes = users.flatMap(user => {
          // If a user already has a filter for the community tag, they've
          // already been migrated. Don't migrate them again or you'll overwrite
          // that setting with the personalBlogpost setting that now might
          // actually be about personal blogposts
          if (user.frontpageFilterSettings?.tags?.some((setting: FilterTag) => setting.tagId === communityTagId)) {
            return []
          }

          // If the user has set their community filter to something other than
          // the default, we keep their preference. However, we're changing the
          // default from "Hidden" to -25.
          let communityWeight = user.frontpageFilterSettings?.personalBlog
          if (!communityWeight || communityWeight === "Hidden") {
            communityWeight = -25
          }

          return [
            {
              updateOne: {
                filter: { _id: user._id },
                update: {$push: {'frontpageFilterSettings.tags': {
                  tagId: communityTagId,
                  tagName: "Community",
                  filterMode: communityWeight,
                }}}
              }
            }, {
              updateOne: {
                filter: { _id: user._id },
                update: {$set: {
                  'frontpageFilterSettings.personalBlog': getDefaultFilterSettings().personalBlog
                }}
              }
            }
          ]
        })
        
        if (changes.length) await Users.rawCollection().bulkWrite(changes, { ordered: false })
      }
    })
  }
})

// Someone's gotta put their name on all those tagRels
const DEFAULT_ADMIN_USER_SLUG = 'jpaddison'

// Tag all posts with the meta flag as community posts
export const metaToCommunityPosts = registerMigration({
  name: 'metaToCommunityPosts',
  dateWritten: '2020-08-12',
  idempotent: true,
  action: async () => {
    const communityTagId = (await Tags.find({slug: 'community'}).fetch())[0]._id
    const defaultAdminUserId = (await Users.find({ slug: DEFAULT_ADMIN_USER_SLUG }).fetch())[0]._id

    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      filter: {meta: true, status: postStatuses.STATUS_APPROVED},
      callback: async (posts: Array<DbPost>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        
        for (let post of posts) {
          if (post.tagRelevance?.[communityTagId]) {
            continue
          }
          // Oh man, I refactored this migration to use this method, and it
          // changed my life. 10/10 would use again in future migrations.
          // bulkwrite is faster, but callbacks are often important
          await createMutator({
            collection: TagRels,
            document: {
              tagId: communityTagId,
              postId: post._id,
              userId: post.reviewedByUserId || defaultAdminUserId,
            },
            // Validation requires us to have a context object, which has
            // things like currentUser that aren't applicable.
            validate: false,
          })
        }
      }
    })
  }
})

// Once we've deployed, run this migration to mark all community posts as
// frontpage, and remove the meta flag
export const moveMetaToFrontpage = registerMigration({
  name: 'moveMetaToFrontpage',
  dateWritten: '2020-08-14',
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      filter: {meta: true, status: postStatuses.STATUS_APPROVED},
      callback: async (posts: Array<DbPost>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        const changes = posts.map(post => ({
          updateOne: {
            filter: {_id : post._id},
            update: {$set: {
              meta: false,
              frontpageDate: post.createdAt
            }}
          }
        }))
        if (changes.length) {
          await Posts.rawCollection().bulkWrite(changes, { ordered: false });
        }
      }
    })
  }
})
