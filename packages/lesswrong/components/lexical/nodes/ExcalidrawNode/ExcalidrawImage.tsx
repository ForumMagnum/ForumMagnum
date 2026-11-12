// Vendored from: https://github.com/facebook/lexical/commit/2e0f8fa65f7c9a389603008671d120bbd1f71d7a
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// LessWrong modifications from upstream: rather than rendering the diagram
// with Excalidraw's exportToSvg (which would require loading Excalidraw just
// to display a diagram), this displays the SVG that was rendered when the
// diagram was saved. Since that SVG is stored in the document, it's sanitized
// before display.

import type {JSX} from 'react';

import * as React from 'react';
import {useMemo} from 'react';
import { sanitize } from '@/lib/utils/sanitize';

type Props = {
  /**
   * The css class applied to the root element of this component
   */
  className?: string;
  /**
   * The ref object to be used to render the image
   */
  imageContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * The rendered diagram, as SVG markup
   */
  svg: string;
};

/**
 * @explorer-desc
 * A component for rendering an Excalidraw diagram as a static image
 */
export default function ExcalidrawImage({
  className,
  imageContainerRef,
  svg,
}: Props): JSX.Element {
  const sanitizedSvg = useMemo(() => sanitize(svg), [svg]);

  return (
    <div
      ref={node => {
        if (node) {
          if (imageContainerRef) {
            imageContainerRef.current = node;
          }
        }
      }}
      className={className}
      dangerouslySetInnerHTML={{__html: sanitizedSvg}}
    />
  );
}
