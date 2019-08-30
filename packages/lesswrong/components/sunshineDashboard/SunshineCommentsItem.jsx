import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'
import Icon from '@material-ui/core/Icon';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'

const styles = theme => ({
  icon: {
    fontSize: "18px",
    color:"rgba(0,0,0,.25)"
  },
  postAction: {
    marginRight: 12,
    "&:hover": {
      cursor: "pointer",
      "& span": {
        color: "rgba(0,0,0,.4) !important",
      },
    },

    "&.clear, &.purge": {
      "&:hover .sunshine-sidebar-posts-item-delete-overlay": {
        background: "rgba(255,50,0,.2)",
        position: "absolute",
        top: 0,
        right: 0,
        width: 250,
        height: "100%",
        pointerEvents: "none",
      }
    }
  },
});

class SunshineCommentsItem extends Component {

  handleReview = () => {
    const { currentUser, comment, updateComment } = this.props
    updateComment({
      selector: {_id: comment._id},
      data: {reviewedByUserId : currentUser._id}
    })
  }

  handleDelete = () => {
    const { currentUser, comment, updateComment } = this.props
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      updateComment({
        selector: {_id: comment._id},
        set: {
          deleted: true,
          deletedDate: new Date(),
          deletedByUserId: currentUser._id,
          deletedReason: "spam"
        }
      })
    }
  }

  render () {
    const { comment, classes } = this.props;
    if (comment) {
      return (
        <div className="sunshine-sidebar-item new-comment">
          <Components.SidebarHoverOver
            hoverOverComponent={
              <Typography variant="body1">
                <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                  Commented on post: <strong>{ comment.post.title }</strong>
                </Link>
                <Components.CommentBody comment={comment}/>
              </Typography>
            }
          >
            <Components.SunshineListItem>
              <Components.SunshineCommentsItemOverview comment={comment}/>
              <div className="sunshine-sidebar-posts-actions new-comment">
                <Link
                  className={classnames(classes.postAction, "new-comment", "clear")}
                  target="_blank"
                  title="Spam/Eugin (delete immediately)"
                  to={Users.getProfileUrl(comment.user)}
                  onClick={this.handleDelete}>
                    <Icon
                      className={classnames("material-icons", classes.icon)}>
                        clear
                    </Icon>
                    <div className="sunshine-sidebar-posts-item-delete-overlay"/>
                </Link>
                <span
                  className={classnames(classes.postAction, "new-comment", "review")}
                  title="Mark as Reviewed"
                  onClick={this.handleReview}>
                  <Icon
                    className={classnames("material-icons", classes.icon)}>
                      done
                  </Icon>
                </span>
              </div>
            </Components.SunshineListItem>
          </Components.SidebarHoverOver>
        </div>
      )
    } else {
      return null
    }
  }
}

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
}
registerComponent('SunshineCommentsItem', SunshineCommentsItem, [withUpdate, withUpdateOptions], withUser, withErrorBoundary,
  withStyles(styles, { name: "SunshineCommentsItem" }));
