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
    width: 16,
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
    width: "calc(100% - 20px)",
    fontFamily: theme.typography.commentStyle.fontFamily,
    marginTop: 0,
    marginBottom: 0,
  },
  author: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    marginBottom: 4
  }
})

const AnswerTocRow = ({classes, answer}) => {
  const { FormatDate } = Components
  const { html = "" } = answer.contents || {}

  const highlight = truncate(html, 900)
  let shortHighlight = htmlToText.fromString(answerTocExcerptFromHTML(html), {ignoreImage:true, ignoreHref:true})

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
          <div className={classes.author}>{answer.author}</div> 
          <div>
            { shortHighlight }
          </div>
        </span>
      </span>
    </Tooltip>
    </div>
}

registerComponent( 'AnswerTocRow', AnswerTocRow, withStyles(styles, {name: 'AnswerTocRow'}))
