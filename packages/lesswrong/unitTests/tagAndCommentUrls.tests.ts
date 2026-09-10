import { siteUrlSetting, type ForumTypeString } from '@/lib/instanceSettings';
import {
  tagGetUrl,
  tagGetAbsoluteUrl,
  tagGetDiscussionUrl,
  tagGetAbsoluteDiscussionUrl,
  tagGetSubforumUrl,
  tagGetAbsoluteSubforumUrl,
  tagGetCommentLink,
  tagGetAbsoluteCommentLink,
} from '@/lib/collections/tags/helpers';
import {
  commentGetPageUrlFromIds,
  commentGetAbsolutePageUrlFromIds,
  commentGetRSSUrl,
  commentGetAbsoluteRSSUrl,
} from '@/lib/collections/comments/helpers';

const tag = { slug: 'rationality' };
const forumTypes: ForumTypeString[] = ['LessWrong', 'AlignmentForum'];

describe('relative and absolute tag and comment URLs', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds relative URLs without reading instance settings', () => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(() => {
      throw new Error('Relative URLs must not read the site URL setting');
    });

    expect(tagGetUrl(tag)).toBe('/w/rationality');
    expect(tagGetUrl(tag, { lens: 'overview', from: 'tag search' }, 'section')).toBe('/w/rationality?lens=overview&from=tag%20search#section');
    expect(tagGetUrl(tag, undefined, 'section')).toBe('/w/rationality#section');
    expect(tagGetDiscussionUrl(tag)).toBe('/w/rationality/discussion');
    expect(tagGetSubforumUrl(tag)).toBe('/w/rationality?tab=posts');
    expect(tagGetCommentLink({ tagSlug: tag.slug, tagCommentType: 'DISCUSSION', commentId: 'comment-id' })).toBe('/w/rationality/discussion?commentId=comment-id');
    expect(tagGetCommentLink({ tagSlug: tag.slug, tagCommentType: 'SUBFORUM', commentId: 'comment-id' })).toBe('/w/rationality?tab=posts&commentId=comment-id');
    expect(tagGetCommentLink({ tagSlug: tag.slug, tagCommentType: 'SUBFORUM' })).toBe('/w/rationality?tab=posts');
    expect(commentGetPageUrlFromIds({ tagSlug: tag.slug, commentId: 'comment-id' })).toBe('/w/rationality/discussion?commentId=comment-id');
    expect(commentGetPageUrlFromIds({ postId: 'post-id', postSlug: 'post-slug', commentId: 'comment-id', permalink: false })).toBe('/posts/post-id/post-slug#comment-id');
    expect(commentGetRSSUrl({ _id: 'comment-id' })).toBe('/feed.xml?type=comments&view=commentReplies&parentCommentId=comment-id');
  });

  it.each(forumTypes)('uses the supplied %s forum for absolute tag URLs', forumType => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'https://www.alignmentforum.org/' : 'https://www.lesswrong.com'
    );
    const base = forumType === 'AlignmentForum' ? 'https://www.alignmentforum.org' : 'https://www.lesswrong.com';

    expect(tagGetAbsoluteUrl(tag, forumType, { tab: 'posts' }, 'section')).toBe(`${base}/w/rationality?tab=posts#section`);
    expect(tagGetAbsoluteDiscussionUrl(tag, forumType)).toBe(`${base}/w/rationality/discussion`);
    expect(tagGetAbsoluteSubforumUrl(tag, forumType)).toBe(`${base}/w/rationality?tab=posts`);
    expect(tagGetAbsoluteCommentLink({ tagSlug: tag.slug, tagCommentType: 'DISCUSSION', commentId: 'comment-id' }, forumType)).toBe(`${base}/w/rationality/discussion?commentId=comment-id`);
    expect(tagGetAbsoluteCommentLink({ tagSlug: tag.slug, tagCommentType: 'SUBFORUM', commentId: 'comment-id' }, forumType)).toBe(`${base}/w/rationality?tab=posts&commentId=comment-id`);
  });

  it('propagates the forum through generic absolute comment links and preserves permalink styles', () => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(forum =>
      forum === 'AlignmentForum' ? 'https://www.alignmentforum.org/' : 'https://www.lesswrong.com/'
    );
    const base = 'https://www.alignmentforum.org';

    expect(commentGetAbsolutePageUrlFromIds({ tagSlug: tag.slug, commentId: 'comment-id' }, 'AlignmentForum')).toBe(`${base}/w/rationality/discussion?commentId=comment-id`);
    expect(commentGetAbsolutePageUrlFromIds({ tagSlug: tag.slug, tagCommentType: 'SUBFORUM', commentId: 'comment-id' }, 'AlignmentForum')).toBe(`${base}/w/rationality?tab=posts&commentId=comment-id`);
    expect(commentGetAbsolutePageUrlFromIds({ postId: 'post-id', commentId: 'comment-id' }, 'AlignmentForum')).toBe(`${base}/posts/post-id/?commentId=comment-id`);
    expect(commentGetAbsolutePageUrlFromIds({ postId: 'post-id', postSlug: 'post-slug', commentId: 'comment-id', permalink: false }, 'AlignmentForum')).toBe(`${base}/posts/post-id/post-slug#comment-id`);
    expect(commentGetAbsoluteRSSUrl({ _id: 'comment-id' }, 'AlignmentForum')).toBe(`${base}/feed.xml?type=comments&view=commentReplies&parentCommentId=comment-id`);
    expect(commentGetPageUrlFromIds({})).toBe('/');
    expect(commentGetAbsolutePageUrlFromIds({}, 'AlignmentForum')).toBe('/');
  });
});
