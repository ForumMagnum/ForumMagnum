import React, { useState, useEffect, useCallback } from 'react';
import Button from '@material-ui/core/Button';
import sumBy from 'lodash/sumBy'
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation, gql } from '@apollo/client';
import Paper from '@material-ui/core/Paper';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import KeyboardTabIcon from '@material-ui/icons/KeyboardTab';
import { commentBodyStyles } from '../../themes/stylePiping';
import CachedIcon from '@material-ui/icons/Cached';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';
import { currentUserCanVote, getReviewPhase, REVIEW_NAME_IN_SITU, REVIEW_NAME_TITLE, REVIEW_YEAR } from '../../lib/reviewUtils';
import { annualReviewAnnouncementPostPathSetting, annualReviewStart } from '../../lib/publicSettings';
import moment from 'moment';
import { forumTypeSetting } from '../../lib/instanceSettings';

const isEAForum = forumTypeSetting.get() === 'EAForum'

const VOTING_VIEW = "reviewVoting" // unfortunately this can't just inhereit from REVIEW_YEAR. It needs to exactly match a view-type so that the type-check of the view can pass.
export const REVIEW_COMMENTS_VIEW = "reviews2020"
const userVotesAreQuadraticField: keyof DbUser = "reviewVotesQuadratic2020";

const styles = (theme: ThemeType): JssStyles => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: `
      minmax(10px, 0.5fr) minmax(100px, 640px) minmax(30px, 0.5fr) minmax(300px, 740px) minmax(30px, 0.5fr)
    `,
    gridTemplateAreas: `
    "... leftColumn ... rightColumn ..."
    `,
    paddingBottom: 175
  },
  instructions: {
    ...theme.typography.body2,
    ...commentBodyStyles(theme),
    paddingBottom: 35
  },
  leftColumn: {
    gridArea: "leftColumn",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  rightColumn: {
    gridArea: "rightColumn",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  result: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    lineHeight: "1.3rem",
    marginBottom: 10,
    position: "relative"
  },
  votingBox: {
    maxWidth: 700
  },
  expandedInfo: {
    maxWidth: 600,
    marginBottom: 175,
  },
  menu: {
    position: "sticky",
    top:0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    zIndex: theme.zIndexes.reviewVotingMenu,
    padding: theme.spacing.unit,
    background: "#ddd",
    borderBottom: "solid 1px rgba(0,0,0,.15)"
  },
  menuIcon: {
    marginLeft: theme.spacing.unit
  },
  returnToBasicIcon: {
    transform: "rotate(180deg)",
    marginRight: theme.spacing.unit
  },
  expandedInfoWrapper: {
    position: "fixed",
    top: 100,
    overflowY: "auto",
    height: "100vh",
    paddingRight: 8
  },
  header: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 6,
  },
  postHeader: {
    ...theme.typography.display1,
    ...theme.typography.postStyle,
    marginTop: 0,
  },
  comments: {
  },
  voteTotal: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  excessVotes: {
    color: theme.palette.error.main,
    border: `solid 1px ${theme.palette.error.light}`,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 3,
    '&:hover': {
      opacity: .5
    }
  },
  message: {
    width: "100%",
    textAlign: "center",
    paddingTop: 50,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  warning: {
    color: theme.palette.error.main
  },
  
  voteAverage: {
    cursor: 'pointer',
  }
});

export type ReviewVote = {_id: string, postId: string, score: number, type?: string}
export type quadraticVote = ReviewVote & {type: "quadratic"}
export type qualitativeVote = ReviewVote & {type: "qualitative", score: 0|1|2|3|4}


