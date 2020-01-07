import React, { useState, useEffect, useCallback } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { sumBy } from 'lodash'
import { registerComponent, Components, useMulti, getFragment, updateEachQueryResultOfType, handleUpdateMutation } from 'meteor/vulcan:core';
import { useMutation } from 'react-apollo';
import { Paper } from '@material-ui/core';
import { Posts } from '../../lib/collections/posts';
import { useCurrentUser } from '../common/withUser';
import { ReviewVotes } from '../../lib/collections/reviewVotes/collection';
import classNames from 'classnames';
import * as _ from "underscore"
import gql from 'graphql-tag';
import { commentBodyStyles } from '../../themes/stylePiping';
import CachedIcon from '@material-ui/icons/Cached';
import KeyboardTabIcon from '@material-ui/icons/KeyboardTab';

const styles = theme => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `
      1fr minmax(300px, 740px) minmax(50px, 0.5fr) minmax(100px, 600px) 1fr
    `,
    gridTemplateAreas: `
    "... title  ... ....... ..."
    "... voting ... results ..."
    `,
    paddingBottom: 175
  },
  instructions: {
    ...theme.typography.body2,
    ...commentBodyStyles(theme),
    maxWidth: 545
  },
  leftColumn: {
    gridArea: "voting"
  },
  rightColumn: {
    gridArea: "results"
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
  expandedInfoWrapper: {
    position: "sticky",
    top: 0,
    paddingTop: 100,
  },
  expandedInfo: {
    height: "80vh",
    maxWidth: 600,
    overflowY: "scroll",
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
  reason: {
    marginBottom: theme.spacing.unit*1.5,
    position: "relative",
    border: "solid 1px rgba(0,0,0,.3)",
    padding: theme.spacing.unit*2
  },
  reasonTitle: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    marginBottom: theme.spacing.unit
  },
  voteTotal: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  excessVotes: {
    color: theme.palette.error
  }
});

type vote = {postId: string, score: number, type?: string}
type quadraticVote = vote & {type: "quadratic"}
type linearVote = vote & {type: "qualitative", score: 0|1|2|3|4}



