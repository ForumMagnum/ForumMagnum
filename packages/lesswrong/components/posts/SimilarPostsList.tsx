import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    marginTop: theme.spacing.unit*2
  },
  title: {
    ...theme.typography.commentStyle,
    display: "inline-block",
    lineHeight: "1rem",
    marginBottom: -4
  },
});

const SimilarPostsList = ({postId, classes}: {
  postId: string,
  classes: ClassesType,
}) => {
  const { document: post, loading } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: 'PostWithSimilarPosts',
  });
  
  const similarPosts = post?.similarPosts;
  const { LoadMore, LWTooltip, PostFooterPostLink, Loading } = Components;
  
  return <div className={classes.root}>
    <div className={classes.title}>
      <LWTooltip title="Posts similar to this post" placement="right">
        <span>Similar Posts</span>
      </LWTooltip>
    </div>
    {loading && <Loading/>}
    {similarPosts && <div className={classes.list}>
      {similarPosts.map((post, i) =>
        <div key={post._id} >
          <PostFooterPostLink post={post}/>
        </div>
      )}
    </div>}
  </div>
}

const SimilarPostsListComponent = registerComponent("SimilarPostsList", SimilarPostsList, {styles});

declare global {
  interface ComponentTypes {
    SimilarPostsList: typeof SimilarPostsListComponent
  }
}

