import { performVoteServer } from '../voteServer';
import { updateDenormalizedHtmlAttributions } from '../tagging/updateDenormalizedHtmlAttributions';
import { recomputeContributorScoresFor } from '../utils/contributorsUtil';
import { createForumEvent, updateForumEvent } from '../collections/forumEvents/mutations';
import { UpdateCallbackProperties } from '../mutationCallbacks';
import { hasPolls } from '@/lib/betas';
import { cheerioParse } from '../utils/htmlUtil';
import { z } from 'zod';

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

const PollPropsSchema = z.object({
  question: z.string(),
  agreeWording: z.string(),
  disagreeWording: z.string(),
  colorScheme: z.object({
    darkColor: z.string(),
    lightColor: z.string(),
    bannerTextColor: z.string(),
  }),
  duration: z.object({
    days: z.number().min(0),
    hours: z.number().min(0),
    minutes: z.number().min(0),
  }),
});

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Upsert a ForumEvent with eventFormat = "POLL"
async function upsertPoll({
  _id,
  post,
  commentId,
  existingPoll,
  question,
  agreeWording,
  disagreeWording,
  colorScheme,
  duration,
}: {
  _id: string;
  existingPoll?: DbForumEvent;
  post?: Pick<DbPost, '_id' | 'draft'>;
  commentId?: string;
} & PollProps, context: ResolverContext) {
  const endDateFromDuration = new Date(
    Date.now() + (duration.days * ONE_DAY_MS) + (duration.hours * ONE_HOUR_MS) + (duration.minutes * ONE_MINUTE_MS)
  );

  // The post not existing means this is a poll in a comment that is currently being
  // created (so doesn't exist in the db yet). In this case, treat the poll as a non-draft.
  // Technically it is possible to comment on a draft post but this is a rare edge case.
  const isPostDraft = post ? post.draft : false;
  // Poll timer starts when the post is published. Don't update the end date after that.
  const endDate = existingPoll?.endDate ? existingPoll.endDate : (isPostDraft ? null : endDateFromDuration);

  const dataPayload = {
    eventFormat: "POLL" as const,
    pollQuestion: {
      originalContents: {
        data: `<p>${question}</p>`,
        type: "ckEditorMarkup" as const,
      },
    },
    pollAgreeWording: agreeWording,
    pollDisagreeWording: disagreeWording,
    endDate,
    ...colorScheme,
    postId: post?._id,
    commentId,
  };

  if (existingPoll) {
    return updateForumEvent(
      {
        selector: { _id: existingPoll._id },
        data: dataPayload,
      },
      context
    );
  } else {
    return createForumEvent(
      {
        data: {
          // @ts-expect-error _id is not in the type but works
          _id,
          title: `New Poll for ${_id}`,
          startDate: new Date(),
          isGlobal: false,
          ...dataPayload,
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

  const { html, collectionName, documentId } = revision;

  if (!(html && (collectionName === "Posts" || collectionName === "Comments") && !!documentId)) return;

  const $ = cheerioParse(html);
  const pollData = $(".ck-poll[data-internal-id]")
    .map((_, element) => {
      const internalId = $(element).attr("data-internal-id");
      const props = $(element).attr("data-props");

      if (!props) return null;

      try {
        const rawParsedProps = JSON.parse(props);
        const validationResult = PollPropsSchema.safeParse(rawParsedProps);
        if (!validationResult.success) {
          const errorMessage = `Invalid poll props found for internalId ${internalId}: ${JSON.stringify(validationResult.error.issues)}`;
          throw new Error(errorMessage);
        }

        const parsedProps = validationResult.data;
        return { _id: internalId, ...parsedProps };

      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error parsing poll props for internalId ${internalId}:`, error);
        return null;
      }
    })
    .get()
    .filter((item): item is ({ _id: string } & PollProps) => item !== null);

  if (!pollData?.length) return;

  const fetchPollPost = async (): Promise<DbPost | undefined> => {
    if (collectionName === "Posts") {
      return context.loaders.Posts.load(documentId);
    } else { // Comments
      const comment = await context.loaders.Comments.load(documentId);
      if (comment && comment.postId) {
        return context.loaders.Posts.load(comment.postId);
      }
      return undefined;
    }
  };

  const [post, existingPolls] = await Promise.all([
    fetchPollPost(),
    context.loaders.ForumEvents.loadMany(pollData.map(d => d._id))
  ]);

  const validExistingPolls = existingPolls.filter((fe): fe is DbForumEvent => !(fe instanceof Error) && !!fe?._id);

  if ((collectionName === "Posts" && !post)) {
    // eslint-disable-next-line no-console
    console.error(`Post (${documentId}) not found, cannot upsert polls`);
    return;
  }

  const commentId = collectionName === "Comments" ? documentId : undefined;

  // Upsert a poll for each internal id found in the HTML
  for (const data of pollData) {
    const existingPoll = validExistingPolls.find(poll => poll && poll._id === data._id);
    await upsertPoll({ ...data, post, commentId, existingPoll }, context);
  }
};
