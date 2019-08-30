import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, getSetting } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home';
import GroupIcon from '@material-ui/icons/Group';
import SubjectIcon from '@material-ui/icons/Subject';

const styles = theme => ({
  root: {
    textAlign: 'left',
    display: 'inline-block',
    color: theme.palette.grey[600],
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body1.fontSize,
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

const contentTypes = {
  LessWrong: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <div>Moderators promote posts to frontpage based on:</div>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      Icon: PersonIcon
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      Icon: SubjectIcon
    }
  },
  AlignmentForum: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <div>Moderators promote posts to frontpage based on:</div>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Meta-discussion of LessWrong (site features, interpersonal community dynamics)</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      Icon: PersonIcon
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      Icon: SubjectIcon
    }
  },
  EAForum: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <div>
        Material selected by moderators as especially interesting or useful to
        people with interest in doing good effectively.
      </div>,
      Icon: HomeIcon
    },
    meta: {
      tooltipTitle: 'Community Post',
      tooltipBody: <div>
        Posts with topical content or relating to the EA community itself.
      </div>,
      Icon: GroupIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Members can write whatever they want on their personal blog. Personal
          blogposts are a good fit for:
        </div>
        <ul>
          <li>Niche topics</li>
          <li>Topics that are difficult to discuss rationally</li>
          <li>Personal ramblings</li>
        </ul>
      </React.Fragment>,
      Icon: PersonIcon
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is short in length, or written in a short amount of time.
        Off-the-cuff thoughts, brainstorming, early stage drafts, etc.
      </div>,
      Icon: SubjectIcon
    }
  }
}

const ContentType = ({classes, type, label}) => {
  if (!type) {
    throw new Error('ContentType requires type property')
  }
  const contentData = contentTypes[getSetting('forumType')][type]
  return <Typography variant="body2" component="span" className={classes.root}>
    <Tooltip title={<React.Fragment>
      <div className={classes.tooltipTitle}>{contentData.tooltipTitle}</div>
      {contentData.tooltipBody}
    </React.Fragment>}>
      <span><contentData.Icon className={classes.icon} /> {label}</span>
    </Tooltip>
  </Typography>
}

registerComponent('ContentType', ContentType, withStyles(styles, {name: "ContentType"}))
