import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { userHasPingbacks } from '../../../lib/betas';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from './PostsPage';
import { isLW, isLWorAF } from '../../../lib/instanceSettings';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';
import { isFriendlyUI } from '../../../themes/forumTheme';
import classNames from 'classnames';
import {expandedPingbacksEnabledSetting} from '@/lib/publicSettings.ts'



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
  lwVote: {
    marginTop: 66,
    marginBottom: 70,
  },
  footerTagList: {
    marginTop: 16,
    marginBottom: 66,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    }
  }
});

const PostsPagePostFooter = ({post, sequenceId, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  sequenceId: string|null,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const votingSystemName = post.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const { PostsVote, BookmarkButton, SharePostButton, PostActionsButton, BottomNavigation, PingbacksList, FooterTagList, UnifiedPingbackList } = Components;
  const wordCount = post.contents?.wordCount || 0
  const PostBottomSecondaryVotingComponent = votingSystem?.getPostBottomSecondaryVotingComponent?.();
  const isEAEmojis = votingSystemName === "eaEmojis";

  return <>
    {isLWorAF && !post.shortform && !post.isEvent &&
      <AnalyticsContext pageSectionContext="tagFooter">
        <div className={classes.footerTagList}>
          <FooterTagList post={post}/>
        </div>
      </AnalyticsContext>
    }
    {!post.shortform && (isLW || isEAEmojis) &&
      <>
        <div className={classes.footerSection}>
          <div className={classNames(classes.voteBottom, isLWorAF && classes.lwVote)}>
            <AnalyticsContext pageSectionContext="lowerVoteButton">
              <PostsVote post={post} useHorizontalLayout={isFriendlyUI} isFooter />
            </AnalyticsContext>
          </div>
          {isFriendlyUI && <div className={classes.secondaryInfoRight}>
            <BookmarkButton post={post} className={classes.bookmarkButton} placement='bottom-start' />
            <SharePostButton post={post} />
            <span className={classes.actions}>
              <AnalyticsContext pageElementContext="tripleDotMenu">
                <PostActionsButton post={post} includeBookmark={!isFriendlyUI} />
              </AnalyticsContext>
            </span>
          </div>}
        </div>
        {PostBottomSecondaryVotingComponent &&
          <PostBottomSecondaryVotingComponent
            document={post}
            votingSystem={votingSystem}
            isFooter
          />
        }
      </>
    }
    {sequenceId && <div className={classes.bottomNavigation}>
      {('sequence' in post) && <AnalyticsContext pageSectionContext="bottomSequenceNavigation">
        <BottomNavigation post={post}/>
      </AnalyticsContext>}
    </div>}

    {userHasPingbacks(currentUser) && <AnalyticsContext pageSectionContext="pingbacks">
      {expandedPingbacksEnabledSetting.get() ? 
        <UnifiedPingbackList postId={post._id}/> :
        <PingbacksList postId={post._id}/>}
    </AnalyticsContext>}
  </>
}

const PostsPagePostFooterComponent = registerComponent("PostsPagePostFooter", PostsPagePostFooter, {styles});

declare global {
  interface ComponentTypes {
    PostsPagePostFooter: typeof PostsPagePostFooterComponent
  }
}
