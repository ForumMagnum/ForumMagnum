import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext } from './ImageContext';
import { useEventListener } from '../../hooks/useEventListener';
import { useCreate } from '../../../lib/crud/withCreate';
// import { createAdminContext, createMutator } from '../../../server/vulcan-lib';
// import { createAdminContext } from '../../../server/vulcan-lib/query';
import { useUpdate } from '../../../lib/crud/withUpdate';

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

export const ImageCropPreview = ({ reviewWinner, classes }: {
    reviewWinner: ReviewWinnerAll,
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
  const {selectedImageInfo} = useImageContext();

  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean | null>(null);

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

  const { create: createSplashArtCoordinateMutation, loading, error } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinates'
  });

  const {mutate: updateReviewWinner, error: updateRWError} = useUpdate({
    collectionName: "ReviewWinners",
    fragmentName: 'ReviewWinnerAll',
  });

  const saveCoordinates = useCallback(async () => {

    console.log('Attempting to save coordinates');

    try {
      if (!selectedImageInfo?.imageId) {
        console.error('No image id provided');
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      const splashArtData = {
        reviewWinnerArtId: selectedImageInfo?.imageId,
        xCoordinate: boxPosition.x,
        yCoordinate: boxPosition.y,
        width: boxSize.width,
        height: boxSize.height,
        logTime: new Date(),
      };
      console.log('Splash Art Data: ', splashArtData);
  
      const response = await createSplashArtCoordinateMutation({ data: splashArtData });

      console.log('response: ', response);
      console.log('response.data.createSplashArtCoordinate: ', response.data?.createSplashArtCoordinate);
      console.log('response.data.createSplashArtCoordinate.data: ', response.data?.createSplashArtCoordinate.data);
      console.log('response.data.createSplashArtCoordinate.data._id: ', response.data?.createSplashArtCoordinate.data._id);


      await updateReviewWinner({
        selector: {_id: reviewWinner?._id},
        data: {
          splashArtCoordinateId: response.data?.createSplashArtCoordinate.data._id 
        }
      })

      if (updateRWError) {
        console.error('Error updating review winner', updateRWError);
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      setShowSaveSuccess(true); // might want to see if we actually succeeded somehow before setting this
    }
    catch (error) {
      console.error('Error saving coordinates', error);
      setShowSaveSuccess(false); // Set failure state
    }
  }, [updateReviewWinner, updateRWError, reviewWinner, boxPosition, boxSize, selectedImageInfo, createSplashArtCoordinateMutation]);

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
              zIndex: 20000,
              backgroundImage: `url(${selectedImageInfo?.splashArtImageUrl})`, 
              backgroundPosition: `-${boxPosition.x}px -${boxPosition.y}px`, // Set the background position based on boxPosition
              backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
              width: boxSize.width,
              height: boxSize.height,             
            }}
            onMouseDown={handleMouseDown}>
            <div className={classes.closeButton} onClick={() => setIsBoxVisible(false)}>
                x
            </div>
            <div
                className={classes.resizer}
                onMouseDown={handleMouseDown}
            ></div>
            {loading ? 
                <div className={classes.saveCoordinates}>Saving coordinates...</div> : 
                <div className={classes.saveCoordinates} onClick={saveCoordinates}>Save coordinates</div>}
            {error && <div>Error saving coordinates. Please try again.</div>}
            {showSaveSuccess && <div>`Coordinates saved successfully!<div onClick={() => setShowSaveSuccess(false)}>(click here to close)</div></div>}

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
