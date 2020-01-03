import React, { useState, useReducer } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import IconButton from '@material-ui/core/IconButton';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
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
    1fr
    minmax(${300}px, ${740}px)
    minmax(${100}px, ${300}px)
    1fr
    `,
    gridTemplateAreas: `
    "... voting results ..."
    `,
  },
  title: {
    gridArea: "title"
  },
  voting: {
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
        <Paper className={classes.voting}>
          {results?.map(post => {
              return <VoteTableRow key={post._id} post={post} dispatch={dispatchVote} quadraticVotes={quadraticVotes} setQuadraticVotes=  {setQuadraticVotes} useQuadratic={useQuadratic} setExpandedPostId={setExpandedPostId} expandedPostId={expandedPostId}/>
            })}
        </Paper>
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
    width: "60%",
  },
  reason: {
    marginTop: theme.spacing.unit,
    width: "calc(40% - 8px)"
  },
  commentsSubtitle: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 4
  },
  closeButton: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    width: "60%",
    marginLeft: "auto",
    padding: theme.spacing.unit,
    textAlign: "center",
    color: theme.palette.grey[600],
    '&:hover': {
      backgroundColor: "rgba(0,0,0,.1)"
    }
  }
})

const VoteTableRow = withStyles(voteRowStyles, {name: "VoteTableRow"})((
  {post, dispatch, setQuadraticVotes, quadraticVotes, useQuadratic, classes, setExpandedPostId, expandedPostId }:
  {post: object, dispatch: React.Dispatch<vote>, quadraticVotes: Map<string, number>, setQuadraticVotes: any, useQuadratic: boolean, classes:any, setExpandedPostId: Function, expandedPostId: string }
) => {
  const { PostsTitle, PostsItemNewCommentsWrapper } = Components

  const expanded = expandedPostId === post._id

  return <div className={classNames(classes.root, {[classes.expanded]: expanded})} onClick={()=>setExpandedPostId(post._id)}>
      <div className={classes.postVote} >
        <div className={classes.post}>
          <PostsTitle post={post} showIcons={false} wrap isLink={false}/>
          {!expanded && <div className={classes.expand}>Click to expand</div>}
        </div>
        <div>
            {useQuadratic ? 
            <QuadraticVotingButtons title={post.title} votes={quadraticVotes} setVotes={setQuadraticVotes} /> :
            <VotingButtons title={post.title} dispatch={dispatch} />
            }
        </div>
      </div>
      {expanded && <div>
        <div className={classes.expandedInfo}>
          <div className={classes.reason}>
            <TextField
              id="standard-multiline-static"
              label="Why did you vote this way?"
              fullWidth
              multiline
              rows="4"
            />
          </div>
          <div className={classes.comments}>
            <div className={classes.commentsSubtitle}>Reviews</div>
            <PostsItemNewCommentsWrapper terms={{view:"reviews2018", postId: post._id}} post={post} forceSingleLine hideSingleLineDate hideSingleLineMeta/>
            <div className={classes.commentsSubtitle}>Nominations</div>
            <PostsItemNewCommentsWrapper terms={{view:"nominations2018", postId: post._id}} post={post} forceSingleLine hideSingleLineDate hideSingleLineMeta/>
          </div>
        </div>
        <div className={classes.closeButton} onClick={()=>setExpandedPostId(null)}>Close</div>
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

const QuadraticVotingButtons = ({title, setVotes, votes}: {title: string, setVotes: any, votes: Map<string, number>}) => {
  const createClickHandler = (title: string, type: 'buy' | 'sell') => {
      return () => {
      const newScore = (votes.get(title) || 0) + (type === 'buy' ? 1 : -1)
      setVotes(new Map([...votes, [title, newScore]]))
      }
  } 
  return <div>
      <Button onClick={createClickHandler(title, 'sell')}>Sell (-1)</Button>
      <Button>{votes.get(title) || 0}</Button>
      <Button onClick={createClickHandler(title, 'buy')}>Buy (+1)</Button>
  </div>
}

registerComponent('ReviewVotingPage', ReviewVotingPage,withStyles(styles, {name: "ReviewVotingPage"}));