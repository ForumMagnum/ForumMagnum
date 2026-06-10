import { openThreadTagIdSetting, seasonalOpenThreadAuthorSlugSetting, isLW } from "@/lib/instanceSettings";
import { postStatuses } from "@/lib/collections/posts/constants";
import Posts from "@/server/collections/posts/collection";
import Users from "@/server/collections/users/collection";
import { createPost, updatePost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { getLockOrAbort } from "@/server/utils/advisoryLockUtil";
import { getSeasonalOpenThreadInfo, OPEN_THREAD_BODY_MARKDOWN, type SeasonalOpenThreadInfo } from "@/lib/seasonalOpenThread";

const SEASONAL_OPEN_THREAD_LOCK = "seasonal-open-thread";

export interface SeasonalOpenThreadCronResult {
  status: "not_due" | "not_lesswrong" | "missing_author" | "created" | "already_exists" | "lock_unavailable";
  title?: string;
  postId?: string;
  unpinnedPostIds?: string[];
}

const getOpenThreadSelector = (openThreadTagId: string) => ({
  sticky: true,
  [`tagRelevance.${openThreadTagId}`]: { $gte: 1 },
});

const unpinOtherOpenThreads = async (
  context: ResolverContext,
  openThreadTagId: string,
  currentPostId: string,
): Promise<string[]> => {
  const currentOpenThreads = await Posts.find(getOpenThreadSelector(openThreadTagId), {
    sort: { postedAt: -1 },
    projection: { _id: 1 },
  }).fetch();
  const postsToUnpin = currentOpenThreads.filter(post => post._id !== currentPostId);

  await Promise.all(postsToUnpin.map(post => updatePost({
    selector: { _id: post._id },
    data: { sticky: false },
  }, context)));

  return postsToUnpin.map(post => post._id);
};

const createOrUpdateSeasonalOpenThread = async (
  info: SeasonalOpenThreadInfo,
): Promise<SeasonalOpenThreadCronResult> => {
  const authorSlug = seasonalOpenThreadAuthorSlugSetting.get();
  const author = await Users.findOne({ slug: authorSlug });
  if (!author) {
    return { status: "missing_author", title: info.title };
  }

  const context = await computeContextFromUser({ user: author, isSSR: false });
  const openThreadTagId = openThreadTagIdSetting.get();
  const existingPost = await Posts.findOne({
    title: info.title,
    [`tagRelevance.${openThreadTagId}`]: { $gte: 1 },
  });

  if (existingPost) {
    const unpinnedPostIds = await unpinOtherOpenThreads(context, openThreadTagId, existingPost._id);
    return {
      status: "already_exists",
      title: info.title,
      postId: existingPost._id,
      unpinnedPostIds,
    };
  }

  const post = await createPost({
    data: {
      title: info.title,
      draft: false,
      status: postStatuses.STATUS_APPROVED,
      sticky: true,
      stickyPriority: 2,
      submitToFrontpage: false,
      tagRelevance: {
        [openThreadTagId]: 1,
      },
      contents: {
        originalContents: {
          type: "markdown",
          data: OPEN_THREAD_BODY_MARKDOWN,
        },
      },
    },
  }, context);

  const unpinnedPostIds = await unpinOtherOpenThreads(context, openThreadTagId, post._id);
  return {
    status: "created",
    title: info.title,
    postId: post._id,
    unpinnedPostIds,
  };
};

export const maybeCreateSeasonalOpenThread = async (date = new Date()): Promise<SeasonalOpenThreadCronResult> => {
  const info = getSeasonalOpenThreadInfo(date);
  if (!info) {
    return { status: "not_due" };
  }
  if (!isLW()) {
    return { status: "not_lesswrong", title: info.title };
  }

  let result: SeasonalOpenThreadCronResult = { status: "lock_unavailable", title: info.title };
  await getLockOrAbort(SEASONAL_OPEN_THREAD_LOCK, async () => {
    result = await createOrUpdateSeasonalOpenThread(info);
  });

  return result;
};
