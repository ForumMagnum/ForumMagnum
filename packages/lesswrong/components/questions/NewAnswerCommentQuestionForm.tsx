import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withMessages } from '../common/withMessages';
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import withUser from '../common/withUser';
import Tooltip from '@material-ui/core/Tooltip';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FullscreenExitIcon from '@material-ui/icons/FullscreenExit';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    borderTop: "solid 2px rgba(0,0,0,.5)",
    maxWidth:650 + (theme.spacing.unit*4),
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  chooseResponseType: {
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
  form: {
    position: "relative",
    zIndex: theme.zIndexes.textbox,
  },
  disabled: {
    cursor: "default",
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.grey[400],
      borderBottom: "unset"
    },
  },
  whitescreen: {
    display: "none",
    position: "absolute",
    left: -300,
    width: 3000,
    top: 0,
    height: 5000,
    backgroundColor: "white",
    zIndex: theme.zIndexes.questionPageWhitescreen,
  },
  displayWhitescreen: {
    display: "block"
  },
  toggleFocus: {
    cursor: "pointer",
    paddingTop: theme.spacing.unit*1.5,
    padding: theme.spacing.unit
  }
})

interface ExternalProps {
  post: PostsBase,
  refetch: any,
}
interface NewAnswerCommentQuestionFormProps extends ExternalProps, WithMessagesProps, WithUserProps, WithStylesProps {
}
interface NewAnswerCommentQuestionFormState {
  selection: string,
  formFocus: boolean,
}

class NewAnswerCommentQuestionForm extends PureComponent<NewAnswerCommentQuestionFormProps,NewAnswerCommentQuestionFormState> {
  state: NewAnswerCommentQuestionFormState = {
    selection: "answer",
    formFocus: false
  }

  toggleFormFocus = () => {
    this.setState((prevState) => ({formFocus: !prevState.formFocus}))
  }

  getNewForm = () => {
    const { post, refetch } = this.props
    const { selection } = this.state
    const { NewAnswerForm, CommentsNewForm, NewRelatedQuestionForm } = Components

    switch(selection) {
      case "answer":
        return <NewAnswerForm post={post} />
      case "comment":
        return <CommentsNewForm
          post={post}
          type="comment"
        />
      case "question":
       return <NewRelatedQuestionForm post={post} refetch={refetch}/>
    }
  }

  render () {
    const { classes } = this.props
    const { selection, formFocus } = this.state

    return (
        <div className={classes.root}>
          <div className={classNames(classes.whitescreen, {[classes.displayWhitescreen]: formFocus})}/>
          <div className={classes.form}>
            <div className={classes.chooseResponseType}>
              <Tooltip title="Write an answer or partial-answer to the question (i.e. something that gives the question author more information, or helps others to do so)">
                <div onClick={()=>this.setState({selection: "answer"})}
                  className={classNames(classes.responseType, {[classes.selected]: selection === "answer"})}
                >
                  New Answer
                </div>
              </Tooltip>
              <Tooltip title="Help break down this question into easier sub-questions, or explore new questions building off of it.">
                <div onClick={()=>this.setState({selection: "question"})}
                  className={classNames(classes.responseType, {[classes.selected]: selection === "question"})}>
                  Ask Related Question
                </div>
              </Tooltip>
              <Tooltip title="Discuss the question or ask clarifying questions">
                <div onClick={()=>this.setState({selection: "comment"})}
                  className={classNames(classes.responseType, {[classes.selected]: selection === "comment"})}>
                  New Comment
                </div>
              </Tooltip>
              <div className={classes.toggleFocus} onClick={this.toggleFormFocus}>
                {formFocus ?
                  <Tooltip title="Exit focus mode">
                    <FullscreenExitIcon />
                  </Tooltip>
                  :
                  <Tooltip title="Enter focus mode">
                    <FullscreenIcon />
                  </Tooltip>
                  }
              </div>
            </div>
            <div className={classes.responseForm}>
              { this.getNewForm() }
            </div>
          </div>
      </div>
    )
  }
}

const NewAnswerCommentQuestionFormComponent = registerComponent<ExternalProps>('NewAnswerCommentQuestionForm', NewAnswerCommentQuestionForm, {
  styles,
  hocs: [withMessages, withUser]
});

declare global {
  interface ComponentTypes {
    NewAnswerCommentQuestionForm: typeof NewAnswerCommentQuestionFormComponent
  }
}

