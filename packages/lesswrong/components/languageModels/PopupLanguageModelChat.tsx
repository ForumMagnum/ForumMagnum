import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import { useLlmChat } from './LlmChatWrapper';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { SHOW_LLM_CHAT_COOKIE } from '@/lib/cookies/cookies';
import { AnalyticsContext } from '@/lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    width: 500,
    maxHeight: "calc(100vh - 80px)",
    position: "fixed",
    right: theme.spacing.unit,
    bottom: theme.spacing.unit,
    zIndex: theme.zIndexes.languageModelChat,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  title: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 4,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    rowGap: 5,
    columnGap: 10,
    marginRight: 5
  },
  privacyWarning: {
    ...theme.typography.commentStyle,
    color: theme.palette.error.main,
    fontStyle: "italic",
    fontWeight: 350,
    fontSize: "0.9em"
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
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
});

const PLACEHOLDER_TITLE = "LLM Chat: New Conversation"

const PopupLanguageModelChat = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType
}) => {
  const { LanguageModelChat, LWTooltip } = Components;

  const { currentConversation } = useLlmChat();
  const [_, setCookies] = useCookiesWithConsent([SHOW_LLM_CHAT_COOKIE]);

  const title = currentConversation?.title ?? PLACEHOLDER_TITLE;

  const handleClose = () => {
    setCookies(SHOW_LLM_CHAT_COOKIE, "false");
    onClose();
  }

  return <Paper className={classes.root}>
    <AnalyticsContext pageSectionContext='llmChatPopup'>
      <div className={classes.header}>
        <div className={classes.title}>
          {title}
          <LWTooltip title="LLM chat is under development. Reviewing user conversations helps with product decisions.">
            <div className={classes.privacyWarning}>
              Warning! Conversation may be viewed by the LW dev team
            </div>
          </LWTooltip>
        </div>
        <CloseIcon className={classes.close} onClick={handleClose} />
      </div>
      <div className={classes.editor}>
        <LanguageModelChat />
      </div>
    </AnalyticsContext>
  </Paper>
}

const PopupLanguageModelChatComponent = registerComponent('PopupLanguageModelChat', PopupLanguageModelChat, {styles});

declare global {
  interface ComponentTypes {
    PopupLanguageModelChat: typeof PopupLanguageModelChatComponent
  }
}
