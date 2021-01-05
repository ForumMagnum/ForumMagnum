import React, { useState, useEffect } from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import sumBy from 'lodash/sumBy'
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { updateEachQueryResultOfType, handleUpdateMutation } from '../../lib/crud/cacheUpdates';
import { useMulti } from '../../lib/crud/withMulti';
import { useMutation } from '@apollo/client';
import { Paper } from '@material-ui/core';
import { useCurrentUser } from '../common/withUser';
import classNames from 'classnames';
import * as _ from "underscore"
import gql from 'graphql-tag';
import { commentBodyStyles } from '../../themes/stylePiping';
import CachedIcon from '@material-ui/icons/Cached';
import KeyboardTabIcon from '@material-ui/icons/KeyboardTab';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents'
import seedrandom from '../../lib/seedrandom';

const YEAR = "2019"
const NOMINATIONS_VIEW = "nominations2019"
const REVIEWS_VIEW = "reviews2019" // unfortunately this can't just inhereit from YEAR. It needs to exactly match a view-type so that the type-check of the view can pass.

const styles = (theme: ThemeType): JssStyles => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: `
      minmax(10px, 0.5fr) minmax(300px, 740px) minmax(30px, 0.5fr) minmax(100px, 600px) minmax(30px, 0.5fr)
    `,
    gridTemplateAreas: `
    "... leftColumn ... rightColumn ..."
    `,
    paddingBottom: 175
  },
  instructions: {
    ...theme.typography.body2,
    ...commentBodyStyles(theme),
    maxWidth: 545,
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
    height: "calc(100vh - 80px)",
    maxWidth: 600,
    overflowY: "scroll",
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
    position: "sticky",
    top: 0
  },
  header: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
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
    color: theme.palette.error.main
  },
  message: {
    width: "100%",
    textAlign: "center",
    paddingTop: 50,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  hideOnMobile: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    }
  },
  writeAReview: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingBottom: 8,
    border: "solid 1px rgba(0,0,0,.3)",
    marginBottom: 8,
  },
  reviewPrompt: {
    fontWeight: 600,
    fontSize: "1.2rem",
    color: "rgba(0,0,0,.87)",
    width: "100%",
    display: "block"
  },
  fakeTextfield: {
    marginTop: 5,
    width: "100%",
    borderBottom: "dashed 1px rgba(0,0,0,.25)",
    color: theme.palette.grey[400]
  },
  warning: {
    color: theme.palette.error.main
  }
});

