import React, { useState, useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import withErrorBoundary from '../../common/withErrorBoundary'
import { SidebarsContext } from '../../common/SidebarsWrapper';
import type { ToCData } from '../../../lib/tableOfContents';
import type { ToCDisplayOptions } from './TableOfContentsList';
import { AnalyticsContext } from '@/lib/analyticsEvents';

const styles = (theme: ThemeType) => ({
});

const TableOfContents = ({sectionData, title, heading, onClickSection, displayOptions, fixedPositionToc = false, hover, prefix}: {
  sectionData: ToCData,
  title: string,
  heading?: React.ReactNode,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
  fixedPositionToc?: boolean,
  hover?: boolean,
  prefix?: React.ReactNode,
}) => {
  const {setToC, toc} = useContext(SidebarsContext)!;

  useEffect(() => {
    if (setToC) {
      setToC({title, sectionData});
    }
    
    return () => {
      if (setToC)
        setToC(null);
    }
  }, [title, sectionData, setToC]);

  const displayToc = toc ?? {title, sectionData}

  if (fixedPositionToc) {
    return (
      <AnalyticsContext pageSectionContext="tableOfContents" componentName="FixedPositionToC">
        <Components.FixedPositionToC
          tocSections={displayToc.sectionData.sections}
          prefix={prefix}
          title={title}
          heading={heading}
          onClickSection={onClickSection}
          displayOptions={displayOptions}
          hover={hover}
        />
      </AnalyticsContext>
    );
  }

  return (
    <AnalyticsContext pageSectionContext="tableOfContents" componentName="TableOfContentsList">
      <Components.TableOfContentsList
        tocSections={sectionData.sections}
        title={title}
        onClickSection={onClickSection}
        displayOptions={displayOptions}
      />
    </AnalyticsContext>
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
