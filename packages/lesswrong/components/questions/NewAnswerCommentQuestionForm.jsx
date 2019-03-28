import { Components, registerComponent, withMessages } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Comments } from '../../lib/collections/comments';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';

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
    padding: theme.spacing.unit,
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    color: theme.palette.grey[500],
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

  render () {
    const {post, classes, currentUser} = this.props
    const { NewAnswerForm, CommentsNewForm } = Components
    const { selection } = this.state 
  
    const prefilledProps = { 
      postId: post._id, 
      answer: true,
      af: Comments.defaultToAlignment(currentUser, post),
    }

    // Not sure what this thing is doing and if prefilledProps is the right thing to feed into it (if prefilledProps isn't otherwise being used)
    if (!Comments.options.mutations.new.check(currentUser, prefilledProps)) {
      return <FormattedMessage id="users.cannot_comment"/>;
    }
    
    let newForm

    switch(selection) {
      case "answer": 
        newForm = <NewAnswerForm post={post} alignmentForumPost={post.af} />
        break
      case "comment":
        newForm = <CommentsNewForm
          alignmentForumPost={post.af}
          postId={post._id}
          prefilledProps={{
            af: Comments.defaultToAlignment(currentUser, post)
          }}
          type="comment"
        />
        break
    }

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
          <Tooltip title="Discuss the question at the meta level (such as asking clarifying questions)">
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
          { newForm }
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