type vote = {_id: string, postId: string, score: number, type?: string}
type quadraticVote = vote & {type: "quadratic"}
type qualitativeVote = vote & {type: "qualitative", score: 0|1|2|3|4}


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
    terms: {view: REVIEWS_VIEW, limit: 200},
    collectionName: "Posts",
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
  });
  
  const { results: dbVotes, loading: dbVotesLoading } = useMulti({
    terms: {view: "reviewVotesFromUser", limit: 200, userId: currentUser?._id},
    collectionName: "ReviewVotes",
    fragmentName: "reviewVoteFragment",
    fetchPolicy: 'cache-and-network',
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

  const [useQuadratic, setUseQuadratic] = useState(currentUser ? currentUser.reviewVotesQuadratic : false)
  const [loading, setLoading] = useState(false)
  const [expandedPost, setExpandedPost] = useState<any>(null)

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
        reviewVotesQuadratic: newUseQuadratic,
      }
    });
  }

  const dispatchQualitativeVote = async ({postId, score}: {postId: string, score: number}) => await submitVote({variables: {postId, qualitativeScore: score, year: YEAR, dummy: true}})

  const quadraticVotes = dbVotes?.map(({_id, quadraticScore, postId}) => ({_id, postId, score: quadraticScore, type: "quadratic"})) as quadraticVote[]
  const dispatchQuadraticVote = async ({_id, postId, change, set}) => {
    const existingVote = _id && dbVotes.find(vote => vote._id === _id)
    await submitVote({
      variables: {postId, quadraticChange: change, newQuadraticScore: set, year: YEAR, dummy: true},
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

  const { PostReviewsAndNominations, LWTooltip, Loading, ReviewPostButton } = Components

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

  if (!currentUser || currentUser.createdAt > new Date(`${YEAR}-01-01`)) {
    return (
      <div className={classes.message}>
        Only users registered before {YEAR} can vote in the {YEAR} LessWrong Review
      </div>
    )
  }

  const voteTotal = useQuadratic ? computeTotalCost(quadraticVotes) : 0

  return (
    <AnalyticsContext pageContext="ReviewVotingPage">
    <div>
      <div className={classNames(classes.hideOnMobile, classes.message)}>
        Voting is not available on small screens
      </div>
      <div className={classes.grid}>
        <div className={classes.leftColumn}>
          <div className={classes.menu}>
            <LWTooltip title="Sorts the list of post by vote-strength">
              <Button onClick={reSortPosts}>
                Re-Sort <CachedIcon className={classes.menuIcon} />
              </Button>
            </LWTooltip>
            {(postsLoading || dbVotesLoading || loading) && <Loading/>}
            {!useQuadratic && <LWTooltip title="WARNING: Once you switch to quadratic-voting, you cannot go back to default-voting without losing your quadratic data.">
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
            <Button disabled={!expandedPost} onClick={()=>{
              setExpandedPost(null)
              captureEvent(undefined, {eventSubType: "showInstructionsClicked"})
            }}>Show Instructions</Button>
          </div>
          <Paper>
            {!!posts && !!postOrder && applyOrdering(posts, postOrder).map((post) => {
                return <div key={post._id} onClick={()=>{
                  setExpandedPost(post)
                  captureEvent(undefined, {eventSubType: "voteTableRowClicked", postId: post._id})}}
                >
                  <VoteTableRow
                    post={post}
                    dispatch={dispatchQualitativeVote}
                    votes={votes}
                    quadraticVotes={quadraticVotes}
                    dispatchQuadraticVote={dispatchQuadraticVote}
                    useQuadratic={useQuadratic}
                    expandedPostId={expandedPost?._id}
                  />
                </div>
              })}
          </Paper>
        </div>
        <div className={classes.rightColumn}>
          {!expandedPost && <div className={classes.expandedInfoWrapper}>
            <div className={classes.expandedInfo}>
              <h1 className={classes.header}>Try out the vote on nominated and reviewed posts from {YEAR}</h1>
              <div className={classes.instructions}>
                <p className={classes.warning}>For now this is just a dummy page that you can use to understand how the vote works. All submissions will be discarded, and the list of posts replaced by posts in the {YEAR} Review on January 12th.</p>
                <p> Your vote should reflect a post’s overall level of importance (with whatever weightings seem right to you for “usefulness”, “accuracy”, “following good norms”, and other virtues).</p>
                <p>Voting is done in two passes. First, roughly sort each post into one of the following buckets:</p>
                <ul>
                  <li><b>No</b> – Misleading, harmful or low quality.</li>
                  <li><b>Neutral</b> – You wouldn't personally recommend it, but seems fine if others do. <em>(If you don’t have strong opinions about a post, leaving it ‘neutral’ is fine)</em></li>
                  <li><b>Good</b> – Useful ideas that I still think about sometimes.</li>
                  <li><b>Important</b> – A key insight or excellent distillation.</li>
                  <li><b>Crucial</b> – One of the most significant posts of {YEAR}, for LessWrong to discuss and build upon over the coming years.</li>
                </ul>
                <p>After that, click “Convert to Quadratic”, and you will then have the option to use the quadratic voting system to fine-tune your votes. (Quadratic voting gives you a limited number of “points” to spend on votes, allowing you to vote multiple times, with each additional vote on an item costing more. See <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">this post</Link> for details.)</p>
                <p>If you’re having difficulties, please message the LessWrong Team using Intercom, the circle at the bottom right corner of the screen, or leave a comment on <Link to="/posts/zLhSjwXHnTg9QBzqH/the-final-vote-for-lw-2018-review">this post</Link>.</p>
                {/* <p>The vote closes on Jan 19th. If you leave this page and come back, your votes will be saved.</p> */}
              </div>
            </div>
          </div>}
          {expandedPost && <div className={classes.expandedInfoWrapper}>
            <div className={classes.expandedInfo}>
                <ReviewPostButton post={expandedPost} year={YEAR} reviewMessage={<div>
                  <div className={classes.writeAReview}>
                    <div className={classes.reviewPrompt}>Write a review for "{expandedPost.title}"</div>
                    <div className={classes.fakeTextfield}>Any thoughts about this post you want to share with other voters?</div>
                  </div>
                </div>}/>

              <div className={classes.comments}>
                <PostReviewsAndNominations
                  title="nomination"
                  singleLine
                  terms={{view: NOMINATIONS_VIEW, postId: expandedPost._id}}
                  post={expandedPost}
                />
                <PostReviewsAndNominations
                  title="review"
                  terms={{view: REVIEWS_VIEW, postId: expandedPost._id}}
                  post={expandedPost}
                />
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
    </AnalyticsContext>
  );
}

function getPostOrder(posts: Array<PostsList>, votes: Array<qualitativeVote|quadraticVote>, currentUser: UsersCurrent|null): Array<[number,number]> {
  const randomPermutation = generatePermutation(posts.length, currentUser);
  const result = posts.map(
    (post: PostsList, i: number) => {
      const voteForPost = votes.find(vote => vote.postId === post._id)
      const  voteScore = voteForPost ? voteForPost.score : 1;
      return [post, voteForPost, voteScore, i, randomPermutation[i]]
    })
    .sort(([post1, vote1, voteScore1, i1, permuted1], [post2, vote2, voteScore2, i2, permuted2]) => {
      const sortCriteria1 = [voteScore1, permuted1];
      const sortCriteria2 = [voteScore2, permuted2];
      if (sortCriteria1<sortCriteria2) return -1;
      else if (sortCriteria1>sortCriteria2) return 1;
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
  0: -4,
  1: 0,
  2: 1,
  3: 4,
  4: 15
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
  return x*(x+1)/2
}

const computeTotalCost = (votes: vote[]) => {
  return sumBy(votes, ({score}) => sumOf1ToN(score))
}

function createPostVoteTuples<K extends HasIdType,T extends vote> (posts: K[], votes: T[]):[K, T | undefined][] {
  return posts.map(post => {
    const voteForPost = votes.find(vote => vote.postId === post._id)
    return [post, voteForPost]
  })
}

const voteRowStyles = createStyles((theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit*1.5,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "solid 1px rgba(0,0,0,.15)",
    position: "relative",
    '&:hover': {
      '& $expand': {
        display: "block"
      }
    }
  },
  voteIcon: {
      padding: 0
  },
  postVote: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  post: {
    paddingRight: theme.spacing.unit*2,
    maxWidth: "calc(100% - 100px)"
  },
  expand: {
    display:"none",
    position: "absolute",
    bottom: 2,
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[400],
    paddingBottom: 35
  },
  expanded: {
    background: "#eee"
  }
}));

const VoteTableRow = withStyles(voteRowStyles, {name: "VoteTableRow"})((
  {post, dispatch, dispatchQuadraticVote, quadraticVotes, useQuadratic, classes, expandedPostId, votes }:
  {post: PostsList, dispatch: React.Dispatch<vote>, quadraticVotes: vote[], dispatchQuadraticVote: any, useQuadratic: boolean, classes:ClassesType, expandedPostId: string, votes: vote[] }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip, MetaInfo } = Components

  const currentUser = useCurrentUser()
  if (!currentUser) return null;

  return <AnalyticsContext pageElementContext="voteTableRow">
    <div className={classNames(classes.root, {[classes.expanded]: expandedPostId === post._id})}>
      <div>
        <div className={classes.postVote} >
          <div className={classes.post}>
            <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
              <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap curatedIconLeft={false} />
            </LWTooltip>
          </div>
          {post.userId !== currentUser._id && <div>
              {useQuadratic ?
                <QuadraticVotingButtons postId={post._id} votes={quadraticVotes} vote={dispatchQuadraticVote} /> :
                <VotingButtons postId={post._id} dispatch={dispatch} votes={votes} />
              }
          </div>}
          {post.userId === currentUser._id && <MetaInfo>You cannot vote on your own posts</MetaInfo>}
        </div>
      </div>
    </div>
  </AnalyticsContext>
})

const votingButtonStyles = (theme: ThemeType) => ({
  button: {
    padding: theme.spacing.unit,
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    cursor: "pointer"
  },
  selectionHighlight: {
    backgroundColor: "rgba(0,0,0,.5)",
    color: "white",
    borderRadius: 3
  },
  defaultHighlight: {
    backgroundColor: "rgba(0,0,0,.075)",
    borderRadius: 3
  },
})

const indexToTermsLookup = {
  0: "No",
  1: "Neutral",
  2: "Good",
  3: "Important",
  4: "Crucial"
}

const VotingButtons = withStyles(votingButtonStyles, {name: "VotingButtons"})(({classes, postId, dispatch, votes}: {classes: ClassesType, postId: string, dispatch: any, votes: vote[]}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const score = voteForCurrentPost?.score
  const [selection, setSelection] = useState(voteForCurrentPost ? score : 1)
  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      dispatch({postId, score: index})
    }
  }

  return <div>
      {[0,1,2,3,4].map((i) => {
        return <span className={classNames(classes.button, {[classes.selectionHighlight]:selection === i && score, [classes.defaultHighlight]: selection === i && !score})} onClick={createClickHandler(i)} key={`${indexToTermsLookup[i]}-${i}`} >{indexToTermsLookup[i]}</span>
      })}
  </div>
})

const quadraticVotingButtonStyles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  vote: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    paddingLeft: 10,
    paddingRight: 10,
    cursor: "pointer"
  },
  score: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle
  }
})

const QuadraticVotingButtons = withStyles(quadraticVotingButtonStyles, {name: "QuadraticVotingButtons"})(({classes, postId, vote, votes }: {classes: ClassesType, postId: string, vote: any, votes: vote[]}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const createClickHandler = (postId: string, type: 'buy' | 'sell', voteId: string | undefined, score: number | undefined) => {
      return () => {
        vote({postId, change: (type === 'buy' ? 1 : -1), _id: voteId, previousValue: score})
      }
  }
  return <div className={classes.root}>
    <span className={classes.vote} onClick={createClickHandler(postId, 'sell', voteForCurrentPost?._id, voteForCurrentPost?.score)}>–</span>
    <span className={classes.score}>{voteForCurrentPost?.score || 0}</span>
    <span className={classes.vote} onClick={createClickHandler(postId, 'buy', voteForCurrentPost?._id, voteForCurrentPost?.score)}>+</span>
  </div>
})

const ReviewVotingPageComponent = registerComponent('ReviewVotingPage', ReviewVotingPage, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPage: typeof ReviewVotingPageComponent
  }
}
