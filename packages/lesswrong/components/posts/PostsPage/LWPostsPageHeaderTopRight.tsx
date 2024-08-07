// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { getVotingSystemByName } from '@/lib/voting/votingSystems';

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
  tagList: {
    marginTop: 12,
    marginBottom: 12,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  }
});

export const LWPostsPageHeaderTopRight = ({classes, post, toggleEmbeddedPlayer, showEmbeddedPlayer, hideVoteOnMobile}: {
  classes: ClassesType<typeof styles>,
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
  hideVoteOnMobile?: boolean
}) => {
  const { FooterTagList, LWPostsPageTopHeaderVote, AudioToggle, PostActionsButton } = Components;

  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');

  return <div className={classes.root}>
      {<AnalyticsContext pageSectionContext="tagHeader">
        <div className={classes.tagList}>
          <FooterTagList post={post} hideScore useAltAddTagButton hideAddTag={true} align="right" noBackground neverCoreStyling />
        </div>
      </AnalyticsContext>}
      <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
      <div className={classes.vote}>
        <LWPostsPageTopHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>
      <PostActionsButton post={post} className={classes.postActionsButton} flip />
  </div>;
}

const LWPostsPageHeaderTopRightComponent = registerComponent('LWPostsPageHeaderTopRight', LWPostsPageHeaderTopRight, {styles});

declare global {
  interface ComponentTypes {
    LWPostsPageHeaderTopRight: typeof LWPostsPageHeaderTopRightComponent
  }
}
