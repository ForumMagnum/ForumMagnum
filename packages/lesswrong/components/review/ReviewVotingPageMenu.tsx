import React from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import { eligibleToNominate, ReviewPhase } from '../../lib/reviewUtils';
import Select from '@material-ui/core/Select';
import qs from 'qs';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { isLW, isLWorAF } from '@/lib/instanceSettings';
import { useLocation } from '@/lib/routeUtil';

const styles = (theme: ThemeType) => ({
  menu: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.panelBackground.default,
    zIndex: theme.zIndexes.reviewVotingMenu,
    padding: theme.spacing.unit,
    background: theme.palette.grey[310],
    borderBottom: theme.palette.border.slightlyFaint,
    flexWrap: "wrap"
  },
  costTotal: {
    ...theme.typography.commentStyle,
    marginLeft: 10,
    color: theme.palette.grey[600],
    marginRight: "auto",
    whiteSpace: "pre"
  },
  excessVotes: {
    color: theme.palette.error.main,
  },
  message: {
    width: "100%",
    textAlign: "center",
    paddingTop: 50,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  warning: {
    color: theme.palette.error.main
  },
  singleLineWarning: {
    padding: 16,
  },
  postCount: {
    ...theme.typography.commentStyle,
    marginLeft: 10,
    color: theme.palette.grey[600],
    marginRight: "auto",
    whiteSpace: "pre"
  },
  highlightedPostCount: {
    color: theme.palette.primary.main,
    cursor: "pointer",
    marginRight: 8
  },
  sortingOptions: {
    whiteSpace: "pre",
    display: "flex",
    [theme.breakpoints.down('xs')]: {
      paddingTop: 12,
      paddingLeft: 4
    }
  },
  sortBy: {
    color: theme.palette.grey[600],
    marginRight: 3
  },
  sortArrow: {
    cursor: "pointer",
    padding: 4,
    borderRadius: 3,
    marginRight: 6,
    border: theme.palette.border.normal,
    "&:hover": {
      background: theme.palette.panelBackground.darken20,
    }
  },
  votingTitle: {
    ...theme.typography.display2,
    ...theme.typography.postStyle,
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  }
});

