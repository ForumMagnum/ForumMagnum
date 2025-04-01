import React, { useState, useEffect, useRef, useCallback } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import ThreeSlotMachine from './ThreeSlotMachine';

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
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  slotMachineContainer: {
    width: '90%',
    height: '250px',
    marginBottom: '20px',
    borderRadius: '10px',
    position: 'relative',
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
  }
}))

const prizeTextureUrls = [
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743450362/reel-strip_ox23zc.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743450362/reel-strip_ox23zc.png",
  "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743450362/reel-strip_ox23zc.png"
];

const TreasureChestOpening = () => {
  const classes = useStyles(styles);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);
  const [winningItemIndex, setWinningItemIndex] = useState(0);
  const [triggerSpin, setTriggerSpin] = useState(false);

  const treasureDescriptions = [
    "Latest Fooming Shoggoths album and audio player",
    "Increase your strong-upvote strength by one",
    "Studio Ghibli site theme"
  ];

  const handleClose = () => {
    setIsOpened(false);
    setSpinComplete(false);
    setTriggerSpin(false);
  };

  const handleChestClick = () => {
    const randomIndex = Math.floor(Math.random() * prizeTextureUrls.length);
    setWinningItemIndex(randomIndex);
    setSpinComplete(false);
    setTriggerSpin(false);
    setIsHovered(false);
    setIsOpened(true);
  };

  const handleTriggerSpin = () => {
    console.log("Triggering spin via state");
    setTriggerSpin(true);
  };

  const handleSpinComplete = useCallback(() => {
    console.log("Parent received spin complete");
    setSpinComplete(true);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center p-6 bg-gray-800 rounded-lg" style={{
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
            marginRight: '-30px'
          }}
        />
        <img 
          src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743369660/ChatGPT_Image_Mar_30_2025_02_20_47_PM_vifqzq.png"
          style={{
            position: 'relative',
            width: '40%',
            zIndex: 1200,
            margin: 'auto',
            marginTop: '-110px',
            opacity: isHovered ? 0 : 1,
            transition: 'opacity 500ms ease-in-out',
            cursor: 'pointer'
          }}
          className="hover-image"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleChestClick}
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
            transform: 'scaleX(-1)'
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
            left: '180px',
            top: '-60px'
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
            right: '140px',
            top: '-90px'
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
            transition: 'opacity 500ms ease-in-out'
          }}
        />
      </div>

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
              width: '50vw',
              height: 'auto',
              minHeight: '50vh',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
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
                     winningItemIndex={winningItemIndex}
                     startSpin={triggerSpin}
                     onSpinComplete={handleSpinComplete}
                   />
               </div>

               
                 <button
                   className={classes.spinButton}
                   onClick={handleTriggerSpin}
                   disabled={triggerSpin}
                 >
                   {triggerSpin ? 'Spinning...' : 'Spin!'}
                 </button>
               

               {/* {spinComplete && (
                  <div className={classes.resultContainer}>
                     <img
                       src={prizeTextureUrls[winningItemIndex]}
                       alt={treasureDescriptions[winningItemIndex]}
                       style={{ width: '150px', height: 'auto', marginBottom: '10px' }}
                     />
                     <div className={classes.itemDescription}>
                       You won: {treasureDescriptions[winningItemIndex]}
                     </div>
                  </div>
               )} */}
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

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

const TreasureChestOpeningComponent = registerComponent('TreasureChestOpening', TreasureChestOpening);

declare global {
  interface ComponentTypes {
    TreasureChestOpening: typeof TreasureChestOpeningComponent
  }
}

export default TreasureChestOpening;
