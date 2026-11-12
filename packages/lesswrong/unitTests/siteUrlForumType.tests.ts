import { siteUrlSetting, type ForumTypeString } from '@/lib/instanceSettings';
import { getSiteUrl, makeAbsolute } from '@/lib/vulcan-lib/utils';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import {
  postGetPageUrl, postGetAbsolutePageUrl,
  postGetCommentsUrl, postGetAbsoluteCommentsUrl,
  postGetEditUrl, postGetAbsoluteEditUrl,
} from '@/lib/collections/posts/helpers';
import {
  userGetProfileUrlFromSlug, userGetAbsoluteProfileUrlFromSlug,
  userGetAnalyticsUrl, userGetAbsoluteAnalyticsUrl,
  userGetAbsoluteProfileUrl,
} from '@/lib/collections/users/helpers';
import { sequenceGetPageUrl, sequenceGetAbsolutePageUrl, getCollectionOrSequenceUrl, getAbsoluteCollectionOrSequenceUrl } from '@/lib/collections/sequences/helpers';
import { collectionGetPageUrl, collectionGetAbsolutePageUrl } from '@/lib/collections/collections/helpers';
import { conversationGetPageUrl, conversationGetAbsolutePageUrl } from '@/lib/collections/conversations/helpers';

const post = { _id: 'post-id', slug: 'post-title' };
const sequence = { _id: 'sequence-id', canonicalCollectionSlug: 'rationality' };
const forumTypes: ForumTypeString[] = ['LessWrong', 'AlignmentForum'];

function mockSiteUrls() {
  jest.spyOn(siteUrlSetting, 'get').mockImplementation(forum => {
    const forumType = typeof forum === 'string' ? forum : forum.forumType;
    return forumType === 'AlignmentForum' ? 'https://www.alignmentforum.org/' : 'https://www.lesswrong.com';
  });
}

describe('site URLs and relative/absolute helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a forum type or resolver context and normalizes the trailing slash', () => {
    mockSiteUrls();
    const context = createAnonymousContext({ forumType: 'AlignmentForum' });
    expect(getSiteUrl('LessWrong')).toBe('https://www.lesswrong.com/');
    expect(getSiteUrl('AlignmentForum')).toBe('https://www.alignmentforum.org/');
    expect(getSiteUrl(context)).toBe('https://www.alignmentforum.org/');
    expect(makeAbsolute('/account', context)).toBe('https://www.alignmentforum.org/account');
    expect(makeAbsolute('account', 'LessWrong')).toBe('https://www.lesswrong.com/account');
  });

  it('builds relative routes without consulting the site URL setting', () => {
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(() => {
      throw new Error('Relative routes must not depend on a forum domain');
    });
    expect(postGetPageUrl(post)).toBe('/posts/post-id/post-title');
    expect(postGetPageUrl({ ...post, isEvent: true })).toBe('/events/post-id/post-title');
    expect(postGetPageUrl({ ...post, groupId: 'group-id' })).toBe('/g/group-id/p/post-id/');
    expect(postGetPageUrl({ ...post, isEvent: true }, 'sequence-id')).toBe('/s/sequence-id/p/post-id');
    expect(postGetCommentsUrl(post, 'sequence-id')).toBe('/s/sequence-id/p/post-id#comments');
    expect(postGetEditUrl(post._id, 'sharing-key', '1.2.3')).toBe('/editPost?postId=post-id&key=sharing-key&version=1.2.3');
    expect(userGetProfileUrlFromSlug('alice')).toBe('/users/alice');
    expect(userGetAnalyticsUrl({ slug: 'alice' })).toBe('/users/alice/stats');
    expect(sequenceGetPageUrl(sequence)).toBe('/s/sequence-id');
    expect(getCollectionOrSequenceUrl(sequence)).toBe('/rationality#sequence-id');
    expect(collectionGetPageUrl({ slug: 'rationality' })).toBe('/rationality');
    expect(conversationGetPageUrl({ _id: 'conversation-id' })).toBe('/inbox?conversation=conversation-id');
  });

  it.each(forumTypes)('uses the %s domain without changing route shapes', forumType => {
    mockSiteUrls();
    const base = forumType === 'AlignmentForum' ? 'https://www.alignmentforum.org' : 'https://www.lesswrong.com';
    expect(postGetAbsolutePageUrl(post, forumType)).toBe(`${base}/posts/post-id/post-title`);
    expect(postGetAbsolutePageUrl({ ...post, isEvent: true }, forumType)).toBe(`${base}/events/post-id/post-title`);
    expect(postGetAbsolutePageUrl({ ...post, groupId: 'group-id' }, forumType)).toBe(`${base}/g/group-id/p/post-id/`);
    expect(postGetAbsolutePageUrl(post, forumType, 'sequence-id')).toBe(`${base}/s/sequence-id/p/post-id`);
    expect(postGetAbsoluteCommentsUrl(post, forumType, 'sequence-id')).toBe(`${base}/s/sequence-id/p/post-id#comments`);
    expect(postGetAbsoluteEditUrl(post._id, forumType, 'sharing-key', '1.2.3')).toBe(`${base}/editPost?postId=post-id&key=sharing-key&version=1.2.3`);
    expect(userGetAbsoluteProfileUrlFromSlug('alice', forumType)).toBe(`${base}/users/alice`);
    expect(userGetAbsoluteAnalyticsUrl({ slug: 'alice' }, forumType)).toBe(`${base}/users/alice/stats`);
    expect(userGetAbsoluteProfileUrl(null, forumType)).toBe('');
    expect(userGetAbsoluteProfileUrlFromSlug('', forumType)).toBe('');
    expect(userGetAbsoluteAnalyticsUrl({ slug: '' }, forumType)).toBe('');
    expect(sequenceGetAbsolutePageUrl(sequence, forumType)).toBe(`${base}/s/sequence-id`);
    expect(getAbsoluteCollectionOrSequenceUrl(sequence, forumType)).toBe(`${base}/rationality#sequence-id`);
    expect(getAbsoluteCollectionOrSequenceUrl({ ...sequence, canonicalCollectionSlug: null }, forumType)).toBe(`${base}/s/sequence-id`);
    expect(collectionGetAbsolutePageUrl({ slug: 'rationality' }, forumType)).toBe(`${base}/rationality`);
    expect(conversationGetAbsolutePageUrl({ _id: 'conversation-id' }, forumType)).toBe(`${base}/inbox?conversation=conversation-id`);
  });
});
