import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { truncateWithGrace } from '../../lib/editor/ellipsize';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  maxHeight: {
    maxHeight: 600,
    overflow: "hidden"
  }
})

// ContentItemTruncated: Wrapper around ContentItemBody with options for
// limiting length and height in various ways.
const ContentItemTruncated = ({classes, maxLengthWords, graceWords=20, expanded=false, rawWordCount, getTruncatedSuffix, nonTruncatedSuffix, dangerouslySetInnerHTML, className, description, nofollow}: {
  classes: ClassesType<typeof styles>,
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
  
  const html = dangerouslySetInnerHTML.__html;
  const {truncatedHtml, wasTruncated, wordsLeft} =
    expanded ? {
      truncatedHtml: html,
      wasTruncated: false,
      wordsLeft: 0,
    } : truncateWithGrace(html, maxLengthWords, graceWords, rawWordCount);
  
  return <>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: truncatedHtml}}
      className={classNames(className, !expanded && classes.maxHeight)}
      description={description}
      nofollow={nofollow}
    />
    {wasTruncated && getTruncatedSuffix && getTruncatedSuffix({wordsLeft})}
    {!wasTruncated && nonTruncatedSuffix}
  </>
}

const ContentItemTruncatedComponent = registerComponent('ContentItemTruncated', ContentItemTruncated, {styles});

declare global {
  interface ComponentTypes {
    ContentItemTruncated: typeof ContentItemTruncatedComponent
  }
}
