import moment from "moment"
import { combineUrls, getSiteUrl } from "../../vulcan-lib"

/**
 * Returns the digest name in our standard format
 */
export const getDigestName = ({digest, includeDates=true}: {digest: DigestsMinimumInfo, includeDates?: boolean}) => {
  let name = `EA Forum Digest #${digest.num}`
  if (!includeDates) return name
  
  const digestStartDateFormatted = moment(digest.startDate).format('MMM D')
  const digestEndDateFormatted = digest.endDate ? moment(digest.endDate).format('MMM D') : 'now'
  return `${name} (${digestStartDateFormatted} - ${digestEndDateFormatted})`
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
 * <post title as link> (<post authors>, [<read time> min | link-post])
 */
export const getEmailDigestPostData = (post: PostsListBase) => {
  const url = combineUrls(getSiteUrl(), `/posts/${post._id}/${post.slug}`)
  const readingTime = post.url ? 'link-post' : `${post.readTimeMinutes} min`
  return `<a href="${url}">${post.title}</a> (${getPostAuthors(post)}, ${readingTime})`
}

/**
 * Returns the post list in the format that we expect to see in the email digest:
 *
 * 1. <post title as link> (<post authors>, <read time> min)
 * 2. ...
 */
export const getEmailDigestPostListData = (posts: PostsListBase[]) => {
  const digestData = posts.reduce((prev, next) => {
    return `${prev}<li>${getEmailDigestPostData(next)}</li>`
  }, '')
  
  return `<ol>${digestData}</ol>`
}
