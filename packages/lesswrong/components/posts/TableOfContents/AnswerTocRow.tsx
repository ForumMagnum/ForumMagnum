import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import type { ToCAnswer } from '../../../lib/tableOfContents';
import { LWTooltip } from "../../common/LWTooltip";
import { FormatDate } from "../../common/FormatDate";

const styles = (theme: ThemeType) => ({
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

const AnswerTocRowInner = ({classes, answer}: {
  classes: ClassesType<typeof styles>,
  answer: ToCAnswer,
}) => {
  const tooltip = <div>
    <div className={classes.tooltipKarma}>
      <div>
        { answer.baseScore } karma ({answer.voteCount} votes)
      </div>
      <div>
        Posted <FormatDate date={answer.postedAt} tooltip={false} /> ago
      </div>
    </div>
    <div dangerouslySetInnerHTML={{__html:answer.highlight}} className={classes.tooltip} />
  </div>

  return <div>
    <LWTooltip title={tooltip} placement="right-start">
      <span className={classes.root}>
        <span className={classes.karma}>
          {answer.baseScore}
        </span>
        <span className={classes.firstLine}>
          <div className={classes.author}>{answer.author}</div> 
          <div>
            { answer.shortHighlight }
          </div>
        </span>
      </span>
    </LWTooltip>
  </div>
}

export const AnswerTocRow = registerComponent('AnswerTocRow', AnswerTocRowInner, {styles});


