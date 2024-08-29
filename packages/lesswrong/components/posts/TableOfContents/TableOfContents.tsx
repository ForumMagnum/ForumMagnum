import React, { useEffect, useContext } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import withErrorBoundary from '../../common/withErrorBoundary'
import { SidebarsContext } from '../../common/SidebarsWrapper';
import type { ToCSection } from '../../../lib/tableOfContents';
import type { ToCDisplayOptions } from './TableOfContentsList';

const styles = (theme: ThemeType): JssStyles => ({
});

const TableOfContents = ({sections, title, onClickSection, displayOptions, fixedPositionToc = false, hover, commentCount, answerCount}: {
  sections: ToCSection[],
  title: string,
  onClickSection?: () => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType,
  fixedPositionToc?: boolean,
  hover?: boolean,
  commentCount?: number,
  answerCount?: number,
}) => {
  const {setToC, toc} = useContext(SidebarsContext)!;

  useEffect(() => {
    if (setToC) {
      setToC({title, sections});
    }
    
    return () => {
      if (setToC)
        setToC(null);
    }
  }, [title, sections, setToC]);

  const displayToc = toc ?? {title, sections}

  if (fixedPositionToc) {
    return (
      <Components.FixedPositionToC
        tocSections={displayToc.sections}
        title={title}
        onClickSection={onClickSection}
        displayOptions={displayOptions}
        hover={hover}
        commentCount={commentCount}
        answerCount={answerCount}
      />
    );
  }

  return (
    <Components.TableOfContentsList
      tocSections={sections}
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
