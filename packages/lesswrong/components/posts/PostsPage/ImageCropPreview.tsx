import React, { useState, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';

const boxHeight = 480;
const boxWidth = 360;

const styles = (theme: ThemeType) => ({
    button: {
        padding: '10px 20px',
        cursor: 'pointer',
        backgroundColor: theme.palette.panelBackground.reviewGold,
        color: 'white',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    overlay: {
        position: 'fixed',
        background: 'rgba(0, 0, 0, 0.7)'
    },
    moveableBox: { 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginBottom: '40px', 
        position: 'absolute',
        width: boxWidth,
        height: boxHeight,
        background: 'transparent',
        border: '2px solid white',
        cursor: 'move'
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        cursor: 'pointer',
        padding: '2px 5px',
        userSelect: 'none', // Prevent text selection
        color: 'white',
        fontSize: '1.5rem',
    }
  });

export const ImageCropPreview = ({ classes } : {
    classes: ClassesType<typeof styles>
  }) => {
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [boxPosition, setBoxPosition] = useState({ x: 50, y: 50 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const moveBox = (e : MouseEvent) => {
      if (isBoxVisible && isDragging) {
        setBoxPosition({
          x: e.clientX - 50, // Adjust based on the box size for centering
          y: e.clientY - 50,
        });
      }
    };

    const updateWindowSize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };

    // if (isBoxVisible) {
    //     window.addEventListener('mousemove', moveBox);
    //   } else {
    //     window.removeEventListener('mousemove', moveBox);
    //   }

    window.addEventListener('resize', updateWindowSize);
    window.addEventListener('mousemove', moveBox);
    window.addEventListener('mouseup', () => setIsDragging(false)); // End dragging

    return () => {
      window.removeEventListener('resize', updateWindowSize);
      window.removeEventListener('mousemove', moveBox);
      window.removeEventListener('mouseup', () => setIsDragging(false));
    };
  }, [isBoxVisible, isDragging]);

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering drag when clicking the close button
    if ((e.target as HTMLElement).className !== 'classes.closeButton') {
      setIsDragging(true); // Start dragging
    }
  };

  const closeBox = () => {
    setIsBoxVisible(false);
  };

  const overlayStyle = (position: 'top' | 'bottom' | 'left' | 'right') => {
    switch (position) {
      case 'top':
        return { top: 0, height: `${boxPosition.y}px`, left: 0, right: 0 };
      case 'bottom':
        return { bottom: 0, height: `${windowSize.height - boxPosition.y - boxHeight + 0.75}px`, left: 0, right: 0 }; // I have no idea why we are adding the 0.75
      case 'left':
        return { top: `${boxPosition.y}px`, height: boxHeight, left: 0, width: `${boxPosition.x}px` };
      case 'right':
        return { top: `${boxPosition.y}px`, height: boxHeight, right: 0, width: `${windowSize.width - boxPosition.x - boxWidth}px` };
      default:
        return {};
    }
  };

  return (
    <>
      <button className={classes.button} onClick={() => setIsBoxVisible(!isBoxVisible)}>Show Box</button>
      {isBoxVisible && (
        <>
        <div className={classes.overlay} style={overlayStyle('top')}></div>
        <div className={classes.overlay} style={overlayStyle('bottom')}></div>
        <div className={classes.overlay} style={overlayStyle('left')}></div>
        <div className={classes.overlay} style={overlayStyle('right')}></div>
        <div className={classes.moveableBox}
            style={{
              left: `${boxPosition.x}px`,
              top: `${boxPosition.y}px`,
            }}
            onMouseDown={startDragging}>
            <div className={classes.closeButton} onClick={closeBox}>
                x
            </div>
        </div>
        </>
      )}
    </>
  );
};

const ImageCropPreviewComponent = registerComponent('ImageCropPreview', ImageCropPreview, {styles});

declare global {
  interface ComponentTypes {
    ImageCropPreview: typeof ImageCropPreviewComponent
  }
}