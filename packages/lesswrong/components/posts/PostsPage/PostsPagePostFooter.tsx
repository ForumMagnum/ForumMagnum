import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from './PostsPage';
import { isEAForum } from '../../../lib/instanceSettings';

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300

const styles = (theme: ThemeType): JssStyles => ({
  footerSection: {
    display: 'flex',
    columnGap: 20,
    alignItems: 'center',
    fontSize: '1.4em',
    paddingTop: isEAForum ? 30 : undefined,
    borderTop: isEAForum ? theme.palette.border.normal : undefined,
    marginTop: isEAForum ? 40 : undefined,
    marginBottom: isEAForum ? 40 : undefined
  },
  bookmarkButton: {
    marginBottom: -5,
    height: 22,
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 0.5,
    },
  },
  actions: {
    "&:hover": {
      opacity: 0.5,
    },
    '& svg': {
      color: 'inherit' // this is needed for the EAF version of the icon
    },
  },
  voteBottom: {
    flexGrow: isEAForum ? 1 : undefined,
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: isEAForum ? undefined : 'auto',
    marginRight: isEAForum ? undefined : 'auto',
    marginBottom: isEAForum ? undefined : 40,
    "@media print": { display: "none" },
  },
  secondaryInfoRight: {
    flex: 'none',
    display: 'flex',
    columnGap: 20,
    color: theme.palette.text.dim3,
  },
  bottomNavigation: {
    width: 640,
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width:'100%',
      maxWidth: MAX_COLUMN_WIDTH
    }
  },
  footerTagList: {
    marginTop: 16,
    marginBottom: 66,
  },
});

const PostsPagePostFooter = ({post, sequenceId, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  sequenceId: string,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { PostsVote, BookmarkButton, SharePostButton, PostActionsButton, BottomNavigation, PingbacksList, FooterTagList } = Components;
  const wordCount = post.contents?.wordCount || 0
  
  return <>
    {!isEAForum && !post.shortform && !post.isEvent && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
      <AnalyticsContext pageSectionContext="tagFooter">
        <div className={classes.footerTagList}>
          <FooterTagList post={post}/>
        </div>
      </AnalyticsContext>
    }
    {!post.shortform && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
      <div className={classes.footerSection}>
        <div className={classes.voteBottom}>
          <AnalyticsContext pageSectionContext="lowerVoteButton">
            <PostsVote post={post} useHorizontalLayout={isEAForum} />
          </AnalyticsContext>
        </div>
        {isEAForum && <div className={classes.secondaryInfoRight}>
          <BookmarkButton post={post} className={classes.bookmarkButton} placement='bottom-start' />
          <SharePostButton post={post} />
          <span className={classes.actions}>
            <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostActionsButton post={post} includeBookmark={!isEAForum} />
            </AnalyticsContext>
          </span>
        </div>}
      </div>}
    {sequenceId && <div className={classes.bottomNavigation}>
      <AnalyticsContext pageSectionContext="bottomSequenceNavigation">
        <BottomNavigation post={post}/>
      </AnalyticsContext>
    </div>}

    {userHasPingbacks(currentUser) && <AnalyticsContext pageSectionContext="pingbacks">
      <PingbacksList postId={post._id}/>
    </AnalyticsContext>}
  </>
}

const PostsPagePostFooterComponent = registerComponent("PostsPagePostFooter", PostsPagePostFooter, {styles});

declare global {
  interface ComponentTypes {
    PostsPagePostFooter: typeof PostsPagePostFooterComponent
  }
}
