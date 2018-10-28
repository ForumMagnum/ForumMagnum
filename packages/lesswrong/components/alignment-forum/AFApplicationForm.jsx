import React, { PureComponent } from 'react';
import { registerComponent, withMessages, Components, withUpdate } from 'meteor/vulcan:core';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import Users from 'meteor/vulcan:users';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles'

class AFApplicationForm extends PureComponent {
  state = { applicationText: "" }

  handleSubmission = (event) => {
    const { currentUser, updateUser, flash, onRequestClose } = this.props
    event.preventDefault();
    updateUser({
      selector: { _id: currentUser._id },
      data: {
        afSubmittedApplication: true,
        afApplicationText: this.state.applicationText,
      }
    }).then(()=>{
      flash({messageString: "Successfully submitted application", type: "success"})
      onRequestClose()
    }).catch(/* error */);
  }

  render() {
    const { onRequestClose } = this.props
    return (
      <Dialog open={true} onClose={onRequestClose}>
        <DialogTitle>
          AI Alignment Forum Membership Application
        </DialogTitle>
        <DialogContent>
          <p>
            Most applications to the AI Alignment Forum are rejected, and we instead recommend that you participate in technical AI Alignment Discussion on LessWrong.com. If your content there meets the quality standards of the forum, it will be promoted to the AI Alignment Forum, and we will naturally evaluate every user whose content has been upvoted by existing AI Alignment Forum members, and will give them membership when we think they have demonstrated the relevant knowledge and skill.
          </p>
          <p>
            However, if you have contributed to technical AI Alignment research outside of LessWrong and think that those contributions will be sufficient to gain membership to the AI Alignment Forum, then you can provide us with links to those below and we will review them in the following days. Links to papers, blog posts and comments are going to be most useful.
          </p>
          <br/>
          <TextField
            id="comment-menu-item-delete-reason"
            label="Write application text here"
            className="comments-delete-modal-textfield"
            value={this.state.applicationText}
            onChange={e => this.setState({applicationText:e.target.value})}
            fullWidth
            multiline
            rows={4}
            rowsMax={100}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onRequestClose}>
            Cancel
          </Button>
          <Button color="primary" onClick={this.handleSubmission}>
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'SuggestAlignmentUser',
};

registerComponent('AFApplicationForm', AFApplicationForm, withMessages, [withUpdate, withUpdateOptions], withUser);
