import {PingbackDocument, RouterLocation} from './vulcan-lib'
import {Posts} from './collections/posts'
import {Users} from './collections/users/collection'
import { mentionKarmaThresholdSetting } from './publicSettings'

export const userMentionQuery = 'mention'
export const userMentionValue = 'user'
export const userMentionQueryString = `${userMentionQuery}=${userMentionValue}`

export async function getPostPingbackById(parsedUrl: RouterLocation, postId: string | null): Promise<PingbackDocument | null> {
  if (!postId)
    return null

  // If the URL contains a hash, it leads to either a comment, a landmark within
  // the post, or a builtin ID.
  // TODO: In the case of a comment, we should generate a comment-specific
  // pingback in addition to the pingback to the post the comment is on.
  // TODO: In the case of a landmark, we want to customize the hover preview to
  // reflect where in the post the link was to.
  return ({collectionName: 'Posts', documentId: postId})
}

export async function getPostPingbackByLegacyId(parsedUrl: RouterLocation, legacyId: string) {
  const parsedId = parseInt(legacyId, 36)
  const post = await Posts.findOne({'legacyId': parsedId.toString()})
  if (!post) return null
  return await getPostPingbackById(parsedUrl, post._id)
}

export async function getPostPingbackBySlug(parsedUrl: RouterLocation, slug: string) {
  const post = await Posts.findOne({slug: slug})
  if (!post) return null
  return await getPostPingbackById(parsedUrl, post._id)
}

export async function getUserPingbackBySlug(parsedUrl: RouterLocation): Promise<PingbackDocument | null> {
  const hasMentionParam = parsedUrl.query[userMentionQuery] === userMentionValue
  if (!hasMentionParam) return null

  const user = await Users.findOne({slug: parsedUrl.params.slug})
  if (!user) return null
 
  return ({collectionName: 'Users', documentId: user._id})
}

interface ValidationUserPartial {
  isAdmin: boolean
  karma: number
  conversationsDisabled: boolean
}

export const canMention = (currentUser: ValidationUserPartial, mentionsCount: number, {
  karmaThreshold = mentionKarmaThresholdSetting.get(),
  mentionsLimit = 10,
}: { karmaThreshold?: number|null, mentionsLimit?: number } = {}): { result: boolean, reason?: string } => {
  if (currentUser.isAdmin) return {result: true}

  const youCanStillPost = `This will not prevent you from posting, but the mentioned users won't be notified.`

  if (karmaThreshold && (currentUser.karma || 0) < karmaThreshold && mentionsCount > 0) {
    return {
      result: false,
      reason: `You must have at least ${karmaThreshold} karma to mention users. ${youCanStillPost}`,
    }
  }

  if (mentionsCount > mentionsLimit) return {
    result: false,
    reason: `You can notify ${mentionsLimit} users at most in a single post. ${youCanStillPost}`,
  }

  if (currentUser.conversationsDisabled) return {
    result: false,
    reason: `Ability to mention users has been disabled for this account. ${youCanStillPost}`,
  }

  return {result: true}
}
