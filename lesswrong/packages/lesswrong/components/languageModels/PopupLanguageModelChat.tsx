import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import Fullscreen from '@material-ui/icons/Fullscreen';
import FullscreenExit from '@material-ui/icons/FullscreenExit';
import { useLlmChat } from './LlmChatWrapper';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LLM_CHAT_EXPANDED, SHOW_LLM_CHAT_COOKIE } from '@/lib/cookies/cookies';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import classNames from 'classnames';
import { LanguageModelChat } from "@/components/languageModels/LanguageModelChat";
import LWTooltip from "@/components/common/LWTooltip";
import ForumIcon from "@/components/common/ForumIcon";

const styles = (theme: ThemeType) => ({
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
  expanded: {
    width: 650,
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
  },
  header: {
    backgroundColor: theme.palette.grey[100],
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative",
    display: "flex",
    justifyContent: "space-between",
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
  classes: ClassesType<typeof styles>
}) => {
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
      <div className={classes.header}>
        <div className={classes.title}>
          {title}
          <LWTooltip title="LLM chat is under development. Reviewing user conversations helps with product decisions.">
            <div className={classes.privacyWarning}>
              Warning! Conversation may be viewed by the LW dev team
            </div>
          </LWTooltip>
        </div>
        <div className={classes.icons}>
          <ForumIcon icon={expanded ? "FullscreenExit" : "Fullscreen"} className={classes.icon} onClick={toggleExpanded} />
          <CloseIcon className={classes.icon} onClick={handleClose} />
        </div>
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

export default PopupLanguageModelChatComponent;