const ReviewVotingPage = ({classes}) => {
  const { results: posts, loading: postsLoading } = useMulti({
    terms: {view:"reviews2018", limit: 100},
    collection: Posts,
    queryName: 'postsListQuery',
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { results: dbVotes, loading: dbVotesLoading } = useMulti({
    terms: {view: "reviewVotesFromUser", limit: 100},
    collection: ReviewVotes,
    queryName: "reviewVoteQuery",
    fragmentName: "reviewVoteFragment",
    fetchPolicy: 'cache-and-network',
    ssr: true
  })

  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quadraticScore: Int, $comment: String) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quadraticScore: $quadraticScore, comment: $comment) {
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

  const [useQuadratic, setUseQuadratic] = useState(false)
  const [expandedPost, setExpandedPost] = useState<any>(null)

  const votes = dbVotes?.map(({qualitativeScore, postId}) => ({postId, score: qualitativeScore, type: "qualitative"})) as linearVote[]
  const dispatchQualitativeVote = async ({postId, score}) => await submitVote({variables: {postId, qualitativeScore: score}})

  const quadraticVotes = dbVotes?.map(({quadraticScore, postId}) => ({postId, score: quadraticScore, type: "quadratic"})) as quadraticVote[]
  const dispatchQuadraticVote = async ({postId, score}) => await submitVote({variables: {postId, quadraticScore: score}})

  const { PostReviewsAndNominations, LWTooltip, Loading } = Components

  const [postOrder, setPostOrder] = useState<Map<number, number> | undefined>(undefined)
  const reSortPosts = () => setPostOrder(new Map(getPostOrder(posts, useQuadratic ? quadraticVotes : votes))) 

  useEffect(() => {
    if (!!posts) setPostOrder(new Map(getPostOrder(posts, useQuadratic ? quadraticVotes : votes)))
  }, [!!posts, useQuadratic])

  const currentUser = useCurrentUser()
  if (!currentUser || !currentUser.isAdmin) return null

  const voteTotal = useQuadratic ? computeTotalCost(quadraticVotes) : 0

  return (
      <div className={classes.root}>
        <div className={classes.leftColumn}>
          <div className={classes.menu}>
            {(postsLoading || dbVotesLoading) && <Loading/>}
            <LWTooltip title="Sorts the list of post by vote-strength">
              <Button onClick={reSortPosts}>
                Re-Sort <CachedIcon className={classes.menuIcon} />
              </Button>
            </LWTooltip>
            {!useQuadratic && <LWTooltip title="WARNING: Once you switch to quadratic-voting, you cannot go back to default-voting without losing your quadratic data.">
              <Button className={classes.convert} onClick={async () => {
                  await Promise.all(votesToQuadraticVotes(votes, posts).map(dispatchQuadraticVote))
                  setUseQuadratic(true)
              }}> 
                Convert to Quadratic <KeyboardTabIcon className={classes.menuIcon} /> 
              </Button>
            </LWTooltip>}
            {useQuadratic && <div className={classNames(classes.voteTotal, {[classes.excessVotes]: voteTotal > 500})}>
              {voteTotal}/500
            </div>}
            <Button disabled={!expandedPost} onClick={()=>setExpandedPost(null)}>Show Instructions</Button>
          </div>
          <Paper>
            {!!posts && !!postOrder && applyOrdering(posts, postOrder).map((post) => {
                return <div key={post._id} onClick={()=>setExpandedPost(post)}>
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
            <h1 className={classes.header}>Rate the most important posts of 2018</h1>
            <div className={classes.instructions}>
              <p>Your vote should reflect each post’s overall level of importance (with whatever weightings seem right to you for “usefulness”, “accuracy”, and “following good norms”).</p>
              <p>The default voting method is to rate each post with the following five options:</p>
              <ul>
                <li><b>No</b> – Misleading, harmful or low quality.</li>
                <li><b>Neutral</b> – You wouldn't personally recommend it, but seems fine if others do. <em>(If you don’t have strong opinions about a post, leaving it ‘neutral’ is fine)</em></li>
                <li><b>Good</b> – Useful ideas that I still think about sometimes.</li>
                <li><b>Important</b> – A key insight or excellent distillation.</li>
                <li><b>Crucial</b> – One of the most significant posts of 2018.</li>
              </ul>
              <p>Alternatively, you can directly use the quadratic voting system to fine-tune your votes. (Quadratic voting gives you a limited number of “points” to spend on votes, allowing you to vote multiple times, with each additional vote on an item costing more. See here for details)</p>
              <p>You can either skip directly to the underlying quadratic voting system, or use the No / Neutral / Good / Important / Crucial buttons to roughly assign some initial points.</p>
            </div>
          </div>}
          {expandedPost && <div className={classes.expandedInfoWrapper}>
            <div className={classes.expandedInfo}>
              <h2 className={classes.postHeader}>{expandedPost.title}</h2>
              <div className={classes.reason}>
                <div className={classes.reasonTitle}>Anonymous Comments (optional)</div>
                <CommentTextField 
                  startValue={getVoteForPost(dbVotes, expandedPost._id)?.comment}  
                  updateValue={(value) => submitVote({variables: {comment: value, postId: expandedPost._id}})}
                  postId={expandedPost._id}
                />
              </div>
              <div className={classes.comments}>
                <PostReviewsAndNominations 
                  title="Nominations"
                  terms={{view:"nominations2018", postId: expandedPost._id}} 
                  post={expandedPost} 
                />
                <PostReviewsAndNominations 
                  title="Reviews"
                  terms={{view:"reviews2018", postId: expandedPost._id}} 
                  post={expandedPost} 
                />
              </div>
            </div>
          </div>}
        </div>
      </div>
  );
}

function getVoteForPost(votes, postId) {
  return votes.find(vote => vote.postId === postId)
}

function CommentTextField({startValue, updateValue, postId}) {
  const [text, setText] = useState(startValue)
  useEffect(() => {
    setText(startValue)
  }, [postId])
  const debouncedUpdateValue = useCallback(_.debounce((value) => {
    updateValue(value)
  }, 500), [postId])
  return <TextField
    id="standard-multiline-static"
    placeholder="Write any special considerations that affected your vote. These will appear anonymously in a 2018 Review roundup. The moderation team will take them as input for the final decisions of what posts to include in the book."
    defaultValue={startValue}
    onChange={(event) => {
      setText(event.target.value)
      debouncedUpdateValue(event.target.value)
    }}
    value={text || ""}
    fullWidth
    multiline
    rows="4"
  />
}
function getPostOrder(posts, votes) {
  return posts.map((post, i) => {
    const voteForPost = votes.find(vote => vote.postId === post._id)
    return [post, voteForPost, i]
  })
  .sort(([post1, vote1], [post2, vote2]) => (vote1 ? vote1.score : 1) - (vote2 ? vote2.score : 1))
  .reverse()
  .map(([post,vote,originalIndex], sortedIndex) => [sortedIndex, originalIndex])
}

function applyOrdering<T extends any>(array:T[], order:Map<number, number>):T[] {
  const newArray = array.map((value, i) => {
    const newIndex = order.get(i)
    if (typeof newIndex !== 'number') throw Error(`Can't find value for key: ${i}`)
    return array[newIndex]
  })
  return newArray
}

const linearScoreScaling = {
  0: -4, 
  1: 0,
  2: 1,
  3: 4,
  4: 15
}

const VOTE_BUDGET = 500
const MAX_SCALING = 6
const votesToQuadraticVotes = (votes:linearVote[], posts: any[]):quadraticVote[] => {
  const sumScaled = sumBy(votes, vote => Math.abs(linearScoreScaling[vote ? vote.score : 1]) || 0)
  return createPostVoteTuples(posts, votes).map(([post, vote]) => {
    if (vote) {
      const newScore = computeQuadraticVoteScore(vote.score, sumScaled)
      return {postId: post._id, score: newScore, type: "quadratic"}
    } else {
      return {postId: post._id, score: 0, type: "quadratic"}
    }
  })
}

const computeQuadraticVoteScore = (linearScore: 0|1|2|3|4, totalCost: number) => {
  const scaledScore = linearScoreScaling[linearScore]
  const scaledCost = scaledScore * Math.min(VOTE_BUDGET/totalCost, MAX_SCALING)
  const newScore = Math.sign(scaledCost) * Math.floor(inverseSumOf1ToN(Math.abs(scaledCost)))
  return newScore
}

const inverseSumOf1ToN = (x:number) => {
  return Math.sign(x)*(1/2 * (Math.sqrt(8 * Math.abs(x) + 1) - 1))
}

const sumOf1ToN = (x:number) => {
  return x*(x+1)/2
}

const computeTotalCost = (votes: vote[]) => {
  return sumBy(votes, ({score}) => sumOf1ToN(score))
}

function createPostVoteTuples<K extends any,T extends vote> (posts: K[], votes: T[]):[K, T | undefined][] {
  return posts.map(post => {
    const voteForPost = votes.find(vote => vote.postId === post._id)
    return [post, voteForPost]
  })
}

const voteRowStyles = theme => ({
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
    color: theme.palette.grey[400]
  },
  expanded: {
    background: "#eee"
  }
})

const VoteTableRow = withStyles(voteRowStyles, {name: "VoteTableRow"})((
  {post, dispatch, dispatchQuadraticVote, quadraticVotes, useQuadratic, classes, expandedPostId, votes }:
  {post: any, dispatch: React.Dispatch<vote>, quadraticVotes: vote[], dispatchQuadraticVote: any, useQuadratic: boolean, classes:any, expandedPostId: string, votes: vote[] }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip } = Components

  return <div className={classNames(classes.root, {[classes.expanded]: expandedPostId === post._id})}>
    <div>
      <div className={classes.postVote} >
        <div className={classes.post}>
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
            <PostsTitle post={post} showIcons={false} showLinkTag={false} wrap />
          </LWTooltip>
        </div>
        <div>
            {useQuadratic ? 
              <QuadraticVotingButtons postId={post._id} votes={quadraticVotes} vote={dispatchQuadraticVote} /> :
              <VotingButtons postId={post._id} dispatch={dispatch} votes={votes} />
            }
        </div>
      </div>
    </div>
  </div>
})

const votingButtonStyles = theme => ({
  button: {
    padding: theme.spacing.unit,
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    cursor: "pointer"
  },
  highlighted: {
    backgroundColor: "rgba(0,0,0,.075)",
    borderRadius: 3
  }
})

const indexToTermsLookup = {
  0: "No",
  1: "Neutral",
  2: "Good",
  3: "Important",
  4: "Crucial"
}

const VotingButtons = withStyles(votingButtonStyles, {name: "VotingButtons"})(({classes, postId, dispatch, votes}: {classes: any, postId: string, dispatch: any, votes: vote[]}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const [selection, setSelection] = useState(voteForCurrentPost ? voteForCurrentPost.score : 1)
  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      dispatch({postId, score: index})
    }
  }
  return <div>
      {[0,1,2,3,4].map((i) => {
        return <span className={classNames(classes.button, {[classes.highlighted]:selection === i})} onClick={createClickHandler(i)} key={`${indexToTermsLookup[i]}-${i}`} >{indexToTermsLookup[i]}</span>
      })}
  </div>
})

const quadraticVotingButtonStyles = theme => ({
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

const QuadraticVotingButtons = withStyles(quadraticVotingButtonStyles, {name: "QuadraticVotingButtons"})(({classes, postId, vote, votes }: {classes: any, postId: string, vote: any, votes: vote[]}) => {
  const voteForCurrentPost = votes.find(vote => vote.postId === postId)
  const createClickHandler = (postId: string, type: 'buy' | 'sell') => {
      return () => {
        const newScore = (voteForCurrentPost?.score || 0) + (type === 'buy' ? 1 : -1)
        vote({postId, score: newScore})
      }
  } 
  return <div className={classes.root}>
    <span className={classes.vote} onClick={createClickHandler(postId, 'sell')}>–</span>
    <span className={classes.score}>{voteForCurrentPost?.score || 0}</span>
    <span className={classes.vote} onClick={createClickHandler(postId, 'buy')}>+</span>
  </div>
})

registerComponent('ReviewVotingPage', ReviewVotingPage,withStyles(styles, {name: "ReviewVotingPage"}));