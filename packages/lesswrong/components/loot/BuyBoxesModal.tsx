import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import React, { useState } from "react";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { PREMIUM_BOX_COST, REGULAR_BOX_COST, useCurrentUserUnlocks, REGULAR_BOX_PICO_COST, PREMIUM_BOX_PICO_COST } from "@/lib/loot/unlocks";
import classNames from 'classnames';
import { gql, useMutation } from "@apollo/client";


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
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.unit * 2,
  },
  title: {
    fontSize: '20px',
    textShadow: `0.5px 0.5px 0 ${theme.palette.grey[0]}, 1px 1px 0 ${theme.palette.grey[1000]}`,
    flexGrow: 1,
  },
  balanceContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    fontSize: '14px',
    fontWeight: 'bold',
    textShadow: `0.5px 0.5px 0 ${theme.palette.grey[0]}`,
    whiteSpace: 'nowrap',
    marginLeft: theme.spacing.unit * 2,
  },
  balanceItem: {
    display: 'flex',
    alignItems: 'center',
  },
  balanceIcon: {
    marginRight: theme.spacing.unit * 0.5,
    display: 'inline-block',
    width: '12px',
    height: '12px',
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
    borderRadius: 0,
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    minWidth: '180px',
    background: theme.palette.grey[0],
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit * 1.5,
  },
  boxName: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  costContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit * 0.5,
  },
  boxCost: {
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit * 1,
    marginTop: theme.spacing.unit * 1,
  },
  pixelButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '14px',
    padding: '8px 16px',
    color: theme.palette.grey[0],
    textShadow: `1px 1px 0 ${theme.palette.grey[1000]}`,
    background: `linear-gradient(180deg, ${theme.palette.grey[620]} 0%, ${theme.palette.grey[750]} 100%)`,
    border: `2px solid ${theme.palette.grey[1000]}`,
    borderRadius: 0,
    cursor: 'pointer',
    imageRendering: 'pixelated',
    transition: 'transform 0.1s ease, background 0.1s ease',

    '&:hover:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.grey[550]} 0%, ${theme.palette.grey[680]} 100%)`,
      transform: 'scale(1.02)',
    },

    '&:active:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.grey[750]} 0%, ${theme.palette.grey[800]} 100%)`,
      transform: 'translate(1px, 1px)',
    },

    '&:disabled': {
      background: `linear-gradient(180deg, ${theme.palette.grey[405]} 0%, ${theme.palette.grey[550]} 100%)`,
      color: theme.palette.grey[680],
      textShadow: `1px 1px 0 ${theme.palette.grey[1000]}`,
      cursor: 'not-allowed',
      border: `2px solid ${theme.palette.grey[750]}`,
    }
  },
  buyButton: {
    background: theme.palette.loot.buyModal.buyButtonBackground,

    '&:hover:not(:disabled)': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundHover,
      transform: 'scale(1.02)',
    },

    '&:active:not(:disabled)': {
      background: theme.palette.loot.buyModal.buyButtonBackgroundActive,
      transform: 'translate(1px, 1px)',
    },
  },
  picoBuyButton: {
    background: `linear-gradient(180deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,

    '&:hover:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
      transform: 'scale(1.02)',
    },

    '&:active:not(:disabled)': {
      background: `linear-gradient(180deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
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

type PurchasingTransaction = `${'regular' | 'premium'}-${'lwBucks' | 'picoLightcones'}`;

const BuyBoxesModal = ({ onClose }: { onClose?: () => void; }) => {
  const { LWDialog, Loading } = Components;
  const classes = useStyles(styles);
  const { unlocksState, refetch } = useCurrentUserUnlocks();
  const [currentPurchasingTransaction, setCurrentPurchasingTransaction] = useState<PurchasingTransaction | null>(null);

  const userLwBucks = unlocksState.lwBucks;
  const userPicoLightcones = unlocksState.picoLightcones;

  const [buyLootBox, {loading, error}] = useMutation(gql`
    mutation BuyLootBox($boxType: String!, $currency: String!) {
      BuyLootBox(boxType: $boxType, currency: $currency)
    }
  `);

  async function handleBuyBox(boxType: 'regular' | 'premium', currency: 'lwBucks' | 'picoLightcones') {
    const transactionId: PurchasingTransaction = `${boxType}-${currency}`;
    setCurrentPurchasingTransaction(transactionId);
    await buyLootBox({
      variables: {
        boxType,
        currency,
      },
    });
    await refetch();
    setCurrentPurchasingTransaction(null);
  }

  const handleBuyRegularLW = () => handleBuyBox('regular', 'lwBucks');
  const handleBuyPremiumLW = () => handleBuyBox('premium', 'lwBucks');
  const handleBuyRegularPico = () => handleBuyBox('regular', 'picoLightcones');
  const handleBuyPremiumPico = () => handleBuyBox('premium', 'picoLightcones');

  const isPurchasing = !!currentPurchasingTransaction;

  return (
    <LWDialog
      open={true}
      onClose={onClose}
      className={classes.modal}
      dialogClasses={{
        paper: classes.paper
      }}
    >
      <div className={classes.headerContainer}>
        <div className={classes.title}>Buy Loot Boxes</div>
        <div className={classes.balanceContainer}>
          <div className={classes.balanceItem}>
            <span className={classes.balanceIcon}>[B]</span>
            {userLwBucks} LW Bucks
          </div>
          <div className={classes.balanceItem}>
            <span className={classes.balanceIcon}>[P]</span>
            {userPicoLightcones} Pico Lightcones
          </div>
        </div>
      </div>

      <div className={classes.boxOptions}>
        <div className={classes.boxOption}>
          <div className={classes.boxName}>Regular Box</div>
          <div className={classes.costContainer}>
            <div className={classes.boxCost}>Cost: {REGULAR_BOX_COST} LW Bucks</div>
            <div className={classes.boxCost}>Cost: {REGULAR_BOX_PICO_COST} Pico Lightcones</div>
          </div>
          <div className={classes.buttonContainer}>
            {currentPurchasingTransaction === 'regular-lwBucks' && <Loading/>}
            {currentPurchasingTransaction !== 'regular-lwBucks' && <button
              className={classNames(classes.pixelButton, classes.buyButton)}
              onClick={handleBuyRegularLW}
              disabled={userLwBucks < REGULAR_BOX_COST || isPurchasing}
            >
              Buy (Bucks)
            </button>}
            {currentPurchasingTransaction === 'regular-picoLightcones' && <Loading/>}
            {currentPurchasingTransaction !== 'regular-picoLightcones' && <button
              className={classNames(classes.pixelButton, classes.picoBuyButton)}
              onClick={handleBuyRegularPico}
              disabled={userPicoLightcones < REGULAR_BOX_PICO_COST || isPurchasing}
            >
              Buy (Pico)
            </button>}
          </div>
        </div>

        <div className={classes.boxOption}>
          <div className={classes.boxName}>Premium Box</div>
          <div className={classes.costContainer}>
            <div className={classes.boxCost}>Cost: {PREMIUM_BOX_COST} LW Bucks</div>
            <div className={classes.boxCost}>Cost: {PREMIUM_BOX_PICO_COST} Pico Lightcones</div>
          </div>
          <div className={classes.buttonContainer}>
            {currentPurchasingTransaction === 'premium-lwBucks' && <Loading/>}
            {currentPurchasingTransaction !== 'premium-lwBucks' && <button
              className={classNames(classes.pixelButton, classes.buyButton)}
              onClick={handleBuyPremiumLW}
              disabled={userLwBucks < PREMIUM_BOX_COST || isPurchasing}
            >
              Buy (Bucks)
            </button>}
            {currentPurchasingTransaction === 'premium-picoLightcones' && <Loading/>}
            {currentPurchasingTransaction !== 'premium-picoLightcones' && <button
              className={classNames(classes.pixelButton, classes.picoBuyButton)}
              onClick={handleBuyPremiumPico}
              disabled={userPicoLightcones < PREMIUM_BOX_PICO_COST || isPurchasing}
            >
              Buy (Pico)
            </button>}
          </div>
        </div>
      </div>

      {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>Error: {error.message}</div>}

      <div className={classes.buttons}>
        <button
          className={classes.pixelButton}
          onClick={onClose}
          disabled={isPurchasing}
        >
          Cancel
        </button>
      </div>
    </LWDialog>
  );
};

const BuyBoxesModalComponent = registerComponent('BuyBoxesModal', BuyBoxesModal);

declare global {
  interface ComponentTypes {
    BuyBoxesModal: typeof BuyBoxesModalComponent;
  }
}