export const ReviewVotingPageMenu = ({classes, reviewPhase, loading, sortedPosts, costTotal, setSortPosts, sortPosts, sortReversed, setSortReversed, postsLoading, postsResults}: {
  classes: ClassesType<typeof styles>,
  reviewPhase: ReviewPhase,
  loading: boolean,
  sortedPosts: PostsList[]|null,
  costTotal: number,
  setSortPosts: (sort: string) => void,
  sortPosts: string,
  sortReversed: boolean,
  setSortReversed: (reversed: boolean) => void,
  postsLoading: boolean,
  postsResults: PostsList[]|null,
}) => {
  const currentUser = useCurrentUser();
  const { ContentStyles, LWTooltip, Loading, MenuItem, } = Components

  const accountSettings = preferredHeadingCase("Account Settings");

  const reviewedPosts = sortedPosts?.filter(post=>post.reviewCount > 0)

  const costTotalTooltip = costTotal > 500 ? <div>You have spent more than 500 points. Your vote strength will be reduced to account for this.</div> : <div>You have {500 - costTotal} points remaining before your vote-weight begins to reduce.</div>

  const navigate = useNavigate();
  const location = useLocation();

  const updatePostSort = (sort: AnyBecauseTodo) => {
    setSortPosts(sort)
    const newQuery = {...location.query, sort}
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
  }

  const reviewedPostCount = <LWTooltip title="Posts need at least 1 review to enter the Final Voting Phase">
    {reviewedPosts?.length || 0} Reviewed Posts
  </LWTooltip> 
  const nominatedPostCount = reviewPhase !== "VOTING" && <LWTooltip title={<div><div>{sortedPosts?.length ?? 0} have received at least one Nomination Vote</div><div><em>Posts need at least 2 Nomination Votes to proceed to the Review Phase</em></div></div>}>{sortedPosts?.length ?? 0} Nominated</LWTooltip>

  return <AnalyticsContext pageElementContext='reviewVotingPageMenu'> 
      <div>
          {reviewPhase === "VOTING" && currentUser?.noSingleLineComments && <ContentStyles contentType="comment" className={classes.singleLineWarning}>
            <span className={classes.warning}>You have "Do not collapse comments to single line" enabled, </span>which is going to make this page pretty bloated. The intended experience is for each post to have a few truncated reviews, which you can expand. You may want to disable the option in your <Link to={'/account'}>{accountSettings}</Link>
            </ContentStyles>}
          <div className={classes.menu}>

            {/* TODO: Remove this if we haven't seen the error in awhile. I think I've fixed it but... model uncertainty */}
            {!postsResults && !postsLoading && <div className={classes.postCount}>ERROR: Please Refresh</div>} 

            {sortedPosts && 
              <div className={classes.postCount}>
                {reviewPhase === "NOMINATIONS" && <><span className={classes.highlightedPostCount}>{nominatedPostCount}</span> ({reviewedPostCount})</>}
                {reviewPhase !== "NOMINATIONS" && <><span className={classes.highlightedPostCount}>{reviewedPostCount}</span> ({nominatedPostCount})</>}
              </div>
            }
            {(postsLoading || loading) && <Loading/>}

            {eligibleToNominate(currentUser) && (costTotal !== null) && <div className={classNames(classes.costTotal, {[classes.excessVotes]: costTotal > 500})}>
              <LWTooltip title={costTotalTooltip}>
                {costTotal}/500
              </LWTooltip>
            </div>}
            
            <div className={classes.sortingOptions}>
              <LWTooltip title={`Sorted by ${sortReversed ? "Ascending" : "Descending"}`}>
                <div onClick={() => { 
                  setSortReversed(!sortReversed); 
                }}>
                  {sortReversed ? <ArrowUpwardIcon className={classes.sortArrow} />
                    : <ArrowDownwardIcon className={classes.sortArrow}  />
                  }
                </div>
              </LWTooltip>
              <Select
                value={sortPosts}
                onChange={(e)=>{updatePostSort(e.target.value)}}
                disableUnderline
                >
                {reviewPhase === "NOMINATIONS" && <MenuItem value={'needsPreliminaryVote'}>
                  <LWTooltip placement="left" title={<div>Prioritizes posts with at least one review, which you haven't yet voted on<div><em>(intended to reward reviews by making reviewed posts more prominent</em></div></div>}>
                    <span><span className={classes.sortBy}>Sort by</span> Magic (Prioritize reviewed)</span>
                  </LWTooltip>
                </MenuItem>}
                <MenuItem value={'lastCommentedAt'}>
                  <span className={classes.sortBy}>Sort by</span> {preferredHeadingCase("Last Commented")}
                </MenuItem>
                {reviewPhase === "REVIEWS" && <MenuItem value={'reviewVoteScoreHighKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (1000+ Karma Users)
                </MenuItem>}
                {reviewPhase === "REVIEWS" && <MenuItem value={'reviewVoteScoreAllKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (All Users)
                </MenuItem>}
                {reviewPhase === "REVIEWS" && (isLWorAF) && <MenuItem value={'reviewVoteScoreAF'}>
                  <span className={classes.sortBy}>Sort by</span> Vote Total (Alignment Forum Users)
                </MenuItem>}
                <MenuItem value={'yourVote'}>
                  <span className={classes.sortBy}>Sort by</span> Your Review Vote
                </MenuItem>
                <MenuItem value={'yourKarmaVote'}>
                  <span className={classes.sortBy}>Sort by</span> Your Karma Vote
                </MenuItem>
                <MenuItem value={'reviewCount'}>
                  <span className={classes.sortBy}>Sort by</span> Review Count
                </MenuItem>
                {reviewPhase === "NOMINATIONS" && 
                  <MenuItem value={'positiveReviewVoteCount'}>
                    <LWTooltip title={<div>
                      <div>Sort by how many positive votes the post has</div>
                      <div><em>(Posts need at least 2 positive votes to proceed to the Review Phase</em></div>
                    </div>}>
                      <span className={classes.sortBy}>Sort by</span> Positive Vote Count
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "REVIEWS" && 
                  <MenuItem value={'needsReview'}>
                    <LWTooltip title={<div><p>Prioritizes posts you voted on or wrote, which haven't had a review written, and which have at least 4 points.</p>
                      <p><em>(i.e. emphasizees posts that you'd likely want to prioritize reviewing, so that they make it to the final voting)</em></p>
                    </div>}>
                      <span><span className={classes.sortBy}>Sort by</span> Magic (Needs Review)</span>
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "VOTING" && 
                  <MenuItem value={'needsFinalVote'}>
                    <LWTooltip title={<div>Prioritizes posts you haven't voted on yet</div>}>
                      <span><span className={classes.sortBy}>Sort by</span> Magic (Needs Vote)</span>
                    </LWTooltip>
                  </MenuItem>
                }
                {reviewPhase === "COMPLETE" && <MenuItem value={'finalReviewVoteScoreHighKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (1000+ Karma Users)
                </MenuItem>}
                {reviewPhase === "COMPLETE" && <MenuItem value={'finalReviewVoteScoreAllKarma'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (All Users)
                </MenuItem>}
                {reviewPhase === "COMPLETE" && isLW && <MenuItem value={'finalReviewVoteScoreAF'}>
                  <span className={classes.sortBy}>Sort by</span> Final Vote Total (Alignment Forum Users)
                </MenuItem>}
              </Select>
            </div>
          </div>
    </div>
  </AnalyticsContext>;
}

const ReviewVotingPageMenuComponent = registerComponent('ReviewVotingPageMenu', ReviewVotingPageMenu, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPageMenu: typeof ReviewVotingPageMenuComponent
  }
}
