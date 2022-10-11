import fetch from "node-fetch";
import Users from "../../lib/collections/users/collection";
import { randomId } from "../../lib/random";
import { Crosspost, UpdateCrosspostPayload, CrosspostPayload } from "./types";
import { signToken } from "./tokens";
import { apiRoutes, makeApiUrl } from "./routes";
import { makeCrossSiteRequest } from "./resolvers";
import { crosspostUserAgent } from "../../lib/apollo/links";
import { denormalizedFieldKeys, DenormalizedCrosspostData, extractDenormalizedData } from "./denormalizedFields";

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

  // If we're creating a new post without making a draft first then we won't have an ID yet
  if (!post._id) {
    post._id = randomId();
  }

  const token = await signToken<CrosspostPayload>({
    localUserId: post.userId,
    foreignUserId: user.fmCrosspostUserId,
    postId: post._id,
    ...extractDenormalizedData(post),
  });

  const apiUrl = makeApiUrl(apiRoutes.crosspost);
  const result = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": crosspostUserAgent,
    },
    body: JSON.stringify({token}),
  });
  const json = await result.json();
  if (json.status !== "posted" || !json.postId) {
    throw new Error(`Failed to create crosspost: ${JSON.stringify(json)}`);
  }

  post.fmCrosspost.foreignPostId = json.postId;
  return post;
}

const updateCrosspost = async (postId: string, denormalizedData: DenormalizedCrosspostData) => {
  const token = await signToken<UpdateCrosspostPayload>({
    ...denormalizedData,
    postId,
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
    denormalizedFieldKeys.some((key) => data[key] !== undefined && data[key] !== document[key]) &&
    document.fmCrosspost?.foreignPostId
  ) {
    const denormalizedData = denormalizedFieldKeys.reduce(
      (result, key) => ({...result, [key]: data[key] ?? document[key]}),
      {},
    ) as DenormalizedCrosspostData;
    await updateCrosspost(document.fmCrosspost.foreignPostId, denormalizedData);
  }

  const {_id, userId, fmCrosspost} = document;
  return performCrosspost({
    _id,
    userId,
    fmCrosspost,
    ...extractDenormalizedData(document),
    ...data,
  });
}
