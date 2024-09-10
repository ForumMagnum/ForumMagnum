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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    width: 48,
    height: 48,
    padding: 10,
    cursor: "pointer",
    // TODO: Currently the shadow and animation effects on hover don't show up in darkmode
    boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
    "&:hover": {
      boxShadow: `0 6px 8px ${theme.palette.greyAlpha(0.2)}`
    },
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    ...(theme.palette.intercom ? {
      color: theme.palette.text.alwaysBlack,
      backgroundColor: theme.palette?.intercom?.buttonBackground ?? theme.palette.grey[100],
    } : {
      backgroundColor: theme.palette.grey[100],
    })
  },
  icon: {
    witdh: 24,
    height: 24,
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
    <ForumIcon icon="Sparkles" className={classes.icon} />
  </div>;
}

const LanguageModelLauncherButtonComponent = registerComponent('LanguageModelLauncherButton', LanguageModelLauncherButton, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelLauncherButton: typeof LanguageModelLauncherButtonComponent
  }
}
