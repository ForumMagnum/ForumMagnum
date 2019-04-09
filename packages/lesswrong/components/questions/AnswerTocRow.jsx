import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { truncate } from '../../lib/editor/ellipsize';

const styles = (theme) => ({
  root: {
    marginLeft: -theme.spacing.unit
  },
  karma: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    width: 20,
    display: "inline-block",
    textAlign: "right",
    marginRight: theme.spacing.unit
  },
  date: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    paddingLeft: theme.spacing.unit,
  },
  tooltip: {
    wordBreak: "break-word"
  },
  tooltipKarma: {
    fontStyle: "italic",
    marginBottom: theme.spacing.unit*2,
    display:"flex",
    justifyContent: "space-between"
  }
})

const AnswerTocRow = ({classes, answer}) => {
  const { FormatDate } = Components
  const { html = "" } = answer.contents || {}

  const highlight = truncate(html, 900)

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
        <span>
          {answer.author}
        </span>
      </span>
    </Tooltip>
    </div>
}

registerComponent( 'AnswerTocRow', AnswerTocRow, withStyles(styles, {name: 'AnswerTocRow'}))
