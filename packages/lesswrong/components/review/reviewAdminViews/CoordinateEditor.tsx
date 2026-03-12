import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { SELECTION_DEFAULT_COORDINATES, hasCustomCoordinates } from './types';
import { reviewWinnerSectionsInfo, type ReviewSectionInfo } from '@/lib/reviewWinnerSections';
import classNames from 'classnames';

const SplashArtCoordinatesMutation = gql(`
  mutation createSplashArtCoordinateCoordinateEditor($data: CreateSplashArtCoordinateDataInput!) {
    createSplashArtCoordinate(data: $data) {
      data {
        ...SplashArtCoordinatesEdit
      }
    }
  }
`);

type CoordinatePosition = 'left' | 'middle' | 'right';

interface CoordinateValues {
  leftXPct: number;
  leftYPct: number;
  leftWidthPct: number;
  leftHeightPct: number;
  leftFlipped: boolean;
  middleXPct: number;
  middleYPct: number;
  middleWidthPct: number;
  middleHeightPct: number;
  middleFlipped: boolean;
  rightXPct: number;
  rightYPct: number;
  rightWidthPct: number;
  rightHeightPct: number;
  rightFlipped: boolean;
}

const POSITION_OFFSETS: Record<CoordinatePosition, number> = { left: 0, middle: 1, right: 2 };
const ALL_POSITIONS: CoordinatePosition[] = ['left', 'middle', 'right'];

function getDefaultPosition(category: string | undefined): CoordinatePosition {
  if (!category) return 'left';
  const sectionInfo = (reviewWinnerSectionsInfo as Record<string, ReviewSectionInfo>)[category];
  if (!sectionInfo) return 'left';
  return ALL_POSITIONS[sectionInfo.order % 3];
}

function getPositionOrder(defaultPosition: CoordinatePosition): CoordinatePosition[] {
  const startIdx = ALL_POSITIONS.indexOf(defaultPosition);
  return [ALL_POSITIONS[startIdx], ALL_POSITIONS[(startIdx + 1) % 3], ALL_POSITIONS[(startIdx + 2) % 3]];
}

function extractCoords(splashCoords: SplashArtCoordinatesEdit): CoordinateValues {
  return {
    leftXPct: splashCoords.leftXPct,
    leftYPct: splashCoords.leftYPct,
    leftWidthPct: splashCoords.leftWidthPct,
    leftHeightPct: splashCoords.leftHeightPct,
    leftFlipped: splashCoords.leftFlipped,
    middleXPct: splashCoords.middleXPct,
    middleYPct: splashCoords.middleYPct,
    middleWidthPct: splashCoords.middleWidthPct,
    middleHeightPct: splashCoords.middleHeightPct,
    middleFlipped: splashCoords.middleFlipped,
    rightXPct: splashCoords.rightXPct,
    rightYPct: splashCoords.rightYPct,
    rightWidthPct: splashCoords.rightWidthPct,
    rightHeightPct: splashCoords.rightHeightPct,
    rightFlipped: splashCoords.rightFlipped,
  };
}

function getDefaultCoords(): CoordinateValues {
  return { ...SELECTION_DEFAULT_COORDINATES };
}

const EDITOR_MAX_WIDTH = 700;

