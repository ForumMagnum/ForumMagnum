import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { sumBy } from 'lodash'
import { registerComponent, Components, useMulti, useCreate, useUpdate, getFragment, updateEachQueryResultOfType, handleUpdateMutation } from 'meteor/vulcan:core';
import { useMutation } from 'react-apollo';
import { Paper } from '@material-ui/core';
import { Posts } from '../../lib/collections/posts';
import { useCurrentUser } from '../common/withUser';
import { ReviewVotes } from '../../lib/collections/reviewVotes/collection';
import classNames from 'classnames';
import * as _ from "underscore"
import gql from 'graphql-tag';

const styles = theme => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `
      1fr minmax(${300}px, ${740}px) minmax(${100}px, ${500}px) 1fr
    `,
    gridTemplateAreas: `
    "... title ... ..."
    "... voting results ..."
    `,
  },
  mainColumn: {
    gridArea: "voting"
  },
  results: {
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
  postItem: {

  },
  convert: {
    marginTop: theme.spacing.unit,
    width: "100%",
  },
  expandedInfo: {
    padding: 16,
    marginBottom: 10,
    position: "fixed",
    maxWidth: 500,
    maxHeight: "60vh",
  },
  header: {
    gridArea: "title",
    ...theme.typography.display3,
    ...theme.typography.postStyle
  },
  comments: {
  },
  reason: {
    marginBottom: theme.spacing.unit*1.5,
    position: "relative",
  },
});

type vote = {postId: string, score: number, type?: string}
type quadraticVote = vote & {type: "quadratic"}
type linearVote = vote & {type: "qualitative", score: 0|1|2|3|4}

const ReviewVotingPage = ({classes}) => {
  const { results: posts } = useMulti({
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

  const [submitVote] = useMutation(gql`
    mutation submitReviewVote($postId: String, $qualitativeScore: Int, $quantitativeScore: Int) {
      submitReviewVote(postId: $postId, qualitativeScore: $qualitativeScore, quantitativeScore: $quantitativeScore) {
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

  const currentUser = useCurrentUser()
  if (!currentUser || !currentUser.isAdmin) return null

  const votes = dbVotes?.map(({qualitativeScore, postId}) => ({postId, score: qualitativeScore, type: "qualitative"})) as linearVote[]
  const dispatchQualitativeVote = ({postId, score}) => submitVote({variables: {postId, qualitativeScore: score}})

  const quadraticVotes = dbVotes?.map(({quadraticScore, postId}) => ({postId, score: quadraticScore, type: "quadratic"})) as quadraticVote[]
  const dispatchQuadraticVote = ({postId, score}) => submitVote({variables: {postId, quadraticScore: score}})

  return (
      <div className={classes.root}>
        <div className={classes.mainColumn}>
          {/* {votes.length && <Paper>
            {votes.filter(vote => vote.score !== 1).sort((a,b) => a.score - b.score).reverse().map(({postId}) => {
              return <div className={classes.result} key={postId}>
                  {results.find(post => post._id === postId)?.title || "Couldn't find title"}
              </div>
            })}
          </Paper>} */}
          <h1 className={classes.header}>Rate the most important posts of 2018?</h1>
          <Button className={classes.convert} onClick={() => {
              votesToQuadraticVotes(votes, posts).forEach(dispatchQuadraticVote)
              setUseQuadratic(true)
          }}> 
            Convert to Quadratic 
          </Button>
          <Paper>
            {posts?.length > 0 && createPostVoteTuples(posts, useQuadratic ? quadraticVotes : votes)
              .sort(([post1, vote1], [post2, vote2]) => (vote1 ? vote1.score : 1) - (vote2 ? vote2.score : 1))
              .reverse()
              .map(([post, vote]) => {
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
              })
            }
          </Paper>
        </div>
        <div className={classes.results}>
          {expandedPost && <div>
            <div className={classes.expandedInfo}>
                <div className={classes.reason}>
                  <TextField
                    id="standard-multiline-static"
                    label={`Explanation for your vote on "${expandedPost.title}?" (Optional)"`}
                    fullWidth
                    multiline
                    rows="4"
                  />
                </div>
                <div className={classes.comments}>
                  <Components.PostReviewsAndNominations 
                    title="Nominations"
                    terms={{view:"nominations2018", postId: expandedPost._id}} 
                    post={expandedPost} 
                  />
                  <Components.PostReviewsAndNominations 
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
  const sumScaled = sumBy(votes, vote => Math.abs(linearScoreScaling[vote ? vote.score : 1]))
  return createPostVoteTuples(posts, votes).map(([post, vote]) => {
    console.log("creatingPostVoteTuples")
    if (vote) {
      const newScore = computeQuadraticVoteScore(vote.score, sumScaled)
      return {postId: post._id, score: newScore, type: "quadratic"}
    } else {
      return {postId: post._id, score: 0, type: "quadratic"}
    }
  })
}

const computeQuadraticVoteScore = (linearScore: 0|1|2|3|4, totalCost: number) => {
  console.log(linearScore)
  const scaledScore = linearScoreScaling[linearScore]
  console.log("scaledScore: ", scaledScore)
  const scaledCost = scaledScore * Math.min(VOTE_BUDGET/totalCost, MAX_SCALING)
  console.log("scaledCost: ", scaledCost)
  const newScore = Math.sign(scaledCost) * Math.floor(inverseSumOf1ToN(Math.abs(scaledCost)))
  console.log("newScore: ", newScore)
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
  {post: any, dispatch: React.Dispatch<vote>, quadraticVotes: vote[], dispatchQuadraticVote: any, useQuadratic: boolean, classes:any, setExpandedPostId: Function, expandedPostId: string, votes: vote[] }
) => {
  const { PostsTitle, LWTooltip, PostsPreviewTooltip } = Components

  return <div className={classNames(classes.root, {[classes.expanded]: expandedPostId === post._id})}>
    <div>
      <div className={classes.postVote} >
        <div className={classes.post}>
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false}>
            <PostsTitle post={post} showIcons={false} wrap isLink={false}/>
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

const QuadraticVotingButtons = withStyles(quadraticVotingButtonStyles, {name: "QuadraticVotingButtons"})(({classes, postId, vote, votes}: {classes: any, postId: string, vote: any, votes: vote[]}) => {
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