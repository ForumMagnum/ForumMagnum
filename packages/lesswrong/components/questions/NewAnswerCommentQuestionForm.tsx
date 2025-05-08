import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React, {useState} from 'react';
import classNames from 'classnames';
import FullscreenIcon from '@/lib/vendor/@material-ui/icons/src/Fullscreen';
import FullscreenExitIcon from '@/lib/vendor/@material-ui/icons/src/FullscreenExit';
import { afNonMemberDisplayInitialPopup } from "../../lib/alignment-forum/displayAFNonMemberPopups";
import { useCurrentUser } from "../common/withUser";
import { useDialog } from "../common/withDialog";
import { TooltipSpan } from '../common/FMTooltip';

const styles = (theme: ThemeType) => ({
  root: {
    borderTop: theme.palette.border.intense,
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
    width: "calc(50% - 12px)",
    textAlign: "center",
    padding: theme.spacing.unit*2,
    color: theme.palette.grey[500],
    marginRight: theme.spacing.unit*1.5,
    cursor: "pointer",
    '&:hover': {
      color: theme.palette.text.normal,
      borderBottom: theme.palette.border.normal,
    }
  },
  selected: {
    color: theme.palette.text.normal,
    borderBottom: theme.palette.border.slightlyIntense3,
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
    position: "fixed",
    inset: 0,
    backgroundColor: theme.palette.panelBackground.default,
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

const NewAnswerCommentQuestionFormInner = ({post, classes}: {
  post: PostsDetails,
  classes: ClassesType<typeof styles>,
}) => {
  const [selection, setSelection] = useState("answer");
  const [formFocus, setFormFocus] = useState(false);
  const currentUser = useCurrentUser()
  const { openDialog } = useDialog()
  const {CommentsNewForm} = Components;

  const toggleFormFocus = () => {
    setFormFocus(!formFocus);
  }

  const isAnswer = selection === "answer";

  return <div className={classes.root} onFocus={() => afNonMemberDisplayInitialPopup(currentUser, openDialog)}>
    <div className={classNames(classes.whitescreen, {[classes.displayWhitescreen]: formFocus})}/>
    <div className={classes.form}>
      <div className={classes.chooseResponseType}>
        <TooltipSpan title="Write an answer or partial-answer to the question (i.e. something that gives the question author more information, or helps others to do so)">
          <div onClick={()=>setSelection("answer")}
            className={classNames(classes.responseType, {[classes.selected]: selection === "answer"})}
          >
            New Answer
          </div>
        </TooltipSpan>
        <TooltipSpan title="Discuss the question or ask clarifying questions">
          <div onClick={()=>setSelection("comment")}
            className={classNames(classes.responseType, {[classes.selected]: selection === "comment"})}>
            New Comment
          </div>
        </TooltipSpan>
        <div className={classes.toggleFocus} onClick={toggleFormFocus}>
          {formFocus ?
            <TooltipSpan title="Exit focus mode">
              <FullscreenExitIcon />
            </TooltipSpan>
            :
            <TooltipSpan title="Enter focus mode">
              <FullscreenIcon />
            </TooltipSpan>
            }
        </div>
      </div>
      <div>
        <CommentsNewForm
          post={post}
          type="comment"
          isAnswer={isAnswer}
        />
      </div>
    </div>
  </div>
}

export const NewAnswerCommentQuestionForm = registerComponent('NewAnswerCommentQuestionForm', NewAnswerCommentQuestionFormInner, {styles});

declare global {
  interface ComponentTypes {
    NewAnswerCommentQuestionForm: typeof NewAnswerCommentQuestionForm
  }
}
