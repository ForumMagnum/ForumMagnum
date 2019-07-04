import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home'

const styles = theme => ({
  root: {
    textAlign: 'left',
    ...theme.typography.postStyle,
    marginLeft: 20,
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
  },
  tooltipTitle: {
    marginBottom: 8,
  },
})

const PostsType = ({classes, post}) => {
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

  return <Typography variant="body1" component="span" className={classes.root}>
    { post.frontpageDate ? 
      <Tooltip title={frontpageTooltip}>
        <HomeIcon className={classes.icon} />
      </Tooltip>
        :
      <Tooltip title={personalTooltip}>
        <PersonIcon className={classes.icon}  />
      </Tooltip>
    }
  </Typography>
}

registerComponent('PostsType', PostsType, withStyles(styles, {name: "PostsType"}))
