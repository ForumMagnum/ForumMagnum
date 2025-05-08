import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { getVotingSystemByName } from '@/lib/voting/getVotingSystem';
import classNames from 'classnames';
import type { AnnualReviewMarketInfo } from '@/lib/collections/posts/annualReviewMarkets';
import { postHasAudioPlayer } from './PostsAudioPlayerWrapper';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: "nowrap",
    alignItems: "center",
    columnGap: 8,
    [theme.breakpoints.down('sm')]: {
      top: 8,
      right: 8
    },
    
    // Ensure this is above the side-items column, which extends to the top of
    // the page.
    zIndex: 100,
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
  darkerOpacity: {
    opacity: 0.7
  }
});

export const LWPostsPageHeaderTopRightInner = ({classes, post, toggleEmbeddedPlayer, showEmbeddedPlayer, higherContrast, annualReviewMarketInfo}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
  higherContrast?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo
}) => {
  const { FooterTagList, LWPostsPageTopHeaderVote, AudioToggle, PostActionsButton } = Components;

  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');

  return <div className={classes.root}>
      {!post.shortform && <AnalyticsContext pageSectionContext="tagHeader">
        <div className={classNames(classes.tagList, higherContrast && classes.darkerOpacity)}>
          <FooterTagList post={post} hideScore useAltAddTagButton align="right" noBackground neverCoreStyling tagRight={false} annualReviewMarketInfo={annualReviewMarketInfo}/>
        </div>
      </AnalyticsContext>}
      {!post.shortform && postHasAudioPlayer(post) && <div className={classNames(classes.audioToggle, higherContrast && classes.darkerOpacity)}>
        <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
      </div>}
      {!post.shortform && <div className={classes.vote}>
        <LWPostsPageTopHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>}
      <PostActionsButton post={post} className={classNames(classes.postActionsButton, post.shortform && classes.postActionsButtonShortform)} flip />
  </div>;
}

export const LWPostsPageHeaderTopRight = registerComponent('LWPostsPageHeaderTopRight', LWPostsPageHeaderTopRightInner, {styles});

declare global {
  interface ComponentTypes {
    LWPostsPageHeaderTopRight: typeof LWPostsPageHeaderTopRight
  }
}
