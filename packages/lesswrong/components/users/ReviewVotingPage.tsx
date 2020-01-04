import React, { useState, useReducer } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { find, reject, sortBy, sumBy } from 'lodash'
import { registerComponent, Components, useMulti } from 'meteor/vulcan:core';
import { Paper } from '@material-ui/core';
import { Posts } from '../../lib/collections/posts';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    display: 'grid',
    gridTemplateColumns: `
      1fr minmax(${300}px, ${740}px) minmax(${100}px, ${300}px) 1fr
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
    padding: theme.spacing.unit*2,
    gridArea: "results"
  },
  result: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    lineHeight: "1.3rem",
    marginBottom: 10
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
  header: {
    gridArea: "title",
    ...theme.typography.display3,
    ...theme.typography.postStyle
  }
});

function reducer(state: vote[], { title, score }: vote):vote[] {
  if (find(state, ['title', title])) state = reject(state, ['title', title])
  if (score === 1) return state
  return sortBy([...state, {title, score}], ['score', 'title']).reverse()
}

type vote = {title: string, score: number, type?: string}

const ReviewVotingPage = ({classes}) => {
  const { results } = useMulti({
    terms: {view:"reviews2018", limit: 100},
    collection: Posts,
    queryName: 'postsListQuery',
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const [votes, dispatchVote]:[vote[], React.Dispatch<vote>] = useReducer(reducer, [])
  const [quadraticVotes, setQuadraticVotes] = useState<Map<string, number>>(new Map())
  const [useQuadratic, setUseQuadratic] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState(null)

  return (
      <div className={classes.root}>
        <h1 className={classes.header}>Rate the most important posts of 2018?</h1>
        <div className={classes.mainColumn}>
          <Paper>
            {results?.map(post => {
                return <VoteTableRow key={post._id} post={post} dispatch={dispatchVote} quadraticVotes={quadraticVotes} setQuadraticVotes=  {setQuadraticVotes} useQuadratic={useQuadratic} setExpandedPostId={setExpandedPostId} expandedPostId={expandedPostId}/>
              })}
          </Paper>
        </div>
        <div className={classes.results}>
          {useQuadratic && computeTotalCost(quadraticVotes)}
          {votes.map(({title}: {title: string}) => {
            return <div className={classes.result} key={title}>
                {title}
            </div>
          })}
        <Button className={classes.convert} onClick={() => {
            setQuadraticVotes(votesToQuadraticVotes(votes))
            setUseQuadratic(true)
        }}> 
          Convert to Quadratic 
        </Button>
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
const votesToQuadraticVotes = (votes:vote[]):Map<string, number> => {
const sumScaled = sumBy(votes, vote => Math.abs(linearScoreScaling[vote.score]))
return new Map(votes.map(({title, score}) => {
    const scaledScore = linearScoreScaling[score]
    const scaledCost = scaledScore * Math.min(VOTE_BUDGET/sumScaled, MAX_SCALING)
    const newScore = Math.sign(scaledCost) * Math.floor(inverseSumOf1ToN(scaledCost))
    return [title, newScore]
}))
}

const inverseSumOf1ToN = (x:number) => {
return Math.sign(x)*(1/2 * (Math.sqrt(8 * Math.abs(x) + 1) - 1))
}

const sumOf1ToN = (x:number) => {
return x*(x+1)/2
}

const computeTotalCost = (votes: Map<string, number>) => {
const voteArray = [...votes]
return sumBy(voteArray, ([,score]) => sumOf1ToN(score))
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
    background: "rgba(0,0,0,.05)"
  },
  expandedInfo: {
    display: "flex",
    justifyContent: "space-between"
  },
  comments: {
    marginTop: theme.spacing.unit*1.5,
    width: "calc(100% - 275px)",
  },
  reason: {
    marginTop: theme.spacing.unit*1.5,
    width: 252,
    position: "relative",
    minHeight: 200
  },
  closeButton: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    padding: theme.spacing.unit,
    position: "absolute",
    bottom: 0,
    right: 0,
    textAlign: "right",
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: "rgba(0,0,0,.1)"
    }
  }
})

const VoteTableRow = withStyles(voteRowStyles, {name: "VoteTableRow"})((
  {post, dispatch, setQuadraticVotes, quadraticVotes, useQuadratic, classes, setExpandedPostId, expandedPostId }:
  {post: object, dispatch: React.Dispatch<vote>, quadraticVotes: Map<string, number>, setQuadraticVotes: any, useQuadratic: boolean, classes:any, setExpandedPostId: Function, expandedPostId: string }
) => {
  const { PostsTitle, PostReviewsAndNominations, LWTooltip, PostsPreviewTooltip } = Components

  const expanded = expandedPostId === post._id

  return <div className={classNames(classes.root, {[classes.expanded]: expanded})}>
    <div onClick={()=>setExpandedPostId(post._id)}>
      <div className={classes.postVote} >
        <div className={classes.post}>
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false}>
            <PostsTitle post={post} showIcons={false} wrap isLink={false}/>
          </LWTooltip>
          {!expanded && <div className={classes.expand}>Click to expand</div>}
        </div>
        <div>
            {useQuadratic ? 
            <QuadraticVotingButtons title={post.title} votes={quadraticVotes} setVotes={setQuadraticVotes} /> :
            <VotingButtons title={post.title} dispatch={dispatch} />
            }
        </div>
      </div>
    </div>
    {expanded && <div>
        <div className={classes.expandedInfo}>
          <div className={classes.comments}>
            <PostReviewsAndNominations 
              title="Nominations"
              terms={{view:"nominations2018", postId: post._id}} 
              post={post} 
            />
            <PostReviewsAndNominations 
              title="Reviews"
              terms={{view:"reviews2018", postId: post._id}} 
              post={post} 
            />
          </div>
          <div className={classes.reason}>
            <TextField
              id="standard-multiline-static"
              label="Why did you vote this way? (Optional)"
              fullWidth
              multiline
              rows="4"
            />
            <div className={classes.closeButton} onClick={()=>setExpandedPostId(null)}>Submit</div>
          </div>
        </div>
    </div>}
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

const VotingButtons = withStyles(votingButtonStyles, {name: "VotingButtons"})(({classes, title, dispatch}: {classes: object, title: string, dispatch: any}) => {
const [selection, setSelection] = useState("Neutral")
const createClickHandler = (index:number, text: string) => {
    return () => {
    setSelection(text)
    dispatch({title, score: index})
    }
}
return <div>
    {["No", "Neutral", "Good", "Important", "Crucial"].map((text, i) => {
    return <span className={classNames(classes.button, {[classes.highlighted]:selection === text})} onClick={createClickHandler(i, text)} key={`${text}-${i}`} >{text}</span>
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

const QuadraticVotingButtons = withStyles(quadraticVotingButtonStyles, {name: "QuadraticVotingButtons"})(({classes, title, setVotes, votes}: {title: string, setVotes: any, votes: Map<string, number>}) => {
  const createClickHandler = (title: string, type: 'buy' | 'sell') => {
      return () => {
      const newScore = (votes.get(title) || 0) + (type === 'buy' ? 1 : -1)
      setVotes(new Map([...votes, [title, newScore]]))
      }
  } 
  return <div>
    <span className={classes.vote} onClick={createClickHandler(title, 'sell')}>–</span>
    <span className={classes.score}>{votes.get(title) || 0}</span>
    <span className={classes.vote} onClick={createClickHandler(title, 'buy')}>+</span>
  </div>
})

registerComponent('ReviewVotingPage', ReviewVotingPage,withStyles(styles, {name: "ReviewVotingPage"}));