import { Components, registerComponent, withMessages, getSetting } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography'

const styles = theme => ({
  root: {
    maxWidth:650,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  chooseResponseType: {
    borderTop: "solid 3px rgba(0,0,0,.87)",
    display: "flex",
    justifyContent: "space-between",
    padding: theme.spacing.unit,
  },
  responseType: {
    ...theme.typography.commentStyle,
    fontSize: 16,
    width: "calc(33.3% - 12px)",
    textAlign: "center",
    padding: theme.spacing.unit*2,
    color: theme.palette.grey[500],
    marginRight: theme.spacing.unit*1.5,
    cursor: "pointer",
    '&:hover': {
      color: "rgba(0,0,0,.87)",
      borderBottom: "solid 1px rgba(0,0,0,.2)"
    }
  },
  selected: {
    color: "rgba(0,0,0,.87)",
    borderBottom: "solid 1px rgba(0,0,0,.4)"
  },
  responseForm: {
    padding: theme.spacing.unit*1.5,
  },
  disabled: {
    cursor: "default",
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.grey[400],
      borderBottom: "unset"
    }
  }
})

class NewAnswerCommentQuestionForm extends PureComponent {
  state = { selection: "answer"}

  getNewForm = () => {
    const {post, currentUser} = this.props
    const { selection } = this.state
    const { NewAnswerForm, CommentsNewForm } = Components

    if (!currentUser) {
      return <Components.LoginPopupLink>
        <Typography variant="body2">
          <a>
            <FormattedMessage id={!(getSetting('AlignmentForum', false)) ? "comments.please_log_in" : "alignment.comments.please_log_in"}/>
          </a>
        </Typography>
      </Components.LoginPopupLink>
    }

    switch(selection) {
      case "answer": 
        return <NewAnswerForm post={post} alignmentForumPost={post.af} />
      case "comment":
        return <CommentsNewForm
          alignmentForumPost={post.af}
          postId={post._id}
          prefilledProps={{
            af: Comments.defaultToAlignment(currentUser, post)
          }}
          type="comment"
        />
    }
  }

  render () {
    const { classes } = this.props
    const { selection } = this.state 

    return (
      <div className={classes.root}>
        <div className={classes.chooseResponseType}>
          <Tooltip title="Write an answer or partial-answer to the question (i.e. something that gives the question author more information, or helps others to do so)">
            <div onClick={()=>this.setState({selection: "answer"})} 
              className={classNames(classes.responseType, {[classes.selected]: selection === "answer"})}
            >
              New Answer
            </div>
          </Tooltip>
          <Tooltip title="Discuss the question or ask clarifying questions">
            <div onClick={()=>this.setState({selection: "comment"})} 
              className={classNames(classes.responseType, {[classes.selected]: selection === "comment"})}>
              New Comment
            </div>
          </Tooltip>
          <Tooltip title="...coming soon">
            <div className={classNames(classes.responseType, classes.disabled, {[classes.selected]: selection === "question"})}>
              Ask Related Question
            </div>
          </Tooltip>
        </div>
        <div className={classes.responseForm}>
          { this.getNewForm() }
        </div>
      </div>
    )
  }
}

NewAnswerCommentQuestionForm.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired
};

registerComponent('NewAnswerCommentQuestionForm', NewAnswerCommentQuestionForm, withMessages, withUser, withStyles(styles, {name:"NewAnswerCommentQuestionForm"}));
