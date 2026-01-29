import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { LanguageModelChat } from './LanguageModelChat';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useLlmChat } from './LlmChatWrapper';

const styles = defineStyles('SidebarLanguageModelChat', (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    width: 500,
    minWidth: 500,
    height: "100vh",
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('md')]: {
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
    flexShrink: 0,
  },
  editor: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexGrow: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
}));

const PLACEHOLDER_TITLE = "LLM Chat: New Conversation"

const SidebarLanguageModelChat = ({onClose}: {
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const { currentConversation } = useLlmChat();

  const title = currentConversation?.title ?? PLACEHOLDER_TITLE;

  return <div className={classes.root}>
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
        <ForumIcon icon="Close" className={classes.icon} onClick={onClose} />
      </div>
    </div>
    <div className={classes.editor}>
      <LanguageModelChat />
    </div>
  </div>
}

export default SidebarLanguageModelChat;
