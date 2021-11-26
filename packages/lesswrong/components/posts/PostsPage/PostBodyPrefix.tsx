import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import Info from '@material-ui/icons/Info';
import { siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { useCurrentUser } from '../../common/withUser';
import { canNominate } from '../../review/NominatePostMenuItem';

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
  infoIcon: {
    width: 16,
    height: 16,
    marginLeft: theme.spacing.unit,
    verticalAlign: "top",
    color: "rgba(0,0,0,.4)",
  },
  reviewVoting: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*6
  }
});

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  query?: any,
  classes: ClassesType,
}) => {
  const { AlignmentCrosspostMessage, AlignmentPendingApprovalMessage, LinkPostMessage, PostsRevisionMessage, LWTooltip, ReviewVotingWidget} = Components;
  const currentUser = useCurrentUser();

  return <>
    {/* disabled except during Review */}
    {canNominate(currentUser, post) && <div className={classes.reviewVoting}><ReviewVotingWidget post={post} /></div>}
    {/* {(post.nominationCount2019 >= 2) && <div className={classes.reviewInfo}>
      <div className={classes.reviewLabel}>
        This post has been nominated for the <HoverPreviewLink href={'/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review'} id="QFBEjjAvT6KbaA3dY" innerHTML={"2019 Review"}/>
      </div>
      <ReviewPostButton post={post} reviewMessage="Write a Review" year="2019"/>
    </div>} */}

    <AlignmentCrosspostMessage post={post} />
    <AlignmentPendingApprovalMessage post={post} />
    
    {post.shortform && post.draft && <div className={classes.contentNotice}>
      This is a special post that holds your short-form writing. Because it's
      marked as a draft, your short-form posts will not be displayed. To un-draft
      it, pick Edit from the menu above, then click Publish.
    </div>}
    
    {post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>
      Because this is your first post, this post is awaiting moderator approval.
      <LWTooltip title={<p>
        New users' first posts on {siteNameWithArticleSetting.get()} are checked by moderators before they appear on the site.
        Most posts will be approved within 24 hours; posts that are spam or that don't meet site
        standards will be deleted. After you've had a post approved, future posts will appear
        immediately without waiting for review.
      </p>}>
        <Info className={classes.infoIcon}/>
      </LWTooltip>
    </div>}
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
