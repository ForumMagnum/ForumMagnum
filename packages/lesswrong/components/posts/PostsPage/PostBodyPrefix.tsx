import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
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
  const { AlignmentCrosspostMessage, LinkPostMessage, PostsRevisionMessage, HoverPreviewLink, ReviewPostButton} = Components;
  
  return <>
    {/* disabled except during Review */}
    {(post.nominationCount2019 >= 2) && <div className={classes.reviewInfo}>
      <div className={classes.reviewLabel}>
        This post has been nominated for the <HoverPreviewLink href={'/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review'} id="QFBEjjAvT6KbaA3dY" innerHTML={"2019 Review"}/>
      </div>
      <ReviewPostButton post={post} reviewMessage="Write a Review" year="2019"/>
    </div>}

    <AlignmentCrosspostMessage post={post} />
    { post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>This post is awaiting moderator approval</div>}
    <LinkPostMessage post={post} />
    {query?.revision && post.contents && <PostsRevisionMessage post={post} />}
  </>;
}

const PostBodyPrefixComponent = registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});

declare global {
  interface ComponentTypes {
    PostBodyPrefix: typeof PostBodyPrefixComponent
  }
}
