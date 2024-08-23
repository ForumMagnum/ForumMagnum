// TODO: Import component in components.ts
import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useDialog } from '../common/withDialog';

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
    // TODO: Figure out for dark mode
    backgroundColor: theme.palette.grey[100],
    boxShadow: "0 1px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 32px 0 rgba(0, 0, 0, 0.16)",
    // add hover styling
    "&:hover": {
      boxShadow: "0 6px 8px rgba(0, 0, 0, 0.2)"
    },
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
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

  const onClickLanguageModelLauncher = useCallback(() => {
    captureEvent("languageModelLauncherButtonClicked");
    openDialog({
      componentName:"PopupLanguageModelChat",
      }
    )},[openDialog, captureEvent]);

  return <div className={classes.root} onClick={onClickLanguageModelLauncher}>
    <ForumIcon icon="Sparkles" className={classes.icon} />
  </div>;
}

const LanguageModelLauncherButtonComponent = registerComponent('LanguageModelLauncherButton', LanguageModelLauncherButton, {styles});

declare global {
  interface ComponentTypes {
    LanguageModelLauncherButton: typeof LanguageModelLauncherButtonComponent
  }
}
