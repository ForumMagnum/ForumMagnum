import { Components, registerComponent, withDocument} from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Posts } from '../../lib/collections/posts';
import classNames from 'classnames'
import Users from 'meteor/vulcan:users';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    marginBottom: 10,
  },
  header: {
    cursor: 'pointer',
    padding: '8px 14px',
    fontWeight: 400,
    whiteSpace: 'pre-line',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.02)'
    }
  },
  assistance: {
    color: 'rgba(0,0,0,0.6)',
  },
  content: {
    padding: '8px 14px 1px 14px',
    backgroundColor: 'transparent',
    marginTop: 0,
  },
  'easy-going': {
    color: 'rgba(100, 169, 105, 0.9)',
  },
  'norm-enforcing': {
    color: '#2B6A99'
  },
  'reign-of-terror': {
    color: 'rgba(179,90,49,.8)'
  }
})

class ModerationGuidelinesBox extends PureComponent {
  constructor(props, context) {
    super(props);
    this.state = {
      open: false,
    }
  }

  render() {
    const { document, classes } = this.props;
    const post = document;
    const user = document && document.user;
    const canModerate = Users.canModeratePost(user, post)
    const moderationStyle = user.moderationStyle || "no-moderation";
    const { ModerationGuidelinesContent } = Components

    if (post && user && (canModerate || document.frontpageDate) && !user.moderationGuidelines) {
      return(
        <div className={classes.root}>
          <div className={classes.header} onClick={() => this.setState({open: !this.state.open})}>
            {canModerate && <span className={classes[moderationStyle]}>
              <FormattedMessage id={"moderation-" + moderationStyle} />
              </span>}
            <ModerationGuidelinesContent
              showFrontpageGuidelines={post && post.frontpageDate}
              user={user}
             />

          </div>
          {this.state.open &&
            <ModerationGuidelinesContent
              showFrontpageGuidelines={post && post.frontpageDate}
              user={user} />}
        </div>
      )
    } else {
      return <div className={classNames(classes.root, {[moderationStyle]: canModerate})}>
        <div className={classes.header} onClick={() => this.setState({open: !this.state.open})}>

          <PersonalBlogGuidelines user={user} classes={classes} canModerate={canModerate} moderationStyle={moderationStyle}/>
           {/*canModerate && <span>: <FormattedMessage id={"moderation-" + moderationStyle} /></span>*/}
        </div>
        {this.state.open &&
          <ModerationGuidelinesContent
            showFrontpageGuidelines={post && post.frontpageDate}
            user={user} />}
      </div>
    }
  }
}

const PersonalBlogGuidelines = ({user, classes, canModerate, moderationStyle}) => {
  return(user && user.moderationGuidelines &&
    <div>
      <p>
        <b>{user.displayName + "'s moderation guidelines:"}</b> <br/>
        {canModerate && <span className={classes[moderationStyle]}>
          <FormattedMessage id={"moderation-" + moderationStyle} />
        </span>}
      </p>
      <p>{user.moderationGuidelines}</p>
    </div>)
}


const ShortModerationGuidelines = () => (
  <div>
    <b>Moderation Guidelines:</b> Aim to explain, not persuade. Write your true reasons for believing something, not
      the reasons you think are most likely to persuade readers of your comments. Try to offer concrete
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

registerComponent('ModerationGuidelinesBox', ModerationGuidelinesBox, [withDocument, queryOptions], withStyles(styles, {name: 'ModerationGuidelinesBox'}));
