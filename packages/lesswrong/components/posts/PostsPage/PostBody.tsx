import React, { ComponentType } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';
import type { SideCommentMode } from '../../dropdowns/posts/SetSideCommentVisibility';

const styles = (_theme: ThemeType) => ({
  sideComponentWrapper: {
    position: "relative",
  },
  sideComponent: {
    position: "absolute",
    left: "105%",
    ["@media (min-width: 1550px)"]: {
      left: "110%",
    },
  },
});

const PostBody = ({post, html, sideCommentMode, SideComponent, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  html: string,
  sideCommentMode?: SideCommentMode
  SideComponent?: ComponentType<{className: string}>,
  classes: ClassesType,
}) => {
  const includeSideComments = sideCommentMode && sideCommentMode!=="hidden";

  const { document } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fragmentName: 'PostSideComments',
    skip: !includeSideComments,
  });
  
  const { ContentItemBody, SideCommentIcon } = Components;
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  
  if (includeSideComments && document?.sideComments) {
    const htmlWithIDs = document.sideComments.html;
    const sideComments = sideCommentMode==="highKarma"
      ? document.sideComments.highKarmaCommentsByBlock
      : document.sideComments.commentsByBlock;
    const sideCommentsMap = mapValues(sideComments, commentIds => <SideCommentIcon post={post} commentIds={commentIds}/>)

    return <ContentItemBody
      dangerouslySetInnerHTML={{__html: htmlWithIDs}}
      key={`${post._id}_${sideCommentMode}`}
      description={`post ${post._id}`}
      nofollow={nofollow}
      idInsertions={sideCommentsMap}
    />
  }

  if (SideComponent) {
    return (
      <div className={classes.sideComponentWrapper}>
        <SideComponent className={classes.sideComponent} />
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: html}}
          description={`post ${post._id}`}
          nofollow={nofollow}
        />
      </div>
    );
  }

  return <ContentItemBody
    dangerouslySetInnerHTML={{__html: html}}
    description={`post ${post._id}`}
    nofollow={nofollow}
  />
}

const PostBodyComponent = registerComponent('PostBody', PostBody, {styles});

declare global {
  interface ComponentTypes {
    PostBody: typeof PostBodyComponent
  }
}
