import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { stripFootnotes } from '../../lib/collections/forumEvents/helpers';

export const PostsPageHeaderTitle = ({siteName}: {
  siteName: string,
}) => {

  const { params: {_id, postId}, query } = useLocation();
  const { document: post, loading } = useSingle({
    documentId: _id || postId,
    collectionName: "Posts",
    fragmentName: "PostsBase",
  });

  const { document: linkedPoll } = useSingle({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    documentId: query.pollId,
    skip: !query.pollId,
  });

  if (!post || loading) return null;

  // Use poll question as title when linking to a specific poll
  const ogTitle = linkedPoll?.pollQuestion?.html
    ? stripFootnotes(linkedPoll.pollQuestion.html)
    : post.title;

  return <Helmet>
    <title>{`${post.title} — ${siteName}`}</title>
    <meta property='og:title' content={`${ogTitle} — ${siteName}`}/>
  </Helmet>
}
