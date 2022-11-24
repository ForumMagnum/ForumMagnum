import React, { useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import { SidebarsContext } from '../../common/SidebarsWrapper';
import type { ToCData } from '../../../server/tableOfContents';
import type { ToCDisplayOptions } from './TableOfContentsList';

const styles = (theme: ThemeType): JssStyles => ({
});

const TableOfContents = ({sectionData, title, onClickSection, displayOptions, classes}: {
  sectionData: ToCData,
  title: string,
  onClickSection?: ()=>void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {setToC} = useContext(SidebarsContext)!;

  useEffect(() => {
    if (setToC) {
      setToC({title, sectionData});
    }
    
    return () => {
      if (setToC)
        setToC(null);
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
