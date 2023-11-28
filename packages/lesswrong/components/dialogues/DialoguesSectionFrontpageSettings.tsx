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
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-evenly",
    marginTop: isFriendlyUI ? 10 : undefined,
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
      flexWrap: "nowrap",
    },
  },
  hidden: {
    display: "none", // Uses CSS to show/hide
    overflow: "hidden",
  },
  checkbox: {
    padding: "1px 12px 0 0",
    paddingRight: isFriendlyUI ? 6 : undefined,
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

const DialoguesSectionFrontpageSettings = ({persistentSettings, hidden, currentShowDialogues, currentShowMyDialogues, currentShowMatches, currentShowRecommendedPartners, hideReciprocityButtons, classes}: {
  persistentSettings?: any,
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

  const setSetting = (type: keyof typeof USER_SETTING_NAMES, newSetting: any) => {
    if (currentUser && persistentSettings) {
      void updateCurrentUser({
        [USER_SETTING_NAMES[type]]: newSetting,
      })
    }
  }

  return (
      <div className={classNames(classes.root, {[classes.hidden]: hidden})}>
        <div>
          <Tooltip title="Toggle to show/hide dialogues">
            <>
              <Checkbox
                checked={currentShowDialogues}
                onChange={() => setSetting('showDialogues', !currentShowDialogues)}
              />
              <MetaInfo>Show Dialogues</MetaInfo>
            </>
          </Tooltip>
          <Tooltip title="Toggle to show/hide my dialogues">
            <>
              <Checkbox
                checked={currentShowMyDialogues}
                onChange={() => setSetting('showMyDialogues', !currentShowMyDialogues)}
              />
              <MetaInfo>Show My Dialogues</MetaInfo>
            </>
          </Tooltip>
          {!hideReciprocityButtons && <Tooltip title="Toggle to show/hide matches">
            <>
              <Checkbox
                checked={currentShowMatches}
                onChange={() => setSetting('showMatches', !currentShowMatches)}
              />
              <MetaInfo>Show Matches</MetaInfo>
            </>
          </Tooltip>}
          {!hideReciprocityButtons && <Tooltip title="Toggle to show/hide recommended partners">
            <>
              <Checkbox
                checked={currentShowRecommendedPartners}
                onChange={() => setSetting('showRecommendedPartners', !currentShowRecommendedPartners)}
              />
              <MetaInfo>Show Recommended Partners</MetaInfo>
            </>
          </Tooltip>}
        </div>
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
