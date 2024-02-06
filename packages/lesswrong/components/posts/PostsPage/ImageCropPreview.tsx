import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext } from './ImageContext';
import { useEventListener } from '../../hooks/useEventListener';
import { useCreate } from '../../../lib/crud/withCreate';
// import { createAdminContext, createMutator } from '../../../server/vulcan-lib';
// import { createAdminContext } from '../../../server/vulcan-lib/query';

const initialHeight = 480;
const initialWidth = 360;
const aspectRatio = initialHeight / initialWidth;

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
        // background: 'rgba(0, 0, 0, 0.7)'
    },
    moveableBox: { 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginBottom: '40px', 
        position: 'absolute',
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
        color: 'black',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
    },
    resizer: {
      width: '10px',
      height: '10px',
      position: 'absolute',
      bottom: 0,
      right: 0,
      cursor: 'nwse-resize',
      backgroundColor: '#fff',
      border: '1px solid #000',
    },
    saveCoordinates: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      cursor: 'pointer',
      padding: '2px 5px',
      userSelect: 'none', // Prevent text selection
      color: 'black',
      fontSize: '1rem',
    },
  });

export const ImageCropPreview = ({ classes }: {
    classes: ClassesType<typeof styles>
  }) => {
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [boxPosition, setBoxPosition] = useState({ x: 100, y: 100 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); 

  const [initialBoxSize, setInitialBoxSize] = useState({ width: initialWidth, height: initialHeight });
  const [boxSize, setBoxSize] = useState({ width: initialWidth, height: initialHeight });
  const [initialResizePosition, setInitialResizePosition] = useState({ x: initialWidth, y: initialHeight });

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const {imageInfo} = useImageContext();
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering drag when clicking the close button or the resize button
    if ((e.target as HTMLElement).className.includes('resizer') || (e.target as HTMLElement).className.includes('closeButton')) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
        x: e.clientX - boxPosition.x,
        y: e.clientY - boxPosition.y,
      });
  };

  const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
    setInitialBoxSize({ width: boxSize.width, height: boxSize.height });
    setInitialResizePosition({ x: e.clientX, y: e.clientY });
    setIsResizing(true);

  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).className.includes('resizer')) {
      startResizing(e);
    } else {
      startDragging(e);
    }
  };

  const endMouseDown = () => {
    setIsDragging(false);
    setIsResizing(false);
  }

  const moveBox = (e: MouseEvent) => {
    setBoxPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const resizeBox = (e: MouseEvent) => {
    const additionalWidth = e.clientX - initialResizePosition.x;
    const newWidth = initialBoxSize.width + additionalWidth;
    const newHeight = newWidth * aspectRatio;

    setBoxSize({ width: newWidth, height: newHeight });
  };

  const handleBox = (e: MouseEvent) => {
    if (isDragging && !isResizing) moveBox(e);
    if (isResizing) resizeBox(e);
  }

  const updateWindowSize = () => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  };

  useEventListener('resize', updateWindowSize);
  useEventListener('mousemove', handleBox);
  useEventListener('mouseup', endMouseDown);


  const closeBox = () => {
    setIsBoxVisible(false);
  };

  const { create: createSplashArtCoordinateMutation, data: SplashArtCoordinates } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinatesDefaultFragment'
  });

  const saveCoordinates = useCallback(async () => {

    try {
      if (!imageInfo?.imageId) {
        console.error('No image id provided');
        setSaveSuccess(false); // Set failure state
        return;
      }
  
      const splashArtData: SplashArtCoordinatesDefaultFragment = {
        reviewWinnerArtId: imageInfo?.imageId,
        xCoordinate: boxPosition.x,
        yCoordinate: boxPosition.y,
        width: boxSize.width,
        height: boxSize.height,
        logTime: new Date(),
      };
  
      await createSplashArtCoordinateMutation({ data: splashArtData });

      setSaveSuccess(true); // Set success state
    }
    catch (error) {
      console.error('Error saving coordinates', error);
      setSaveSuccess(false); // Set failure state
    }
  }, [boxPosition, boxSize, imageInfo, createSplashArtCoordinateMutation]);

  return (
    <>
      <button className={classes.button} onClick={() => setIsBoxVisible(!isBoxVisible)}>Show Box</button>
      {isBoxVisible && (
        <>
        <div className={classes.overlay} style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}></div>
        <div className={classes.moveableBox}
            style={{
              left: `${boxPosition.x}px`,
              top: `${boxPosition.y}px`,
              zIndex: 2000,
              backgroundImage: `url(${imageInfo?.splashArtImageUrl})`, 
              backgroundPosition: `-${boxPosition.x}px -${boxPosition.y}px`, // Set the background position based on boxPosition
              backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
              width: boxSize.width,
              height: boxSize.height,             
            }}
            onMouseDown={handleMouseDown}>
            <div className={classes.closeButton} onClick={closeBox}>
                x
            </div>
            <div
                className={classes.resizer}
                onMouseDown={handleMouseDown}
            ></div>
            <div
                className={classes.saveCoordinates} onClick={saveCoordinates}
            >Save coordinates</div>
            {saveSuccess === true && <div>Coordinates saved successfully! ${SplashArtCoordinates} </div>}
            {saveSuccess === false && <div>Error saving coordinates. Please try again.</div>}
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