const cropStyles = defineStyles("CropPositionEditor", (theme: ThemeType) => ({
  root: {
    marginBottom: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    maxWidth: EDITOR_MAX_WIDTH,
  },
  positionLabel: {
    ...theme.typography.body2,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  defaultBadge: {
    ...theme.typography.body2,
    fontSize: 10,
    padding: '1px 6px',
    borderRadius: 3,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  flipLabel: {
    ...theme.typography.body2,
    fontSize: 11,
    color: theme.palette.grey[600],
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  editorRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    userSelect: 'none',
    overflow: 'hidden',
    maxWidth: EDITOR_MAX_WIDTH,
    flex: `0 1 ${EDITOR_MAX_WIDTH}px`,
  },
  image: {
    display: 'block',
    width: '100%',
    pointerEvents: 'none',
  },
  cropBox: {
    position: 'absolute',
    border: `2px solid ${theme.palette.inverseGreyAlpha(0.8)}`,
    cursor: 'move',
    display: 'flex',
    boxSizing: 'border-box',
  },
  cropThird: {
    flex: 1,
    height: '100%',
    boxSizing: 'border-box',
  },
  cropThirdDark: {
    backgroundColor: theme.palette.greyAlpha(0.5),
  },
  cropThirdBorderLeft: {
    borderLeft: `2px dashed ${theme.palette.inverseGreyAlpha(0.6)}`,
  },
  cropThirdBorderRight: {
    borderRight: `2px dashed ${theme.palette.inverseGreyAlpha(0.6)}`,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: theme.palette.inverseGreyAlpha(0.9),
    border: `1px solid ${theme.palette.greyAlpha(0.3)}`,
    cursor: 'nwse-resize',
  },
  preview: {
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
  },
  previewImage: {
    display: 'block',
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
  },
  previewThird: {
    flex: 1,
    height: '100%',
  },
  previewThirdDark: {
    backgroundColor: theme.palette.greyAlpha(0.5),
  },
}));

interface PreviewPanelProps {
  imageUrl: string;
  stripLeftPct: number;
  stripWidthPct: number;
  yPct: number;
  offset: number;
  /** Rendered dimensions of the main editor image, used to size the preview to match */
  editorImgDimensions: { width: number; height: number };
}

function PreviewPanel({ imageUrl, stripLeftPct, stripWidthPct, yPct, offset, editorImgDimensions }: PreviewPanelProps) {
  const classes = useStyles(cropStyles);

  // The preview shows the strip as it appears on the expanded /bestoflesswrong page:
  // 9 cols × 4 rows (1080×480), aspect ratio 9:4.
  // We display at a fixed height matching the editor image, with width derived from 9:4.
  const containerHeight = editorImgDimensions.height;
  const containerWidth = containerHeight * 9 / 4;

  // Scale the full image so the strip portion fills the container width
  const scale = stripWidthPct > 0 ? containerWidth / (stripWidthPct * editorImgDimensions.width) : 1;
  const fullRenderWidth = editorImgDimensions.width * scale;
  const fullRenderHeight = editorImgDimensions.height * scale;

  // Offset the image so the strip region aligns with the container
  const imgLeft = -stripLeftPct * fullRenderWidth;
  const imgTop = -yPct * fullRenderHeight;

  return (
    <div className={classes.preview} style={{ width: containerWidth, height: containerHeight }}>
      <img
        className={classes.previewImage}
        src={imageUrl}
        draggable={false}
        style={{
          position: 'absolute',
          width: fullRenderWidth,
          left: imgLeft,
          top: imgTop,
        }}
      />
      <div className={classes.previewOverlay}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={classNames(
              classes.previewThird,
              i !== offset && classes.previewThirdDark,
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface PositionCoords {
  xPct: number;
  yPct: number;
  widthPct: number;
  flipped: boolean;
}

interface CropPositionEditorProps {
  position: CoordinatePosition;
  isDefault: boolean;
  imageUrl: string;
  coords: PositionCoords;
  onChange: (coords: PositionCoords) => void;
}

function CropPositionEditor({ position, isDefault, imageUrl, coords, onChange }: CropPositionEditorProps) {
  const classes = useStyles(cropStyles);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, startWidth: 0 });

  const offset = POSITION_OFFSETS[position];

  const updateImgDimensions = useCallback(() => {
    if (imgRef.current) {
      setImgDimensions({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateImgDimensions();
    window.addEventListener('resize', updateImgDimensions);
    return () => window.removeEventListener('resize', updateImgDimensions);
  }, [updateImgDimensions]);

  // Pixel positions of the crop box.
  // The expanded grid on /bestoflesswrong is 9 cols × 4 rows (1080×480), aspect ratio 9:4.
  const stripWidthPct = coords.widthPct * 3;
  const stripLeftPct = coords.xPct - (coords.widthPct * offset);
  const boxLeft = stripLeftPct * imgDimensions.width;
  const boxTop = coords.yPct * imgDimensions.height;
  const boxWidth = stripWidthPct * imgDimensions.width;
  const boxHeight = boxWidth * 4 / 9;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.resizeHandle) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    dragOffsetRef.current = { x: mouseX - boxLeft, y: mouseY - boxTop };
    setIsDragging(true);
  }, [boxLeft, boxTop]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = { mouseX: e.clientX, startWidth: boxWidth };
    setIsResizing(true);
  }, [boxWidth]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    function handleMouseMove(e: MouseEvent) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || imgDimensions.width === 0) return;

      if (isDragging) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let newBoxLeft = mouseX - dragOffsetRef.current.x;
        let newBoxTop = mouseY - dragOffsetRef.current.y;

        // Clamp to image bounds
        newBoxLeft = Math.max(0, Math.min(newBoxLeft, imgDimensions.width - boxWidth));
        newBoxTop = Math.max(0, newBoxTop);

        const newStripLeftPct = newBoxLeft / imgDimensions.width;
        const newXPct = newStripLeftPct + (coords.widthPct * offset);
        const newYPct = newBoxTop / imgDimensions.height;

        onChange({ ...coords, xPct: newXPct, yPct: newYPct });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        let newBoxWidth = resizeStartRef.current.startWidth + deltaX;
        // Minimum width: 60px; max: image width
        newBoxWidth = Math.max(60, Math.min(newBoxWidth, imgDimensions.width));
        const newWidthPct = newBoxWidth / 3 / imgDimensions.width;
        onChange({ ...coords, widthPct: newWidthPct });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
      setIsResizing(false);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, imgDimensions, coords, offset, onChange, boxWidth]);

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <span className={classes.positionLabel}>{position}</span>
        {isDefault && <span className={classes.defaultBadge}>default</span>}
        <label className={classes.flipLabel}>
          <input
            type="checkbox"
            checked={coords.flipped}
            onChange={e => onChange({ ...coords, flipped: e.target.checked })}
          />{' '}
          Flip
        </label>
      </div>
      <div className={classes.editorRow}>
        <div className={classes.imageContainer} ref={containerRef}>
          <img
            ref={imgRef}
            className={classes.image}
            src={imageUrl}
            onLoad={updateImgDimensions}
            draggable={false}
          />
          {imgDimensions.width > 0 && (
            <div
              className={classes.cropBox}
              style={{
                left: boxLeft,
                top: boxTop,
                width: boxWidth,
                height: Math.max(boxHeight, 20),
              }}
              onMouseDown={handleMouseDown}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={classNames(
                    classes.cropThird,
                    i !== offset && classes.cropThirdDark,
                    i > 0 && classes.cropThirdBorderLeft,
                    i < 2 && classes.cropThirdBorderRight,
                  )}
                />
              ))}
              <div
                className={classes.resizeHandle}
                data-resize-handle="true"
                onMouseDown={handleResizeMouseDown}
              />
            </div>
          )}
        </div>
        {imgDimensions.width > 0 && imgDimensions.height > 0 && stripWidthPct > 0 && (
          <PreviewPanel
            imageUrl={imageUrl}
            stripLeftPct={stripLeftPct}
            stripWidthPct={stripWidthPct}
            yPct={coords.yPct}
            offset={offset}
            editorImgDimensions={imgDimensions}
          />
        )}
      </div>
    </div>
  );
}

