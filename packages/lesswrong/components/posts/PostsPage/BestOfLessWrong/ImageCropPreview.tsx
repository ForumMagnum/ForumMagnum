import React, { useState, useCallback, RefObject } from 'react';
import { registerComponent } from '../../../../lib/vulcan-lib/components';
import { useImageContext, ReviewWinnerImageInfo } from '../ImageContext';
import { useEventListener } from '../../../hooks/useEventListener';
import { useWindowSize } from '../../../hooks/useScreenWidth';
import { COORDINATE_POSITIONS_TO_BOOK_OFFSETS, CoordinatePosition } from '../../../sequences/TopPostsPage';
import classNames from 'classnames';
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";

const SplashArtCoordinatesMutation = gql(`
  mutation createSplashArtCoordinateImageCropPreview($data: CreateSplashArtCoordinateDataInput!) {
    createSplashArtCoordinate(data: $data) {
      data {
        ...SplashArtCoordinates
      }
    }
  }
`);

const initialHeight = 480;
const initialWidth = 360 * 3;
const aspectRatio = initialHeight / initialWidth;

export type Coordinates = {
  x: number,
  y: number,
  width: number,
  height: number,
}


/*
TODO: I'm not sure that this component exactly works (I think the exact positioning of the 
cropped image is a bit off, probably because of the image being shifted around relative to last year's design). 

But, going forward I am expecting to mostly use handleSaveCoordinates from PostsWithArtGrid 
to set most image crops, and I'm done using this component for this year and the effort/reward
ratio for fixing does not seem worth it right now. --Ray, April 2025
*/

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
    padding: '8px 20px',
    cursor: 'pointer',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    color: theme.palette.inverseGreyAlpha(1),
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
    position: 'fixed',
    background: 'transparent',
    border: '2px solid',
    borderColor: theme.palette.inverseGreyAlpha(1),
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
    color: theme.palette.greyAlpha(1),
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
    backgroundColor: theme.palette.inverseGreyAlpha(1),
    border: '1px solid',
    borderColor: theme.palette.greyAlpha(1),
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
    color: theme.palette.greyAlpha(1),
    fontSize: '1rem',
    backgroundColor: theme.palette.error,
  },
  showSaveAllButton: {
    backgroundColor: theme.palette.primary
  },
  successNotification: {
    position: 'absolute',
    display: 'block',
    width: '100%',
    cursor: 'pointer',
    padding: '2px 5px',
    userSelect: 'none', // Prevent text selection
    fontSize: '1rem',
    backgroundColor: theme.palette.primary,
    textAlign: 'center',
  },
});

const ImagePreviewSubset = ({ boxCoordinates, selectedImageInfo, subBoxPosition, selectedBox, setSelectedBox, cachedBoxCoordinates, setCachedBoxCoordinates, flipped }: {
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
    borderLeft: '1px solid',
    borderRight: '1px solid',
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

const SaveAllBar = ({showSaveAllButton, loading, saveAllCoordinates}: {showSaveAllButton: boolean, loading: boolean, saveAllCoordinates: () => void}) => {
  if (!showSaveAllButton) return <div> Must set all placements before you can save them </div>
  if (loading) return <div>Saving all placements...</div> 
  return <div onClick={saveAllCoordinates}>{`Save all placements`}</div>
}

const ImageCropPreview = ({ imgRef, classes, flipped }: {
  imgRef: RefObject<HTMLImageElement|null>,
  classes: ClassesType<typeof styles>,
  flipped: boolean
}) => {
  // TODO: per docstring, this hook isn't safe in an SSR context; make sure we wrap this entire component in a NoSSR block
  const windowSize = useWindowSize();
  const { selectedImageInfo } = useImageContext();
  
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); 
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean | null>(null);
  const [selectedBox, setSelectedBox] = useState<CoordinatePosition | null>(null);

  const initialBoxCoordinates: BoxCoordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight, flipped }
  const [boxCoordinates, setBoxCoordinates] = useState(initialBoxCoordinates);

  const initialResizeInitialBoxCoordinates: BoxCoordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight, flipped }
  const [resizeInitialBoxCoordinates, setResizeInitialBoxCoordinates] = useState(initialResizeInitialBoxCoordinates);

  const initialCachedCoordinates: Record<string, BoxSubContainers> = {} 
  const [cachedBoxCoordinates, setCachedBoxCoordinates] = useState(initialCachedCoordinates);

  const updateBoxCoordinates = (newCoordinates: BoxCoordinates) => {
    setBoxCoordinates(newCoordinates);
  }

  const toggleBoxVisibility = () => {
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

  const [createSplashArtCoordinateMutation, { loading, error }] = useMutation(SplashArtCoordinatesMutation);

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
  
      const { errors } = await createSplashArtCoordinateMutation({ variables: { data: splashArtData } });
      
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

  // if we don't yet have a selectedImageInfo, don't render the rest of the component which relies on it. (As of April 2025 it is set in PostsPage)
  if (!selectedImageInfo) {
    return <button className={classes.button} onClick={toggleBoxVisibility}>Show Box</button>;
  }

  const moveableBoxStyle = {
    left: boxCoordinates.x,
    top: boxCoordinates.y,
    backgroundPosition: `-${boxCoordinates.x}px -${boxCoordinates.y}px`, // Set the background position based on boxPosition
    backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
    width: boxCoordinates.width,
    height: boxCoordinates.height,             
  };

  const boxSubContainers = {
    display: 'flex',
    justifyContent: 'space-around',
  };

  const showSaveAllButton = !!( 
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

  const saveAllClass = classNames([classes.saveAllCoordinates, {[classes.showSaveAllButton]: showSaveAllButton}]);

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
          <div className={saveAllClass} onClick={saveAllCoordinates}>
            <SaveAllBar showSaveAllButton={showSaveAllButton} loading={loading} saveAllCoordinates={saveAllCoordinates} />
            {error && <div>Error saving. Please try again.</div>}
          </div>
          {showSaveSuccess && <div className={classes.successNotification}>
            Coordinates saved successfully!
            <div onClick={() => {
              setShowSaveSuccess(false);
              toggleBoxVisibility();
            }}>
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

export default registerComponent('ImageCropPreview', ImageCropPreview, {styles});


