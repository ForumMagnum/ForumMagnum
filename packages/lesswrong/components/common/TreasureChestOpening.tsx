import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ThreeSlotMachine from './ThreeSlotMachine';
import { useDialog } from './withDialog';
import { useMutation, gql } from '@apollo/client';
import { useCurrentUserUnlocks } from '@/lib/loot/unlocks';

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
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    marginTop: '15px',
    transition: 'background-color 0.3s ease',
    '&:disabled': {
        backgroundColor: '#ccc',
        cursor: 'not-allowed'
    }
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

  const [spinTreasureChest] = useMutation(gql`
    mutation SpinTreasureChest($paymentMethod: String!) {
      SpinTreasureChest(paymentMethod: $paymentMethod)
    }
  `);

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
  };

  const handleChestClick = () => {
    setWinningItemIndices([0, 0, 0]);
    setSpinComplete(false);
    setTriggerSpin(false);
    setIsSpinning(false);
    setIsOpened(true);
  };

  const fetchWinningIndices = async (): Promise<number[]> => {
    const { data: { SpinTreasureChest: indices } } = await spinTreasureChest({ variables: { paymentMethod: "lwBucks" } });
    console.log("Received winning indices from server:", indices);
    return indices;
  };

  const handleTriggerSpin = async () => {
    if (isSpinning) return;

    console.log("Handle Trigger Spin called");
    setIsSpinning(true);
    setTriggerSpin(false);
    setSpinComplete(false);

    try {
      const indices = await fetchWinningIndices();
      console.log("Setting winningItemIndices to", indices);
      setWinningItemIndices(indices);
      console.log("Setting triggerSpin to true to start animation");
      setTriggerSpin(true);
    } catch (error) {
      console.error("Failed to fetch winning indices:", error);
      setIsSpinning(false);
    }
  };

  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    if (clickX >= rect.width * 0.75) {
      console.log("Lever area clicked!");
      void handleTriggerSpin();
    } else {
      console.log("Clicked outside lever area.");
    }
  };

  const handleSpinComplete = useCallback(() => {
    console.log("Parent received spin complete");
    setSpinComplete(true);
    setIsSpinning(false);
    void refetch();
  }, [refetch]);

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
          <div className={classes.modalContentContainer} onClick={handleBackgroundClick}>
             <div className={classes.slotMachineContainer}>
                 <ThreeSlotMachine
                   textureUrls={prizeTextureUrls}
                   winningItemIndices={winningItemIndices}
                   startSpin={triggerSpin}
                   onSpinComplete={handleSpinComplete}
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
