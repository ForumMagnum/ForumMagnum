import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';

const PostBody = ({post, html}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  html: string,
}) => {
  const { document, loading } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fragmentName: 'PostSideComments',
  });
  
  const { ContentItemBody, SideCommentIcon } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  
  if (document?.sideComments) {
    const htmlWithIDs = document.sideComments.html;
    const sideCommentsMap = mapValues(document.sideComments.commentsByBlock, commentIds => <SideCommentIcon post={post} commentIds={commentIds}/>)
    
    return <ContentItemBody
      dangerouslySetInnerHTML={{__html: htmlWithIDs}}
      description={`post ${post._id}`}
      nofollow={nofollow}
      idInsertions={sideCommentsMap}
    />
  }
  
  return <ContentItemBody
    dangerouslySetInnerHTML={{__html: html}}
    description={`post ${post._id}`}
    nofollow={nofollow}
  />
}

const PostBodyComponent = registerComponent('PostBody', PostBody);

declare global {
  interface ComponentTypes {
    PostBody: typeof PostBodyComponent
  }
}