const generatePermutation = (count: number, user: UsersCurrent|null): Array<number> => {
  const seed = user?._id || "";
  const rng = seedrandom(seed);
  
  let remaining = _.range(count);
  let result: Array<number> = [];
  while(remaining.length > 0) {
    let idx = Math.floor(rng() * remaining.length);
    result.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return result;
}


const ReviewVotingPage = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking({eventType: "reviewVotingEvent"})
  

  const { results: posts, loading: postsLoading } = useMulti({
    terms: {
      view: VOTING_VIEW,
      before: `${REVIEW_YEAR+1}-01-01`,
      ...(isEAForum ? {} : {after: `${REVIEW_YEAR}-01-01`}),
      limit: 300
    },
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
    fetchPolicy: 'network-only',
  });
  
  const { results: dbVotes, loading: dbVotesLoading } = useMulti({
    terms: {view: "reviewVotesFromUser", limit: 300, userId: currentUser?._id, year: REVIEW_YEAR+""},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteFragment",
    fetchPolicy: 'network-only',
  })

  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });

  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticChange: Int, $newQuadraticScore: Int, $comment: String, $year: String, $dummy: Boolean) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticChange: $quadraticChange, comment: $comment, newQuadraticScore: $newQuadraticScore, year: $year, dummy: $dummy) {
        ...reviewVoteFragment
      }
    }
    ${getFragment("reviewVoteFragment")}
  `, {
    update: (store, mutationResult) => {
      updateEachQueryResultOfType({
        func: handleUpdateMutation,
        document: mutationResult.data.submitReviewVote,
        store, typeName: "ReviewVote",
      });
    }
  });

  const [useQuadratic, setUseQuadratic] = useState(currentUser ? currentUser[userVotesAreQuadraticField] : false)
  const [loading, setLoading] = useState(false)
  const [expandedPost, setExpandedPost] = useState<PostsListWithVotes|null>(null)
  const [showKarmaVotes] = useState<any>(true)

  const votes = dbVotes?.map(({_id, qualitativeScore, postId}) => ({_id, postId, score: qualitativeScore, type: "qualitative"})) as qualitativeVote[]
  
  const handleSetUseQuadratic = (newUseQuadratic: boolean) => {
    if (!newUseQuadratic) {
      if (!confirm("WARNING: This will discard your quadratic vote data. Are you sure you want to return to basic voting?")) {
        return
      }
    }

    setUseQuadratic(newUseQuadratic)
    void updateUser({
      selector: {_id: currentUser?._id},
      data: {
        [userVotesAreQuadraticField]: newUseQuadratic,
      }
    });
  }

  const dispatchQualitativeVote = useCallback(async ({_id, postId, score}: {
    _id: string|null,
    postId: string,
    score: number
  }) => {
    return await submitVote({variables: {postId, qualitativeScore: score, year: REVIEW_YEAR+"", dummy: false}})
  }, [submitVote]);

  const quadraticVotes = dbVotes?.map(({_id, quadraticScore, postId}) => ({_id, postId, score: quadraticScore, type: "quadratic"})) as quadraticVote[]
  const dispatchQuadraticVote = async ({_id, postId, change, set}: {
    _id?: string|null,
    postId: string,
    change?: number,
    set?: number
  }) => {
    const existingVote = _id ? dbVotes.find(vote => vote._id === _id) : null;
    await submitVote({
      variables: {postId, quadraticChange: change, newQuadraticScore: set, year: REVIEW_YEAR+"", dummy: false},
      optimisticResponse: _id && {
        __typename: "Mutation",
        submitReviewVote: {
          __typename: "ReviewVote",
          ...existingVote,
          quadraticScore: (typeof set !== 'undefined') ? set : ((existingVote?.quadraticScore || 0) + (change || 0))
        }
      }
    })
  }

  const { LWTooltip, Loading, ReviewVotingExpandedPost, ReviewVoteTableRow } = Components

  const [postOrder, setPostOrder] = useState<Map<number, number> | undefined>(undefined)
  const reSortPosts = () => {
    setPostOrder(new Map(getPostOrder(posts, useQuadratic ? quadraticVotes : votes, currentUser)))
    captureEvent(undefined, {eventSubType: "postsResorted"})
  }

  // Re-sort in response to changes. (But we don't need to re-sort in response
  // to everything exhaustively)
  useEffect(() => {
    if (!!posts && useQuadratic ? !!quadraticVotes : !!votes) setPostOrder(new Map(getPostOrder(posts, useQuadratic ? quadraticVotes : votes, currentUser)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!posts, useQuadratic, !!quadraticVotes, !!votes])

  if (!currentUserCanVote(currentUser)) {
    return (
      <div className={classes.message}>
        {isEAForum ?
          `Only users regerested before ${moment.utc(annualReviewStart.get()).format('MMM Do')} can vote in the ${REVIEW_NAME_IN_SITU}` :
          `Only users registered before ${REVIEW_YEAR} can vote in the ${REVIEW_NAME_IN_SITU}`
        }
      </div>
    )
  }

  const voteTotal = useQuadratic ? computeTotalCost(quadraticVotes) : 0
  
  // TODO: Redundancy here due to merge
  const voteSum = useQuadratic ? computeTotalVote(quadraticVotes) : 0
  const voteAverage = posts?.length > 0 ? voteSum/posts?.length : 0

  const renormalizeVotes = (quadraticVotes:quadraticVote[], voteAverage: number) => {
    const voteAdjustment = -Math.trunc(voteAverage)
    quadraticVotes.forEach(vote => dispatchQuadraticVote({...vote, change: voteAdjustment, set: undefined }))
  }
  
  const instructions = isEAForum ?
    <div className={classes.instructions}>
      <p><b>Welcome to the {REVIEW_NAME_IN_SITU} dashboard.</b></p>

      <p>We begin with Preliminary Voting. Posts with at least one positive vote will appear in the public list to the right. You are encouraged to vote on as many posts as you have an opinion on.</p>
      
      <p>At the end of the Preliminary Voting phase, the EA Forum team will publish a ranked list of the results. This will help you decide how to spend attention during the Review phase. You may want to focus on high-ranking posts, or those which seem undervalued or controversial.</p>

      <p>During Preliminary Voting, you can sort posts into seven categories (roughly "super strong downvote" to "super strong upvote"). During the Final Voting phase, you'll have the opportunity to fine-tune those votes using our quadratic voting system; see <a href="https://lesswrong.com/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">this LessWrong post</a> for details.</p>

      <p><b>How exactly do the preliminary votes Work?</b></p>

      <p>If you intuitively sort posts into "good", "important", "crucial", etc., you'll probably do fine. But here are some details on how it works under the hood:</p>

      <p>Each of the voting buttons corresponds to a relative strength: 1x, 4x, or 9x. One of your "9" votes is 9x as powerful as one of your "1" votes. However, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", your "9" votes will end up weaker than those of someone who used them more sparingly. On the "backend", we use a quadratic voting system, giving you a fixed number of points and attempting to allocate them to match the relative strengths of your votes.</p>

      <p><b>Submitting reviews</b></p>

      <p>The Review phase involves writing reviews of posts, with the advantage of hindsight. They can be brief or very detailed. You can write multiple reviews if your thoughts evolve over the course of the event.</p>

      <p>If you have any trouble, please <Link to="/contact">contact the Forum team</Link>, or leave a comment on <Link to={annualReviewAnnouncementPostPathSetting.get()}>this post</Link>.</p>
    </div> :
    <div className={classes.instructions}>
      <p><b>Welcome to the {REVIEW_NAME_IN_SITU} dashboard.</b></p>

      <p>This year, instead of a nominations phase, we're beginning with Preliminary Voting. Posts with at least one positive vote will appear in the public list to the right. You are encouraged to vote on as many posts as you have an opinion on.</p>
      
      <p>At the end of the Preliminary Voting phase, the LessWrong team will publish a ranked list of the results. This will help inform how to spend attention during <em>the Review Phase</em>. High-ranking, undervalued or controversial posts can get additional focus.</p>

      <p>During Preliminary voting, you can sort posts into 7 buckets (roughly "super strong downvote" to "super strong upvote"). During the Final Voting Phase, you'll have the opportunity to fine-tune those votes using our <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">quadratic voting system.</Link></p>

      <p><b>How exactly do the Preliminary Votes Work?</b></p>

      <p>If you intuitively sort posts into "good", "important", "crucial", you'll probably do fine. But here are some details on how it works under-the-hood:</p>

      <p>Each of the voting-buttons corresponds to a relative strength: 1x, 4x, or 9x. One of your "9" votes is 9x as powerful as one of your "1" votes. But, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", your "9" votes will end up weaker than someone who used them more sparingly. On the "backend" the system uses our <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">quadratic voting system.</Link>, giving you a fixed number of points and attempting to allocate them to match the relative strengths of your vote-choices.</p>

      <p><b>Submitting Reviews</b></p>

      <p>Last year, nominating posts required writing a comment saying what was good about it. Since nomination is an "anonymous vote" this year, we're giving people the ability to write reviews right away. Feel free to write short reviews about what sticks out to you about a post, with a year of hindsight. You can write multiple reviews if your thoughts evolve over the course of the month.</p>
    </div>

  return (
    <AnalyticsContext pageContext="ReviewVotingPage">
    <div>
      {/* TODO(Review) link to list of nominated posts */}
      <div className={classNames(classes.hideOnDesktop, classes.message)}>
        Voting is not available on small screens. You can still vote on individual posts, however.
      </div>
      <div className={classes.grid}>
      <div className={classes.leftColumn}>
          {!expandedPost && <div>
            <h1 className={classes.header}>
              {/* 160 is nbsp */}
              {REVIEW_NAME_TITLE}{isEAForum ? String.fromCharCode(160) + '—' : ':'} Preliminary Voting
            </h1>
            {instructions}
          </div>}
          <ReviewVotingExpandedPost post={expandedPost}/>
        </div>
        <div className={classes.rightColumn}>
          <div className={classes.menu}>
            <Button disabled={!expandedPost} onClick={()=>{
              setExpandedPost(null)
              captureEvent(undefined, {eventSubType: "showInstructionsClicked"})
            }}>Show Instructions</Button>
            
            {/* Turned off for the Preliminary Voting phase */}
            {getReviewPhase() !== "NOMINATIONS" && <>
              {!useQuadratic && <LWTooltip title="WARNING: Once you switch to quadratic voting, you cannot go back to default voting without losing your quadratic data.">
                <Button className={classes.convert} onClick={async () => {
                    setLoading(true)
                    await Promise.all(votesToQuadraticVotes(votes, posts).map(dispatchQuadraticVote))
                    handleSetUseQuadratic(true)
                    captureEvent(undefined, {eventSubType: "quadraticVotingSet", quadraticVoting:true})
                    setLoading(false)
                }}>
                  Convert to Quadratic <KeyboardTabIcon className={classes.menuIcon} />
                </Button>
              </LWTooltip>}
              {useQuadratic && <LWTooltip title="Discard your quadratic data and return to default voting.">
                <Button className={classes.convert} onClick={async () => {
                    handleSetUseQuadratic(false)
                    captureEvent(undefined, {eventSubType: "quadraticVotingSet", quadraticVoting:false})
                }}>
                  <KeyboardTabIcon className={classes.returnToBasicIcon} />  Return to Basic Voting
                </Button>
              </LWTooltip>}
              {useQuadratic && <LWTooltip title={`You have ${500 - voteTotal} points remaining`}>
                  <div className={classNames(classes.voteTotal, {[classes.excessVotes]: voteTotal > 500})}>
                    {voteTotal}/500
                  </div>
              </LWTooltip>}
              {useQuadratic && Math.abs(voteAverage) > 1 && <LWTooltip title={<div>
                  <p><em>Click to renormalize your votes, closer to an optimal allocation</em></p>
                  <p>If the average of your votes is above 1 or below -1, you are always better off shifting all of your votes by 1 to move closer to an average of 0.</p></div>}>
                  <div className={classNames(classes.voteTotal, classes.excessVotes, classes.voteAverage)} onClick={() => renormalizeVotes(quadraticVotes, voteAverage)}>
                    Avg: {(voteSum / posts.length).toFixed(2)}
                  </div>
              </LWTooltip>}
            </>}
            <LWTooltip title="Sorts the list of posts by vote strength">
              <Button onClick={reSortPosts}>
                Re-Sort <CachedIcon className={classes.menuIcon} />
              </Button>
            </LWTooltip>
          </div>
          {(postsLoading || dbVotesLoading || loading) ?
            <Loading /> :
            <Paper>
              {!!posts && !!postOrder && applyOrdering(posts, postOrder).map((post) => {
                  const currentQualitativeVote = votes.find(vote => vote.postId === post._id)
                  const currentQuadraticVote = quadraticVotes.find(vote => vote.postId === post._id)
    
                  return <div key={post._id} onClick={()=>{
                    setExpandedPost(post)
                    captureEvent(undefined, {eventSubType: "voteTableRowClicked", postId: post._id})}}
                  >
                    <ReviewVoteTableRow
                      post={post}
                      showKarmaVotes={showKarmaVotes}
                      dispatch={dispatchQualitativeVote}
                      currentQualitativeVote={currentQualitativeVote||null}
                      currentQuadraticVote={currentQuadraticVote||null}
                      dispatchQuadraticVote={dispatchQuadraticVote}
                      useQuadratic={useQuadratic}
                      expandedPostId={expandedPost?._id}
                    />
                  </div>
                })}
            </Paper>
          }
        </div>
      </div>
    </div>
    </AnalyticsContext>
  );
}

function getPostOrder(posts: Array<PostsList>, votes: Array<qualitativeVote|quadraticVote>, currentUser: UsersCurrent|null): Array<[number,number]> {
  const randomPermutation = generatePermutation(posts.length, currentUser);
  const result = posts.map(
    (post: PostsList, i: number): [PostsList, qualitativeVote | quadraticVote | undefined, number, number, number] => {
      const voteForPost = votes.find(vote => vote.postId === post._id)
      const  voteScore = voteForPost ? voteForPost.score : 1;
      return [post, voteForPost, voteScore, i, randomPermutation[i]]
    })
    .sort(([post1, vote1, voteScore1, i1, permuted1], [post2, vote2, voteScore2, i2, permuted2]) => {
      if (voteScore1 < voteScore2) return -1;
      if (voteScore1 > voteScore2) return 1;
      if (permuted1 < permuted2) return -1;
      if (permuted1 > permuted2) return 1;
      else return 0;
    })
    .reverse()
    .map(([post,vote,voteScore,originalIndex,permuted], sortedIndex) => [sortedIndex, originalIndex])
  return result as Array<[number,number]>;
}

function applyOrdering<T extends any>(array:T[], order:Map<number, number>):T[] {
  const newArray = array.map((value, i) => {
    const newIndex = order.get(i)
    if (typeof newIndex !== 'number') throw Error(`Can't find value for key: ${i}`)
    return array[newIndex]
  })
  return newArray
}

