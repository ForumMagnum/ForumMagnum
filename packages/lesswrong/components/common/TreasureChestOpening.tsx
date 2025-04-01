import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ThreeSlotMachine from './ThreeSlotMachine';
import { useDialog } from './withDialog';
import { useMutation, gql } from '@apollo/client';
import { cylinder0Rewards, cylinder1Rewards, cylinder2Rewards, useCurrentUserUnlocks } from '@/lib/loot/unlocks';
import { useMessages } from './withMessages';
import ReactConfetti from 'react-confetti';

const styles = defineStyles("TreasureChestOpening", (theme: ThemeType) => ({
  itemDescription: {
    ...theme.typography.body1,
    marginTop: '10px',
    textAlign: 'center',
    color: 'black',
    fontSize: '21px'
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gapX: 20
  },
  modalContentContainer: {
    position: 'relative',
    backgroundImage: 'url(https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743472234/ChatGPT_Image_Mar_31_2025_06_48_11_PM_rpebq6.png)',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '800px',
    height: '500px',
    padding: '0',
  },
  slotMachineContainer: {
    borderRadius: '10px',
    position: 'absolute',
    overflow: 'hidden',
    zIndex: -1,
    top: "23%",
    left: "4%",
    width: "81%",
    height: "61%"
  },
  resultContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  spinButton: {
    padding: '10px 20px',
    fontSize: '18px',
    cursor: 'pointer',
    backgroundColor: theme.palette.icon.greenCheckmark,
    color: theme.palette.grey[0],
    border: 'none',
    borderRadius: '5px',
    marginTop: '15px',
    transition: 'background-color 0.3s ease',
    '&:disabled': {
      backgroundColor: theme.palette.grey[405],
      cursor: 'not-allowed'
    }
  },
  prizeDisplay: {
    position: 'absolute',
    bottom: '5%',
    left: '0',
    right: '0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
    animation: '$slideIn 0.5s ease-out',
    maxWidth: '80%',
    margin: '0 auto'
  },
  prizeTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: theme.palette.loot.treasureChest.primary,
    textShadow: `2px 2px 4px ${theme.palette.greyAlpha(0.5)}`,
    marginBottom: '10px'
  },
  prizeItem: {
    backgroundColor: `${theme.palette.inverseGreyAlpha(0.95)}`,
    borderRadius: '10px',
    padding: '15px 20px',
    marginBottom: '8px',
    boxShadow: `0 4px 8px ${theme.palette.greyAlpha(0.2)}`,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '500px',
    border: `2px solid ${theme.palette.loot.treasureChest.primary}`,
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: `0 6px 12px ${theme.palette.greyAlpha(0.3)}`,
    }
  },
  dismissButton: {
    marginTop: '15px',
    padding: '8px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: theme.palette.loot.treasureChest.primary,
    color: theme.palette.loot.treasureChest.dismissButton,
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    boxShadow: `0 3px 6px ${theme.palette.greyAlpha(0.2)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.loot.treasureChest.secondary,
      transform: 'translateY(-2px)',
      boxShadow: `0 5px 8px ${theme.palette.greyAlpha(0.3)}`,
    }
  },
  prizeIcon: {
    width: '32px',
    height: '32px',
    marginRight: '15px',
    objectFit: 'contain'
  },
  prizeText: {
    flex: 1,
    fontSize: '18px',
    fontWeight: 'bold',
    color: theme.palette.loot.treasureChest.dismissButton,
    textAlign: 'left'
  },
  buttonsContainer: {
    position: 'absolute',
    right: '-20px',
    bottom: '0px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10
  },
  lwBuxButton: {
    width: '170px',
    cursor: 'pointer',
    marginBottom: '-72px',
    zIndex: 1
  },
  lightconesButton: {
    width: '170px',
    cursor: 'pointer',
  },
  "@keyframes slideIn": {
    from: {
      opacity: 0,
      transform: "scale(0.9) translateY(-20px)",
    },
    to: {
      opacity: 1,
      transform: "scale(1) translateY(0)",
    }
  }
}))

// Prize category icons mapping
const prizeIcons = {
  audio: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743500000/loot/audio-icon.png",
  voting: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743500000/loot/voting-icon.png",
  theme: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743500000/loot/theme-icon.png",
  default: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743500000/loot/prize-icon.png"
};

const prizeTextureUrls = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743472447/reel-strip_croqb4.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743472447/reel-strip_croqb4.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743472447/reel-strip_croqb4.png"
];

const TreasureChestOpening = () => {
  const classes = useStyles(styles);
  const [isOpened, setIsOpened] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [winningItemIndices, setWinningItemIndices] = useState<number[]>([0, 0, 0]);
  const [triggerSpin, setTriggerSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showRewards, setShowRewards] = useState(true);

  const { flash } = useMessages();

  const [spinTreasureChest] = useMutation(gql`
    mutation SpinTreasureChest($paymentMethod: String!) {
      SpinTreasureChest(paymentMethod: $paymentMethod)
    }
  `, { 
    onError(error) {
      flash(error.message);
    }
  });

  const { refetch } = useCurrentUserUnlocks();

  const treasureDescriptions = [
    "Latest Fooming Shoggoths album and audio player",
    "Increase your strong-upvote strength by one",
    "Studio Ghibli site theme"
  ];

  const handleClose = () => {
    setIsOpened(false);
    setSpinComplete(false);
    setTriggerSpin(false);
    setIsSpinning(false);
    setWinningItemIndices([0, 0, 0]);
    setShowRewards(true);
  };

  const dismissRewards = () => {
    setShowRewards(false);
  };

  const handleChestClick = () => {
    if (window.innerWidth < 900) {
      alert("You can't become stronger on a phone yet!");
      return;
    }
    setWinningItemIndices([0, 0, 0]);
    setSpinComplete(false);
    setTriggerSpin(false);
    setIsSpinning(false);
    setIsOpened(true);
    setShowRewards(true);
  };

  const fetchWinningIndices = async (paymentMethod: string): Promise<number[]> => {
    const { data: { SpinTreasureChest: indices }, errors } = await spinTreasureChest({ variables: { paymentMethod } });
    console.log("Received winning indices from server:", indices);
    return indices;
  };

  const handleSpin = async (paymentMethod: string) => {
    if (isSpinning) return;

    console.log(`Spinning with ${paymentMethod}`);
    setIsSpinning(true);
    setTriggerSpin(false);
    setSpinComplete(false);
    setShowRewards(true);

    try {
      const indices = await fetchWinningIndices(paymentMethod);
      console.log("Setting winningItemIndices to", indices);
      setWinningItemIndices(indices);
      console.log("Setting triggerSpin to true to start animation");
      setTriggerSpin(true);
    } catch (error) {
      console.error(`Failed to fetch winning indices using ${paymentMethod}:`, error);
      setIsSpinning(false);
    }
  };

  const handleSpinComplete = useCallback(() => {
    console.log("Parent received spin complete", winningItemIndices);
    setSpinComplete(true);
    setIsSpinning(false);
    
    void refetch();
  }, [refetch, winningItemIndices]);

  return <>
    <FrontPageTreasureChest onClickChest={handleChestClick} />
    {isOpened && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          backdropFilter: 'blur(5px)'
        }}
        onClick={handleClose}
      >
        <div
          style={{
            position: 'relative',
            width: 'fit-content',
            height: 'fit-content',
            minHeight: 'auto',
            borderRadius: '20px',
            animation: 'slideIn 0.5s ease-out',
            zIndex: 1201,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={classes.modalContentContainer}>
             <div className={classes.slotMachineContainer}>
                 <ThreeSlotMachine
                   textureUrls={prizeTextureUrls}
                   winningItemIndices={winningItemIndices}
                   startSpin={triggerSpin}
                   onSpinComplete={handleSpinComplete}
                 />
             </div>
             
             {spinComplete && winningItemIndices.length > 0 && showRewards && (
               <div className={classes.prizeDisplay}>
                 <div className={classes.prizeTitle}>Your Rewards!</div>
                 {winningItemIndices.map((index, i) => {
                   const prize = i === 0 ? cylinder0Rewards[index] : i === 1 ? cylinder1Rewards[index] : cylinder2Rewards[index];
                   return (
                     <div key={i} className={classes.prizeItem}>
                       <img 
                         src={prize.imagePath} 
                         alt="Prize icon" 
                         className={classes.prizeIcon} 
                       />
                       <div className={classes.prizeText}>
                         {(prize as any).longDescription || (prize as any).description}
                       </div>
                     </div>
                   );
                 })}
                 <button 
                   className={classes.dismissButton}
                   onClick={dismissRewards}
                 >
                   Dismiss Rewards
                 </button>
                 <ReactConfetti
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
                    numberOfPieces={250}
                    gravity={0.25}
                  />
               </div>
             )}
             
             <div className={classes.buttonsContainer}>
               <img 
                 className={classes.lwBuxButton} 
                 src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743497863/loot/ChatGPT_Image_Apr_1_2025_01_57_32_AM.png"
                 onClick={() => handleSpin("lwBucks")}
               />
               <img 
                 className={classes.lightconesButton} 
                 src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743497984/loot/ChatGPT_Image_Apr_1_2025_01_59_33_AM.png"
                 onClick={() => handleSpin("picoLightcones")}
               />
             </div>
          </div>

          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              border: 'none',
              color: '#666',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '50%',
              width: '35px',
              height: '35px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 1202
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0e0e0';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>
      </div>
    )}
  </>
};

function FrontPageTreasureChest({onClickChest}: {
  onClickChest: () => void,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { openDialog } = useDialog();

  async function handleBuyButtonClick() {
    const response = await fetch('/loot-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const { url } = await response.json();
    window.location.href = url;
  }

  return <Components.SingleColumnSection>
    <div style={{
      alignItems: 'center',
      height: '139px',
      display: 'flex',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743370814/ChatGPT_Image_Mar_30_2025_02_39_36_PM_vhrh9w.png"
        style={{
          position: 'relative',
          width: '20%',
          zIndex: 1200,
          margin: 'auto',
          marginTop: '0px',
          marginRight: '-30px',
          pointerEvents: "none",
        }}
      />
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743369660/ChatGPT_Image_Mar_30_2025_02_20_47_PM_vifqzq.png"
        style={{
          position: 'relative',
          width: '40%',
          zIndex: 1200,
          margin: 'auto',
          marginTop: '-15%',
          opacity: isHovered ? 0 : 1,
          transition: 'opacity 500ms ease-in-out',
          cursor: 'pointer'
        }}
        className="hover-image"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClickChest}
      />
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743370814/ChatGPT_Image_Mar_30_2025_02_39_36_PM_vhrh9w.png"
        style={{
          position: 'relative',
          width: '20%',
          zIndex: 1200,
          margin: 'auto',
          marginTop: '0px',
          marginLeft: '-30px',
          transform: 'scaleX(-1)',
          pointerEvents: "none",
        }}
      />
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743371486/ChatGPT_Image_Mar_30_2025_02_50_57_PM_gmapr2.png"
        style={{
          position: 'absolute',
          width: '15%',
          zIndex: 1200,
          margin: 'auto',
          marginTop: '0px',
          marginLeft: '-30px',
          left: '23%',
          top: '-60px',
          pointerEvents: "none",
        }}
      />
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743371486/ChatGPT_Image_Mar_30_2025_02_50_57_PM_gmapr2.png"
        style={{
          position: 'absolute',
          width: '15%',
          zIndex: 1200,
          margin: 'auto',
          marginTop: '0px',
          marginLeft: '-30px',
          transform: 'scaleX(-1)',
          right: '18%',
          top: '-90px',
          pointerEvents: "none",
        }}
      />
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743372662/ChatGPT_Image_Mar_30_2025_03_10_38_PM_tbq6fd.png"
        style={{
          position: 'absolute',
          width: '40%',
          zIndex: 1190,
          margin: 'auto',
          marginTop: '-50px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 500ms ease-in-out',
          pointerEvents: "none",
        }}
      />
      <img
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743475039/ChatGPT_Image_Mar_31_2025_07_37_03_PM_hoxzyq.png"
        style={{
          position: 'absolute',
          top: '50px',
          width: '140px',
          zIndex: 1200,
          cursor: 'pointer'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClickChest}
      />

      <img
        onClick={handleBuyButtonClick}
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743475874/PicoLightcones_dbxcvm.png"
        style={{
          cursor: "pointer",
          position: 'absolute',
          top: '69px',
          left: 'calc(50% - 180px)',
          width: '110px',
          zIndex: 1200,
        }}
      />

      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743483676/loot/CollectVirtues.png"
        onClick={() => openDialog({
          componentName: 'TwelveVirtuesDialog',
          componentProps: {},
        })}
        style={{
          cursor: "pointer",
          position: 'absolute',
          top: '72px',
          right: 'calc(50% - 180px)',
          width: '110px',
          zIndex: 1200,
        }}
      />
    </div>
  </Components.SingleColumnSection>
}

const TreasureChestOpeningComponent = registerComponent('TreasureChestOpening', TreasureChestOpening);

declare global {
  interface ComponentTypes {
    TreasureChestOpening: typeof TreasureChestOpeningComponent
  }
}

export default TreasureChestOpening;
