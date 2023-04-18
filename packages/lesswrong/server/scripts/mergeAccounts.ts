import Users from '../../lib/collections/users/collection';
import { Vulcan, updateMutator, getCollection, Utils } from '../vulcan-lib';
import { Revisions } from '../../lib/collections/revisions/collection';
import { editableCollectionsFields } from '../../lib/editor/make_editable'
import ReadStatuses from '../../lib/collections/readStatus/collection';
import { Votes } from '../../lib/collections/votes/index';
import { Conversations } from '../../lib/collections/conversations/collection'
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import sumBy from 'lodash/sumBy';
import { ConversationsRepo, LocalgroupsRepo, VotesRepo } from '../repos';
import Localgroups from '../../lib/collections/localgroups/collection';
import { collectionsThatAffectKarma } from '../callbacks/votingCallbacks';

const transferOwnership = async ({documentId, targetUserId, collection, fieldName = "userId"}: {
  documentId: string
  targetUserId: string
  collection: CollectionBase<any>
  fieldName: string
}) => {
  await updateMutator({
    collection,
    documentId,
    set: {[fieldName]: targetUserId},
    unset: {},
    validate: false,
  })
}

const transferCollection = async ({sourceUserId, targetUserId, collectionName, fieldName = "userId", dryRun}: {
  sourceUserId: string,
  targetUserId: string,
  collectionName: CollectionNameString,
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
          const editableFieldNames = editableCollectionsFields[collectionName]
          if (editableFieldNames?.length) {
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

const transferEditableField = async ({documentId, sourceUserId, targetUserId, collection, fieldName = "contents"}: {
  documentId: string,
  sourceUserId: string,
  targetUserId: string,
  collection: CollectionBase<DbObject>,
  fieldName: string
}) => {
  // Update the denormalized revision on the document
  await updateMutator({
    collection,
    documentId,
    set: {[`${fieldName}.userId`]: targetUserId},
    unset: {},
    validate: false
  })
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
        await updateMutator({
          collection: Users,
          documentId: sourceUser._id,
          unset: {[`services.${profilePath}`]: null} as any,
          // Normal updates are not supposed to update services
          validate: false
        })
        await updateMutator({
          collection: Users,
          documentId: targetUser._id,
          set: {[`services.${profilePath}`]: sourceProfile} as any,
          // Normal updates are not supposed to update services
          validate: false
        })
      } 
    } else {
      // eslint-disable-next-line no-console
      console.log(`  Not copying ${profilePath}`)
    }
  }
}

Vulcan.mergeAccounts = async ({sourceUserId, targetUserId, dryRun}:{
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

  try {
    const [sourceConversationsCount, targetConversationsCount] = await Promise.all([
      Conversations.find({participantIds: sourceUserId}).count(),
      Conversations.find({participantIds: sourceUserId}).count()
    ])
    // eslint-disable-next-line no-console
    console.log(`conversations from source user: ${sourceConversationsCount}`)
    // eslint-disable-next-line no-console
    console.log(`conversations from target user: ${targetConversationsCount}`)

    if (!dryRun) {
      // Transfer conversations
      if (Conversations.isPostgres()) {
        await new ConversationsRepo().moveUserConversationsToNewUser(sourceUserId, targetUserId);
      } else {
        await Conversations.rawUpdateMany(
          {participantIds: sourceUserId},
          {$set: {"participantIds.$": targetUserId}},
          {multi: true},
        );
      }
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
    const readPostIds = readStatuses.map((status) => status.postId).filter(postId => !!postId)
    const readTagIds = readStatuses.map((status) => status.tagId).filter(tagId => !!tagId)
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
    if (Localgroups.isPostgres()) {
      await new LocalgroupsRepo().moveUserLocalgroupsToNewUser(sourceUserId, targetUserId);
    } else {
      await Localgroups.rawUpdateMany(
        {organizerIds: sourceUserId},
        {$set: {"organizerIds.$": targetUserId}},
        {multi: true},
      );
    }
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
      if (Votes.isPostgres()) {
        await new VotesRepo().transferVotesTargetingUser(sourceUserId, targetUserId);
      } else {
        // https://www.mongodb.com/docs/manual/reference/operator/update/positional/
        await Votes.rawUpdateMany(
          {authorIds: sourceUserId},
          {$set: {"authorIds.$": targetUserId}},
          {multi: true},
        );
      }

      // Transfer votes cast by source user
      // eslint-disable-next-line no-console
      console.log("Transferring votes cast by source user")
      await Votes.rawUpdateMany({userId: sourceUserId}, {$set: {userId: targetUserId}}, {multi: true})
  
      // Transfer karma
      // eslint-disable-next-line no-console
      console.log("Transferring karma")
      const newKarma = await recomputeKarma(targetUserId)
      await updateMutator({
        collection: Users,
        documentId: targetUserId,
        set: {
          karma: newKarma, 
          // We only recalculate the karma for non-af karma, because recalculating
          // af karma is a lot more complicated
          afKarma: sourceUser.afKarma + targetUser.afKarma 
        },
        validate: false
      })
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
          slug: await Utils.getUnusedSlug(Users, `${sourceUser.slug}-old`, true)
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
      
      await updateMutator({
        collection: Users,
        documentId: targetUserId,
        set: {oldSlugs: newOldSlugs}, 
        validate: false
      })
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("%c Error changing slugs", "color: red")
    // eslint-disable-next-line no-console
    console.log(err)
  }

  // if the two accounts share an email address, change the sourceUser email to "+old"
  try {
    if (!dryRun) {
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
      const sourceEmailsEmail = (sourceUser.emails.length > 0) && sourceUser.emails[0]
      const targetEmailsEmail = (targetUser.emails.length > 0) && targetUser.emails[0]
      if (sourceEmailsEmail === targetEmailsEmail) {
        await Users.rawUpdateOne(
          {_id: sourceUserId},
          {$set: {
            'emails.0': {address: newEmail, verified: sourceEmailsEmail ? sourceEmailsEmail.verified : false}
          }}
        );
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
    await updateMutator({
      collection: Users,
      documentId: sourceUserId,
      set: {
        deleted: true
      },
      // We remove the login tokins from the source account since it's now deleted
      unset: {'services.resume':1},
      validate: false
    })
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
  const allTargetVotes = await Votes.find(selector).fetch()
  const karma = sumBy(allTargetVotes, vote => {
    // a doc author cannot give karma to themselves or any other authors for that doc
    return vote.authorIds.includes(vote.userId) ? 0 : vote.power
  })
  return karma
}

Vulcan.getTotalKarmaForUser = recomputeKarma
