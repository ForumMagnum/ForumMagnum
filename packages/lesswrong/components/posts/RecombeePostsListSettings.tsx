import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import isEqual from 'lodash/isEqual';

const styles = (theme: ThemeType) => ({
  adminOverrides: {
    display: 'flex',
    flexDirection: 'column',
  },
  adminOverridesRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'end',
  },
  adminOverrideItem: {
    padding: 8,
    width: 180,
  },
  boosterOverride: {
    width: 600
  },
  refreshButton: {
    alignSelf: 'center',
    background: theme.palette.greyAlpha(0.1)
  },
});

export const RecombeePostsListSettings = ({ settings, updateSettings, classes }: {
  settings: RecombeeConfiguration,
  updateSettings: (settings: RecombeeConfiguration) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const { UserSelect } = Components;

  const [userIdOverride, setUserIdOverride] = useState<string | null>(settings.userId ?? null);
  const [boosterOverride, setBoosterOverride] = useState<string | undefined>(settings.booster);
  const [rotationRateOverride, setRotationRateOverride] = useState<number>(settings.rotationRate);
  const [rotationTimeOverride, setRotationTimeOverride] = useState<number>(settings.rotationTime);

  const updateAdminOverrides = (e?: React.FocusEvent | React.MouseEvent, forceUpdate?: boolean) => {
    const newSettings = {
      userId: userIdOverride ?? undefined,
      booster: boosterOverride,
      rotationRate: rotationRateOverride,
      rotationTime: rotationTimeOverride,
    };

    if (forceUpdate || !isEqual(settings, newSettings)) {
      updateSettings(newSettings);
    }
  };

  const updateUserIdOverride = (newUserIdOverride: string | null) => {
    setUserIdOverride(newUserIdOverride);
    updateAdminOverrides();
  };

  const updateBoosterOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    setBoosterOverride(e.target.value);
  };

  const updateRotationRateOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue: number = parseFloat(e.target.value);
    if (isNaN(newValue)) newValue = 0;
    setRotationRateOverride(newValue);
  };

  const updateRotationTimeOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue: number = parseFloat(e.target.value);
    if (isNaN(newValue)) newValue = 0;
    setRotationTimeOverride(newValue);
  };

  return (
    <div className={classes.adminOverrides}>
      <div className={classes.adminOverridesRow}>
        <div className={classes.adminOverrideItem}>
          <UserSelect value={userIdOverride} setValue={updateUserIdOverride} label='Override with user' />
        </div>
        <div className={classes.adminOverrideItem}>
          <label>Rotation Rate:</label>
          <Input type="number" id="rotationRate" value={rotationRateOverride} onChange={updateRotationRateOverride} onBlur={updateAdminOverrides} />
        </div>
        <div className={classes.adminOverrideItem}>
          <label>Rotation Time:</label>
          <Input type="number" id="rotationTime" value={rotationTimeOverride} onChange={updateRotationTimeOverride} onBlur={updateAdminOverrides} />
        </div>
        <Button className={classes.refreshButton} onClick={() => updateAdminOverrides(undefined, true)}>Refresh</Button>
      </div>

      <div className={classes.adminOverridesRow}>
        <div className={classes.adminOverrideItem}>
          <label>Booster ReQL:</label>
          <Input type="text" id="booster" value={boosterOverride} onChange={updateBoosterOverride} onBlur={updateAdminOverrides} className={classes.boosterOverride} multiline />
        </div>
      </div>
    </div>
  );
}

const RecombeePostsListSettingsComponent = registerComponent('RecombeePostsListSettings', RecombeePostsListSettings, {styles});

declare global {
  interface ComponentTypes {
    RecombeePostsListSettings: typeof RecombeePostsListSettingsComponent
  }
}
