import React, { useState, useCallback, useEffect, RefObject, useRef } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext, ReviewWinnerImageInfo } from './ImageContext';
import { useEventListener } from '../../hooks/useEventListener';
import { useCreate } from '../../../lib/crud/withCreate';
import { useWindowSize } from '../../hooks/useScreenWidth';
import { COORDINATE_POSITIONS_TO_BOOK_OFFSETS, CoordinatePosition } from '../../sequences/TopPostsPage';

const initialHeight = 480;
const initialWidth = 360 * 3;
const aspectRatio = initialHeight / initialWidth;

export type Coordinates = {
  x: number,
  y: number,
  width: number,
  height: number,
}

export type BoxCoordinates = Coordinates & { flipped: boolean }

type BoxSubContainers = Record<CoordinatePosition, BoxCoordinates | null>

type PositionedOffsets<T extends CoordinatePosition> = {
  [k in `${T}XPct` | `${T}YPct` | `${T}WidthPct` | `${T}HeightPct`]: number;
}

function getOffsetPercentages<T extends CoordinatePosition>(imgCoordinates: Coordinates, boxCoordinates: BoxCoordinates, prefix: T): PositionedOffsets<T> {
  const {
    x: imgX,
    y: imgY,
    width: imgWidth,
    height: imgHeight,
  } = imgCoordinates;

  const {
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
  } = boxCoordinates;

  const relativeXOffset = boxX - imgX;
  const relativeYOffset = boxY - imgY;

  const xPct = (relativeXOffset / imgWidth);
  const yPct = (relativeYOffset / imgHeight);

  const widthPct = (boxWidth / imgWidth);
  // This is the "correct" height percentage
  // const heightPct = (boxHeight / imgHeight);
  // This is the "all the way to the bottom of the image" percentage, which we prefer to use if it turns out it doen't mess up aspect ratios or whatever
  const heightPct = ((boxHeight - relativeYOffset) / boxHeight);

  return {
    [`${prefix}XPct`]: xPct,
    [`${prefix}YPct`]: yPct,
    [`${prefix}WidthPct`]: widthPct,
    [`${prefix}HeightPct`]: heightPct
  } as PositionedOffsets<T>;
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
    backgroundColor: theme.palette.greyAlpha(.7),
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10000,
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
    backgroundColor: theme.palette.inverseGreyAlpha(.7),
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
  saveAllCoordinates: {
    position: 'absolute',
    display: 'block',
    bottom: 0,
    left: 0,
    width: '100%',
    cursor: 'pointer',
    padding: '2px 5px',
    userSelect: 'none', // Prevent text selection
    color: 'black',
    fontSize: '1rem',
  },
  successNotification: {
    position: 'absolute',
    display: 'block',
    width: '100%',
    cursor: 'pointer',
    padding: '2px 5px',
    userSelect: 'none', // Prevent text selection
    color: 'black',
    fontSize: '1rem',
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    textAlign: 'center',
  },
});

export const ImagePreviewSubset = ({ boxCoordinates, selectedImageInfo, subBoxPosition, selectedBox, setSelectedBox, cachedBoxCoordinates, setCachedBoxCoordinates, flipped }: {
  boxCoordinates: Coordinates,
  selectedImageInfo: ReviewWinnerImageInfo,
  subBoxPosition: CoordinatePosition,
  selectedBox: CoordinatePosition | null,
  setSelectedBox: React.Dispatch<React.SetStateAction<CoordinatePosition | null>>,
  cachedBoxCoordinates: Record<string, BoxSubContainers>,
  setCachedBoxCoordinates: React.Dispatch<React.SetStateAction<Record<string, BoxSubContainers>>>,
  flipped: boolean,
}) => {
  // Update the style of each boxSub based on the selected box
  const handleBoxClick = (subBox: CoordinatePosition) => {
    setSelectedBox(subBox);
  };

  const cacheCoordinates = useCallback(async () => {
    const subBoxX = boxCoordinates.x + ((boxCoordinates.width / 3) * COORDINATE_POSITIONS_TO_BOOK_OFFSETS[subBoxPosition]);
    const subBoxY = boxCoordinates.y;

    setCachedBoxCoordinates((prev) => {
      return {
        ...prev,
        [selectedImageInfo._id]: {
          ...prev[selectedImageInfo._id],
          [subBoxPosition]: {
            x: subBoxX,
            y: subBoxY,
            width: boxCoordinates.width / 3,
            height: boxCoordinates.height,
            flipped
          }
        }
      }
    })
  }, [setCachedBoxCoordinates, subBoxPosition, boxCoordinates, selectedImageInfo, flipped]);

  const subBoxStyle = {
    width: boxCoordinates.width / 3,
    height: boxCoordinates.height,
    background: selectedBox === subBoxPosition ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.3)',
    borderLeft: '1px solid white',
    borderRight: '1px solid white',
  };

  const saveCoordinatesStyle = {
    bottom: 0,
    left: `${(boxCoordinates.width / 3) * (subBoxPosition === "left" ? 0 : subBoxPosition === "middle" ? 1 : 2)}px`,
    cursor: 'pointer',
    padding: '2px 5px',
    color: 'black',
    fontSize: '1rem',
  };

  // this will become a hoverover tooltip that previews the relevant image snippet
  const cachedBoxStyle = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundColor: (cachedBoxCoordinates[selectedImageInfo._id] && cachedBoxCoordinates[selectedImageInfo._id][subBoxPosition]) ? 'green' : 'red'
  } as const;

  return (<>
    <div style={subBoxStyle} onClick={() => handleBoxClick(subBoxPosition)}>
    <div style={saveCoordinatesStyle} onClick={cacheCoordinates}>{`Save ${subBoxPosition} placement`}</div>
    <div style={cachedBoxStyle}></div>
    </div>
  </>)
}

