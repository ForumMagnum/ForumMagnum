import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { userHasPingbacks } from '../../lib/betas';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { isLWorAF } from '../../lib/instanceSettings';
import classNames from 'classnames';
import PostsVote from "../votes/PostsVote";
import PingbacksList from "../posts/PingbacksList";
import FooterTagList from "../tagging/FooterTagList";

const styles = defineStyles("UltraFeedPostFooter", (theme: ThemeType) => ({
  footerSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.4em',
    marginTop: 30,
    marginBottom: 30,
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
      color: 'inherit'
    },
  },
  voteBottom: {
    position: 'relative',
    fontSize: 42,
    textAlign: 'center',
    display: 'inline-block',
    '& .PostsVoteDefault-voteScore': {
      fontFamily: theme.palette.fonts.sansSerifStack,
    },
    '& .PostsVoteDefault-voteBlock': {
      display: 'flex',
      alignItems: 'center',
    },
  },
  secondaryInfoRight: {
    flex: 'none',
    display: 'flex',
    columnGap: 20,
    color: theme.palette.text.dim3,
  },
  footerTagList: {
    marginTop: 16,
    marginBottom: 40,
  }
}));

const UltraFeedPostFooter = ({post}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  return <>
    {isLWorAF() && !post.shortform && !post.isEvent &&
      <AnalyticsContext pageSectionContext="tagFooter">
        <div className={classes.footerTagList}>
          <FooterTagList post={post}/>
        </div>
      </AnalyticsContext>
    }
    {!post.shortform &&
      <>
        <div className={classes.footerSection}>
          <div className={classNames(classes.voteBottom)}>
            <AnalyticsContext pageSectionContext="lowerVoteButton">
              <PostsVote post={post} useHorizontalLayout={true} isFooter />
            </AnalyticsContext>
          </div>
        </div>
      </>
    }
    {userHasPingbacks(currentUser) && <AnalyticsContext pageSectionContext="pingbacks">
      <PingbacksList postId={post._id}/>
    </AnalyticsContext>}
  </>
}

export default UltraFeedPostFooter;
