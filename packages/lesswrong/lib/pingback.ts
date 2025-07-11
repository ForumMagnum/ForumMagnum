import { PingbackDocument, RouterLocation } from './vulcan-lib/routes'

export const userMentionQuery = 'mention'
export const userMentionValue = 'user'
export const userMentionQueryString = `${userMentionQuery}=${userMentionValue}`

export async function getPostPingbackById(parsedUrl: RouterLocation, postId: string | null): Promise<PingbackDocument | null> {
  if (!postId)
    return null

  if (parsedUrl.query.commentId) {
    return {collectionName: 'Comments', documentId: parsedUrl.query.commentId}
  }

  // If the URL contains a hash, it leads to either a comment, a landmark within
  // the post, or a builtin ID.
  // TODO: In the case of a landmark, we want to customize the hover preview to
  // reflect where in the post the link was to.
  return ({collectionName: 'Posts', documentId: postId})
}

export async function getPostPingbackByLegacyId(parsedUrl: RouterLocation, legacyId: string, context: ResolverContext) {
  const { Posts } = context;
  const parsedId = parseInt(legacyId, 36)
  const post = await Posts.findOne({'legacyId': parsedId.toString()})
  if (!post) return null
  return await getPostPingbackById(parsedUrl, post._id)
}

export async function getPostPingbackBySlug(parsedUrl: RouterLocation, slug: string, context: ResolverContext) {
  const { Posts } = context;
  const post = await Posts.findOne({slug: slug})
  // FIXME: Handle oldSlugs
  if (!post) return null
  return await getPostPingbackById(parsedUrl, post._id)
}

export async function getUserPingbackBySlug(parsedUrl: RouterLocation, context: ResolverContext): Promise<PingbackDocument | null> {
  const { Users } = context;
  const hasMentionParam = parsedUrl.query[userMentionQuery] === userMentionValue
  if (!hasMentionParam) return null

  const user = await Users.findOne({slug: parsedUrl.params.slug})
  if (!user) return null
 
  return ({collectionName: 'Users', documentId: user._id})
}

export async function getTagPingbackById(parsedUrl: RouterLocation, tagId: string|null): Promise<PingbackDocument | null> {
  if (!tagId) return null;
  return {collectionName: "Tags", documentId: tagId};
}

export async function getTagPingbackBySlug(parsedUrl: RouterLocation, slug: string, context: ResolverContext): Promise<PingbackDocument | null> {
  const { Tags } = context;
  // TODO: Handle lenses
  const tag = await Tags.findOne(
    {$or: [
      {slug},
      {oldSlugs: slug}
    ]}
  );
  if (!tag) return null;
  return getTagPingbackById(parsedUrl, tag._id);
}

interface ValidationUserPartial {
  isAdmin: boolean
  karma: number | null
  mentionsDisabled: boolean | null
  conversationsDisabled: boolean | null
}

export const canMention = (currentUser: ValidationUserPartial, mentionsCount: number, {
  karmaThreshold = 1,
  mentionsLimit = 10,
}: { karmaThreshold?: number, mentionsLimit?: number } = {}): { result: boolean, reason?: string } => {
  if (currentUser.isAdmin) return {result: true}

  const youCanStillPost = `This will not prevent you from posting, but the mentioned users won't be notified.`

  if ((currentUser.karma || 0) < karmaThreshold && mentionsCount > 0) {
    return {
      result: false,
      reason: `You must have at least ${karmaThreshold} karma to mention users. ${youCanStillPost}`,
    }
  }

  if (mentionsCount > mentionsLimit) return {
    result: false,
    reason: `You can notify ${mentionsLimit} users at most in a single post. ${youCanStillPost}`,
  }

  if (currentUser.conversationsDisabled || currentUser.mentionsDisabled) return {
    result: false,
    reason: `Ability to mention users has been disabled for this account. ${youCanStillPost}`,
  }

  return {result: true}
}
