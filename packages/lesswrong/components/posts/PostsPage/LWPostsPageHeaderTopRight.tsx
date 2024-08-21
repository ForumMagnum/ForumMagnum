import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { getVotingSystemByName } from '@/lib/voting/votingSystems';
import classNames from 'classnames';

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
  darkerOpacity: {
    opacity: 0.8
  }
});

export const LWPostsPageHeaderTopRight = ({classes, post, toggleEmbeddedPlayer, showEmbeddedPlayer, higherContrast}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
  higherContrast?: boolean
}) => {
  const { FooterTagList, LWPostsPageTopHeaderVote, AudioToggle, PostActionsButton } = Components;

  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');

  return <div className={classes.root}>
      {!post.shortform && <AnalyticsContext pageSectionContext="tagHeader">
        <div className={classNames(classes.tagList, higherContrast && classes.darkerOpacity)}>
          <FooterTagList post={post} hideScore useAltAddTagButton align="right" noBackground neverCoreStyling tagRight={false} />
        </div>
      </AnalyticsContext>}
      {!post.shortform && <div className={classNames(classes.audioToggle, higherContrast && classes.darkerOpacity)}>
        <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
      </div>}
      {!post.shortform && <div className={classes.vote}>
        <LWPostsPageTopHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>}
      <PostActionsButton post={post} className={classNames(classes.postActionsButton, post.shortform && classes.postActionsButtonShortform)} flip />
  </div>;
}

const LWPostsPageHeaderTopRightComponent = registerComponent('LWPostsPageHeaderTopRight', LWPostsPageHeaderTopRight, {styles});

declare global {
  interface ComponentTypes {
    LWPostsPageHeaderTopRight: typeof LWPostsPageHeaderTopRightComponent
  }
}
