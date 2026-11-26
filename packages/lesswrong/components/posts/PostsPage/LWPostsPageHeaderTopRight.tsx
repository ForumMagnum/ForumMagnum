import React from 'react';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { getVotingSystemByName } from '@/lib/voting/getVotingSystem';
import classNames from 'classnames';
import type { AnnualReviewMarketInfo } from '@/lib/collections/posts/annualReviewMarkets';
import FooterTagList from "../../tagging/FooterTagList";
import LWPostsPageTopHeaderVote from "../../votes/LWPostsPageTopHeaderVote";
import AudioToggle from "./AudioToggle";
import PostActionsButton from "../../dropdowns/posts/PostActionsButton";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LWPostsPageHeaderTopRight', (theme: ThemeType) => ({
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
  rootShortform: {
    marginTop: 12,
    marginRight: 8
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
    opacity: 0.5,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  audioToggle: {
    opacity: 0.55,
    display: 'flex',
    "@media print": {
      display: "none",
    },
  },
  darkerOpacity: {
    opacity: 0.7
  }
}));

export const LWPostsPageHeaderTopRight = ({post, toggleEmbeddedPlayer, showEmbeddedPlayer, higherContrast, annualReviewMarketInfo}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  toggleEmbeddedPlayer?: () => void,
  showEmbeddedPlayer?: boolean,
  higherContrast?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo
}) => {
  const classes = useStyles(styles);
  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');

  return <div className={classNames(classes.root, post.shortform && classes.rootShortform)}>
      {!post.shortform && <AnalyticsContext pageSectionContext="tagHeader">
        <div className={classNames(classes.tagList, higherContrast && classes.darkerOpacity)}>
          <FooterTagList post={post} hideScore useAltAddTagButton align="right" noBackground neverCoreStyling tagRight={false} annualReviewMarketInfo={annualReviewMarketInfo}/>
        </div>
      </AnalyticsContext>}
      {toggleEmbeddedPlayer && <div className={classNames(classes.audioToggle, higherContrast && classes.darkerOpacity)}>
        <AudioToggle toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
      </div>}
      {!post.shortform && <div className={classes.vote}>
        <LWPostsPageTopHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>}
      <PostActionsButton post={post} className={classes.postActionsButton} flip />
  </div>;
}

export default LWPostsPageHeaderTopRight;


