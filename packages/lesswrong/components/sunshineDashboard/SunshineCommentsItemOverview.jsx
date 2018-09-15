import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';
import defineComponent from '../../lib/defineComponent';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

const styles = theme => ({
  comment: {
    fontSize: "1rem",
    lineHeight: "1.5em"
  }
})

class SunshineCommentsItemOverview extends Component {

  render () {
    const { comment, classes } = this.props
    let commentExcerpt = comment.body.substring(0,38);
    return (
      <div>
        <Typography variant="body2">
          <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id} className={classes.comment}>
            { comment.deleted ? <span>COMMENT DELETED</span>
              : <span>{ commentExcerpt }</span>
            }
          </Link>
        </Typography>
        <div>
          <Components.SidebarInfo>
            { comment.baseScore }
          </Components.SidebarInfo>
          <Components.SidebarInfo>
            <Link to={Users.getProfileUrl(comment.user)}>
                {comment.user.displayName}
            </Link>
          </Components.SidebarInfo>
          <Components.SidebarInfo>
            <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
              {moment(new Date(comment.postedAt)).fromNow()}
              <FontIcon className="material-icons comments-item-permalink"> link </FontIcon>
            </Link>
          </Components.SidebarInfo>
        </div>
      </div>
    )
  }
}

SunshineCommentsItemOverview.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
}

export default defineComponent({
  name: 'SunshineCommentsItemOverview',
  component: SunshineCommentsItemOverview,
  styles: styles,
  hocs: [ withCurrentUser ]
});
