import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';

const TRUNCATION_MAX_HEIGHT = 600;

const styles = (theme: ThemeType): JssStyles => ({
  maxHeight: {
    maxHeight: TRUNCATION_MAX_HEIGHT,
    overflow: "hidden"
  }
})

// ContentItemTruncated: Wrapper around ContentItemBody with options for
// limiting length and height in various ways.
const ContentItemTruncated = ({classes, maxLengthWords, graceWords=20, expanded=false, rawWordCount, getTruncatedSuffix, nonTruncatedSuffix, dangerouslySetInnerHTML, className, description, nofollow}: {
  classes: ClassesType,
  maxLengthWords: number,
  graceWords?: number,
  expanded?: boolean,
  rawWordCount: number,
  // Suffix, shown only if truncated
  getTruncatedSuffix?: (props: {wordsLeft: number}) => React.ReactNode,
  // Alternate suffix, shown if truncated didn't happen (because it wasn't long
  // enough to need it)
  nonTruncatedSuffix?: React.ReactNode
  
  dangerouslySetInnerHTML: { __html: string },
  className?: string,
  description?: string,
  nofollow?: boolean
}) => {
  const {ContentItemBody} = Components;
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

  const showSuffix = (wasTruncated || hasHeightLimit);

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
    {showSuffix && getTruncatedSuffix && getTruncatedSuffix({wordsLeft})}
    {!showSuffix && nonTruncatedSuffix}
  </>
}

const ContentItemTruncatedComponent = registerComponent('ContentItemTruncated', ContentItemTruncated, {styles});

declare global {
  interface ComponentTypes {
    ContentItemTruncated: typeof ContentItemTruncatedComponent
  }
}
