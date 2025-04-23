import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import cheerio from 'cheerio';
import ForumEvents from '../collections/forumEvents/collection';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { createForumEvent, updateForumEvent } from '../collections/forumEvents/mutations';
import { UpdateCallbackProperties } from '../mutationCallbacks';
import { hasPolls } from '@/lib/betas';

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

// Duplicate of ckEditor/src/ckeditor5-poll/poll.ts
type PollProps = {
  question: string;
  agreeWording: string;
  disagreeWording: string;
  colorScheme: { darkColor: string; lightColor: string; bannerTextColor: string }
  duration: { days: number; hours: number; minutes: number };
};
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Upsert a ForumEvent with eventFormat = "POLL"
async function upsertPoll({
  _id,
  post,
  existingPoll,
  question,
  agreeWording,
  disagreeWording,
  colorScheme,
  duration,
}: {
  _id: string;
  existingPoll?: DbForumEvent;
  post: DbPost;
} & PollProps, context: ResolverContext) {
  const endDateFromDuration = new Date(
    Date.now() + (duration.days * ONE_DAY_MS) + (duration.hours * ONE_HOUR_MS) + (duration.minutes * ONE_MINUTE_MS)
  );
  // Start the timer when the post is published. If editing after that, don't update the end date
  const endDate = existingPoll?.endDate ? existingPoll?.endDate : (post.draft ? null : endDateFromDuration);

  if (existingPoll) {
    return updateForumEvent(
      {
        selector: { _id: existingPoll._id },
        data: {
          eventFormat: "POLL",
          pollQuestion: {
            originalContents: {
              data: `<p>${question}</p>`,
              type: "ckEditorMarkup",
            },
          },
          pollAgreeWording: agreeWording,
          pollDisagreeWording: disagreeWording,
          endDate,
          ...colorScheme,
          postId: post._id,
        },
      },
      context
    );
  } else {
    return createForumEvent(
      {
        data: {
          // TODO Explicitly allow setting an _id. This does work currently, but the generated types don't recognise it
          // @ts-ignore
          _id,
          title: `New Poll for ${_id}`,
          eventFormat: "POLL",
          pollQuestion: {
            originalContents: {
              data: `<p>${question}</p>`,
              type: "ckEditorMarkup",
            },
          },
          startDate: new Date(),
          endDate,
          pollAgreeWording: agreeWording,
          pollDisagreeWording: disagreeWording,
          ...colorScheme,
          postId: post._id,
          isGlobal: false,
        },
      },
      context
    );
  }
}

export async function upsertPolls({
  revision,
  context,
}: {
  revision: Pick<DbRevision, "documentId" | "collectionName" | "html">;
  context: ResolverContext;
}) {
  if (!hasPolls) return;

  console.log("In upsertPolls");

  if (revision.html && revision.collectionName === "Posts" && !!revision.documentId) {
    const $ = cheerio.load(revision.html);
    const pollData = $(".ck-poll[data-internal-id]")
      .map((_, element) => {
        const internalId = $(element).attr("data-internal-id");
        const props = $(element).attr("data-props");

        if (!props) return null;

        const parsedProps = JSON.parse(props) as PollProps;

        return { _id: internalId, ...parsedProps };
      })
      .get()
      .filter((item) => item !== null) as ({ _id: string } & PollProps)[];
    console.log("Data-internal-ids and questions:", pollData);

    if (!pollData?.length) return;

    const [post, existingPolls] = await Promise.all([
      context.loaders.Posts.load(revision.documentId),
      context.loaders.ForumEvents.loadMany(pollData.map(d => d._id))
    ]);

    const validExistingPolls = existingPolls.filter((fe): fe is DbForumEvent => !(fe instanceof Error) && !!fe?._id);

    if (!post) {
      // eslint-disable-next-line no-console
      console.error(`Post (${revision.documentId}) not found, cannot upsert polls`);
      return;
    }

    // Upsert a poll for each internal id found in the HTML
    for (const data of pollData) {
      const existingPoll = validExistingPolls.find(poll => poll && poll._id === data._id);
      await upsertPoll({ ...data, post, existingPoll }, context);
    }
  }

  return;
};