const qualitativeScoreScaling = {
  1: -45, // 9
  2: -10, // 4
  3: -1, // 1
  4: 0,
  5: 1, // 1
  6: 10, // 4
  7: 45 // 9
}

const VOTE_BUDGET = 500
const MAX_SCALING = 6
const votesToQuadraticVotes = (votes:qualitativeVote[], posts: any[]):{postId: string, change?: number, set?: number, _id?: string, previousValue?: number}[] => {
  const sumScaled = sumBy(votes, vote => Math.abs(qualitativeScoreScaling[vote ? vote.score : 1]) || 0)
  return createPostVoteTuples(posts, votes).map(([post, vote]) => {
    if (vote) {
      const newScore = computeQuadraticVoteScore(vote.score, sumScaled)
      return {postId: post._id, set: newScore}
    } else {
      return {postId: post._id, set: 0}
    }
  })
}

const computeQuadraticVoteScore = (qualitativeScore: 0|1|2|3|4, totalCost: number) => {
  const scaledScore = qualitativeScoreScaling[qualitativeScore]
  const scaledCost = scaledScore * Math.min(VOTE_BUDGET/totalCost, MAX_SCALING)
  const newScore = Math.sign(scaledCost) * Math.floor(inverseSumOf1ToN(Math.abs(scaledCost)))
  return newScore
}

const inverseSumOf1ToN = (x:number) => {
  return Math.sign(x)*(1/2 * (Math.sqrt((8 * Math.abs(x)) + 1) - 1))
}

const sumOf1ToN = (x:number) => {
  const absX = Math.abs(x)
  return absX*(absX+1)/2
}

const computeTotalCost = (votes: ReviewVote[]) => {
  return sumBy(votes, ({score}) => sumOf1ToN(score))
}

const computeTotalVote = (votes: ReviewVote[]) => {
  return sumBy(votes, ({score}) => score)
}

function createPostVoteTuples<K extends HasIdType,T extends ReviewVote> (posts: K[], votes: T[]):[K, T | undefined][] {
  return posts.map(post => {
    const voteForPost = votes.find(vote => vote.postId === post._id)
    return [post, voteForPost]
  })
}

const ReviewVotingPageComponent = registerComponent('ReviewVotingPage', ReviewVotingPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPage: typeof ReviewVotingPageComponent
  }
}
