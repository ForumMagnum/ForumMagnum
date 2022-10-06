import Users from "../../lib/collections/users/collection";
import { randomId } from "../../lib/random";
import { Crosspost, UpdateCrosspostPayload, CrosspostPayload } from "./types";
import { signToken } from "./tokens";
import { apiRoutes, makeApiUrl } from "./routes";
import { makeCrossSiteRequest } from "./resolvers";
import { crosspostUserAgent } from "../../lib/apollo/links";

export const performCrosspost = async <T extends Crosspost>(post: T): Promise<T> => {
  if (!post.fmCrosspost || !post.userId || post.draft) {
    return post;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    return post;
  }

  const user = await Users.findOne({_id: post.userId});
  if (!user || !user.fmCrosspostUserId) {
    throw new Error("You have not connected a crossposting account yet");
  }

  const token = await signToken<CrosspostPayload>({
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
  });

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!post._id) {
    post._id = randomId();
  }

  const apiUrl = makeApiUrl(apiRoutes.crosspost);
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": crosspostUserAgent,
    },
    body: JSON.stringify({
      token,
      postId: post._id,
      postTitle: post.title,
    }),
  });
  const json = await result.json();
  if (json.status !== "posted" || !json.postId) {
    throw new Error(`Failed to create crosspost: ${JSON.stringify(json)}`);
  }

  post.fmCrosspost.foreignPostId = json.postId;
  return post;
}

const updateCrosspost = async (postId: string, draft: boolean, deletedDraft: boolean, title: string) => {
  const token = await signToken<UpdateCrosspostPayload>({
    postId,
    draft,
    deletedDraft,
    title,
  });
  await makeCrossSiteRequest(
    apiRoutes.updateCrosspost,
    {token},
    "updated",
    "Failed to update crosspost draft status",
  );
}

export const handleCrosspostUpdate = async (document: DbPost, data: Partial<DbPost>) => {
  if (
    (data.draft !== undefined || data.deletedDraft !== undefined || data.title !== undefined) &&
    document.fmCrosspost?.foreignPostId
  ) {
    await updateCrosspost(
      document.fmCrosspost.foreignPostId,
      data.draft ?? document.draft,
      data.deletedDraft ?? document.deletedDraft,
      data.title ?? document.title,
    );
  }

  return performCrosspost({
    _id: document._id,
    title: document.title,
    userId: document.userId,
    draft: document.draft,
    fmCrosspost: document.fmCrosspost,
    ...data,
  });
}
