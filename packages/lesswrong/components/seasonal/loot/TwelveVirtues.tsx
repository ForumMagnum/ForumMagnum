import React, { useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { VirtueOfRationality, hasUnlock, twelveVirtues, useCurrentUserUnlocks } from '@/lib/loot/unlocks';
import { Link } from '@/lib/reactRouterWrapper';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import classNames from 'classnames';
import { gql, useMutation } from '@apollo/client';
import { useMessages } from '@/components/common/withMessages';

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
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingLeft: '4px',
    paddingRight: '4px',
    marginLeft: '-4px',
    marginRight: '-4px',
    borderRadius: '4px',
  },
  virtueTitle: {
    fontWeight: "bold",
  },
  virtueLongDescription: {
  },
  pinnedVirtue: {
    border: `2px solid ${theme.palette.secondary.main}`,
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: '2px',
    paddingRight: '2px',
    marginLeft: '-6px',
    marginRight: '-6px',
  },
  clickableVirtue: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    }
  }
}))

const TwelveVirtuesDialog = ({onClose}: {
  onClose: () => void
}) => {
  const classes = useStyles(styles);
  const { unlocksState, refetch } = useCurrentUserUnlocks();
  const { flash } = useMessages();
  const {LWDialog} = Components;
  const [togglingVirtue, setTogglingVirtue] = useState<string | null>(null);

  const [pinVirtue, { loading: pinLoading }] = useMutation(gql`
    mutation PinRationalityVirtue($virtueName: String!) {
      PinRationalityVirtue(virtueName: $virtueName)
    }
  `, {
    onCompleted: (data) => {
      flash({ messageString: "Pinned virtues updated!", type: "success" });
      setTogglingVirtue(null);
      void refetch();
    },
    onError: (error) => {
      flash({ messageString: error.message, type: "error" });
      setTogglingVirtue(null);
    }
  });

  const handlePinToggle = (virtueName: string) => {
    setTogglingVirtue(virtueName);
    void pinVirtue({ variables: { virtueName } });
  };

  const pinnedVirtues = unlocksState.pinnedVirtues || [];

  const numVirtuesUnlocked: number = twelveVirtues.filter(v => hasUnlock(unlocksState, v.name)).length;

  return <LWDialog open={true} onClose={onClose}>
    <h2 className={classes.title}>Twelve Virtues of Rationality</h2>
    
    <DialogContent className={classes.twelveVirtues}>
      <p>You have unlocked {numVirtuesUnlocked} of the <Link to="/posts/7ZqGiPHTpiDMwqMN2/twelve-virtues-of-rationality">Twelve Virtues of Rationality</Link>. Collect all twelve Virtues to get a $1M prize plus an invitation to the Beisutsukai! Click an unlocked virtue below to pin/unpin it (max 3).</p>
      
      {twelveVirtues.map(v => <VirtueParagraph
        key={v.name}
        virtue={v}
        unlocked={hasUnlock(unlocksState, v.name)}
        isPinned={pinnedVirtues.includes(v.name)}
        onPinToggle={handlePinToggle}
        isLoading={pinLoading && togglingVirtue === v.name}
      />)}
    </DialogContent>
  </LWDialog>
}

const VirtueParagraph = ({virtue, unlocked, isPinned, onPinToggle, isLoading}: {
  virtue: VirtueOfRationality
  unlocked: boolean
  isPinned: boolean
  onPinToggle: (virtueName: string) => void
  isLoading: boolean
}) => {
  const classes = useStyles(styles);

  const handleClick = () => {
    if (unlocked && !isLoading) {
      onPinToggle(virtue.name);
    }
  };

  return <div 
      className={classNames(
        classes.virtueListItem,
        unlocked && classes.clickableVirtue,
        isPinned && classes.pinnedVirtue,
      )}
      onClick={handleClick}
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
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