export const ImageCropPreview = ({ reviewWinner, imgRef, setCropPreview, classes, flipped }: {
  reviewWinner: ReviewWinnerAll,
  imgRef: RefObject<HTMLImageElement>,
  setCropPreview: (coordinates?: Coordinates) => void,
  classes: ClassesType<typeof styles>,
  flipped: boolean
}) => {
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const initialBoxCoordinates: BoxCoordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight, flipped }
  const [boxCoordinates, setBoxCoordinates] = useState(initialBoxCoordinates);

  const updateBoxCoordinates = (newCoordinates: BoxCoordinates) => {
    setBoxCoordinates(newCoordinates);
    setCropPreview(newCoordinates);
  }

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); 

  const initialResizeInitialBoxCoordinates: BoxCoordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight, flipped }
  const [resizeInitialBoxCoordinates, setResizeInitialBoxCoordinates] = useState(initialResizeInitialBoxCoordinates);

  // TODO: per docstring, this hook isn't safe in an SSR context; make sure we wrap this entire component in a NoSSR block
  const windowSize = useWindowSize();
  const {selectedImageInfo} = useImageContext();

  const initialCachedCoordinates: Record<string, BoxSubContainers> = {} 
  const [cachedBoxCoordinates, setCachedBoxCoordinates] = useState(initialCachedCoordinates);
  
  const toggleBoxVisibility = () => {
    // If we're closing the box, pass that back to undo all the relevant styling
    const newCropPreviewCoords = isBoxVisible ? undefined : boxCoordinates;
    setCropPreview(newCropPreviewCoords);
    setIsBoxVisible(!isBoxVisible);
  }

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
    setResizeInitialBoxCoordinates({ x: e.clientX, y: e.clientY, width: boxCoordinates.width, height: boxCoordinates.height, flipped });
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
    const newCoordinates = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
      width: boxCoordinates.width,
      height: boxCoordinates.height,
      flipped,
    };

    updateBoxCoordinates(newCoordinates);
  };

  const resizeBox = (e: MouseEvent) => {
    const additionalWidth = e.clientX - resizeInitialBoxCoordinates.x;
    const newWidth = resizeInitialBoxCoordinates.width + additionalWidth;
    const newHeight = newWidth * aspectRatio;

    const newCoordinates = {
      x: boxCoordinates.x,
      y: boxCoordinates.y,
      width: newWidth,
      height: newHeight,
      flipped
    };
    
    updateBoxCoordinates(newCoordinates);
  };

  const handleBox = (e: MouseEvent) => {
    if (isDragging && !isResizing) moveBox(e);
    if (isResizing) resizeBox(e);
  }

  useEventListener('mousemove', handleBox);
  useEventListener('mouseup', endMouseDown);

  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean | null>(null);

  const { create: createSplashArtCoordinateMutation, loading, error } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinates'
  });

  const saveAllCoordinates = useCallback(async () => {
    if (!imgRef.current) {
      // eslint-disable-next-line no-console
      console.error('Missing image ref');
      return;
    }

    try {
      const hasCachedCoordinates = (selectedImageInfo && cachedBoxCoordinates[selectedImageInfo._id]) 
  
      if (!hasCachedCoordinates) {
        // eslint-disable-next-line no-console
        console.error('Missing coordinates for this image entirely');
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      const coordsLeft = cachedBoxCoordinates[selectedImageInfo._id]["left"];
      const coordsMiddle = cachedBoxCoordinates[selectedImageInfo._id]["middle"];
      const coordsRight = cachedBoxCoordinates[selectedImageInfo._id]["right"];

      if (!coordsLeft || !coordsMiddle || !coordsRight) {
        // eslint-disable-next-line no-console
        console.error('Not all sub-boxes have been set!');
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      const imgRect = imgRef.current.getBoundingClientRect();

      const leftOffsets = getOffsetPercentages(imgRect, coordsLeft, 'left');
      const middleOffsets = getOffsetPercentages(imgRect, coordsMiddle, 'middle');
      const rightOffsets = getOffsetPercentages(imgRect, coordsRight, 'right');

      const splashArtData = cachedBoxCoordinates[selectedImageInfo._id] && {
        reviewWinnerArtId: selectedImageInfo._id,
        ...leftOffsets,
        leftFlipped: coordsLeft.flipped,
        ...middleOffsets,
        middleFlipped: coordsMiddle.flipped,
        ...rightOffsets,
        rightFlipped: coordsRight.flipped
      };
  
      const { errors } = await createSplashArtCoordinateMutation({ data: splashArtData });
      
      if (errors) {
        // eslint-disable-next-line no-console
        console.error('Error(s) when saving coordinates', { errors: JSON.stringify(errors, null, 2) });
        setShowSaveSuccess(false);
      } else {
        setShowSaveSuccess(true);
      }
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving coordinates', error);
      setShowSaveSuccess(false); // Set failure state
    }
  }, [selectedImageInfo, createSplashArtCoordinateMutation, cachedBoxCoordinates, imgRef]);


  const moveableBoxStyle = {
    left: boxCoordinates.x,
    top: boxCoordinates.y,
    backgroundPosition: `-${boxCoordinates.x}px -${boxCoordinates.y}px`, // Set the background position based on boxPosition
    backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
    width: boxCoordinates.width,
    height: boxCoordinates.height,             
  };

  // Add a state to track the selected box
  const [selectedBox, setSelectedBox] = useState<CoordinatePosition | null>(null);

  if (!selectedImageInfo) {
    return null;
  }

  const boxSubContainers = {
    display: 'flex',
    justifyContent: 'space-around',
  };

  const showSaveAllButton = ( 
    cachedBoxCoordinates[selectedImageInfo._id] && 
    cachedBoxCoordinates[selectedImageInfo._id]["left"] && 
    cachedBoxCoordinates[selectedImageInfo._id]["middle"] && 
    cachedBoxCoordinates[selectedImageInfo._id]["right"]
  );

  const previewSubsetProps = {
    boxCoordinates,
    selectedImageInfo,
    selectedBox,
    setSelectedBox,
    cachedBoxCoordinates,
    setCachedBoxCoordinates,
    flipped
  };

  return (
    <>
      <button className={classes.button} onClick={toggleBoxVisibility}>Show Box</button>
      {isBoxVisible && selectedImageInfo && selectedImageInfo._id && (
        <div className={classes.moveableBox}
          style={moveableBoxStyle}
          onMouseDown={handleMouseDown}>
          <div style={boxSubContainers}>
            <ImagePreviewSubset subBoxPosition='left' {...previewSubsetProps} />
            <ImagePreviewSubset subBoxPosition='middle' {...previewSubsetProps} />
            <ImagePreviewSubset subBoxPosition='right' {...previewSubsetProps} />
          </div>
          <div className={classes.saveAllCoordinates} onClick={saveAllCoordinates} style={{backgroundColor: showSaveAllButton ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.3)'}}>
            {!showSaveAllButton
              ? (<div> Must set all placements before you can save them </div>)
              : loading
                ? <div>Saving all placements...</div> 
                : <div onClick={saveAllCoordinates}>{`Save all placements`}</div>
            }
            {error && <div>Error saving. Please try again.</div>}
          </div>
          {showSaveSuccess && <div className={classes.successNotification}>
            Coordinates saved successfully!
            <div onClick={() => setShowSaveSuccess(false)}>
              (click here to close)
            </div>
          </div>}
          <div className={classes.closeButton} onClick={toggleBoxVisibility}>
              x
          </div>
          <div className={classes.resizer} onMouseDown={handleMouseDown} />
        </div>
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
