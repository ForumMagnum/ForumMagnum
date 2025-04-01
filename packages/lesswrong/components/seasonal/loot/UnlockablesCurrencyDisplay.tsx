import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUserUnlocks } from '@/lib/loot/unlocks';

const styles = defineStyles("UnlockablesCurrencyDisplay", (theme: ThemeType) => ({
  root: {
    marginTop: 10,
  },
  currencyAmount: {
    verticalAlign: "middle",
    fontSize: 16,
  },
  currencyIcon: {
    width: 25,
    marginLeft: 12,
    verticalAlign: "middle",
  },
}))

const UnlockablesCurrencyDisplay = () => {
  const classes = useStyles(styles);
  const { unlocksState } = useCurrentUserUnlocks();
  const { LWTooltip } = Components;

  return <div className={classes.root}>
    <LWTooltip title="LW-Bux">
      <img className={classes.currencyIcon} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743477104/loot/PicoLightcone.png"/>
      <span className={classes.currencyAmount}>{unlocksState.lwBucks ?? 0}</span>
    </LWTooltip>

    <LWTooltip title="Picolightcones">
      <img className={classes.currencyIcon} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743477104/loot/PicoLightcone.png"/>
      <span className={classes.currencyAmount}>{unlocksState.picoLightcones ?? 0}</span>
    </LWTooltip>
  </div>
}

const UnlockablesCurrencyDisplayComponent = registerComponent('UnlockablesCurrencyDisplay', UnlockablesCurrencyDisplay);

declare global {
  interface ComponentTypes {
    UnlockablesCurrencyDisplay: typeof UnlockablesCurrencyDisplayComponent
  }
}

