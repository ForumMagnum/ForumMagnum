/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalEditor, NodeKey} from 'lexical';
import React, { type JSX } from 'react';

import {calculateZoomLevel} from '@lexical/utils';

import {useRef} from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { SET_IMAGE_SIZE_COMMAND } from '../plugins/ImagesPlugin/commands';

const styles = defineStyles('LexicalImageResizer', (theme: ThemeType) => ({
  controlWrapper: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  resizer: {
    display: 'block',
    width: 7,
    height: 7,
    position: 'absolute',
    backgroundColor: theme.palette.lexicalEditor.focusRing,
    border: `1px solid ${theme.palette.grey[0]}`,
    pointerEvents: 'auto',
  },
  resizerN: {
    top: -6,
    left: '48%',
    cursor: 'n-resize',
  },
  resizerNE: {
    top: -6,
    right: -6,
    cursor: 'ne-resize',
  },
  resizerE: {
    bottom: '48%',
    right: -6,
    cursor: 'e-resize',
  },
  resizerSE: {
    bottom: -6,
    right: -6,
    cursor: 'nwse-resize',
  },
  resizerS: {
    bottom: -2,
    left: '48%',
    cursor: 's-resize',
  },
  resizerSW: {
    bottom: -6,
    left: -6,
    cursor: 'sw-resize',
  },
  resizerW: {
    bottom: '48%',
    left: -6,
    cursor: 'w-resize',
  },
  resizerNW: {
    top: -6,
    left: -6,
    cursor: 'nw-resize',
  },
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Direction = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};

export default function ImageResizer({
  nodeKey,
  onResizeStart,
  onResizeEnd,
  imageRef,
  editor,
}: {
  editor: LexicalEditor;
  imageRef: {current: null | HTMLElement};
  nodeKey: NodeKey;
  onResizeEnd: (widthPercent: number | null) => void;
  onResizeStart: () => void;
}): JSX.Element {
  const controlWrapperRef = useRef<HTMLDivElement>(null);
  const userSelect = useRef({
    priority: '',
    value: 'default',
  });
  const positioningRef = useRef<{
    currentHeight: number;
    currentWidth: number;
    direction: number;
    isResizing: boolean;
    ratio: number;
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  }>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });
  const editorRootElement = editor.getRootElement();
  // Find max width, accounting for editor padding.
  const maxWidthContainer =
    editorRootElement !== null
      ? editorRootElement.getBoundingClientRect().width - 20
      : 100;
  const maxHeightContainer =
    editorRootElement !== null
      ? editorRootElement.getBoundingClientRect().height - 20
      : 100;

  const minWidth = 100;
  const minHeight = 100;

  const setStartCursor = (direction: number) => {
    const ew = direction === Direction.east || direction === Direction.west;
    const ns = direction === Direction.north || direction === Direction.south;
    const nwse =
      (direction & Direction.north && direction & Direction.west) ||
      (direction & Direction.south && direction & Direction.east);

    const cursorDir = ew ? 'ew' : ns ? 'ns' : nwse ? 'nwse' : 'nesw';

    if (editorRootElement !== null) {
      editorRootElement.style.setProperty(
        'cursor',
        `${cursorDir}-resize`,
        'important',
      );
    }
    if (document.body !== null) {
      document.body.style.setProperty(
        'cursor',
        `${cursorDir}-resize`,
        'important',
      );
      userSelect.current.value = document.body.style.getPropertyValue(
        '-webkit-user-select',
      );
      userSelect.current.priority = document.body.style.getPropertyPriority(
        '-webkit-user-select',
      );
      document.body.style.setProperty(
        '-webkit-user-select',
        `none`,
        'important',
      );
    }
  };

  const setEndCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty('cursor', 'text');
    }
    if (document.body !== null) {
      document.body.style.setProperty('cursor', 'default');
      document.body.style.setProperty(
        '-webkit-user-select',
        userSelect.current.value,
        userSelect.current.priority,
      );
    }
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: number,
  ) => {
    if (!editor.isEditable()) {
      return;
    }

    const image = imageRef.current;
    const resizeTarget = image?.closest('figure') ?? image;
    const controlWrapper = controlWrapperRef.current;

    if (image !== null && resizeTarget !== null && controlWrapper !== null) {
      event.preventDefault();
      const {width, height} = image.getBoundingClientRect();
      const zoom = calculateZoomLevel(image);
      const positioning = positioningRef.current;
      positioning.startWidth = width;
      positioning.startHeight = height;
      positioning.ratio = width / height;
      positioning.currentWidth = width;
      positioning.currentHeight = height;
      positioning.startX = event.clientX / zoom;
      positioning.startY = event.clientY / zoom;
      positioning.isResizing = true;
      positioning.direction = direction;

      setStartCursor(direction);
      onResizeStart();

      controlWrapper.classList.add('image-control-wrapper--resizing');
      const startWidthPercent = clamp(
        (width / maxWidthContainer) * 100,
        (minWidth / maxWidthContainer) * 100,
        100,
      );
      resizeTarget.style.width = `${startWidthPercent}%`;

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    }
  };
  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const resizeTarget = image?.closest('figure') ?? image;
    const positioning = positioningRef.current;

    const isHorizontal =
      positioning.direction & (Direction.east | Direction.west);
    const isVertical =
      positioning.direction & (Direction.south | Direction.north);

    if (image !== null && resizeTarget !== null && positioning.isResizing) {
      const zoom = calculateZoomLevel(image);
      // Corner cursor
      if (isHorizontal && isVertical) {
        let diff = Math.floor(positioning.startX - (event.clientX / zoom));
        diff = positioning.direction & Direction.east ? -diff : diff;

        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          maxWidthContainer,
        );

        const height = width / positioning.ratio;
        const widthPercent = clamp(
          (width / maxWidthContainer) * 100,
          (minWidth / maxWidthContainer) * 100,
          100,
        );
        resizeTarget.style.width = `${widthPercent}%`;
        positioning.currentHeight = height;
        positioning.currentWidth = width;
      } else if (isVertical) {
        let diff = Math.floor(positioning.startY - (event.clientY / zoom));
        diff = positioning.direction & Direction.south ? -diff : diff;

        const height = clamp(
          positioning.startHeight + diff,
          minHeight,
          maxHeightContainer,
        );

        const width = height * positioning.ratio;
        const widthPercent = clamp(
          (width / maxWidthContainer) * 100,
          (minWidth / maxWidthContainer) * 100,
          100,
        );
        resizeTarget.style.width = `${widthPercent}%`;
        positioning.currentHeight = height;
        positioning.currentWidth = width;
      } else {
        let diff = Math.floor(positioning.startX - (event.clientX / zoom));
        diff = positioning.direction & Direction.east ? -diff : diff;

        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          maxWidthContainer,
        );

        const widthPercent = clamp(
          (width / maxWidthContainer) * 100,
          (minWidth / maxWidthContainer) * 100,
          100,
        );
        resizeTarget.style.width = `${widthPercent}%`;
        positioning.currentWidth = width;
      }
    }
  };
  const handlePointerUp = () => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const width = positioning.currentWidth;
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;

      controlWrapper.classList.remove('image-control-wrapper--resizing');

      setEndCursor();
      
      const widthPercent = maxWidthContainer > 0
        ? (width / maxWidthContainer) * 100
        : null;
      
      const clampedWidthPercent = widthPercent !== null
        ? clamp(widthPercent, (minWidth / maxWidthContainer) * 100, 100)
        : null;

      editor.dispatchCommand(SET_IMAGE_SIZE_COMMAND, {
        nodeKey,
        widthPercent: clampedWidthPercent,
      });
      onResizeEnd(clampedWidthPercent);

      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    }
  };
  const classes = useStyles(styles);

  return (
    <div ref={controlWrapperRef} className={classes.controlWrapper}>
      <div
        className={classNames(classes.resizer, classes.resizerNE)}
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }}
      />
      <div
        className={classNames(classes.resizer, classes.resizerSE)}
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }}
      />
      <div
        className={classNames(classes.resizer, classes.resizerSW)}
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }}
      />
      <div
        className={classNames(classes.resizer, classes.resizerNW)}
        onPointerDown={(event) => {
          handlePointerDown(event, Direction.north | Direction.west);
        }}
      />
    </div>
  );
}
