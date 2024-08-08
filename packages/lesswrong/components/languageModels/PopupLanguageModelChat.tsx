import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import { useNavigate } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    width: 600,
    position: "fixed",
    right: theme.spacing.unit,
    bottom: theme.spacing.unit,
    zIndex: theme.zIndexes.commentBoxPopup,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      right: 0,
      bottom: 0,
    }
  },
  title: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 4,
  },
  expandIcon: {
    height: 20,
    position: "absolute",
    right: 32,
    top: 10,
    cursor: "pointer",
    color: theme.palette.grey[400],
    '&:hover': {
      color: theme.palette.grey[600],
    }
  },
  close: {
    position: "absolute",
    right: 8,
    top: 10,
    cursor: "pointer",
    color: theme.palette.grey[400],
    height: 20,
    '&:hover': {
      color: theme.palette.grey[600],
    }
  },
  header: {
    backgroundColor: theme.palette.grey[100],
    paddingLeft: 20,
    paddingRight: 20,
    // TODO: If we change this to 8 here, should change it the other popup editor
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative"
  },
  editor: {
    padding: 20,
    paddingBottom: 12,
  },
});

//TODO: fix up comment for this different component
/**
 * PopupLanguageModel: Modeled after PopupLanguageModelChat. A floating window for LLM chat. Designed to be minimizable.
 * 
 * title: Shown in a title-bar above the comment editor
 * guidelines: (Optional) Shown above the comment editor, below the titlebar,
 *   styled as part of the window content.
 * commentFormProps: Passed through to CommentsNewForm. Used for things like
 *   specifying what post the comment is on, and prefilling props.
 * onClose: Called when the window is closed.
 */


const PopupLanguageModelChat = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType
}) => {
  const { LanguageModelChat } = Components;

  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  return <Paper className={classes.root}>
    <div className={classes.header}>
      <div className={classes.title}>
        {title}
      </div>
      <FullscreenIcon 
        onClick={()=> {
          onClose();
          navigate("/llm");
        }}
        className={classes.expandIcon} 
      />
      <CloseIcon className={classes.close} onClick={onClose}/>
    </div>
    <div className={classes.editor}>
      <LanguageModelChat setTitle={setTitle} />
      {/* <CommentsNewForm
        enableGuidelines={false}
        padding={false}
        successCallback={onClose}
        type="comment"
        formProps={{
          maxHeight: true
        }}
        {...llmFormProps}
      /> */}
    </div>
  </Paper>
}

const PopupLanguageModelChatComponent = registerComponent('PopupLanguageModelChat', PopupLanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    PopupLanguageModelChat: typeof PopupLanguageModelChatComponent
  }
}
