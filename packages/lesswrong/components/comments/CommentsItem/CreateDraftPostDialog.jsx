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
    opacity: .5,
    cursor: "default"
  }
})

class CreateDraftPostDialog extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      moveChildComments: this.canMoveChildComments() // for the time being, "can move" and "default to move" comments happen to be the same, but this is mostly a coincidence due to limitations of the move children function (and in turn, lack of ancestors-field for comments which would make it easier to move subsets of comments
    };
  } 

  canMoveChildComments = () => {
    const { currentUser, comment } = this.props
    return Users.canMoveChildComments(currentUser, comment) && !comment.topLevelCommentId && comment.shortform
  }

  toggleMoveComments = () => {
    if (this.canMoveChildComments()) {
      this.setState(prevState=>({moveChildComments: !prevState.moveChildComments}))
    }
  }

  handleConvert = async () => {
    const { currentUser, createPost, updateComment, document, history, onClose } = this.props;
    const { title, moveChildComments } = this.state

    // note — this post will have the userID of whoever is creating it (not necessarily that of the author)
    // I think that's probably actually preferable, but not sure (this shoudl only come up for Sunshines/Admins)
    let data = {
      title: title,
      draft: true,
      contents: {
        originalContents: document.contents.originalContents
      },
      convertedFromCommentId: document._id,
      moveCommentsFromConvertedComment: moveChildComments
    }
    const response = await createPost({ data })
    const postId = response.data.createPost.data._id
    history.push({pathname: '/editPost', search: `?postId=${postId}&eventForm=false`})
    onClose()
  }

  render() {
    const { classes, onClose } = this.props
    const { title, moveChildComments } = this.state

    const canMoveChildComments = this.canMoveChildComments()

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
              onClick={this.toggleMoveComments}
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
  'CreateDraftPostDialog', 
  CreateDraftPostDialog, 
  withDialog, 
  withNavigation,
  withUser,
  withStyles(styles, {name:"CreateDraftPostDialog"}),
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
