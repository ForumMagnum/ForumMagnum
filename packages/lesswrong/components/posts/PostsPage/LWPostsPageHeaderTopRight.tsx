import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { getVotingSystemByName } from '@/lib/voting/votingSystems';
import classNames from 'classnames';
import { CommentsLink } from './PostsPagePostHeader';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: "nowrap",
    alignItems: "center",
    columnGap: 8,
    [theme.breakpoints.down('sm')]: {
      top: 8,
      right: 8
    }
  },
  vote: {
    display: 'flex',
    flexDirection: 'row-reverse',
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  postActionsButton: {
    display: 'flex',
    alignItems: 'center',
    opacity: 0.3
  },
  postActionsButtonShortform: {
    marginTop: 12,
    marginRight: 8
  },
  tagList: {
    marginTop: 12,
    marginBottom: 12,
    opacity: 0.5,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  audioToggle: {
    opacity: 0.55,
    display: 'flex',
  },
  commentsIcon: {
    position: "relative",
    top: -2,
    marginRight: 2,
  },
});

export const LWPostsPageHeaderTopRight = ({classes, post, toggleEmbeddedPlayer, showEmbeddedPlayer}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
  hideVoteOnMobile?: boolean
}) => {
  const { FooterTagList, LWPostsPageTopHeaderVote, AudioToggle, PostActionsButton, PostsItemComments } = Components;

  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');

  return <div className={classes.root}>
      {!post.shortform && <AnalyticsContext pageSectionContext="tagHeader">
        <div className={classes.tagList}>
          <FooterTagList post={post} hideScore useAltAddTagButton align="right" noBackground neverCoreStyling tagRight={false} />
        </div>
      </AnalyticsContext>}
      {!post.shortform && <div className={classes.audioToggle}>
        <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
      </div>}
      {!post.shortform && <div className={classes.vote}>
        <LWPostsPageTopHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>}
      <div className={classes.commentsIcon}>
        <CommentsLink anchor="#comments">
          <PostsItemComments
            commentCount={post.commentCount}
            small={true} unreadComments={false} newPromotedComments={false}
          />
        </CommentsLink>
      </div>
      <PostActionsButton post={post} className={classNames(classes.postActionsButton, post.shortform && classes.postActionsButtonShortform)} flip />
  </div>;
}

const LWPostsPageHeaderTopRightComponent = registerComponent('LWPostsPageHeaderTopRight', LWPostsPageHeaderTopRight, {styles});

declare global {
  interface ComponentTypes {
    LWPostsPageHeaderTopRight: typeof LWPostsPageHeaderTopRightComponent
  }
}
