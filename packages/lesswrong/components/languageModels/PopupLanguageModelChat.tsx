import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import { useLlmChat } from './LlmChatWrapper';

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
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative"
  },
  editor: {
    padding: 20,
    paddingBottom: 12,
  },
});

const PLACEHOLDER_TITLE = "LLM Chat: New Conversation"

const PopupLanguageModelChat = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType
}) => {
  const { LanguageModelChat } = Components;

  const { currentConversation } = useLlmChat();

  const title = currentConversation?.title ?? PLACEHOLDER_TITLE;

  return <Paper className={classes.root}>
    <div className={classes.header}>
      <div className={classes.title}>
        {title}
      </div>
      <CloseIcon className={classes.close} onClick={onClose}/>
    </div>
    <div className={classes.editor}>
      <LanguageModelChat />
    </div>
  </Paper>
}

const PopupLanguageModelChatComponent = registerComponent('PopupLanguageModelChat', PopupLanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    PopupLanguageModelChat: typeof PopupLanguageModelChatComponent
  }
}
