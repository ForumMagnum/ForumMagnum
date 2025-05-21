import Users from '../../server/collections/users/collection';
import { Revisions } from '../../server/collections/revisions/collection';
import { getEditableFieldNamesForCollection, editableFieldIsNormalized } from '@/lib/editor/editableSchemaFieldHelpers';
import ReadStatuses from '../../server/collections/readStatus/collection';
import { Votes } from '../../server/collections/votes/collection';
import { Conversations } from '../../server/collections/conversations/collection'
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import sumBy from 'lodash/sumBy';
import ConversationsRepo from '../repos/ConversationsRepo';
import LocalgroupsRepo from '../repos/LocalgroupsRepo';
import PostsRepo from '../repos/PostsRepo';
import VotesRepo from '../repos/VotesRepo';
import { collectionsThatAffectKarma } from '../callbacks/votingCallbacks';
import { filterNonnull, filterWhereFieldsNotNull } from '../../lib/utils/typeGuardUtils';
import { getUnusedSlugByCollectionName } from '@/server/utils/slugUtil';
import { getCollection } from "../collections/allCollections";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updateUser } from '../collections/users/mutations';

type TransferableCollectionName = 
 | 'Bans'
 | 'Subscriptions'
 | 'Posts'
 | 'Comments'
 | 'Tags'
 | 'TagRels'
 | 'RSSFeeds'
 | 'PetrovDayLaunchs'
 | 'Reports'
 | 'ElectionVotes'
 | 'ModeratorActions'
 | 'UserRateLimits'
 | 'Messages'
 | 'Notifications'
 | 'EmailTokens'
 | 'Sequences'
 | 'Collections'
 | 'Localgroups'
 | 'ReviewVotes';

