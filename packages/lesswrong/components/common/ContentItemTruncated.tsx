import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';
import { ContentItemBody } from "./ContentItemBody";

const TRUNCATION_MAX_HEIGHT = 600;

const styles = (theme: ThemeType) => ({
  maxHeight: {
    maxHeight: TRUNCATION_MAX_HEIGHT,
    overflow: "hidden"
  }
})

// ContentItemTruncated: Wrapper around ContentItemBody with options for
// limiting length and height in various ways.
const ContentItemTruncatedInner = ({classes, maxLengthWords, graceWords=20, expanded=false, rawWordCount, getTruncatedSuffix, nonTruncatedSuffix, dangerouslySetInnerHTML, className, description, nofollow}: {
  classes: ClassesType<typeof styles>,
  maxLengthWords: number,
  graceWords?: number,
  expanded?: boolean,
  rawWordCount: number,
  /**
   * Suffix, shown only if truncated. If the truncation was due to the word
   * count limit, includes the number of words left; if it was due to the height
   * limit instead of the word-count limit, wordsLeft is null.
   */
  getTruncatedSuffix?: (props: {wordsLeft: number|null}) => React.ReactNode,
  // Alternate suffix, shown if truncated didn't happen (because it wasn't long
  // enough to need it)
  nonTruncatedSuffix?: React.ReactNode
  
  dangerouslySetInnerHTML: { __html: string },
  className?: string,
  description?: string,
  nofollow?: boolean
}) => {
  const contentsRef = useRef<HTMLDivElement>(null);
  const [hasHeightLimit, setHasHeightLimit] = useState(false);
  
  const html = dangerouslySetInnerHTML.__html;
  const {truncatedHtml, wasTruncated, wordsLeft} =
    expanded ? {
      truncatedHtml: html,
      wasTruncated: false,
      wordsLeft: 0,
    } : truncateWithGrace(html, maxLengthWords, graceWords, rawWordCount);
  
  useEffect(() => {
    if (contentsRef.current) {
      const measuredHeight = contentsRef.current.offsetHeight;
      if (measuredHeight > TRUNCATION_MAX_HEIGHT) {
        setHasHeightLimit(true);
      }
    }
  }, [truncatedHtml]);

  const showSuffix = (wasTruncated || (hasHeightLimit && !expanded));

  return <>
    <div
      ref={contentsRef}
      className={classNames(
        !expanded && hasHeightLimit && classes.maxHeight
      )}
    >
      <ContentItemBody
        dangerouslySetInnerHTML={{__html: truncatedHtml}}
        className={className}
        description={description}
        nofollow={nofollow}
      />
    </div>
    {showSuffix && getTruncatedSuffix && getTruncatedSuffix({wordsLeft: hasHeightLimit ? null : wordsLeft})}
    {!showSuffix && nonTruncatedSuffix}
  </>
}

export const ContentItemTruncated = registerComponent('ContentItemTruncated', ContentItemTruncatedInner, {styles});

declare global {
  interface ComponentTypes {
    ContentItemTruncated: typeof ContentItemTruncated
  }
}
