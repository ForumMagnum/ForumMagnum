import { Revisions } from '../../server/collections/revisions/collection';
import { Tags } from '../../server/collections/tags/collection';
import { Users } from '../../server/collections/users/collection';
import { afterCreateRevisionCallback } from '../editor/make_editable_callbacks';
import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { MultiDocuments } from '@/server/collections/multiDocuments/collection';
import { getCollectionHooks } from '../mutationCallbacks';
import { recomputeContributorScoresFor } from './votingCallbacks';
import cheerio from 'cheerio';
import ForumEvents from '../collections/forumEvents/collection';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';

// TODO: Now that the make_editable callbacks use createMutator to create
// revisions, we can now add these to the regular ${collection}.create.after
// callbacks

// Users upvote their own tag-revisions
afterCreateRevisionCallback.add(async ({revisionID}) => {
  const revision = await Revisions.findOne({_id: revisionID});
  if (!revision) return;
  if (revision.collectionName !== 'Tags') return;
  if (!revision.documentId) throw new Error("Revision is missing documentID");
  
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
});

// Update the denormalized htmlWithContributorAnnotations when a tag revision
// is created or edited
// Users upvote their own tag-revisions
afterCreateRevisionCallback.add(async ({revisionID, skipDenormalizedAttributions, context}) => {
  const revision = await Revisions.findOne({_id: revisionID});
  if (!revision) return;
  if (!skipDenormalizedAttributions) {
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision, context);
  }
});

async function maybeUpdateDenormalizedHtmlAttributionsDueToRev(revision: DbRevision, context: ResolverContext) {

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

getCollectionHooks("Revisions").updateAsync.add(async ({oldDocument, newDocument, context}) => {
  if (oldDocument.skipAttributions !== newDocument.skipAttributions) {
    await recomputeContributorScoresFor(newDocument, context);
    await maybeUpdateDenormalizedHtmlAttributionsDueToRev(newDocument, context);
  }
});

// Upsert a ForumEvent with eventFormat = "POLL"
async function upsertPoll({ _id, question, user, postId }: { _id: string; question: string; user: DbUser | null; postId: string; }) {
  const existingPoll = await ForumEvents.findOne({ _id });

  if (existingPoll) {
    // Update existing poll
    return updateMutator({
      collection: ForumEvents,
      documentId: existingPoll._id,
      data: {
        eventFormat: "POLL",
        // TODO fix
        // @ts-ignore
        pollQuestion: {
          originalContents: {
            data: `<p>${question}</p>`,
            type: "ckEditorMarkup"
          }
        } as EditableFieldInsertion,
        postId, // Set the postId on the updated forumEvent
      },
      validate: false,
      currentUser: user,
    });
  } else {
    // Create a new ForumEvent with basic required fields
    return createMutator({
      collection: ForumEvents,
      document: {
        _id,
        title: `New Poll for ${_id}`,
        eventFormat: "POLL",
        // TODO fix
        // @ts-ignore
        pollQuestion: {
          originalContents: {
            data: `<p>${question}</p>`,
            type: "ckEditorMarkup"
          }
        } as EditableFieldInsertion,
        startDate: new Date('2000-01-01T00:00:00Z'),
        endDate: new Date('2000-01-08T00:00:00Z'),
        darkColor: "#000000",
        lightColor: "#ffffff",
        bannerTextColor: "#ffffff",
        postId,
        isGlobal: false
      },
      validate: false,
      currentUser: user,
    });
  }
}

// Existing createAfter callback:
// This will find every data-internal-id in the revision HTML and call upsertPoll().
getCollectionHooks("Revisions").createAfter.add(async (revision: DbRevision, { currentUser }) => {
  console.log("In createAfter for revision");

  // TODO more specific check here for perf reasons
  if (revision.html && revision.collectionName === "Posts" && !!revision.documentId) {
    const $ = cheerio.load(revision.html);
    // TODO make it a div instead of an a
    const internalIds = $(".ck-poll[data-internal-id]")
      .map((_, element) => {
        const internalId = $(element).attr("data-internal-id");
        const question = $(element).text().trim(); // Extract the content as the question
        return { internalId, question };
      })
      .get();
    console.log("Data-internal-ids and questions:", internalIds);

    // Upsert a poll for each internal id found in the HTML
    for (const { internalId, question } of internalIds) {
      await upsertPoll({ _id: internalId, question, user: currentUser, postId: revision.documentId });
    }
  }

  return revision;
});
