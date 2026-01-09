import { hasPolls } from '@/lib/betas';
import { z } from 'zod';
import { cheerioParse } from '@/server/utils/htmlUtil';
import { createForumEvent, updateForumEvent } from '../collections/forumEvents/mutations';

// Duplicate of ckEditor/src/ckeditor5-poll/constants.ts
type PollProps = {
  question: string;
  agreeWording: string;
  disagreeWording: string;
  colorScheme: { darkColor: string; lightColor: string; bannerTextColor: string };
  duration: { days: number; hours: number; minutes: number };
  /** Set by server when post is published. Used to compute remaining time. */
  endDate?: string;
  /** Set by CKEditor when user edits duration on a published poll. Signals server to update endDate. */
  durationEdited?: boolean;
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
  endDate: z.string().optional(),
  durationEdited: z.boolean().optional(),
});

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Upsert a ForumEvent with eventFormat = "POLL"
async function upsertPoll({
  _id,
  post,
  comment,
  existingPoll,
  question,
  agreeWording,
  disagreeWording,
  colorScheme,
  duration,
  endDate: propsEndDate,
}: {
  _id: string;
  existingPoll?: DbForumEvent;
  post: Pick<DbPost, '_id' | 'draft'>;
  comment?: Pick<DbComment, '_id' | 'draft'>;
} & PollProps, context: ResolverContext) {
  const endDateFromDuration = new Date(
    Date.now() + (duration.days * ONE_DAY_MS) + (duration.hours * ONE_HOUR_MS) + (duration.minutes * ONE_MINUTE_MS)
  );

  const parentIsDraft = comment ? comment.draft : post.draft;

  // Determine endDate:
  // 1. If draft, no endDate
  // 2. If propsEndDate exists in HTML (injected by preprocessing), use it
  // 3. Otherwise fall back to existing poll's endDate or compute from duration
  let endDate: Date | null;
  if (parentIsDraft) {
    endDate = null;
  } else if (propsEndDate) {
    // Use the endDate from HTML props (injected by preprocessing step)
    endDate = new Date(propsEndDate);
  } else if (existingPoll?.endDate) {
    // Preserve existing endDate (old poll without endDate in HTML)
    endDate = existingPoll.endDate;
  } else {
    // First publish without preprocessing (shouldn't happen with new code)
    endDate = endDateFromDuration;
  }

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
    postId: post._id,
    commentId: comment?._id,
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
          // TODO Explicitly allow setting an _id. This does work currently, but the generated types don't recognise it
          // @ts-expect-error
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

function getPollElements($: ReturnType<typeof cheerioParse>) {
  return $(".ck-poll[data-internal-id]");
}

export async function upsertPolls({
  revisionId,
  post,
  comment,
  context,
}: {
  revisionId: string | null;
  post?: DbPost;
  comment?: DbComment;
  context: ResolverContext;
}) {
  if (!hasPolls || !revisionId) return;

  const revision = await context.loaders.Revisions.load(revisionId);

  if (!revision) return;

  const { html, collectionName, documentId } = revision;

  if (!(html && (collectionName === "Posts" || collectionName === "Comments") && !!documentId)) return;

  const $ = cheerioParse(html);
  const pollData = getPollElements($)
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

  const fetchPollPost = async (): Promise<DbPost> => {
    if (post) {
      return post;
    }

    let fetchedPost: null | DbPost = null;
    if (collectionName === "Comments") {
      if (comment && comment.postId) {
        fetchedPost = await context.loaders.Posts.load(comment.postId);
      }
    }

    if (!fetchedPost) {
      throw new Error("Cannot create poll, unable to fetch post.")
    }
    return fetchedPost;
  };

  const [fetchedPost, existingPolls] = await Promise.all([
    fetchPollPost(),
    context.loaders.ForumEvents.loadMany(pollData.map(d => d._id))
  ]);

  const validExistingPolls = existingPolls.filter((fe): fe is DbForumEvent => !(fe instanceof Error) && !!fe?._id);

  // Upsert a poll for each internal id found in the HTML
  for (const data of pollData) {
    const existingPoll = validExistingPolls.find(poll => poll && poll._id === data._id);
    await upsertPoll({ ...data, post: fetchedPost, comment, existingPoll }, context);
  }
};

const pollsAllowedFields = [
  { collectionName: "Comments", fieldName: "contents"},
  { collectionName: "Posts", fieldName: "contents"},
]
export function assertPollsAllowed(revision?: DbRevision | null) {
  if (!revision) return;

  const { html, collectionName, fieldName } = revision;

  if (!html) return;

  const $ = cheerioParse(html);
  const pollElements = getPollElements($)

  if (pollElements.length > 0) {
    const isAllowed = pollsAllowedFields.some(
      (allowedField) =>
        allowedField.collectionName === collectionName &&
        allowedField.fieldName === fieldName
    );

    if (!isAllowed) {
      throw new Error(
        `Polls are only allowed in post and comment bodies.`
      );
    }
  }
}
