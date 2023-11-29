import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames'
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import { useCurrentUser } from '../common/withUser';
import { isFriendlyUI } from '../../themes/forumTheme';

const USER_SETTING_NAMES = {
  showDialogues: 'showDialoguesList',
  showMyDialogues: 'showMyDialogues',
  showMatches: 'showMatches',
  showRecommendedPartners: 'showRecommendedPartners'
}

const styles = (theme: ThemeType): JssStyles => ({
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

const DialoguesSectionFrontpageSettings = ({hidden, currentShowDialogues, currentShowMyDialogues, currentShowMatches, currentShowRecommendedPartners, hideReciprocityButtons, classes}: {
  hidden: boolean,
  currentShowDialogues: boolean,
  currentShowMyDialogues: boolean,
  currentShowMatches: boolean,
  currentShowRecommendedPartners: boolean,
  hideReciprocityButtons: boolean
  classes: ClassesType,
}) => {
  const { MetaInfo } = Components
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
          {!hideReciprocityButtons && <Tooltip title="People you matched with on dialogue matching">
            <div className={classes.setting}>
              <Checkbox
                style={{padding: 7}}
                checked={currentShowMatches}
                onChange={() => setSetting('showMatches', !currentShowMatches)}
              />
              <MetaInfo>Show Matches</MetaInfo>
            </div>
          </Tooltip>}
          {!hideReciprocityButtons && <Tooltip title="Recommended partners for you to consider dialogueing with">
            <div className={classes.setting}>
              <Checkbox
                style={{padding: 7}}
                checked={currentShowRecommendedPartners}
                onChange={() => setSetting('showRecommendedPartners', !currentShowRecommendedPartners)}
              />
              <MetaInfo>Show Recommended Partners</MetaInfo>
            </div>
          </Tooltip>}
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
