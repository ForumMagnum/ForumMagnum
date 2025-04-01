import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCurrentUserUnlocks } from '@/lib/loot/unlocks';

const styles = defineStyles("UnlockablesCurrencyDisplay", (theme: ThemeType) => ({
  root: {
    marginTop: 3,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  currencyAmount: {
    verticalAlign: "middle",
    fontSize: 16,
    fontWeight: 700,
    opacity: 0.8,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 4,
    },
  },
  lwBuxIcon: {
    verticalAlign: "middle",
    width: 40,
    height: 40,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 12,
    },
  },
  picoLightconesIcon: {
    verticalAlign: "middle",
    width: 25,
    [theme.breakpoints.up('sm')]: {
      marginLeft: 12,
    },
  },
  lwBuxIconContainer: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
  },
  picoLightconesIconContainer: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
  }
}))

const UnlockablesCurrencyDisplay = () => {
  const classes = useStyles(styles);
  const { unlocksState } = useCurrentUserUnlocks();
  const { LWTooltip } = Components;

  return <div className={classes.root}>
    <LWTooltip title="LW-Bux">
      <div className={classes.lwBuxIconContainer}>
        <img className={classes.lwBuxIcon} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743478588/loot/LWBuxIcon.png"/>
        <span className={classes.currencyAmount}>{unlocksState.lwBucks ?? 0}</span>
      </div>
    </LWTooltip>

    <LWTooltip title="Picolightcones">
      <div className={classes.picoLightconesIconContainer}>
        <img className={classes.picoLightconesIcon} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743477104/loot/PicoLightcone.png"/>
        <span className={classes.currencyAmount}>{unlocksState.picoLightcones ?? 0}</span>
      </div>
    </LWTooltip>
  </div>
}

const UnlockablesCurrencyDisplayComponent = registerComponent('UnlockablesCurrencyDisplay', UnlockablesCurrencyDisplay);

declare global {
  interface ComponentTypes {
    UnlockablesCurrencyDisplay: typeof UnlockablesCurrencyDisplayComponent
  }
}

