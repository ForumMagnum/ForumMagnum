import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from './PostsPage';
import { isLWorAF } from '../../../lib/instanceSettings';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { hasShareButtonSetting } from '../../../lib/publicSettings';

const HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT = 300

const styles = (theme: ThemeType): JssStyles => ({
  footerSection: {
    display: 'flex',
    columnGap: 20,
    alignItems: 'center',
    fontSize: '1.4em',
    paddingTop: isFriendlyUI ? 30 : undefined,
    borderTop: isFriendlyUI ? theme.palette.border.grey300 : undefined,
    marginTop: isFriendlyUI ? 40 : undefined,
    marginBottom: isFriendlyUI ? 40 : undefined
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
    flexGrow: isFriendlyUI ? 1 : undefined,
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    marginLeft: isFriendlyUI ? undefined : 'auto',
    marginRight: isFriendlyUI ? undefined : 'auto',
    marginBottom: isFriendlyUI ? undefined : 40,
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
    {isLWorAF && !post.shortform && !post.isEvent && (wordCount > HIDE_POST_BOTTOM_VOTE_WORDCOUNT_LIMIT) &&
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
            <PostsVote post={post} useHorizontalLayout={isFriendlyUI} />
          </AnalyticsContext>
        </div>
        {isFriendlyUI && hasShareButtonSetting.get() && <div className={classes.secondaryInfoRight}>
          <BookmarkButton post={post} className={classes.bookmarkButton} placement='bottom-start' />
          <SharePostButton post={post} />
          <span className={classes.actions}>
            <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostActionsButton post={post} />
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
