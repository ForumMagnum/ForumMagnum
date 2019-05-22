import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { truncate, answerTocExcerptFromHTML } from '../../../lib/editor/ellipsize';
import htmlToText from 'html-to-text'

const styles = (theme) => ({
  root: {
    marginLeft: -theme.spacing.unit,
    display: "flex"
  },
  karma: {
    display: "inline-block",
    width: 20,
    textAlign: "center",
    marginRight: theme.spacing.unit,
    marginTop: 1,
    fontFamily: theme.typography.commentStyle.fontFamily,
  },
  tooltip: {
    wordBreak: "break-word"
  },
  tooltipKarma: {
    fontStyle: "italic",
    marginBottom: theme.spacing.unit*2,
    display:"flex",
    justifyContent: "space-between"
  },
  firstLine: {
    fontSize: 13.2,
    width: "calc(100% - 20px)",
    fontFamily: theme.typography.postStyle.fontFamily,
    marginTop: 0,
    marginBottom: 0,
    '& *': {
      display: "inline"
    },
    '& blockquote, & br, & figure, & img': {
      display: "none"
    },
    '& p': {
      marginRight: 6
    },
    '& strong': {
      fontWeight: theme.typography.body2.fontWeight
    }
  },
  author: {
    fontFamily: theme.typography.commentStyle.fontFamily,
  }
})

const AnswerTocRow = ({classes, answer}) => {
  const { FormatDate } = Components
  const { html = "" } = answer.contents || {}

  const highlight = truncate(html, 900)
  const singleLineHighlight = htmlToText.fromString(answerTocExcerptFromHTML(html)).substring(0,80)

  const tooltip = <div>
      <div className={classes.tooltipKarma}>
        <div>
          { answer.baseScore } karma ({answer.voteCount} votes)
        </div>
        <div>
          Posted <FormatDate date={answer.postedAt} tooltip={false} /> ago
        </div>
      </div>
      <div dangerouslySetInnerHTML={{__html:highlight}} className={classes.tooltip} />
    </div>
  return <div>
    <Tooltip title={tooltip} placement="right-start">
      <span className={classes.root}>
        <span className={classes.karma}>
          {answer.baseScore}
        </span>
        <span className={classes.firstLine}>
          <span className={classes.author}>{answer.author}:</span> { singleLineHighlight }...
        </span>
      </span>
    </Tooltip>
    </div>
}

registerComponent( 'AnswerTocRow', AnswerTocRow, withStyles(styles, {name: 'AnswerTocRow'}))
