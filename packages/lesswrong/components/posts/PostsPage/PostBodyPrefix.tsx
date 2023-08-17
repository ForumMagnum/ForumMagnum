import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import Info from '@material-ui/icons/Info';
import { forumTitleSetting, isEAForum, siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { useCurrentUser } from '../../common/withUser';
import { canNominate, postEligibleForReview, postIsVoteable, reviewIsActive, REVIEW_YEAR } from '../../../lib/reviewUtils';
import { forumSelect } from "../../../lib/forumTypeUtils";
import { Link } from '../../../lib/reactRouterWrapper';

const shortformDraftMessage = isEAForum
  ? "This is a special post that holds your Quick takes. Because it's marked as a draft, your Quick takes will not be displayed. To un-draft it, pick Edit from the menu above, then click Publish."
  : "This is a special post that holds your short-form writing. Because it's marked as a draft, your short-form posts will not be displayed. To un-draft it, pick Edit from the menu above, then click Publish.";

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
    ...theme.typography.postStyle,
    maxWidth: 600,
    ...(isEAForum && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  rejectionNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle,
    maxWidth: 600,
    opacity: .75,
    marginBottom: 40
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginLeft: theme.spacing.unit,
    verticalAlign: "top",
    color: theme.palette.icon.dim2,
  },
  reviewVoting: {
    textAlign: "center",
    padding: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*6
  },
  reviewButton: {
    border: `solid 1px ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    display: "inline-block",
    borderRadius: 3
  }
});

const forumNewUserProcessingTime = forumSelect({
  EAForum: 24,
  LessWrong: 72,
  AlignmentForum: 72,
  default: 24
})

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  query?: any,
  classes: ClassesType,
}) => {
  const { AlignmentCrosspostMessage, AlignmentPendingApprovalMessage, LinkPostMessage, PostsRevisionMessage, LWTooltip, ReviewVotingWidget, ReviewPostButton, ContentItemBody, ContentStyles } = Components;
  const currentUser = useCurrentUser();

  return <>
    {reviewIsActive() && postEligibleForReview(post) && postIsVoteable(post) && <div className={classes.reviewVoting}>
      {canNominate(currentUser, post) && <ReviewVotingWidget post={post}/>}
      <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={`Write up your thoughts on what was good about a post, how it could be improved, and how you think stands the tests of time as part of the broader ${forumTitleSetting.get()} conversation`} placement="bottom">
        <div className={classes.reviewButton}>Review</div>
      </LWTooltip>}/>
    </div>}

    <AlignmentCrosspostMessage post={post} />
    <AlignmentPendingApprovalMessage post={post} />

    {post.shortform && post.draft && <div className={classes.contentNotice}>
      {shortformDraftMessage}
    </div>}
    {post.shortform && !post.draft && <div className={classes.contentNotice}>
      {isEAForum
        ? <>
          This is a special post for quick takes by <Components.UsersNameDisplay user={post.user}/>. Only they can create top-level comments. Comments here also appear on the <Link to="/quicktakes">Quick Takes page</Link> and <Link to="/allPosts">All Posts page</Link>.
        </>
        : <>
          This is a special post for short-form writing by <Components.UsersNameDisplay user={post.user}/>. Only they can create top-level comments. Comments here also appear on the <Link to="/shortform">Shortform Page</Link> and <Link to="/allPosts">All Posts page</Link>.
        </>
      }
    </div>}

    {post.rejected && <div className={classes.rejectionNotice}>
      <p>This post was rejected{post.rejectedReason && " for the following reason(s):"}</p>
      <ContentStyles contentType="postHighlight">
        <ContentItemBody dangerouslySetInnerHTML={{__html: post.rejectedReason || "" }}/>
      </ContentStyles>
    </div>}
    {!post.rejected && post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>
      {currentUser?._id === post.userId
        ? "Because this is your first post, this post is awaiting moderator approval."
        : "This post is unlisted and is still awaiting moderation.\nUsers' first posts need to be approved by a moderator."
      }
      <LWTooltip title={<p>
        New users' first posts on {siteNameWithArticleSetting.get()} are checked by moderators before they appear on the site.
        Most posts will be approved within {forumNewUserProcessingTime} hours; posts that are spam or that don't meet site
        standards will be deleted. After you've had a post approved, future posts will appear
        immediately without waiting for review.
      </p>}>
        <Info className={classes.infoIcon}/>
      </LWTooltip>
    </div>}
    <LinkPostMessage post={post} negativeTopMargin />
    {query?.revision && post.contents && <PostsRevisionMessage post={post} />}
  </>;
}

const PostBodyPrefixComponent = registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});

declare global {
  interface ComponentTypes {
    PostBodyPrefix: typeof PostBodyPrefixComponent
  }
}
