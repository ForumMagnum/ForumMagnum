import { registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Posts } from '../../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withNewEvents from '../../../lib/events/withNewEvents.jsx';
import withUser from '../../common/withUser';
import truncatise from 'truncatise';
import Edit from '@material-ui/icons/Edit';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../../common/withDialog'
import withErrorBoundary from '../../common/withErrorBoundary'
import { frontpageGuidelines, defaultGuidelines } from './ForumModerationGuidelinesContent'

const styles = theme => ({
  root: {
    padding: '8px 14px 1px 14px',
    cursor: 'pointer',
    position:"relative",
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.05)'
    }
  },
  assistance: {
    color: 'rgba(0,0,0,0.6)',
  },
  'easy-going': {
    color: 'rgba(100, 169, 105, 0.9)',
  },
  'norm-enforcing': {
    color: '#2B6A99',
  },
  'reign-of-terror': {
    color: 'rgba(179,90,49,.8)',
  },
  'editButton': {
    position: 'absolute',
    right: 16,
    height: '0.8em'
  },
  collapse: {
    display:"flex",
    justifyContent:"flex-end",
    fontSize: 14,
    marginBottom: 4,
  },
  moderationGuidelines: {
    '& p': {
      marginTop: '.6em',
      marginBottom: '.6em'
    }
  }
})

class ModerationGuidelinesBox extends PureComponent {
  constructor(props, context) {
    super(props);
    this.state = {
      open: props && props.document && props.document.showModerationGuidelines,
    }
  }

  handleClick = () => {
    const { currentUser, registerEvent, document } = this.props
    this.setState({open: !this.state.open})
    if (currentUser) {
      const eventProperties = {
        userId: currentUser._id,
        important: false,
        intercom: true,
        documentId: document && document.userId,
        targetState: !this.state.open
      };
      registerEvent('toggled-user-moderation-guidelines', eventProperties);
    }
  }

  getModerationGuidelines = (document, classes) => {
    const moderationStyle = document.moderationStyle || (document.user && document.user.moderationStyle)
    const truncatiseOptions = {
      TruncateLength: 250,
      TruncateBy: "characters",
      Suffix: "... (Read More)",
      Strict: false
    }
    const { html = "" } = document.moderationGuidelines
    const userGuidelines = `${document.user ? `<b>${document.user.displayName + "'s commenting guidelines"}</b>: <span class="${classes[moderationStyle]}">${moderationStyleLookup[moderationStyle] || ""}</span> <br/>` : ""}
    ${html || ""}`

    const combinedGuidelines = `
      ${(html || moderationStyle) ? userGuidelines : ""}
      ${(html && document.frontpageDate) ? '<hr class="dividerBlock"></hr>' : ''}
      ${document.frontpageDate ?
          frontpageGuidelines :
            (
              (html || moderationStyle) ?
                "" :
                defaultGuidelines
            )
       }
    `
    const truncatedGuidelines = truncatise(combinedGuidelines, truncatiseOptions)
    return { combinedGuidelines, truncatedGuidelines }
  }

  openEditDialog = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const { document, openDialog } = this.props;
    openDialog({
      componentName: "ModerationGuidelinesEditForm",
      componentProps: {
        postId: document._id,
      }
    });
  }

  render() {
    const { document, classes, currentUser } = this.props;
    const { open } = this.state
    if (!document) return null
    
    const { combinedGuidelines, truncatedGuidelines } = this.getModerationGuidelines(document, classes)
    const displayedGuidelines = open ? combinedGuidelines : truncatedGuidelines
    return (
      <div className={classes.root} onClick={this.handleClick}>
        {Users.canModeratePost(currentUser, document) &&
          <span onClick={this.openEditDialog}>
            <Tooltip title="Edit moderation guidelines">
              <Edit className={classes.editButton} />
            </Tooltip>
          </span>
        }
        <div className={classes.moderationGuidelines}>
          <div dangerouslySetInnerHTML={{__html: displayedGuidelines}}/>
          {open && (displayedGuidelines.length > 250) && <a className={classes.collapse}>(Click to Collapse)</a>}
        </div>
      </div>
    )
  }
}

const moderationStyleLookup = {
  'norm-enforcing': "Norm Enforcing - I try to enforce particular rules (see below)",
  'reign-of-terror': "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
  'easy-going': "Easy Going - I just delete obvious spam and trolling."
}

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'PostsPage',
  enableTotal: false,
  enableCache: true,
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions], withStyles(styles, {name: 'ModerationGuidelinesBox'}),
  withNewEvents,
  withUser,
  withDialog,
  withErrorBoundary
);
