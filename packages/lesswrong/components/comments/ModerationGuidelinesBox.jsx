import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import withUser from '../common/withUser';
import truncatise from 'truncatise';
import classNames from 'classnames'
import Edit from '@material-ui/icons/Edit';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../common/withDialog'
import withErrorBoundary from '../common/withErrorBoundary'

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
    fontStyle: 'italic'
  },
  'norm-enforcing': {
    color: '#2B6A99',
    fontStyle: 'italic'
  },
  'reign-of-terror': {
    color: 'rgba(179,90,49,.8)',
    fontStyle: 'italic'
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
    const userGuidelines = `${document.user ? `<b>${document.user.displayName + "'s moderation guidelines" } </b>: <br>
    <span class="${classes[moderationStyle]}">${moderationStyleLookup[moderationStyle]}</span>` : ""}
    ${document.moderationGuidelinesHtmlBody}`
    const combinedGuidelines = `
      ${document.moderationGuidelinesHtmlBody ? userGuidelines : ""}
      ${document.frontpageDate ?
          frontpageGuidelines :
            (
              document.moderationGuidelinesHtmlBody ?
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
        postId: document._id
      }
    });
  }

  render() {
    const { document, classes, currentUser } = this.props;
    const { open } = this.state
    const { combinedGuidelines, truncatedGuidelines } = this.getModerationGuidelines(document, classes)
    return (
      <div className={classes.root} onClick={this.handleClick}>
        {Users.canModeratePost(currentUser, document) &&
          <span onClick={this.openEditDialog}>
            <Tooltip title="Edit moderation guidelines">
              <Edit className={classes.editButton} />
            </Tooltip>
          </span>
        }
        <div className={classNames({[classes.truncated]: !open})}>
          <div dangerouslySetInnerHTML={{__html: open ? combinedGuidelines : truncatedGuidelines}}/>
          {open && <a className={classes.collapse}>(Click to Collapse)</a>}
        </div>
      </div>
    )
  }
}

const frontpageGuidelines = `
  <p><em>Frontpage commenting guidelines:</em></p>
  <p>
    <b>Aim to explain, not persuade.</b> Write your true reasons for believing something, not what you think is most likely to persuade others. Try to offer concrete models, make predictions, and note what would change your mind.
  </p>
  <p>
    <b>Avoid identity politics.</b> Make personal statements instead of statements that try to represent a group consensus (“I think X is wrong” vs. “X is generally frowned upon”). Avoid stereotypical arguments that will cause others to round you off to someone else they’ve encountered before. Tell people how <b>you</b> think about a topic, instead of repeating someone else’s arguments (e.g. “But Nick Bostrom says…”).
  </p>
  <p>
    <b>Get curious.</b> If I disagree with someone, what might they be thinking; what are the moving parts of their beliefs? What model do I think they are running? Ask yourself - what about this topic do I not understand? What evidence could I get, or what evidence do I already have?
  </p>`

const defaultGuidelines = `
  <p><em>Default commenting guidelines:</em></p>
  <p>
    <b>Aim to explain, not persuade.</b> Write your true reasons for believing something, not what you think is most likely to persuade others. Try to offer concrete models, make predictions, and note what would change your mind.
  </p>
  <p>
    <b>Avoid identity politics.</b> Make personal statements instead of statements that try to represent a group consensus (“I think X is wrong” vs. “X is generally frowned upon”). Avoid stereotypical arguments that will cause others to round you off to someone else they’ve encountered before. Tell people how <b>you</b> think about a topic, instead of repeating someone else’s arguments (e.g. “But Nick Bostrom says…”).
  </p>
  <p>
    <b>Get curious.</b> If I disagree with someone, what might they be thinking; what are the moving parts of their beliefs? What model do I think they are running? Ask yourself - what about this topic do I not understand? What evidence could I get, or what evidence do I already have?
  </p>
`
const moderationStyleLookup = {
  'norm-enforcing': "Norm Enforcing - I try to enforce particular rules (see below)",
  'reign-of-terror': "Reign of Terror - I delete anything I judge to be annoying or counterproductive",
  'easy-going': "Easy Going - I just delete obvious spam and trolling."
}

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'LWPostsPage',
  enableTotal: false,
  enableCache: true,
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions], withStyles(styles, {name: 'ModerationGuidelinesBox'}),
  withNewEvents,
  withUser,
  withDialog,
  withErrorBoundary
);
