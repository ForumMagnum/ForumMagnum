import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { RecombeeAlgorithm, RecommendationsAlgorithm, isRecombeeAlgorithm } from '../../lib/collections/users/recommendationSettings';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { randomId } from '../../lib/random';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';

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
    width: 400
  },
});

export const HomepageRecommendations = ({ recommendationSettings, currentUser, classes }: {
  recommendationSettings: RecommendationsAlgorithm,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const { RecommendationsList, SingleColumnSection, SectionTitle, SettingsButton, UserSelect } = Components;

  const [adminOverridesVisible, setAdminOverridesVisible] = useState(false);
  const [userIdOverride, setUserIdOverride] = useState<string | null>(null);
  const [scenarioOverride, setScenarioOverride] = useState<string>('');
  const [boosterOverride, setBoosterOverride] = useState<string>('');
  const [countOverride, setCountOverride] = useState<number>(recommendationSettings.count ?? 3);
  const [rotationRateOverride, setRotationRateOverride] = useState<number>(0);
  const [rotationTimeOverride, setRotationTimeOverride] = useState<number>(7200);

  const [adminOverrides, setAdminOverrides] = useState<RecombeeAlgorithm['adminOverrides'] & { refetchKey?: string }>({});

  const updateAdminOverrides = () => {
    setAdminOverrides({
      ...adminOverrides,
      userId: userIdOverride ?? undefined,
      scenario: scenarioOverride,
      booster: boosterOverride,
      count: countOverride,
      rotationRate: rotationRateOverride,
      rotationTime: rotationTimeOverride,
      // This is to force pressing the "Refresh" button to cause a different value to be appended to the batchKey in `withRecommendations`, even though none of the actual settings changed
      refetchKey: randomId()
    });
  };

  const updateUserIdOverride = (newUserIdOverride: string | null) => {
    setUserIdOverride(newUserIdOverride);
    updateAdminOverrides();
  };

  const updateScenarioOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    setScenarioOverride(e.target.value);
  };

  const updateBoosterOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    setBoosterOverride(e.target.value);
  };

  const updateCountOverride = (e: React.FocusEvent<HTMLInputElement>) => {
    let newValue: number = parseFloat(e.target.value);
    if (isNaN(newValue)) newValue = 3;
    setCountOverride(newValue);
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

  if (isRecombeeAlgorithm(recommendationSettings)) {
    recommendationSettings.adminOverrides = adminOverrides;
  }

  const recombeeRecommendationOverrideControls = <div className={classes.adminOverrides}>
    <div className={classes.adminOverridesRow}>
      <div className={classes.adminOverrideItem}>
        <UserSelect value={userIdOverride} setValue={updateUserIdOverride} label='Override with user' />
      </div>
      <div className={classes.adminOverrideItem}>
        <label>Scenario:</label>
        <Input type="text" id="scenario" value={scenarioOverride} onChange={updateScenarioOverride} onBlur={updateAdminOverrides} />
      </div>
      <div className={classes.adminOverrideItem}>
        <label>Count:</label>
        <Input type="number" id="count" value={countOverride} onChange={updateCountOverride} onBlur={updateAdminOverrides} />
      </div>
      <Button onClick={updateAdminOverrides}>Refresh</Button>
    </div>

    <div className={classes.adminOverridesRow}>
      <div className={classes.adminOverrideItem}>
        <label>Rotation Rate:</label>
        <Input type="number" id="rotationRate" value={rotationRateOverride} onChange={updateRotationRateOverride} onBlur={updateAdminOverrides} />
      </div>
      <div className={classes.adminOverrideItem}>
        <label>Rotation Time:</label>
        <Input type="number" id="rotationTime" value={rotationTimeOverride} onChange={updateRotationTimeOverride} onBlur={updateAdminOverrides} />
      </div>
      <div className={classes.adminOverrideItem}>
        <label>Booster ReQL:</label>
        <Input type="text" id="booster" value={boosterOverride} onChange={updateBoosterOverride} onBlur={updateAdminOverrides} className={classes.boosterOverride} multiline />
      </div>
    </div>
  </div>

  return (
    <AnalyticsContext
      pageSubSectionContext="belowLatestPostsRecommendations"
      capturePostItemOnMount
    >
      <SingleColumnSection>
        <SectionTitle title="Recommendations">
          <SettingsButton showIcon={false} onClick={() => setAdminOverridesVisible(!adminOverridesVisible)} label="Admin Overrides" />
        </SectionTitle>

        {userIsAdmin(currentUser) && isRecombeeAlgorithm(recommendationSettings) && adminOverridesVisible && recombeeRecommendationOverrideControls}

        <RecommendationsList algorithm={recommendationSettings} />
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

const HomepageRecommendationsComponent = registerComponent('HomepageRecommendations', HomepageRecommendations, {styles});

declare global {
  interface ComponentTypes {
    HomepageRecommendations: typeof HomepageRecommendationsComponent
  }
}
