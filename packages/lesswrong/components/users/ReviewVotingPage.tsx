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
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Paper } from '@material-ui/core';

const PostsToRate = [
["Causal Abstraction Toy Model: Medical Sensor", "15"],
["Generalizing Experimental Results by Leveraging Knowledge of Mechanisms", "43"],
["ToL: Methods and Success", "9"],
["ToL: This ONE WEIRD Trick to make you a GENIUS at Topology!", "11"],
["What's an important (new) idea you haven't had time to argue for yet?", "6"],
["ToL: The Topological Connection", "12"],
["ToL: Introduction", "11"],
["ToL: Foundations", "11"],
["Applications of Economic Models to Physiology?", "36"],
["Predictive coding = RL + SL + Bayes + MPC", "19"],
["Review  On the Chatham House Rule (Ben Pace, Dec 2019)", "40"],
["Review  Meta-Honesty (Ben Pace, Dec 2019)", "27"],
["Were vaccines relevant to 20th century US mortality improvements?", "17"],
["Bayesian examination", "74"],
["Is Rationalist Self-Improvement Real?", "126"],
["Who are some people you met that were the most extreme on some axis?", "5"],
["What are some things you would do (more) if you were less averse to being/looking weird?", "13"],
["Long Bets by Confidence Level", "22"],
["What are the best arguments and/or plans for doing work in  AI policy ?", "14"],
["The Review Phase: Helping LessWrongers Evaluate Old Posts", "48"],
["Books on the zeitgeist of science during Lord Kelvin's time.", "32"],
["What determines the balance between intelligence signaling and virtue signaling?", "47"],
["Counterfactuals: Smoking Lesion vs. Newcomb's", "9"],
["Progress and preservation in IDA", "12"],
["Confabulation", "39"],
["The Anatomy & Sensory Experiences of Chakras & Qi?", "2"],
["What do the Charter Cities Institute likely mean when they refer to long term problems with the use of eminent domain?", "7"],
["The Lesson To Unlearn", "39"],
["Ungendered Spanish", "20"],
["The 5 Main Muscles Made Easy.", "4"],
["What is a reasonably complete set of the different meanings of  hard work ?", "8"],
["The New Age of Social Engineering", "19"],
["What subfields of mathematics are most useful for what subfields of AI?", "5"],
["What is Abstraction?", "20"],
["New things I understand (or think I do)", "7"],
["Comment on Coherence arguments do not imply goal directed behavior", "20"],
["Is there a website for tracking fads?", "8"],
["The Actionable Version of  Keep Your Identity Small ", "60"],
["Understanding “Deep Double Descent”", "99"],
["Tapping Out In Two", "14"],
["Values, Valence, and Alignment", "12"],
["LW Team Updates - December 2019", "41"],
["To Be Decided #3", "4"],
["LW For External Comments?", "51"],
["Reading list: Starting links and books on studying ontology and causality", "14"],
["Is there a scientific method? Physics, Biology and Beyond", "9"],
["The Devil Made Me Write This Post Explaining Why He Probably Didn't Hide Dinosaur Bones", "-1"],
["Linkpost: Searching Along the Trail of Crumbs", "8"],
["Oracles: reject all deals - break superrationality, with superrationality ", "20"],
["What is an Evidential Decision Theory agent?", "10"],
["Multiple conditions must be met to gain causal effect", "9"],
["Triangle SSC Meetup-December 18th", "4"],
["Seeking Power is Provably Instrumentally Convergent in MDPs", "101"],
["Elementary Statistics", "12"],
["Connectome-Specific Harmonic Waves", "15"],
["What are some non-purely-sampling ways to do deep RL?", "15"],
["Karate Kid and Realistic Expectations for Disagreement Resolution", "80"],
["Recent Progress in the Theory of Neural Networks", "60"],
["Paper-Reading for Gears", "68"],
["On decision-prediction fixed points", "3"],
["What additional features would you like on LessWrong?", "6"],
["AN #76 : How dataset size affects robustness, and benchmarking safe exploration by measuring constraint violations", "13"],
["2019 Winter Solstice Collection", "34"],
["Fully  acausal trade", "16"],
["If giving unsolicited feedback was a social norm, what feedback would you often give?", "8"],
["In which ways have you self-improved that made you feel bad for not having done it earlier?", "14"],
["A letter on optimism about human progress", "35"],
["Symbiotic Wars", "23"],
["Long-lasting Effects of Suspensions?", "16"],
["(Reinventing wheels) Maybe our world has become more people-shaped.", "5"],
["BrienneYudkowsky's Shortform", "17"],
["Russian x-risks newsletter #2, fall 2019", "22"],
["Searching Along the Trail of Crumbs", "10"],
["MIRI’s 2019 Fundraiser", "60"],
["Open & Welcome Thread - December 2019", "12"],
]

