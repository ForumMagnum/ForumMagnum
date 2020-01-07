import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { sumBy } from 'lodash'
import { registerComponent, Components, useMulti, useCreate } from 'meteor/vulcan:core';
import { Paper } from '@material-ui/core';
import { Posts } from '../../lib/collections/posts';
import { useCurrentUser } from '../common/withUser';
import { ReviewVotes } from '../../lib/collections/reviewVotes/collection';
import classNames from 'classnames';
import * as _ from "underscore"
import { commentBodyStyles } from '../../themes/stylePiping';
import CachedIcon from '@material-ui/icons/Cached';
import KeyboardTabIcon from '@material-ui/icons/KeyboardTab';

const styles = theme => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `
      1fr minmax(${300}px, ${740}px) 1fr minmax(${100}px, ${600}px) 1fr
    `,
    gridTemplateAreas: `
    "... title ... ... ..."
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
    gridArea: "title",
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
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
  }
});

type vote = {postId: string, score: number, type?: string}



const ReviewVotingPage = ({classes}) => {
  const { results } = useMulti({
    terms: {view:"reviews2018", limit: 100},
    collection: Posts,
    queryName: 'postsListQuery',
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { results: dbVotes } = useMulti({
    terms: {view: "reviewVotesFromUser", limit: 100},
    collection: ReviewVotes,
    queryName: "reviewVoteQuery",
    fragmentName: "reviewVoteFragment",
    fetchPolicy: 'cache-and-network',
    ssr: true
  })

  const { create: createVote } = useCreate({
    collection: ReviewVotes,
    fragmentName: "reviewVoteFragment", 
  })

  const [useQuadratic, setUseQuadratic] = useState(false)
  const [expandedPost, setExpandedPost] = useState<any>(null)

  const votes:vote[] = filterForMostRecent(dbVotes?.filter(vote => vote.type === "qualitative") || [])
  const dispatchVote = ({postId, score}) => createVote({postId, score, type: "qualitative"})

  const quadraticVotes:vote[] = filterForMostRecent(dbVotes?.filter(vote => vote.type === "quadratic") || [])
  const dispatchQuadraticVote = ({postId, score}) => createVote({postId, score, type: "quadratic"})

  const { PostReviewsAndNominations, LWTooltip } = Components

  const getPostOrder = () => {
    if (!results) return []
    return results.map((post, i) => {
      const voteForPost = useQuadratic ? 
          quadraticVotes.find(vote => vote.postId === post._id) : 
          votes.find(vote => vote.postId === post._id)
          
      return [post, voteForPost, i]
    })
    .sort(([post1, vote1], [post2, vote2]) => (vote1 ? vote1.score : 1) - (vote2 ? vote2.score : 1))
    .reverse()
    .map(([post,vote,originalIndex], sortedIndex) => [originalIndex, sortedIndex])
  }

  const [postOrder, setPostOrder] = useState<any>(new Map(getPostOrder()))

  const reSortPosts = () => setPostOrder(new Map(getPostOrder()))

  const currentUser = useCurrentUser()
  if (!currentUser || !currentUser.isAdmin) return null

  return (
      <div className={classes.root}>
        <div className={classes.leftColumn}>
          <div className={classes.menu}>
            <LWTooltip title="Sorts the list of post by vote-strength">
              <Button onClick={reSortPosts}>
                Re-Sort <CachedIcon className={classes.menuIcon} />
              </Button>
            </LWTooltip>
            <LWTooltip title="WARNING: Once you switch to quadratic-voting, you cannot go back to default-voting without losing your quadratic data.">
              <Button className={classes.convert} onClick={() => {
                  votesToQuadraticVotes(votes).forEach(dispatchQuadraticVote)
                  setUseQuadratic(true)
              }}> 
                Convert to Quadratic <KeyboardTabIcon className={classes.menuIcon} /> 
              </Button>
            </LWTooltip>
            <Button disabled={!expandedPost} onClick={()=>setExpandedPost(null)}>Show Instructions</Button>
          </div>
          <Paper>
            {results && applyOrdering(results, postOrder).map((post) => {
                return <div key={post._id} onClick={()=>setExpandedPost(post)}>
                  <VoteTableRow 
                    post={post} 
                    dispatch={dispatchVote} 
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
              <div className={classes.reason}>
                <div className={classes.reasonTitle}>Anonymous thoughts on "{expandedPost.title}"</div>
                <TextField
                  id="standard-multiline-static"
                  placeholder="(Optional) Write here any special considerations that affected your vote. These will appear anonymously in a 2018 Review roundup. The moderation team will take them as input for the final decisions of what posts to include in the book."
                  fullWidth
                  multiline
                  disableUnderline
                  rows="4"
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
          {useQuadratic && computeTotalCost(quadraticVotes)}
            {/* {votes.filter(vote => vote.score !== 1).sort((a,b) => a.score - b.score).reverse().map(({postId}) => {
              return <div className={classes.result} key={postId}>
                  {results.find(post => post._id === postId)?.title || "Couldn't find title"}
              </div>
            })} */}
        </div>
      </div>
  );
}

function applyOrdering<T extends any>(array:T[], order:Map<number, number>):T[] {
  return array.map((value, i) => {
    console.log(array[order.get(i)])
    return array[order[i]]
  })
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
const votesToQuadraticVotes = (votes:vote[]):vote[] => {
  const sumScaled = sumBy(votes, vote => Math.abs(linearScoreScaling[vote.score]))
  return votes.map(({postId, score}) => {
      const scaledScore = linearScoreScaling[score]
      const scaledCost = scaledScore * Math.min(VOTE_BUDGET/sumScaled, MAX_SCALING)
      const newScore = Math.sign(scaledCost) * Math.floor(inverseSumOf1ToN(Math.abs(scaledCost)))
      return {postId, score: newScore, type: "quadratic"}
  })
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

const filterForMostRecent = (votes: vote[]):vote[] => {
  const groupedVotes = _.groupBy(votes, vote => vote.postId)
  const filteredVotes = Object.keys(groupedVotes).map(key => _.max(groupedVotes[key], vote => new Date(vote.createdAt).getTime()))
  return filteredVotes
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
  vote: {
    ...theme.typography.commentStyle,
    fontSize: "1.5rem",
    fontWeight: 600,
    verticalAlign: "middle",
    padding: 10,
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
  return <div>
    <span className={classes.vote} onClick={createClickHandler(postId, 'sell')}>–</span>
    <span className={classes.score}>{voteForCurrentPost?.score || 0}</span>
    <span className={classes.vote} onClick={createClickHandler(postId, 'buy')}>+</span>
  </div>
})

registerComponent('ReviewVotingPage', ReviewVotingPage,withStyles(styles, {name: "ReviewVotingPage"}));