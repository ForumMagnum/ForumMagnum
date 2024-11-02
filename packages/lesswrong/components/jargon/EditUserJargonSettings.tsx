// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useCurrentUser } from '../common/withUser';
import Checkbox from '@material-ui/core/Checkbox';

const styles = (theme: ThemeType) => ({
  root: {

  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  generationFlagCheckbox: {
    marginLeft: 10,
  },
});

export const EditUserJargonSettings = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const { LWTooltip, MetaInfo } = Components;
  return <>
      <LWTooltip title="Automatically query jargon for all drafts">
        <div className={classes.checkboxContainer}>
          <MetaInfo>All drafts</MetaInfo>
          <Checkbox
            className={classes.generationFlagCheckbox}
            checked={currentUser?.generateJargonForDrafts}
            onChange={(e) => updateCurrentUser({generateJargonForDrafts: e.target.checked})}
          />
        </div>
      </LWTooltip>
      <LWTooltip title="Automatically query jargon for all published posts">
        <div className={classes.checkboxContainer}>
          <MetaInfo>All published posts</MetaInfo>
          <Checkbox
            className={classes.generationFlagCheckbox}
            checked={currentUser?.generateJargonForPublishedPosts}
            onChange={(e) => updateCurrentUser({generateJargonForPublishedPosts: e.target.checked})}
          />
        </div>
      </LWTooltip>
  </>;
}

const EditUserJargonSettingsComponent = registerComponent('EditUserJargonSettings', EditUserJargonSettings, {styles});

declare global {
  interface ComponentTypes {
    EditUserJargonSettings: typeof EditUserJargonSettingsComponent
  }
}
