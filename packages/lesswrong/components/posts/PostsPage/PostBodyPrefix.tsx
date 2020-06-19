import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';

const styles = theme => ({
  reviewInfo: {
    textAlign: "center",
    marginBottom: 32
  },
  reviewLabel: {
    ...theme.typography.postStyle,
    ...theme.typography.contentNotice,
    marginBottom: theme.spacing.unit,
  },
  contentNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
});

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  query?: any,
  classes: ClassesType,
}) => {
  const { AlignmentCrosspostMessage, LinkPostMessage, PostsRevisionMessage} = Components;
  
  return <>
    {/* disabled except during Review */}
    {/* {(post.nominationCount2018 >= 2) && <div className={classes.reviewInfo}>
      <div className={classes.reviewLabel}>
        This post has been nominated for the <HoverPreviewLink href="http://lesswrong.com/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review-posts-need-at-least-2-nominations" innerHTML={"2018 Review"}/>
      </div>
      <ReviewPostButton post={post} reviewMessage="Write a Review"/>
    </div>} */}

    <AlignmentCrosspostMessage post={post} />
    { post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>This post is awaiting moderator approval</div>}
    <LinkPostMessage post={post} />
    {query?.revision && <PostsRevisionMessage post={post} />}
  </>;
}

const PostBodyPrefixComponent = registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});

declare global {
  interface ComponentTypes {
    PostBodyPrefix: typeof PostBodyPrefixComponent
  }
}
