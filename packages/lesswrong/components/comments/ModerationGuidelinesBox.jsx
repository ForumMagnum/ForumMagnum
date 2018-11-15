import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Posts } from '../../lib/collections/posts';
import { withStyles } from '@material-ui/core/styles';
import withNewEvents from '../../lib/events/withNewEvents.jsx';
import withUser from '../common/withUser';
import truncatise from 'truncatise';

const styles = theme => ({
  root: {
    marginBottom: 10,
    padding: '8px 14px 1px 14px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.02)'
    }
  },
  truncated: {

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
  }
})

class ModerationGuidelinesBox extends PureComponent {
  constructor(props, context) {
    super(props);
    this.state = {
      open: props.document.showModerationGuidelines,
    }
  }

  handleClick = () => {
    const { currentUser, registerEvent, document } = this.props
    this.setState({open: !this.state.open})
    const eventProperties = {
      userId: currentUser._id,
      important: false,
      intercom: true,
      documentId: document && document.userId,
      targetState: !this.state.open
    };
    registerEvent('toggled-user-moderation-guidelines', eventProperties);
  }

  render() {
    const { document, classes } = this.props;
    const user = document && document.user;
    const moderationStyle = user.moderationStyle || "no-moderation";
    const truncatiseOptions = {
      TruncateLength: 270,
      TruncateBy: "characters",
      Suffix: "... (Read More)",
      Strict: false
    }
    const userGuidelines = `<b>${user.displayName + "'s moderation guidelines" } </b>: <br>
    <span class="${classes[moderationStyle]}">${moderationStyleLookup[moderationStyle]}</span>
    <span style="white-space: pre-line">
      ${user.moderationGuidelines}
    </span> <br>`
    const truncatedUserGuidelines = truncatise(userGuidelines, truncatiseOptions)
    const combinedGuidelines = `<span>
      ${user.moderationGuidelines ? userGuidelines : ""}
      ${(document.frontpage || !user.moderationGuidelines) ? frontpageGuidelines : ""}
    </span>`
    return (
      <div className={classes.root} onClick={this.handleClick}>
        {!this.state.open ?
          <div className={classes.truncated}>
            {<div dangerouslySetInnerHTML={{__html: user.moderationGuidelines ? truncatedUserGuidelines : truncatedFrontpageGuidelines}}/>}
          </div>
          :
          <div>
            {<div dangerouslySetInnerHTML={{__html: combinedGuidelines}}/>}
          </div>
        }
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

const truncatedFrontpageGuidelines = `
  <p><em>Frontpage commenting guidelines:</em></p>
  <p>
    <b>Aim to explain, not persuade.</b> Write your true reasons for believing something, not what you think is most likely to persuade others. Try to offer concrete models, make predictions, and note what would change your mind. <a>...(Read More)</a>
  </p>`

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
  withUser
);
