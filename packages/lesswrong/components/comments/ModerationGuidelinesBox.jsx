import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Icon from '@material-ui/core/Icon';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from '../../lib/collections/posts';
import classNames from 'classnames'
import Users from 'meteor/vulcan:users';

class ModerationGuidelinesBox extends PureComponent {
  constructor(props, context) {
    super(props);
    this.state = {
      open: false,
    }
  }

  render() {
    const { document } = this.props;
    const post = document;
    const user = document && document.user;
    const canModerate = Users.canModeratePost(user, post)
    const moderationStyle = user.moderationStyle || "no-moderation";
    const commentClasses = classNames(
      "comments-item-text",
      "moderation-guidelines-box",
      {[moderationStyle]: canModerate,
      "open": this.state.open}
    )
    if (post && user && (canModerate || document.frontpageDate)) {
      return(
        <div className={commentClasses}>
          <div className="moderation-guidelines-header" onClick={() => this.setState({open: !this.state.open})}>
            <ShortModerationGuidelines />
             {canModerate && <span>: <FormattedMessage id={"moderation-" + moderationStyle} /></span>}
            <Icon
              className="material-icons moderation-guidelines-header-expand"
            >
              {this.state.open ? "expand_less" : "expand_more"}
            </Icon>
          </div>
          {this.state.open &&
            <Components.ModerationGuidelinesContent
              showFrontpageGuidelines={post && post.frontpageDate}
              user={user} />}
        </div>
      )
    } else {
      return <div className={commentClasses}>
        <div className="moderation-guidelines-header" onClick={() => this.setState({open: !this.state.open})}>
          <PersonalBlogGuidelines />
           {canModerate && <span>: <FormattedMessage id={"moderation-" + moderationStyle} /></span>}
        </div>
        {this.state.open &&
          <Components.ModerationGuidelinesContent
            showFrontpageGuidelines={post && post.frontpageDate}
            user={user} />}
      </div>
    }
  }
}

const PersonalBlogGuidelines = () => (
  <div>
    <b>Moderation Guidelines:</b> Aim to explain, not persuade. Write your true reasons for believing something, as
     opposed to the reasons you think are most likely to persuade readers of your comments. Try to offer concrete
     models, make predictions, and note what would change your mind (Read More)
  </div>
)

const ShortModerationGuidelines = () => (
  <div>
    <b>Moderation Guidelines:</b> Aim to explain, not persuade. Write your true reasons for believing something, as
     opposed to the reasons you think are most likely to persuade readers of your comments. Try to offer concrete
     models, make predictions, and note what would change your mind (Read More)
  </div>
)

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'LWPostsPage',
  enableTotal: false,
  enableCache: true,
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions]);
