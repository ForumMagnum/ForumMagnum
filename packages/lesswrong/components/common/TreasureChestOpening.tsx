import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

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
  container: {
    padding: 20
  }
}))

const TreasureChestOpening = () => {
  const classes = useStyles(styles);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  const treasureDescriptions = [
    "Latest Fooming Shoggoths album and audio player",
    "Increase your strong-upvote strength by one",
    "Studio Ghibli site theme"
  ];

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
            zIndex: 10000,
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
            zIndex: 10000,
            margin: 'auto',
            marginTop: '-110px',
            opacity: isHovered ? 0 : 1,
            transition: 'opacity 500ms ease-in-out',
            cursor: 'pointer'
          }}
          className="hover-image"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpened(true)}
        />
        <img 
          src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743370814/ChatGPT_Image_Mar_30_2025_02_39_36_PM_vhrh9w.png"
          style={{
            position: 'relative',
            width: '20%',
            zIndex: 10000,
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
            zIndex: 10000,
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
            zIndex: 10000,
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
            zIndex: 9993,
            margin: 'auto',
            marginTop: '-50px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 500ms ease-in-out'
          }}
        />
      </div>

      {isOpened && (
        <div 
          className={classes.container}
          style={{
            alignItems: 'center',
            height: '50vh',
            display: 'flex',
            justifyContent: 'center',
            position: 'fixed',
            width: '50vw',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100000,
            borderRadius: '20px',
            animation: 'slideIn 0.5s ease-out',
            background: 'white',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className={classes.itemContainer}>
            <img 
              src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743374079/ChatGPT_Image_Mar_30_2025_03_33_48_PM_ev2zc1.png"
              style={{
                position: 'relative',
                width: '100%',
                zIndex: 10000,
                transition: 'all 0.5s ease-out',
                animation: 'popIn 0.5s ease-out 0.2s forwards',
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            />
            <div className={classes.itemDescription}>
              {treasureDescriptions[0]}
            </div>
          </div>

          <div className={classes.itemContainer}>
            <img 
              src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743374403/ChatGPT_Image_Mar_30_2025_03_39_41_PM_p4ud53.png"
              style={{
                position: 'relative',
                width: '100%',
                zIndex: 10000,
                transition: 'all 0.5s ease-out',
                animation: 'popIn 0.5s ease-out 0.4s forwards',
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            />
            <div className={classes.itemDescription}>
              {treasureDescriptions[1]}
            </div>
          </div>

          <div className={classes.itemContainer}>
            <img 
              src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1743374575/ChatGPT_Image_Mar_30_2025_03_42_38_PM_bpwwap.png"
              style={{
                position: 'relative',
                width: '100%',
                zIndex: 10000,
                transition: 'all 0.5s ease-out',
                animation: 'popIn 0.5s ease-out 0.6s forwards',
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            />
            <div className={classes.itemDescription}>
              {treasureDescriptions[2]}
            </div>
          </div>

          <button 
            onClick={() => setIsOpened(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              border: 'none',
              color: '#666',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 100000
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
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes popIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