const transferCollection = async <N extends TransferableCollectionName>({sourceUserId, targetUserId, collectionName, fieldName = "userId", dryRun}: {
  sourceUserId: string,
  targetUserId: string,
  collectionName: N,
  fieldName?: string,
  dryRun: boolean
}) => {
  const collection = getCollection(collectionName)

  try {
    const [sourceUserCount, targetUserCount] = await Promise.all([
      collection.find({[fieldName]: sourceUserId}).count(),
      collection.find({[fieldName]: targetUserId}).count(),
    ])
    // eslint-disable-next-line no-console
    console.log()
    // eslint-disable-next-line no-console
    console.log(`Source user ${sourceUserId} ${collectionName} count: ${sourceUserCount}`)
    // eslint-disable-next-line no-console
    console.log(`Target user ${targetUserId} ${collectionName} count: ${targetUserCount}`)

    if (!dryRun) {
      const documents = await collection.find({[fieldName]: sourceUserId}).fetch()
      // eslint-disable-next-line no-console
      console.log(`Transferring ${documents.length} documents in collection ${collectionName}`)
      for (const doc of documents) {
        try {
          await transferOwnership({documentId: doc._id, targetUserId, collection, fieldName})
          // Transfer ownership of all revisions and denormalized references for editable fields
          const editableFieldNames = getEditableFieldNamesForCollection(collectionName)
          if (editableFieldNames.length) {
            await asyncForeachSequential(editableFieldNames, async (editableFieldName) => {
              await transferEditableField({documentId: doc._id, sourceUserId, targetUserId, collection, fieldName: editableFieldName})
            })
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.log("")
          // eslint-disable-next-line no-console
          console.log("%c Error Transferring Document", doc._id, collectionName, 'color: red')
          // eslint-disable-next-line no-console
          console.log(err)
        }
      }
      const finalTargetUserCount = await collection.find({[fieldName]: targetUserId}).count()
      // eslint-disable-next-line no-console
      console.log(`Final target user ${targetUserId} ${collectionName} count: ${finalTargetUserCount} (compare ${sourceUserCount + targetUserCount})`)
    }

  } catch (err) {
    // eslint-disable-next-line no-console
    console.log()
    // eslint-disable-next-line no-console
    console.log(`%c Error while transferring collection ${collectionName}`, "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }
}

const getUpdateMutator = ((collectionName: TransferableCollectionName) => {
  switch (collectionName) {
    case 'Posts': {
      const { updatePost }: typeof import("../collections/posts/mutations") = require("../collections/posts/mutations");
      return updatePost;
    }
    case 'Comments': {
      const { updateComment }: typeof import("../collections/comments/mutations") = require("../collections/comments/mutations");
      return updateComment;
    }
    case 'Tags': {
      const { updateTag }: typeof import("../collections/tags/mutations") = require("../collections/tags/mutations");
      return updateTag;
    }
    case 'Bans': {
      const { updateBan }: typeof import("../collections/bans/mutations") = require("../collections/bans/mutations");
      return updateBan;
    }
    case 'Subscriptions': {
      const { updateSubscription }: typeof import("../collections/subscriptions/mutations") = require("../collections/subscriptions/mutations");
      return updateSubscription;
    }
    case 'TagRels': {
      const { updateTagRel }: typeof import("../collections/tagRels/mutations") = require("../collections/tagRels/mutations");
      return updateTagRel;
    }
    case 'RSSFeeds': {
      const { updateRSSFeed }: typeof import("../collections/rssfeeds/mutations") = require("../collections/rssfeeds/mutations");
      return updateRSSFeed;
    }
    case 'PetrovDayLaunchs': {
      const { updatePetrovDayLaunch }: typeof import("../collections/petrovDayLaunchs/mutations") = require("../collections/petrovDayLaunchs/mutations");
      return updatePetrovDayLaunch;
    }
    case 'Reports': {
      const { updateReport }: typeof import("../collections/reports/mutations") = require("../collections/reports/mutations");
      return updateReport;
    }
    case 'ElectionVotes': {
      const { updateElectionVote }: typeof import("../collections/electionVotes/mutations") = require("../collections/electionVotes/mutations");
      return updateElectionVote;
    }
    case 'ModeratorActions': {
      const { updateModeratorAction }: typeof import("../collections/moderatorActions/mutations") = require("../collections/moderatorActions/mutations");
      return updateModeratorAction;
    }
    case 'UserRateLimits': {
      const { updateUserRateLimit }: typeof import("../collections/userRateLimits/mutations") = require("../collections/userRateLimits/mutations");
      return updateUserRateLimit;
    }
    case 'Messages': {
      const { updateMessage }: typeof import("../collections/messages/mutations") = require("../collections/messages/mutations");
      return updateMessage;
    }
    case 'Notifications': {
      const { updateNotification }: typeof import("../collections/notifications/mutations") = require("../collections/notifications/mutations");
      return updateNotification;
    }
    case 'EmailTokens': {
      const { updateEmailToken }: typeof import("../collections/emailTokens/mutations") = require("../collections/emailTokens/mutations");
      return updateEmailToken;
    }
    case 'Sequences': {
      const { updateSequence }: typeof import("../collections/sequences/mutations") = require("../collections/sequences/mutations");
      return updateSequence;
    }
    case 'Collections': {
      const { updateCollection }: typeof import("../collections/collections/mutations") = require("../collections/collections/mutations");
      return updateCollection;
    }
    case 'Localgroups': {
      const { updateLocalgroup }: typeof import("../collections/localgroups/mutations") = require("../collections/localgroups/mutations");
      return updateLocalgroup;
    }
    case 'ReviewVotes': {
      const { updateReviewVote }: typeof import("../collections/reviewVotes/mutations") = require("../collections/reviewVotes/mutations");
      return updateReviewVote;
    }
    
  }
}) satisfies ((collectionName: TransferableCollectionName) => Function);

const transferOwnership = async ({documentId, targetUserId, collection, fieldName = "userId"}: {
  documentId: string
  targetUserId: string
  collection: CollectionBase<any>
  fieldName: string
}) => {
  const updateMutator = getUpdateMutator(collection.collectionName);
  await updateMutator({
    data: { [fieldName]: targetUserId },
    selector: { _id: documentId },
  }, createAnonymousContext());
}

const transferEditableField = async <N extends TransferableCollectionName>({documentId, sourceUserId, targetUserId, collection, fieldName = "contents"}: {
  documentId: string,
  sourceUserId: string,
  targetUserId: string,
  collection: CollectionBase<N>,
  fieldName: string
}) => {
  if (!editableFieldIsNormalized(collection.collectionName, fieldName)) {
    // Update the denormalized revision on the document
    const updateMutator = getUpdateMutator(collection.collectionName)
    await updateMutator({
      data: { [`${fieldName}.userId`]: targetUserId },
      selector: { _id: documentId },
    }, createAnonymousContext());
  }
  // Update the revisions themselves
  await Revisions.rawUpdateMany({ documentId, userId: sourceUserId, fieldName }, {$set: {userId: targetUserId}}, { multi: true })
}

type PostOrTagSelector = {postId: string} | {tagId: string}

const mergeReadStatus = async ({sourceUserId, targetUserId, postOrTagSelector}: {
  sourceUserId: string, 
  targetUserId: string, 
  postOrTagSelector: PostOrTagSelector
}) => {
  const sourceUserStatus = await ReadStatuses.findOne({userId: sourceUserId, ...postOrTagSelector})
  const targetUserStatus = await ReadStatuses.findOne({userId: targetUserId, ...postOrTagSelector})
  const sourceMostRecentlyUpdated = (sourceUserStatus && targetUserStatus) ? (new Date(sourceUserStatus.lastUpdated) > new Date(targetUserStatus.lastUpdated)) : !!sourceUserStatus
  const readStatus = sourceMostRecentlyUpdated ? sourceUserStatus?.isRead : targetUserStatus?.isRead
  const lastUpdated = sourceMostRecentlyUpdated ? sourceUserStatus?.lastUpdated : targetUserStatus?.lastUpdated
  if (targetUserStatus) {
    await ReadStatuses.rawUpdateOne({_id: targetUserStatus._id}, {$set: {isRead: readStatus, lastUpdated}})
  } else if (sourceUserStatus) {
    // eslint-disable-next-line no-unused-vars
    const {_id, ...sourceUserStatusWithoutId} = sourceUserStatus
    await ReadStatuses.rawInsert({...sourceUserStatusWithoutId, userId: targetUserId})
  }
}

const transferServices = async (sourceUser: DbUser, targetUser: DbUser, dryRun: boolean) => {
  // eslint-disable-next-line no-console
  console.log(`transferring services from ${sourceUser._id} to ${targetUser._id}`)

  // we copy services for github, facebook and google 
  const profilePaths = ["github", "facebook", "google"]

  for (const profilePath of profilePaths) {
    const sourceProfile = sourceUser.services[profilePath]
    if (sourceProfile && !targetUser.services[profilePath]) {
      // eslint-disable-next-line no-console
      console.log(`  Copying ${profilePath} profile from ${sourceUser._id} to ${targetUser._id}`)
      if (!dryRun) {

        // if we don't remove the profile from the old account, we'll get a duplicate key error
        await updateUser({ data: { [`services.${profilePath}`]: null }, selector: { _id: sourceUser._id } }, createAnonymousContext())
        await updateUser({ data: {[`services.${profilePath}`]: sourceProfile}, selector: { _id: targetUser._id } }, createAnonymousContext())
      } 
    } else {
      // eslint-disable-next-line no-console
      console.log(`  Not copying ${profilePath}`)
    }
  }
}

// Exported to allow usage with "yarn repl". Also wrapped by scripts/mergeUsers.sh.
export const mergeAccounts = async ({sourceUserId, targetUserId, dryRun}: {
  sourceUserId: string, 
  targetUserId: string, 
  dryRun: boolean
}) => {
  if (typeof dryRun !== "boolean") throw Error("dryRun value missing")

  const sourceUser = await Users.findOne({_id: sourceUserId})
  const targetUser = await Users.findOne({_id: targetUserId})
  if (!sourceUser) throw Error(`Can't find sourceUser with Id: ${sourceUserId}`)
  if (!targetUser) throw Error(`Can't find targetUser with Id: ${targetUserId}`)

  // DO NOT transfer LWEvents, there are way too many and they're probably not important after the fact
  // await transferCollection({sourceUserId, targetUserId, collectionName: "LWEvents"})

  // Do not transfer gardencodes, they aren't in use
  // We don't transfer revisions because that's handled by transferEditableField

  // Transfer bans
  await transferCollection({sourceUserId, targetUserId, collectionName: "Bans", dryRun})

  // Transfer subscriptions (i.e. email subscriptions)
  await transferCollection({sourceUserId, targetUserId, collectionName: "Subscriptions", dryRun})

  // Transfer posts
  await transferCollection({sourceUserId, targetUserId, collectionName: "Posts", dryRun})
  // Transfer post co-authorship
  if (!dryRun) {
    await new PostsRepo().moveCoauthorshipToNewUser(sourceUserId, targetUserId)
  }

  // Transfer comments
  await transferCollection({sourceUserId, targetUserId, collectionName: "Comments", dryRun})

  // Transfer user-created tags
  await transferCollection({sourceUserId, targetUserId, collectionName: "Tags", dryRun})

  // Transfer tag-post relationships (first user who voted on that tag for that post)
  await transferCollection({sourceUserId, targetUserId, collectionName: "TagRels", dryRun})

  // Transfer rss feeds (for crossposting)
  await transferCollection({sourceUserId, targetUserId, collectionName: "RSSFeeds", dryRun})

  // Transfer petrov day launches
  await transferCollection({sourceUserId, targetUserId, collectionName: "PetrovDayLaunchs", dryRun})

  // Transfer reports (i.e. user reporting a comment/tag/etc)
  await transferCollection({sourceUserId, targetUserId, collectionName: "Reports", dryRun})
  
  // Transfer election votes
  await transferCollection({sourceUserId, targetUserId, collectionName: "ElectionVotes", dryRun})
  
  // Transfer moderator actions
  await transferCollection({sourceUserId, targetUserId, collectionName: "ModeratorActions", dryRun})
  
  // Transfer user rate limits
  await transferCollection({sourceUserId, targetUserId, collectionName: "UserRateLimits", dryRun})

  try {
    const [sourceConversationsCount, targetConversationsCount] = await Promise.all([
      Conversations.find({participantIds: sourceUserId}).count(),
      Conversations.find({participantIds: targetUserId}).count()
    ])
    // eslint-disable-next-line no-console
    console.log(`conversations from source user: ${sourceConversationsCount}`)
    // eslint-disable-next-line no-console
    console.log(`conversations from target user: ${targetConversationsCount}`)

    if (!dryRun) {
      // Transfer conversations
      await new ConversationsRepo().moveUserConversationsToNewUser(sourceUserId, targetUserId);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log()
    // eslint-disable-next-line no-console
    console.log("%c Error merging conversations", "color:red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // Transfer private messages
  await transferCollection({sourceUserId, targetUserId, collectionName: "Messages", dryRun})

  // Transfer notifications
  await transferCollection({sourceUserId, targetUserId, collectionName: "Notifications", dryRun})

  try {
    const readStatuses = await ReadStatuses.find({userId: sourceUserId}).fetch()
    const readPostIds = filterNonnull(readStatuses.map((status) => status.postId))
    const readTagIds = filterNonnull(readStatuses.map((status) => status.tagId))
    // eslint-disable-next-line no-console
    console.log(`source readPostIds count: ${readPostIds.length}`)
    // eslint-disable-next-line no-console
    console.log(`source readTagIds count: ${readTagIds.length}`)
    if (!dryRun) {
      // Transfer readStatuses
      await asyncForeachSequential(readPostIds, async (postId) => {
        await mergeReadStatus({sourceUserId, targetUserId, postOrTagSelector:{postId}})
      })
      await asyncForeachSequential(readTagIds, async (tagId) => {
        await mergeReadStatus({sourceUserId, targetUserId, postOrTagSelector:{tagId}})
      })
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log()
    // eslint-disable-next-line no-console
    console.log("%c Error merging readStatuses", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // Transfer sequences
  await transferCollection({sourceUserId, targetUserId, collectionName: "Sequences", dryRun})
  await transferCollection({sourceUserId, targetUserId, collectionName: "Collections", dryRun})

  // Transfer localgroups
  if (!dryRun) {
    await new LocalgroupsRepo().moveUserLocalgroupsToNewUser(sourceUserId, targetUserId);
  }

  // Transfer review votes
  await transferCollection({sourceUserId, targetUserId, collectionName: "ReviewVotes", dryRun})
  
  try {
    const [authorVotesCount, userVoteCounts] = await Promise.all([
      Votes.find({authorIds: sourceUserId}).count(),
      Votes.find({userId: sourceUserId}).count()
    ]) 
    // eslint-disable-next-line no-console
    console.log(`authorVotesCount: ${authorVotesCount}`)
    // eslint-disable-next-line no-console
    console.log(`userVoteCounts: ${userVoteCounts}`)
    if (!dryRun) {
      // Transfer votes that target content from source user (authorId)
      // eslint-disable-next-line no-console
      console.log("Transferring votes that target source user")
      await new VotesRepo().transferVotesTargetingUser(sourceUserId, targetUserId);

      // Transfer votes cast by source user
      // eslint-disable-next-line no-console
      console.log("Transferring votes cast by source user")
      await Votes.rawUpdateMany({userId: sourceUserId}, {$set: {userId: targetUserId}}, {multi: true})
  
      // Transfer karma
      // eslint-disable-next-line no-console
      console.log("Transferring karma")
      const newKarma = await recomputeKarma(targetUserId)
      await updateUser({
        data: {
          karma: newKarma,
          // We only recalculate the karma for non-af karma, because recalculating
          // af karma is a lot more complicated
          afKarma: (sourceUser.afKarma) + (targetUser.afKarma)
        }, selector: { _id: targetUserId }
      }, createAnonymousContext())
    }    
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log()
    // eslint-disable-next-line no-console
    console.log("%c Error merging votes", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  await transferServices(sourceUser, targetUser, dryRun)
  
  // Change slug of source account by appending "old" and reset oldSlugs array
  // eslint-disable-next-line no-console
  console.log("Change slugs of source account")
  try {

    if (!dryRun) {
      await Users.rawUpdateOne(
        {_id: sourceUserId},
        {$set: {
          slug: await getUnusedSlugByCollectionName("Users", `${sourceUser.slug}-old`, true)
        }}
      );
    
      // Add slug to oldSlugs array of target account
      const newOldSlugs = [
        ...(targetUser.oldSlugs || []), 
        ...(sourceUser.oldSlugs || []), 
        sourceUser.slug
      ]
      // eslint-disable-next-line no-console
      console.log("Changing slugs of target account", sourceUser.slug, newOldSlugs)
      
      await updateUser({ data: {oldSlugs: filterNonnull(newOldSlugs)}, selector: { _id: targetUserId } }, createAnonymousContext())
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("%c Error changing slugs", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // if the two accounts share an email address, change the sourceUser email to "+old"
  try {
    if (!dryRun && !!sourceUser.email && !!targetUser.email) {
      const splitEmail = sourceUser.email.split("@")
      const newEmail = `${splitEmail[0]}+old@${splitEmail[1]}` 
      if (sourceUser.email === targetUser.email) {
        // appending "+old" should still allow the email to work if need be
        await Users.rawUpdateOne(
          {_id: sourceUserId},
          {$set: {
            email: newEmail
          }}
        );
      }

      if ((sourceUser?.emails) && (targetUser?.emails)) {
        const sourceEmailsEmail = sourceUser.emails.length > 0 && sourceUser.emails[0]
        const targetEmailsEmail = targetUser.email.length > 0 && targetUser.emails[0]

        if (sourceEmailsEmail === targetEmailsEmail) {
          await Users.rawUpdateOne(
            {_id: sourceUserId},
            {$set: {
              'emails.0': {address: newEmail, verified: sourceEmailsEmail ? sourceEmailsEmail.verified : false}
            }}
          );
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("%c Error changing emails", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // if the two accounts share a displayName, change the sourceUSer to " (Old)"
  try {
    if (!dryRun) {
      if (sourceUser.displayName === targetUser.displayName) {
        const newDisplayName = sourceUser.displayName + " (Old)"
        await Users.rawUpdateOne({_id: sourceUserId}, {$set: { email: newDisplayName}}
        );
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("%c Error changing displayName", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // Transfer email tokens
  await transferCollection({sourceUserId, targetUserId, collectionName: "EmailTokens", dryRun})
  
  if (!dryRun) {
    // Mark old acccount as deleted
    // eslint-disable-next-line no-console
    console.log("Marking old account as deleted")
    await updateUser({
      data: {
          deleted: true,
          'services.resume': null
      } as UpdateUserDataInput, selector: { _id: sourceUserId }
    }, createAnonymousContext())
  }
}


async function recomputeKarma(userId: string) {
  const user = await Users.findOne({_id: userId})
  if (!user) throw Error("Can't find user")
  const selector: Record<string, any> = {
    authorIds: user._id,
    userId: {$ne: user._id},
    cancelled: false,
    collectionName: {$in: collectionsThatAffectKarma}
  };
  const rawAllTargetVotes = await Votes.find(selector).fetch()
  const allTargetVotes = filterWhereFieldsNotNull(rawAllTargetVotes, "authorIds")
  const karma = sumBy(allTargetVotes, vote => {
    // a doc author cannot give karma to themselves or any other authors for that doc
    return vote.authorIds.includes(vote.userId) ? 0 : vote.power
  })
  return karma
}

export const getTotalKarmaForUser = recomputeKarma
