import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from './withUser';

const isEAForum = forumTypeSetting.get() === 'EAForum';

const styles = (theme: ThemeType): JssStyles => ({
  subheader: {
    '& svg': {
      color: theme.palette.grey[600],
    },
    marginTop: -4,
    marginBottom: 2,
  },
});

const LatestPostsDiscussion = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, ContentType, CommentsNode, LoadMore } = Components;
  const currentUser  = useCurrentUser();
  const subforumDiscussionCommentsQuery = useMulti({
    terms: {view: 'latestSubforumDiscussion', profileTagIds: currentUser?.profileTagIds, limit: 3},
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    skip: !isEAForum || !currentUser?.profileTagIds?.length,
  })
  const [loadMoreCalled, setLoadMoreCalled] = useState(false);
  
  if (!isEAForum) {
    return null;
  }
  if (subforumDiscussionCommentsQuery.loading) {
    return <Loading/>;
  }
  if (!subforumDiscussionCommentsQuery.results?.length) {
    return null;
  }
  return <>
    <ContentType type="subforumDiscussion" label="Discussion from your subforums" className={classes.subheader} />
    {subforumDiscussionCommentsQuery.results.map((comment) => {
      return <CommentsNode
        treeOptions={{
          // F7U12
          tag: comment.tag ?? undefined,
          forceSingleLine: true
        }}
        comment={comment}
        key={comment._id}
        loadChildrenSeparately
        displayTagIcon
      />
    })}
    {!loadMoreCalled && <LoadMore {...{
      ...subforumDiscussionCommentsQuery.loadMoreProps,
      loadMore: () => {
        setLoadMoreCalled(true);
        return subforumDiscussionCommentsQuery.loadMore(10);
      },
    }} />}
  </>;
}

const LatestPostsDiscussionComponent = registerComponent(
  'LatestPostsDiscussion',
  LatestPostsDiscussion,
  {styles}
);

declare global {
  interface ComponentTypes {
    LatestPostsDiscussion: typeof LatestPostsDiscussionComponent
  }
}