// --- CoordinateEditingView styles ---

const viewStyles = defineStyles("CoordinateEditingView", (theme: ThemeType) => ({
  root: {
    marginTop: 8,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  saveButton: {
    ...theme.typography.body2,
    fontSize: 11,
    padding: '4px 12px',
    border: 'none',
    borderRadius: 3,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.85,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
  saveStatus: {
    ...theme.typography.body2,
    fontSize: 11,
    alignSelf: 'center',
  },
  saveStatusSuccess: {
    color: theme.palette.text.charsAdded,
  },
  saveStatusError: {
    color: theme.palette.error.main,
  },
}));

interface CoordinateEditingViewProps {
  image: ReviewWinnerArtImages;
  post: PostsTopItemInfo;
  onSaved: () => void;
}

export function CoordinateEditingView({ image, post, onSaved }: CoordinateEditingViewProps) {
  const classes = useStyles(viewStyles);
  const [coords, setCoords] = useState<CoordinateValues>(() => {
    if (image.activeSplashArtCoordinates && hasCustomCoordinates(image.activeSplashArtCoordinates)) {
      return extractCoords(image.activeSplashArtCoordinates);
    }
    return getDefaultCoords();
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null);

  const [createMutation] = useMutation(SplashArtCoordinatesMutation);

  const imageUrl = image.upscaledImageUrl ?? image.splashArtImageUrl;
  const category = post.reviewWinner?.category;
  const defaultPosition = getDefaultPosition(category ?? undefined);
  const positionOrder = getPositionOrder(defaultPosition);

  function getPositionCoords(pos: CoordinatePosition): PositionCoords {
    return {
      xPct: coords[`${pos}XPct`],
      yPct: coords[`${pos}YPct`],
      widthPct: coords[`${pos}WidthPct`],
      flipped: coords[`${pos}Flipped`],
    };
  }

  function handlePositionChange(pos: CoordinatePosition, newPosCoords: PositionCoords) {
    setSaveStatus(null);
    setCoords(prev => ({
      ...prev,
      [`${pos}XPct`]: newPosCoords.xPct,
      [`${pos}YPct`]: newPosCoords.yPct,
      [`${pos}WidthPct`]: newPosCoords.widthPct,
      [`${pos}Flipped`]: newPosCoords.flipped,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const result = await createMutation({
        variables: {
          data: {
            reviewWinnerArtId: image._id,
            ...coords,
          },
        },
      });
      if (result.error) {
        // eslint-disable-next-line no-console
        console.error('Error saving coordinates', result.error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        onSaved();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error saving coordinates', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.actions}>
        <button className={classes.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Coordinates'}
        </button>
        {saveStatus === 'saved' && <span className={classNames(classes.saveStatus, classes.saveStatusSuccess)}>Saved</span>}
        {saveStatus === 'error' && <span className={classNames(classes.saveStatus, classes.saveStatusError)}>Error saving</span>}
      </div>
      {positionOrder.map(pos => (
        <CropPositionEditor
          key={pos}
          position={pos}
          isDefault={pos === defaultPosition}
          imageUrl={imageUrl}
          coords={getPositionCoords(pos)}
          onChange={newCoords => handlePositionChange(pos, newCoords)}
        />
      ))}
      <div className={classes.actions}>
        <button className={classes.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Coordinates'}
        </button>
        {saveStatus === 'saved' && <span className={classNames(classes.saveStatus, classes.saveStatusSuccess)}>Saved</span>}
        {saveStatus === 'error' && <span className={classNames(classes.saveStatus, classes.saveStatusError)}>Error saving</span>}
      </div>
    </div>
  );
}
