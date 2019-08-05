import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'vulcan:core';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home';
import SubjectIcon from '@material-ui/icons/Subject';

const styles = theme => ({
  root: {
    textAlign: 'left',
    display: 'inline-block',
    color: theme.palette.grey[600],
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body2.fontSize,
  },
  icon: {
    fontSize: "1.3rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: 3,
    marginRight: 4,
  },
  tooltipTitle: {
    marginBottom: 8,
  },
})

const ContentType = ({classes, frontpage, shortform, label}) => {
  const frontpageTooltip = <div>
    <div className={classes.tooltipTitle}>Frontpage Post</div>
    <div>Moderators promote posts to frontpage based on:</div>
    <ul>
      <li>Usefulness, novelty, relevance</li>
      <li>Timeless content (minimizing reference to current events)</li>
      <li>Aiming to explain, rather than persuade</li>
    </ul>
  </div>

  const personalTooltip = <div>
    <div className={classes.tooltipTitle}>Personal Blog Post</div>
    <div>
      Members can write whatever they want on their personal blog. Personal blogposts are a good fit for:
    </div>
    <ul>
      <li>Niche topics</li>
      <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
      <li>Topics that are difficult to discuss rationally</li>
      <li>Personal ramblings</li>
    </ul>
  </div>

  const shortformTooltip = <div>
    <div className={classes.tooltipTitle}>Shortform</div>
    <div>
      Writing that is short in length, or written in a short amount of time. Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
    </div>
  </div>

  if (frontpage) {
    return <Typography variant="body1" component="span" className={classes.root}>
      <Tooltip title={frontpageTooltip}>
        <span><HomeIcon className={classes.icon} /> {label}</span>
      </Tooltip>
    </Typography>
  }

  if (shortform) {
    return <Typography variant="body1" component="span" className={classes.root}>
      <Tooltip title={shortformTooltip}>
        <span><SubjectIcon className={classes.icon} /> {label}</span>
      </Tooltip>
    </Typography>
  }

  return <Typography variant="body1" component="span" className={classes.root}>
    <Tooltip title={personalTooltip}>
      <span><PersonIcon className={classes.icon} /> {label}</span>
    </Tooltip>
  </Typography>
}

registerComponent('ContentType', ContentType, withStyles(styles, {name: "ContentType"}))
