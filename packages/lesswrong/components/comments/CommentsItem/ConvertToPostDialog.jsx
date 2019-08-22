import React, { PureComponent } from 'react';
import { registerComponent, withDocument, withCreate, withUpdate } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import { withStyles } from '@material-ui/core/styles';
import withDialog from '../../common/withDialog'
import withUser from '../../common/withUser'
import { Posts } from '../../../lib/collections/posts';
import { Comments } from '../../../lib/collections/comments';
import { withNavigation } from '../../../lib/routeUtil'
import Tooltip from '@material-ui/core/Tooltip';
import classNames from 'classnames';

const styles = theme => ({
  title: {
    ...theme.typography.postStyle,
    fontSize: "1.3rem",
    width: "100%"
  },
  helpText: {
    fontStyle: "italic",
    marginTop: theme.spacing.unit*1.5,
  },
  checkbox: {
    paddingLeft: 0,
  },
  checkboxGroup: {
    cursor: "pointer"
  },
  disabled: {
    opacity: .5
  }
})

class ConvertToPostDialog extends PureComponent {
  state = { title: "", moveChildComments: this.props.defaultMoveChildComments }

  handleConvert = async () => {
    const { createPost, updateComment, document, history, onClose } = this.props;
    const { title, moveChildComments } = this.state
    const response = await createPost({
      data: {
        title: title,
        draft: true,
        contents: {
          originalContents: document.contents.originalContents
        },
        userId: document.userId,
        convertedFromCommentId: document._id,
        moveCommentsFromConvertedComment: moveChildComments
      }
    })
    const postId = response.data.createPost.data._id
    updateComment({
      selector: { _id: document._id},
      data: {
        convertedToPostId: postId
      },
    })
    history.push({pathname: '/editPost', search: `?postId=${postId}&eventForm=false`})
    onClose()
  }

  render() {
    const { classes, onClose, defaultMoveComments, currentUser } = this.props
    const { title, moveChildComments } = this.state

    const canMoveChildComments = Users.canDo('comments.moveConvertedCommentChildren.all', currentUser) || Users.owns(document, currentUser) && defaultMoveComments

    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>
          Create Draft Post from Comment
        </DialogTitle>
        <DialogContent>
          <Input
            className={classes.title}
            placeholder="Title"
            value={title}
            onChange={(event) => this.setState({title: event.target.value})}
            multiline
          />
          <Tooltip title="If this box is checked, then when you un-draft (i.e. publish) the converted post, it will copy over the child comments of the original comment. This is only available when converting top-level shortform comments.">
            <div 
              className={classNames(classes.checkboxGroup, {[classes.disabled]: !canMoveChildComments})} 
              onClick={() => this.setState(prevState=>({moveChildComments: !prevState.moveChildComments}))}
            > 
              <Checkbox 
                disabled={!canMoveChildComments}
                classes={{root: classes.checkbox}}
                checked={moveChildComments} /> 
                Move comments (after post is un-drafted)
            </div>
          </Tooltip>
          <div className={classes.helpText}>This will convert this comment into a draft post, which you can then edit and publish when ready</div>

        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.handleConvert} disabled={!this.state.title}>
            Convert
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

registerComponent(
  'ConvertToPostDialog', 
  ConvertToPostDialog, 
  withDialog, 
  withNavigation,
  withUser,
  withStyles(styles, {name:"ConvertToPostDialog"}),
  [withDocument, {
    collection: Comments,
    queryName: 'CommentConvertingToPostQuery',
    fragmentName: 'CommentEdit',
  }],
  [withCreate, {
    collection: Posts,
    fragmentName: 'PostsPage',
  }], 
  [withUpdate, {
    collection: Comments,
    fragmentName: 'CommentEdit',
  }], 
);
