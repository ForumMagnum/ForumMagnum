import Users from "../../lib/collections/users/collection";
import { randomId } from "../../lib/random";
import { DenormalizedCrosspostData, denormalizedFieldKeys, extractDenormalizedData } from "./denormalizedFields";
import { makeCrossSiteRequest } from "./resolvers";
import { signToken } from "./tokens";
import { Crosspost, CrosspostPayload, UpdateCrosspostPayload } from "./types";

export const performCrosspost = async <T extends Crosspost>(post: T): Promise<T> => {
  if (!post.fmCrosspost || !post.userId || post.draft) {
    return post;
  }

  const {isCrosspost, hostedHere, foreignPostId} = post.fmCrosspost;
  if (!isCrosspost || !hostedHere || foreignPostId) {
    return post;
  }

  if (post.isEvent) {
    throw new Error("Events cannot be crossposted");
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

  const { postId } = await makeCrossSiteRequest(
    'crosspost',
    { token },
    'Failed to create crosspost'
  );

  post.fmCrosspost.foreignPostId = postId;
  return post;
}

const updateCrosspost = async (postId: string, denormalizedData: DenormalizedCrosspostData) => {
  const token = await signToken<UpdateCrosspostPayload>({
    ...denormalizedData,
    postId,
  });
  await makeCrossSiteRequest(
    'updateCrosspost',
    { token },
    "Failed to update crosspost draft status",
  );
}

export const handleCrosspostUpdate = async (document: DbPost, data: Partial<DbPost>) => {
  if (
    denormalizedFieldKeys.some((key) => data[key] !== undefined && data[key] !== document[key]) &&
    document.fmCrosspost?.foreignPostId
  ) {
    if (document.isEvent || data.isEvent) {
      throw new Error("Events cannot be crossposted");
    }
  
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
