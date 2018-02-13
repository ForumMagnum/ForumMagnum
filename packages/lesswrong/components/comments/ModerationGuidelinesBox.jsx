import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import FontIcon from 'material-ui/FontIcon';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from 'meteor/example-forum';
import classNames from 'classnames'

class ModerationGuidelinesBox extends PureComponent {
  constructor(props, context) {
    super(props);
    this.state = {
      open: false,
    }
  }

  render() {
    const { document } = this.props;
    if (document && document.user && (document.user.moderationStyle || document.frontpageDate)) {
      const post = document;
      const user = document.user;
      const { moderationStyle } = user;
      const commentClasses = classNames(
        "comments-item-text",
        "moderation-guidelines-box",
        {[moderationStyle]: moderationStyle,
        "open": this.state.open}
      )
      return(
        <div className={commentClasses}>
          <div className="moderation-guidelines-header" onClick={() => this.setState({open: !this.state.open})}>
            <span>Moderation Guidelines </span>
            <FormattedMessage id={"moderation-" + moderationStyle} />
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
