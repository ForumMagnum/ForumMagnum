import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { sumBy } from 'lodash'
import { registerComponent, Components, useMulti, useCreate } from 'meteor/vulcan:core';
import { Paper } from '@material-ui/core';
import { Posts } from '../../lib/collections/posts';
import { ReviewVotes } from '../../lib/collections/reviewVotes/collection';
import classNames from 'classnames';
import * as _ from "underscore"

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
    overflowY: "scroll"
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

  const votes:vote[] = filterForMostRecent(dbVotes?.filter(vote => vote.type === "qualitative") || [])
  const dispatchVote = ({postId, score}) => createVote({postId, score, type: "qualitative"})

  const quadraticVotes:vote[] = filterForMostRecent(dbVotes?.filter(vote => vote.type === "quadratic") || [])
  const dispatchQuadraticVote = ({postId, score}) => createVote({postId, score, type: "quadratic"})

  const [useQuadratic, setUseQuadratic] = useState(false)
  const [expandedPost, setExpandedPost] = useState<any>(null)

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
              votesToQuadraticVotes(votes).forEach(dispatchQuadraticVote)
              setUseQuadratic(true)
          }}> 
            Convert to Quadratic 
          </Button>
          <Paper>
            {results?.map(post => {
                const voteForPost = useQuadratic ? 
                    quadraticVotes.find(vote => vote.postId === post._id) : 
                    votes.find(vote => vote.postId === post._id)
                    
                return [post, voteForPost]
              })
              .sort(([post1, vote1], [post2, vote2]) => (vote1?.score || 0) - (vote2?.score || 0))
              .reverse()
              .map(([post, vote]) => {
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
  const [selection, setSelection] = useState(voteForCurrentPost?.score === 0 ? 0 : (voteForCurrentPost?.score || 1))
  const createClickHandler = (index:number) => {
    return () => {
      setSelection(index)
      dispatch({postId, score: index})
    }
  }
  return <div>
      {[0,1,2,3,4,5].map((i) => {
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