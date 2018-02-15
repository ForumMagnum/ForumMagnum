import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import FontIcon from 'material-ui/FontIcon';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from 'meteor/example-forum';
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
    if (post && user && (canModerate || document.frontpageDate)) {
      const moderationStyle = user.moderationStyle || "no-moderation";
      const commentClasses = classNames(
        "comments-item-text",
        "moderation-guidelines-box",
        {[moderationStyle]: canModerate,
        "open": this.state.open}
      )
      return(
        <div className={commentClasses}>
          <div className="moderation-guidelines-header" onClick={() => this.setState({open: !this.state.open})}>
            <span>Moderation Guidelines</span>
            {canModerate && <span>: <FormattedMessage id={"moderation-" + moderationStyle} /></span>}
            <FontIcon
              className="material-icons moderation-guidelines-header-expand"
            >
              {this.state.open ? "expand_less" : "expand_more"}
            </FontIcon>
          </div>
          {this.state.open &&
            <Components.ModerationGuidelinesContent
              showFrontpageGuidelines={post && post.frontpageDate}
              user={user} />}
        </div>
      )
    } else {
      return null
    }
  }
}

const queryOptions = {
  collection: Posts,
  queryName: 'postsSingleQuery',
  fragmentName: 'LWPostsPage',
  totalResolver: false,
  enableCache: true,
};

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions]);
