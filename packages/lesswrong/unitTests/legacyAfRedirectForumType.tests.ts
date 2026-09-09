import { NextRequest } from 'next/server';
import * as navigation from 'next/navigation';
import { GET } from '../../../app/item/route';
import Posts from '@/server/collections/posts/collection';
import Comments from '@/server/collections/comments/collection';
import * as commentHelpers from '@/lib/collections/comments/helpers';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { siteUrlSetting } from '@/lib/instanceSettings';

const afRequests = [
  { host: 'alignmentforum.localhost:3000' },
  { host: 'deployment.example', 'x-forwarded-host': 'alignmentforum.org' },
  { host: 'localhost:3000', cookie: 'forumType=AlignmentForum' },
];

describe('legacy AF redirects', () => {
  beforeEach(() => {
    jest.spyOn(forumTypeSetting, 'get').mockImplementation(() => {
      throw new Error('Legacy redirects must not read the deployment forum');
    });
    jest.spyOn(siteUrlSetting, 'get').mockImplementation(forum => {
      const forumType = typeof forum === 'string' ? forum : forum.forumType;
      return forumType === 'AlignmentForum' ? 'https://www.alignmentforum.org/' : 'https://www.lesswrong.com/';
    });
    jest.spyOn(navigation, 'redirect').mockImplementation(url => { throw new Error(url); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(afRequests)('keeps legacy posts on AF for %j', async headers => {
    jest.spyOn(Posts, 'findOne').mockImplementation(jest.fn().mockResolvedValue({ _id: 'post-id', slug: 'post-title' }));
    const request = new NextRequest('http://deployment.example/item?id=123', { headers });

    await expect(GET(request)).rejects.toThrow('https://www.alignmentforum.org/posts/post-id/post-title');
  });

  it('passes the request forum to legacy comment URL resolution', async () => {
    jest.spyOn(Posts, 'findOne').mockResolvedValue(null);
    jest.spyOn(Comments, 'findOne').mockImplementation(jest.fn().mockResolvedValue({ _id: 'comment-id' }));
    const getCommentUrl = jest.spyOn(commentHelpers, 'commentGetAbsolutePageUrlFromDB')
      .mockResolvedValue('https://www.alignmentforum.org/posts/post-id/post-title?commentId=comment-id');
    const request = new NextRequest('http://deployment.example/item?id=456', { headers: afRequests[0] });

    await expect(GET(request)).rejects.toThrow('https://www.alignmentforum.org/');
    expect(getCommentUrl).toHaveBeenCalledWith({ _id: 'comment-id' }, expect.objectContaining({ forumType: 'AlignmentForum' }));
  });
});