const styles = theme => ({
  root: {
    padding: 40,
    display: 'grid',
    gridTemplateColumns: `
    1.5fr
    1fr
    `,
    gridTemplateAreas: `
    "voting results"
    `,
  },
  title: {
    gridArea: "title"
  },
  voting: {
    gridArea: "voting"
  },
  results: {
    gridArea: "results"
  },
  votingBox: {
    maxWidth: 700
  }
});

function reducer(state: vote[], { title, score }: vote):vote[] {
  if (find(state, ['title', title])) state = reject(state, ['title', title])
  if (score === 1) return state
  return sortBy([...state, {title, score}], ['score', 'title']).reverse()
}

type vote = {title: string, score: number, type?: string}
const ReviewVotingPage = ({classes}) => {
  const [votes, dispatchVote]:[vote[], React.Dispatch<vote>] = useReducer(reducer, [])
  const [quadraticVotes, setQuadraticVotes] = useState<Map<string, number>>(new Map())
  const [useQuadratic, setUseQuadratic] = useState(false)
  return (
      <div className={classes.root}>
        <Paper className={classes.voting}>
          <Table>
            <TableHead>
              <TableRow>
              <TableCell> Title </TableCell>
              <TableCell> Voting </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PostsToRate.map(([title]) => {
                return <VoteTableRow key={title} title={title} dispatch={dispatchVote} quadraticVotes={quadraticVotes} setQuadraticVotes={setQuadraticVotes} useQuadratic={useQuadratic}/>
              })}
            </TableBody>
          </Table>
        </Paper>
        <div className={classes.results}>
          {useQuadratic && computeTotalCost(quadraticVotes)}
          {votes.map(({title}: {title: string}) => {
            return <div key={title}>
                {title}
            </div>
          })}
        </div>
        <Button onClick={() => {
            setQuadraticVotes(votesToQuadraticVotes(votes))
            setUseQuadratic(true)
        }}> Convert to Quadratic </Button>
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
  voteIcon: {
      padding: 0
  }
})

const VoteTableRow = withStyles(voteRowStyles, {name: "VoteTableRow"})((
  {title, dispatch, setQuadraticVotes, quadraticVotes, useQuadratic, classes}:
  {title: string, dispatch: React.Dispatch<vote>, quadraticVotes: Map<string, number>, setQuadraticVotes: any, useQuadratic: boolean, classes:any }
) => {
  const [expanded, setExpanded] = useState(false)
  return <>
      <TableRow>
      <TableCell>
          <IconButton className={classes.voteIcon}> 
          <ArrowRightIcon onClick={ev => {setExpanded(!expanded)}} /> 
          </IconButton>
          {title}
      </TableCell>
      <TableCell>
          {useQuadratic ? 
          <QuadraticVotingButtons title={title} votes={quadraticVotes} setVotes={setQuadraticVotes} /> :
          <VotingButtons title={title} dispatch={dispatch} />
          }
      </TableCell>
      </TableRow>
      {expanded && 
      <TableRow>
          <TableCell colSpan={2}>
          <TextField
              id="standard-multiline-static"
              label="Comment"
              multiline
              rows="4"
              defaultValue="Default Value"
          />
          </TableCell>
      </TableRow>
      }
  </>
})

const VotingButtons = ({title, dispatch}: {title: string, dispatch: any}) => {
const [selection, setSelection] = useState("Neutral")
const createClickHandler = (index:number, text: string) => {
    return () => {
    setSelection(text)
    dispatch({title, score: index})
    }
}
return <div>
    {["No", "Neutral", "Decent", "Important", "Crucial"].map((text, i) => {
    return <Button onClick={createClickHandler(i, text)} key={`${text}-${i}`} color={selection === text ? "primary" : "secondary"} >{text}</Button>
    })}
</div>
}

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