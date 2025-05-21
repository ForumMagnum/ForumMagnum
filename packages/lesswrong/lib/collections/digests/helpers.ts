import moment from "moment"
import { capitalize, combineUrls, getSiteUrl } from "../../vulcan-lib/utils"
import { SettingsOption } from "../posts/dropdownOptions"
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils"
import { DIGEST_STATUSES } from "../digestPosts/newSchema"
import type { DigestPost } from "../../../components/ea-forum/digest/EditDigest"

export const DIGEST_STATUS_OPTIONS = new TupleSet([...DIGEST_STATUSES, 'pending'] as const)
export type InDigestStatusOption = UnionOf<typeof DIGEST_STATUS_OPTIONS>
export type StatusField = 'emailDigestStatus'|'onsiteDigestStatus'

/**
 * Returns the digest name in our standard format
 */
export const getDigestName = (digest: DigestsMinimumInfo) => {
  return `EA Forum Digest #${digest.num}`
}

/**
 * Returns the digest name and dates
 */
export const getDigestInfo = (digest: DigestsMinimumInfo) => {
  const name = getDigestName(digest)
  const start = moment(digest.startDate).format('MMM D')
  const end = digest.endDate ? moment(digest.endDate).format('MMM D') : 'now'

  return {
    name,
    start,
    end
  }
}

/**
 * Returns a formatted string that includes all the coauthors
 */
export const getPostAuthors = (post: PostsListBase) => {
  let postAuthors = '[anonymous]'
  if (post.user) {
    postAuthors = post.user.displayName
  }
  if (post.coauthors) {
    post.coauthors.forEach(user => {
      postAuthors += `, ${user.displayName}`
    })
  }
  return postAuthors
}

/**
 * Returns the post data in the format that we expect to see in the email digest:
 *
 * <post title as link> (<post authors>, <read time> min)
 */
export const getEmailDigestPostData = (post: PostsListWithVotes) => {
  const url = combineUrls(getSiteUrl(), `/posts/${post._id}/${post.slug}`)
  const readTimeText = `, ${post.readTimeMinutes} min`
  const linkpostText = post.url ? ', link-post' : ''
  return `<a href="${url}">${post.title}</a> (${getPostAuthors(post)}${readTimeText}${linkpostText})`
}

/**
 * Returns the post list in the format that we expect to see in the email digest:
 *
 * 1. <post title as link> (<post authors>, <read time> min)
 * 2. ...
 */
export const getEmailDigestPostListData = (posts: PostsListWithVotes[]) => {
  const digestData = posts.reduce((prev, next) => {
    return `${prev}<li>${getEmailDigestPostData(next)}</li>`
  }, '')
  
  return `<ol>${digestData}</ol>`
}

/**
 * Returns the options for the given digest status field,
 * formatted to be passed into ForumDropdownMultiselect, like so:
 *
 * {yes: {label: 'Yes (4)'}}
 */
export const getStatusFilterOptions = ({posts, postStatuses, statusFieldName}: {
  posts: PostsListBase[],
  postStatuses: Record<string, Partial<DigestPost>>,
  statusFieldName: StatusField
}) => {
  // count how many posts have each status, to be displayed in the labels
  const counts: Record<string, number> = {}
  DIGEST_STATUS_OPTIONS.forEach(option => counts[option] = 0)
  posts.forEach(p => {
    const status = postStatuses[p._id][statusFieldName];
    if (status) {
      counts[status]++
    }
  })

  const options: Record<string, SettingsOption> = {}
  DIGEST_STATUS_OPTIONS.forEach((option: InDigestStatusOption) => {
    options[option] = {label: `${capitalize(option)} (${counts[option]})`}
  })
  return options
}
