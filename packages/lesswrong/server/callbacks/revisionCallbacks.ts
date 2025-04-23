import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import cheerio from 'cheerio';
import ForumEvents from '../collections/forumEvents/collection';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { createForumEvent, updateForumEvent } from '../collections/forumEvents/mutations';
import { createAnonymousContext } from '../vulcan-lib/createContexts';

// Users upvote their own tag-revisions
export async function upvoteOwnTagRevision({revision, context}: {revision: DbRevision, context: ResolverContext}) {
  const { Revisions, Users } = context;
  if (revision.collectionName !== 'Tags') return;
  // This might be the first revision for a tag, in which case it doesn't have a documentId until later (and in that case we call this function in `updateRevisionDocumentId`)
  if (!revision.documentId) return;
  
  const userId = revision.userId;
  const user = await Users.findOne({_id:userId});
  if (!user) return;
  await performVoteServer({
    document: revision,
    collection: Revisions,
    voteType: 'smallUpvote',
    user,
    skipRateLimits: true,
    selfVote: true
  })
}

// Update the denormalized htmlWithContributorAnnotations when a tag revision
// is created or edited
export async function updateDenormalizedHtmlAttributionsDueToRev({revision, skipDenormalizedAttributions, context}: {revision: DbRevision, skipDenormalizedAttributions: boolean, context: ResolverContext}) {
  if (!skipDenormalizedAttributions) {
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision, context);
  }
}

async function maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision: DbRevision, context: ResolverContext) {
  const { Tags, MultiDocuments } = context;
  if (revision.collectionName === 'Tags') {
    const tag = await Tags.findOne({_id: revision.documentId});
    if (!tag) return;
    await updateDenormalizedHtmlAttributions({ document: tag, collectionName: 'Tags', fieldName: 'description', context });
  } else if (revision.collectionName === 'MultiDocuments') {
    const multiDoc = await MultiDocuments.findOne({_id: revision.documentId});
    if (!multiDoc) return;
    await updateDenormalizedHtmlAttributions({ document: multiDoc, collectionName: 'MultiDocuments', fieldName: 'contents', context });
  }
}

export async function recomputeWhenSkipAttributionChanged({oldDocument, newDocument, context}: UpdateCallbackProperties<'Revisions'>) {
  if (oldDocument.skipAttributions !== newDocument.skipAttributions) {
    await recomputeContributorScoresFor(newDocument, context);
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(newDocument, context);
  }
};

// Upsert a ForumEvent with eventFormat = "POLL"
async function upsertPoll({ _id, question, user, postId }: { _id: string; question: string; user: DbUser | null; postId: string; }) {
  const existingPoll = await ForumEvents.findOne({ _id });

  // TODO replace with actual context
  const context = createAnonymousContext();

  // TODO read the props here
  if (existingPoll) {
    // Update existing poll
    return updateForumEvent({
      selector: { _id: existingPoll._id },
      data: {
        eventFormat: "POLL",
        pollQuestion: {
          originalContents: {
            data: `<p>${question}</p>`,
            type: "ckEditorMarkup"
          }
        },
        postId,
      },
    }, context);
  } else {
    // Create a new ForumEvent with basic required fields
    return createForumEvent({
      data: {
        // TODO fix
        // @ts-ignore
        _id,
        title: `New Poll for ${_id}`,
        eventFormat: "POLL",
        pollQuestion: {
          originalContents: {
            data: `<p>${question}</p>`,
            type: "ckEditorMarkup"
          }
        },
        startDate: new Date('2000-01-01T00:00:00Z'),
        endDate: new Date('2000-01-08T00:00:00Z'),
        darkColor: "#000000",
        lightColor: "#ffffff",
        bannerTextColor: "#ffffff",
        postId,
        isGlobal: false
      }
    }, context);
  }
}

// TODO continue fixing conflicts from here

// Existing createAfter callback:
// This will find every data-internal-id in the revision HTML and call upsertPoll().
// getCollectionHooks("Revisions").createAfter.add(async (revision: DbRevision, { currentUser }) => {
//   console.log("In createAfter for revision");

//   // TODO more specific check here for perf reasons
//   if (revision.html && revision.collectionName === "Posts" && !!revision.documentId) {
//     const $ = cheerio.load(revision.html);
//     // TODO make it a div instead of an a
//     const internalIds = $(".ck-poll[data-internal-id]")
//       .map((_, element) => {
//         const internalId = $(element).attr("data-internal-id");
//         const question = $(element).text().trim(); // Extract the content as the question
//         return { internalId, question };
//       })
//       .get();
//     console.log("Data-internal-ids and questions:", internalIds);

//     // Upsert a poll for each internal id found in the HTML
//     for (const { internalId, question } of internalIds) {
//       await upsertPoll({ _id: internalId, question, user: currentUser, postId: revision.documentId });
//     }
//   }

//   return revision;
// });
