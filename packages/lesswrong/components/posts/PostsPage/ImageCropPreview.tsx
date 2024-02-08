import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext, ReviewWinnerImageInfo } from './ImageContext';
import { useEventListener } from '../../hooks/useEventListener';
import { useCreate } from '../../../lib/crud/withCreate';
import { useUpdate } from '../../../lib/crud/withUpdate';

const initialHeight = 480;
const initialWidth = 360 * 3;
const aspectRatio = initialHeight / initialWidth;

type Coordinates = {
  x: number,
  y: number,
  width: number,
  height: number,
}

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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10000,
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
        cursor: 'move',
        zIndex: 20000,
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

export type SubBoxPosition = "left" | "middle" | "right";

export const ImagePreviewSubset = ({ reviewWinner, boxCoordinates, selectedImageInfo, subBoxPosition, selectedBox, setSelectedBox, classes }: {
    reviewWinner: ReviewWinnerAll,
    boxCoordinates: Coordinates,
    selectedImageInfo: ReviewWinnerImageInfo | undefined,
    subBoxPosition: SubBoxPosition,
    selectedBox: SubBoxPosition | null,
    setSelectedBox: React.Dispatch<React.SetStateAction<SubBoxPosition | null>>,
    classes: ClassesType<typeof styles>
  }) => {
  
      // Update the style of each boxSub based on the selected box
  const handleBoxClick = (subBox: SubBoxPosition) => {
    setSelectedBox(subBox);
  };

    const subBoxCoordinates = {
      left: {x: 0, y: 0},
      middle: {x: boxCoordinates.width / 3, y: 0},
      right: {x: boxCoordinates.width / 3 * 2, y: 0},
    }

    const [showSaveSuccess, setShowSaveSuccess] = useState<boolean | null>(null);

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
          // add a better error message for client
          console.error('No image id provided');
          setShowSaveSuccess(false); // Set failure state
          return;
        }
  
        const splashArtData = {
          reviewWinnerArtId: selectedImageInfo?.imageId,
          xCoordinate: boxCoordinates.x,
          yCoordinate: boxCoordinates.y,
          width: boxCoordinates.width,
          height: boxCoordinates.height,
          logTime: new Date(),
        };
    
        const response = await createSplashArtCoordinateMutation({ data: splashArtData });
  
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
    }, [updateReviewWinner, updateRWError, reviewWinner, boxCoordinates, selectedImageInfo, createSplashArtCoordinateMutation]);

    const subBox = {
      width: boxCoordinates.width / 3,
      height: boxCoordinates.height,
      background: selectedBox === subBoxPosition ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.3)',
      borderLeft: '1px solid white',
      borderRight: '1px solid white',
    };


    const saveCoordinatesStyle = {
      bottom: 0,
      left: `${subBoxCoordinates[subBoxPosition].x}px`,
      cursor: 'pointer',
      padding: '2px 5px',
      color: 'black',
      fontSize: '1rem',
    };

    return (<>
    <div style={subBox} onClick={() => handleBoxClick(subBoxPosition)}>
    {loading ? 
      <div style={saveCoordinatesStyle}>Saving placement...</div> : 
      <div style={saveCoordinatesStyle} onClick={saveCoordinates}>{`Save ${subBoxPosition} placement`}</div>}
    {error && <div>Error saving. Please try again.</div>}
    {showSaveSuccess && <div>Coordinates saved successfully!<div onClick={() => setShowSaveSuccess(false)}>(click here to close)</div></div>}
    </div>
    </>)
  }

export const ImageCropPreview = ({ reviewWinner, classes }: {
    reviewWinner: ReviewWinnerAll,
    classes: ClassesType<typeof styles>
  }) => {


  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [boxCoordinates, setBoxCoordinates] = useState({x: 100, y: 100, width: initialWidth, height: initialHeight});

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); 

  const [initialBoxSize, setInitialBoxSize] = useState({ width: initialWidth, height: initialHeight });
  const [initialResizePosition, setInitialResizePosition] = useState({ x: initialWidth, y: initialHeight });

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const {selectedImageInfo} = useImageContext();

  const [cachedBoxCoordinates, setCachedBoxCoordinates] = useState({x: 0, y: 0, width: 0, height: 0});

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering drag when clicking the close button or the resize button
    if ((e.target as HTMLElement).className.includes('resizer') || (e.target as HTMLElement).className.includes('closeButton')) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
        x: e.clientX - boxCoordinates.x,
        y: e.clientY - boxCoordinates.y,
      });
  };

  const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
    setInitialBoxSize({ width: boxCoordinates.width, height: boxCoordinates.height });
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
    setBoxCoordinates({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
      width: boxCoordinates.width,
      height: boxCoordinates.height,
    });
  };

  const resizeBox = (e: MouseEvent) => {
    const additionalWidth = e.clientX - initialResizePosition.x;
    const newWidth = initialBoxSize.width + additionalWidth;
    const newHeight = newWidth * aspectRatio;

    setBoxCoordinates({ x: boxCoordinates.x, y: boxCoordinates.y, width: newWidth, height: newHeight });
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


  const moveableBoxStyle = {
    left: boxCoordinates.x,
    top: boxCoordinates.y,
    backgroundImage: `url(${selectedImageInfo?.splashArtImageUrl})`, 
    backgroundPosition: `-${boxCoordinates.x}px -${boxCoordinates.y}px`, // Set the background position based on boxPosition
    backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
    width: boxCoordinates.width,
    height: boxCoordinates.height,             
  };
  // log percentages  !!!
  // render image as an image instead of css property

  // Add a state to track the selected box
  const [selectedBox, setSelectedBox] = useState<SubBoxPosition | null>(null);

  const boxSubContainers = {
    display: 'flex',
    justifyContent: 'space-around',
  };

  // probably we want each of the three divs to be its own react element, with a save button in the bottom left of each
  // and an element that tracks whether each has been saved or not
  return (
    <>
      <button className={classes.button} onClick={() => setIsBoxVisible(!isBoxVisible)}>Show Box</button>
      {isBoxVisible && (
        <>
        <div className={classes.overlay}></div>
        <div className={classes.moveableBox}
            style={moveableBoxStyle}
            onMouseDown={handleMouseDown}>
            <div style={boxSubContainers}>
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"left"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} classes={classes} />
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"middle"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} classes={classes} />
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"right"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} classes={classes} />
            </div>
            <div className={classes.closeButton} onClick={() => setIsBoxVisible(false)}>
                x
            </div>
            <div
                className={classes.resizer}
                onMouseDown={handleMouseDown}
            ></div>
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
