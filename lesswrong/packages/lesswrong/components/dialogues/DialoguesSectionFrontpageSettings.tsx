import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames'
import { useCurrentUser } from '../common/withUser';
import { isFriendlyUI } from '../../themes/forumTheme';
import MetaInfo from "@/components/common/MetaInfo";
import { Checkbox, Tooltip } from "@/components/mui-replacement";

const USER_SETTING_NAMES = {
  showDialogues: 'showDialoguesList',
  showMyDialogues: 'showMyDialogues',
  showMatches: 'showMatches',
  showRecommendedPartners: 'showRecommendedPartners'
}

const styles = (theme: ThemeType) => ({
  root: {
    display: "block",
    marginTop: isFriendlyUI ? 10 : undefined,
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down('xs')]: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-evenly",
      flexDirection: "column",
      flexWrap: "nowrap",
    },
  },
  hidden: {
    display: "none",
    overflow: "hidden",
  },
  setting: {
    [theme.breakpoints.down('xs')]: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
  }
})

const DialoguesSectionFrontpageSettings = ({hidden, currentShowDialogues, currentShowMyDialogues, classes}: {
  hidden: boolean,
  currentShowDialogues: boolean,
  currentShowMyDialogues: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const setSetting = (type: keyof typeof USER_SETTING_NAMES, newSetting: boolean) => {
    if (currentUser) {
      void updateCurrentUser({
        [USER_SETTING_NAMES[type]]: newSetting,
      })
    }
  }

  return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
          <Tooltip title="Dialogues with new content">
            <div className={classes.setting}>
              <Checkbox 
                style={{padding: 7}}
                checked={currentShowDialogues}
                onChange={() => setSetting('showDialogues', !currentShowDialogues)}
              />
              <MetaInfo>Show Dialogues</MetaInfo>
            </div>
          </Tooltip>
          <Tooltip title="Dialogues you're involved in">
            <div className={classes.setting}>
              <Checkbox
                style={{padding: 7}}
                checked={currentShowMyDialogues}
                onChange={() => setSetting('showMyDialogues', !currentShowMyDialogues)}
              />
              <MetaInfo>Show My Dialogues</MetaInfo>
            </div>
          </Tooltip>
      </div>
  );
};

const DialoguesSectionFrontpageSettingsComponent = registerComponent(
  'DialoguesSectionFrontpageSettings', DialoguesSectionFrontpageSettings, { styles }
);

declare global {
  interface ComponentTypes {
    DialoguesSectionFrontpageSettings: typeof DialoguesSectionFrontpageSettingsComponent
  }
}

export default DialoguesSectionFrontpageSettingsComponent;
