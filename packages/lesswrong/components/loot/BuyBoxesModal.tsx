import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import React from "react";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUserUnlocks } from "@/lib/loot/unlocks";
import classNames from 'classnames';

// Define placeholder costs - replace with actual values
const REGULAR_BOX_COST = 100;
const PREMIUM_BOX_COST = 500;

const styles = defineStyles('BuyBoxesModal', (theme: ThemeType) => ({
  modal: {
    zIndex: 20001,
  },
  paper: {
    overflow: "visible",
    padding: theme.spacing.unit * 3,
    position: 'relative',
    zIndex: 20001,
    border: `4px solid ${theme.palette.grey[1000]}`,
    borderRadius: 0,
    background: theme.palette.grey[140],
    imageRendering: 'pixelated',
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.primary,
  },
  title: {
    fontSize: '20px',
    textAlign: 'center',
    marginBottom: theme.spacing.unit * 2,
    textShadow: `0.5px 0.5px 0 ${theme.palette.grey[0]}, 1px 1px 0 ${theme.palette.grey[1000]}`,
  },
  balance: {
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: theme.spacing.unit * 3,
    fontWeight: 'bold',
    textShadow: `0.5px 0.5px 0 ${theme.palette.grey[0]}`,
  },
  boxOptions: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 3,
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
    }
  },
  boxOption: {
    border: `2px solid ${theme.palette.grey[1000]}`,
    borderRadius: 0, // Sharp corners
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    minWidth: '150px',
    background: theme.palette.grey[0],
  },
  boxName: {
    fontSize: '18px',
    marginBottom: theme.spacing.unit * 1,
    fontWeight: 'bold',
  },
  boxCost: {
    fontSize: '14px',
    marginBottom: theme.spacing.unit * 2,
  },
  pixelButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '14px',
    padding: '8px 16px',
    color: theme.palette.grey[0],
    textShadow: `1px 1px 0 ${theme.palette.grey[1000]}`,
    background: `linear-gradient(180deg, ${theme.palette.grey[620]} 0%, ${theme.palette.grey[750]} 100%)`, // Grey gradient
    border: `2px solid ${theme.palette.grey[1000]}`,
    borderRadius: 0,
    cursor: 'pointer',
    imageRendering: 'pixelated',
    transition: 'transform 0.1s ease, background 0.1s ease',

    '&:hover:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.grey[550]} 0%, ${theme.palette.grey[680]} 100%)`, // Lighter grey
      transform: 'scale(1.02)',
    },

    '&:active:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.grey[750]} 0%, ${theme.palette.grey[800]} 100%)`, // Darker grey
      transform: 'translate(1px, 1px)',
    },

    '&:disabled': {
      background: `linear-gradient(180deg, ${theme.palette.grey[405]} 0%, ${theme.palette.grey[550]} 100%)`, // Washed out grey
      color: theme.palette.grey[680],
      textShadow: `1px 1px 0 ${theme.palette.grey[1000]}`,
      cursor: 'not-allowed',
      border: `2px solid ${theme.palette.grey[750]}`,
    }
  },
  buyButton: {
    background: theme.palette.loot.buyModal.buyButtonBackground, // Gold gradient

    '&:hover:not(:disabled)': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundHover, // Brighter gold
      transform: 'scale(1.02)',
    },

    '&:active:not(:disabled)': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundActive, // Darker gold
      transform: 'translate(1px, 1px)',
    },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing.unit * 1,
    marginTop: theme.spacing.unit * 2,
  },
  cancelButton: {
    ...theme.typography.body2,
    marginBottom: theme.spacing.unit * 2,
  }
}));

const BuyBoxesModal = ({
  onClose,
}: {
  onClose?: () => void;
}) => {
  const { LWDialog } = Components;
  const classes = useStyles(styles);
  const currentUserUnlocks = useCurrentUserUnlocks();

  const userLwBucks = currentUserUnlocks.unlocksState.lwBucks;

  // Placeholder functions for purchase logic
  const handleBuyRegular = () => {
    console.log(`Attempting to buy Regular Box for ${REGULAR_BOX_COST} LW Bucks`);
    // TODO: Implement actual purchase logic (e.g., call a mutation)
    // Consider disabling button if userLwBucks < REGULAR_BOX_COST
    // Close modal on success? Or show confirmation?
    // onClose?.();
  };

  const handleBuyPremium = () => {
    console.log(`Attempting to buy Premium Box for ${PREMIUM_BOX_COST} LW Bucks`);
    // TODO: Implement actual purchase logic
    // Consider disabling button if userLwBucks < PREMIUM_BOX_COST
    // onClose?.();
  };

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.modal}
      dialogClasses={{
        paper: classes.paper
      }}
    >
      <div className={classes.title}>Buy Loot Boxes</div>
      <div className={classes.balance}>
        Your LW Bucks: {userLwBucks}
      </div>

      <div className={classes.boxOptions}>
        <div className={classes.boxOption}>
          <div className={classes.boxName}>Regular Box</div>
          <div className={classes.boxCost}>Cost: {REGULAR_BOX_COST} LW Bucks</div>
          <button
            className={classNames(classes.pixelButton, classes.buyButton)}
            onClick={handleBuyRegular}
            disabled={userLwBucks < REGULAR_BOX_COST}
          >
            Buy Regular
          </button>
        </div>

        <div className={classes.boxOption}>
          <div className={classes.boxName}>Premium Box</div>
          <div className={classes.boxCost}>Cost: {PREMIUM_BOX_COST} LW Bucks</div>
          <button
            className={classNames(classes.pixelButton, classes.buyButton)}
            onClick={handleBuyPremium}
            disabled={userLwBucks < PREMIUM_BOX_COST}
          >
            Buy Premium
          </button>
        </div>
      </div>

      <div className={classes.buttons}>
        <button
          className={classes.pixelButton}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </LWDialog>
  );
};

const BuyBoxesModalComponent = registerComponent("BuyBoxesModal", BuyBoxesModal);

declare global {
  interface ComponentTypes {
    BuyBoxesModal: typeof BuyBoxesModalComponent;
  }
}

export default BuyBoxesModalComponent;
