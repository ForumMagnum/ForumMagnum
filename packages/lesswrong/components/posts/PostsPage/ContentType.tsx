import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import PersonIcon from '@material-ui/icons/Person'
import HomeIcon from '@material-ui/icons/Home';
import StarIcon from '@material-ui/icons/Star';
import SubjectIcon from '@material-ui/icons/Subject';
import { forumTypeSetting } from '../../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    textAlign: 'left',
    display: 'inline-block',
    color: theme.palette.grey[800],
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body2.fontSize,
  },
  icon: {
    fontSize: "1.3rem",
    color: theme.palette.grey[600],
    position: "relative",
    top: 3,
    marginRight: 4,
  },
  tooltipTitle: {
    marginBottom: 8,
  },
})

export const contentTypes = {
  LessWrong: {
    frontpage: {
      tooltipTitle: 'Frontpage Post',
      tooltipBody: <React.Fragment>
        <p><b>Frontpage Posts</b> are promoted by moderators based on:</p>
        <ul>
          <li>Usefulness, novelty, relevance</li>
          <li>Timeless content (minimizing reference to current events)</li>
          <li>Aiming to explain, rather than persuade</li>
        </ul>
      </React.Fragment>,
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blogpost',
      tooltipBody: <React.Fragment>
        <div><b>Personal Blogpost</b></div><br/>
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
    curated: {
      tooltiptitle: 'Curated Post',
      tooltipBody: <div>
        The best 2-3 posts each week, selected by the moderation team. Curated
        posts are featured at the top of the front page and emailed to subscribers.
      </div>,
      Icon: StarIcon,
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
    curated: {
      tooltiptitle: 'Curated Post',
      tooltipBody: <div>
        The best posts, selected by the moderation team.
      </div>,
      Icon: StarIcon,
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
        Posts that are relevant to doing good effectively.
      </div>,
      Icon: HomeIcon
    },
    personal: {
      tooltipTitle: 'Personal Blog Post',
      tooltipBody: <React.Fragment>
        <div>
          Users can write whatever they want on their personal blog. This category
          is a good fit for:
        </div>
        <ul>
          <li>topics that aren't closely related to EA</li>
          <li>topics that are difficult to discuss rationally</li>
          <li>topics of interest to a small fraction of the Forum’s readers (e.g. local events)</li>
        </ul>
      </React.Fragment>,
      Icon: PersonIcon
    },
    curated: {
      tooltiptitle: 'Curated Post',
      tooltipBody: <div>
        The best 2-3 posts each week, selected by the moderation team. Curated
        posts are featured at the top of the front page and emailed to subscribers.
      </div>,
      Icon: StarIcon,
    },
    shortform: {
      tooltipTitle: 'Shortform',
      tooltipBody: <div>
        Writing that is brief, or written very quickly. Perfect for off-the-cuff
        thoughts, brainstorming, early stage drafts, etc.
      </div>,
      Icon: SubjectIcon
    }
  }
}

const ContentType = ({classes, type, label}: {
  classes: ClassesType,
  type: string,
  label?: string
}) => {
  if (!type) {
    throw new Error('ContentType requires type property')
  }
  const { LWTooltip, Typography } = Components

  const contentData = contentTypes[forumTypeSetting.get()][type]
  return <Typography variant="body1" component="span" className={classes.root}>
    <LWTooltip title={<React.Fragment>
      <div className={classes.tooltipTitle}>{contentData.tooltipTitle}</div>
      {contentData.tooltipBody}
    </React.Fragment>}>
      <span><contentData.Icon className={classes.icon} />{label ? " "+label : ""}</span>
    </LWTooltip>
  </Typography>
}

const ContentTypeComponent = registerComponent('ContentType', ContentType, {styles});

declare global {
  interface ComponentTypes {
    ContentType: typeof ContentTypeComponent
  }
}
