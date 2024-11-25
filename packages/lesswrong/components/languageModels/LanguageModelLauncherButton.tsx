import React, { useCallback, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useDialog } from '../common/withDialog';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { SHOW_LLM_CHAT_COOKIE } from '@/lib/cookies/cookies';

const styles = (theme: ThemeType) => ({
  root: {
    position: "fixed",
    bottom: 20,
    right: 80,
    zIndex: theme.zIndexes.languageModelChatButton,
    ...theme.typography.body2,
    fontSize: '1.1rem',
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    width: 100,
    padding: 10,
    cursor: "text",
    // TODO: Currently the shadow and animation effects on hover don't show up in darkmode
    boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
    transition: 'all 0.2s ease-in-out',
    "&:hover": {
      padding: 4,
      bottom: 18,
      right: 78,
      width: 104,
      height: 52,
      borderRadius: 26,
    },
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    color: theme.palette.grey[500],
    backgroundColor: theme.palette.background.pageActiveAreaBackground
  },
  icon: {
    width: 20,
    height: 20,
    marginLeft: -4,
    marginRight: 8,
    color: theme.palette.grey[900]
  }
});

export const LanguageModelLauncherButton = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { ForumIcon } = Components;
  const { openDialog } = useDialog();
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_LLM_CHAT_COOKIE]);

  const openLlmChat = useCallback(() => {
    captureEvent("languageModelLauncherButtonClicked");
    openDialog({
      componentName:"PopupLanguageModelChat",
    })
    setCookie(SHOW_LLM_CHAT_COOKIE, "true", { path: "/" });
  },[openDialog, captureEvent, setCookie]);

  useEffect(() => {
    if (cookies[SHOW_LLM_CHAT_COOKIE]==="false") {
      return;
    }
    openLlmChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className={classes.root} onClick={openLlmChat}>
    <ForumIcon icon="Sparkles" className={classes.icon} /> Chat...
  </div>;
}

const LanguageModelLauncherButtonComponent = registerComponent('LanguageModelLauncherButton', LanguageModelLauncherButton, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelLauncherButton: typeof LanguageModelLauncherButtonComponent
  }
}
