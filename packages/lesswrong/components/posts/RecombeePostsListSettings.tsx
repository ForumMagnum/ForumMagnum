import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { RecombeeConfiguration } from '../../lib/collections/users/recommendationSettings';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import isEqual from 'lodash/isEqual';
import { randomId } from '../../lib/random';

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
  userOverride: {
    padding: 8,
    width: 280,
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
  const { UserSelect, LWTooltip } = Components;

  const [userIdOverride, setUserIdOverride] = useState<string | null>(settings.userId ?? null);
  const [boosterOverride, setBoosterOverride] = useState<string | undefined>(settings.booster);
  const [rotationRateOverride, setRotationRateOverride] = useState<number>(settings.rotationRate);
  const [rotationTimeOverride, setRotationTimeOverride] = useState<number>(settings.rotationTime);

  const updateAdminOverrides = (e?: React.FocusEvent | React.MouseEvent, forceUpdate?: boolean) => {
    const { refreshKey: oldRefreshKey, ...oldSettings } = settings;

    const newSettings = {
      userId: userIdOverride ?? undefined,
      booster: boosterOverride,
      rotationRate: rotationRateOverride,
      rotationTime: rotationTimeOverride,
    };

    if (forceUpdate || !isEqual(oldSettings, newSettings)) {
      updateSettings({
        ...newSettings,
        ...{ refreshKey: forceUpdate ? randomId() : oldRefreshKey },
      });
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

  useEffect(() => {
    setUserIdOverride(settings.userId ?? null);
    setBoosterOverride(settings.booster);
    setRotationRateOverride(settings.rotationRate);
    setRotationTimeOverride(settings.rotationTime);
  }, [settings]);

  return (
    <div className={classes.adminOverrides}>
      <div className={classes.adminOverridesRow}>
        <div className={classes.userOverride}>
          <UserSelect value={userIdOverride} setValue={updateUserIdOverride} label='Override with user' />
        </div>
        <div className={classes.adminOverrideItem}>
          <LWTooltip title="You may penalize an item for being recommended in the near past. For the specific user, rotationRate=1 means maximal rotation, rotationRate=0 means absolutely no rotation. You may also use, for example, rotationRate=0.2 for only slight rotation of recommended items.">
            <label>Rotation Rate:</label>
          </LWTooltip>
          <Input type="number" id="rotationRate" value={rotationRateOverride} onChange={updateRotationRateOverride} onBlur={updateAdminOverrides} />
        </div>
        <div className={classes.adminOverrideItem}>
          <LWTooltip title="Taking Rotation Rate into account, specifies how long it takes for an item to recover from the penalization. For example, rotationTime=2 means that items recommended less than 2 hours ago are penalized.">
            <label>Rotation Time(hours):</label>
          </LWTooltip>
          <Input type="number" id="rotationTime" value={rotationTimeOverride} onChange={updateRotationTimeOverride} onBlur={updateAdminOverrides} />
        </div>
        <Button className={classes.refreshButton} onClick={() => updateAdminOverrides(undefined, true)}>Refresh</Button>
      </div>

      <div className={classes.adminOverridesRow}>
        <div className={classes.adminOverrideItem}>
          <LWTooltip title={`Number-returning “ReQL” expression, which allows you to boost the recommendation rate of some items based on the values of their attributes. e.g. "if ‘curated’ then 1.5 else 1"`}>
            <label>Booster ReQL:</label>
          </LWTooltip>
          {/* <Input type="text" id="booster" value={boosterOverride} onChange={updateBoosterOverride} onBlur={updateAdminOverrides} className={classes.boosterOverride} multiline /> */}
          <TextField id="booster" value={boosterOverride} onChange={updateBoosterOverride} onBlur={updateAdminOverrides} className={classes.boosterOverride} multiline />
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
