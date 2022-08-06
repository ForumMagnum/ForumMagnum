import React, { useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import type { ToCData } from '../../../server/tableOfContents';
import type { ToCDisplayOptions } from './TableOfContentsList';

const styles = (theme: ThemeType): JssStyles => ({
});

// Context used to share a reference used to share the table of contents
// between the ToC itself, and the Header. The Header uses the ToC to change
// its icon (if a ToC is present) and to put the ToC inside NavigationMenu; it
// needs this Context because it doesn't have access to the post, which is on
// the wrong side of a whole lot of plumbing.
//
// The reference is to a function setToC, which puts the ToC in the state of
// Layout.
type setToCFn = (title: string|null, sectionData: ToCData|null)=>void
export const TableOfContentsContext = React.createContext<setToCFn|null>(null);

const TableOfContents = ({sectionData, title, onClickSection, displayOptions, classes}: {
  sectionData: ToCData,
  title: string|null,
  onClickSection?: ()=>void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const setToC = useContext(TableOfContentsContext);

  useEffect(() => {
    if (setToC)
      setToC(title, sectionData);
    
    return () => {
      if (setToC)
        setToC(null, null);
    }
  }, [title, sectionData, setToC]);

  if (!sectionData)
    return <div/>

  return (
    <Components.TableOfContentsList
      sectionData={sectionData}
      title={title}
      onClickSection={onClickSection}
      displayOptions={displayOptions}
    />
  );
}

const TableOfContentsComponent = registerComponent(
  "TableOfContents", TableOfContents, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    TableOfContents: typeof TableOfContentsComponent
  }
}
