import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { VirtueOfRationality, hasUnlock, twelveVirtues, twelveVirtuesUnlocks, useCurrentUserUnlocks } from '@/lib/loot/unlocks';
import { Link } from '@/lib/reactRouterWrapper';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import classNames from 'classnames';

const styles = defineStyles("TwelveVirtues", (theme: ThemeType) => ({
  title: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingLeft: 24,
    fontSize: 20,
  },
  twelveVirtues: {
    overflowY: "auto",
  },
  virtueImage: {
    position: "absolute",
    left: 0,
    "& img": {
      width: 50,
      height: 50,
    },
  },
  virtueImageLocked: {
    opacity: 0.5,
    filter: "grayscale(1)",
  },
  lockIcon: {
    width: 50,
    height: 50,
    position: "absolute",
    transform: "scale(0.6)",
    left: 0,
  },
  virtueDescription: {
    marginLeft: 55,
  },
  virtueListItem: {
    marginBottom: 16,
    position: "relative",
  },
  virtueTitle: {
    fontWeight: "bold",
  },
  virtueLongDescription: {
  },
}))

const TwelveVirtuesDialog = ({onClose}: {
  onClose: () => void
}) => {
  const classes = useStyles(styles);
  const { unlocksState } = useCurrentUserUnlocks();
  const {LWDialog} = Components;

  const numVirtuesUnlocked: number = twelveVirtues.filter(v => hasUnlock(unlocksState, v.name)).length;

  return <LWDialog open={true} onClose={onClose}>
    <h2 className={classes.title}>Twelve Virtues of Rationality</h2>
    
    <DialogContent className={classes.twelveVirtues}>
      <p>You have unlocked {numVirtuesUnlocked} of the <Link to="/posts/7ZqGiPHTpiDMwqMN2/twelve-virtues-of-rationality">Twelve Virtues of Rationality</Link>. Collect all twelve Virtues to get a $1M prize plus an invitation to the Beisutsukai!</p>
      
      {twelveVirtues.map(v => <VirtueParagraph
        key={v.name}
        virtue={v}
        unlocked={hasUnlock(unlocksState, v.name)}
      />)}
    </DialogContent>
  </LWDialog>
}

const VirtueParagraph = ({virtue, unlocked}: {
  virtue: VirtueOfRationality
  unlocked: boolean
}) => {
  const classes = useStyles(styles);
  return <div className={classes.virtueListItem}>
    <div className={classes.virtueImage}>
      {virtue.imagePath && <img
        src={virtue.imagePath}
        className={classNames(
          !unlocked && classes.virtueImageLocked
        )}
      />}
      {!unlocked && <img
        src={"/lockIcon.png"}
        className={classNames(
          !unlocked && classes.lockIcon
        )}
      />}
    </div>
    <div className={classes.virtueDescription}>
      <div className={classes.virtueTitle}>{virtue.shortDescription}</div>
      <div className={classes.virtueLongDescription}>{virtue.longDescription}</div>
    </div>
  </div>
}

const TwelveVirtuesDialogComponent = registerComponent('TwelveVirtuesDialog', TwelveVirtuesDialog);

declare global {
  interface ComponentTypes {
    TwelveVirtuesDialog: typeof TwelveVirtuesDialogComponent
  }
}

