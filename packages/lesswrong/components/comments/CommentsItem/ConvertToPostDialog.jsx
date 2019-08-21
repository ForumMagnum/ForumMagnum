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

const styles = theme => ({
  title: {
    fontStyle: theme.typography.postStyle,
    fontSize: "1.3rem"
  }
})

class ConvertToPostDialog extends PureComponent {
  state = { title: "", moveComments: null }

  handleConvert = async () => {
    const { createPost, updateComment, document, history, onClose } = this.props;
    const { title, moveComments } = this.state
    const response = await createPost({
      data: {
        title: title,
        draft: true,
        contents: {
          originalContents: {
            data: document.contents.draftJS,
            type: "draftJS",
          }
        },
        userId: document.userId,
        convertedFromCommentId: document._id,
        moveCommentsFromConvertedComment: moveComments
      }
    })
    const postId = response.data.createPost.data._id
    updateComment({
      selector: { _id: document._id},
      data: {
        convertedToPostId: postId
      },
    })
    history.push({pathname: `/posts/${postId}`})
    onClose()
  }

  render() {
    const { classes, onClose, defaultMoveComments, currentUser } = this.props
    const { title, moveComments } = this.state

    const canMoveComments = Users.canDo('comments.copyConvertedComments.all', currentUser) || defaultMoveComments

    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>
          Convert Comment to Post
        </DialogTitle>
        <DialogContent>
          <Input
            className={classes.title}
            placeholder="Title"
            value={title}
            onChange={(event) => this.setState({title: event.target.value})}
            multiline
          />
          <div> 
            <Checkbox 
              disabled={!canMoveComments}
              checked={moveComments} 
              onChange={() => this.setState(prevState=>({moveComments: !prevState.moveComments}))}/> 
              Move Comments
          </div>
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
