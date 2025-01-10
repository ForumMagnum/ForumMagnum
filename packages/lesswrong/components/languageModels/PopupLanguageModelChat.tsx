import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';
import { useLlmChat } from './LlmChatWrapper';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LLM_CHAT_EXPANDED, SHOW_LLM_CHAT_COOKIE } from '@/lib/cookies/cookies';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    background: "unset",
    width: 425,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "fixed",
    right: theme.spacing.unit,
    top: '50vh',
    transform: 'translateY(-50%)',
    zIndex: theme.zIndexes.languageModelChat,
    boxShadow: 'unset',
    paddingLeft: 3,
    paddingRight: 3,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  expanded: {
    background: theme.palette.panelBackground.default,
    width: 650,
    boxShadow: theme.palette.boxShadow.lwCard,
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
  icon: {
    marginLeft: 2,
    cursor: "pointer",
    color: theme.palette.grey[400],
    height: 20,
    '&:hover': {
      color: theme.palette.grey[600],
    }
  },
  icons: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "absolute",
    top: 14,
    right: 10,
  },
  header: {
    position: "absolute",
    top: 0,
    right: 0,
    display: "flex",
    justifyContent: "flex-end",
  },
  editor: {
    position: "relative",
    boxShadow: `0px 0px 5px 0px ${theme.palette.background.pageActiveAreaBackground}`,
    borderRadius: 6,
  },
});

const PLACEHOLDER_TITLE = "LLM Chat: New Conversation"

const PopupLanguageModelChat = ({onClose, classes}: {
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const { LanguageModelChat, LWTooltip, ForumIcon } = Components;

  const { currentConversation } = useLlmChat();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_LLM_CHAT_COOKIE, LLM_CHAT_EXPANDED]);
  const expanded = cookies[LLM_CHAT_EXPANDED] === "true";

  const title = currentConversation?.title ?? PLACEHOLDER_TITLE;

  const handleClose = () => {
    setCookie(SHOW_LLM_CHAT_COOKIE, "false", { path: "/" });
    onClose();
  }

  const toggleExpanded = () => {
    setCookie(LLM_CHAT_EXPANDED, expanded ? "false" : "true", { path: "/"})
  }

  return <Paper className={classNames(classes.root, {[classes.expanded]: expanded})}>
    <AnalyticsContext pageSectionContext='llmChatPopup'>
      <div className={classes.editor}>
        <div className={classes.icons}>
          <ForumIcon icon={expanded ? "FullscreenExit" : "Fullscreen"} className={classes.icon} onClick={toggleExpanded} />
          <CloseIcon className={classes.icon} onClick={handleClose} />
        </div>
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
