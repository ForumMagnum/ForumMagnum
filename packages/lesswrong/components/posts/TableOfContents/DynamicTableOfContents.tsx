import React, { useCallback, useMemo, useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { EditorContents } from '../../editor/Editor';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import TableOfContents from "./TableOfContents";
import ToCColumn from "./ToCColumn";

export interface DynamicTableOfContentsContextType {
  setToc: (document: EditorContents) => void;
}

export const DynamicTableOfContentsContext = React.createContext<DynamicTableOfContentsContextType | null>(null);

export const DynamicTableOfContents = ({title, rightColumnChildren, children}: {
  title?: string,
  rightColumnChildren?: React.ReactNode,
  children: React.ReactNode
}) => {
  const [latestHtml, setLatestHtml] = useState<string | null>(null);
  const sectionData = useDynamicTableOfContents({
    html: latestHtml,
    post: null,
    answers: [],
  }) ?? {
    html: null,
    sections: []
  }

  const setToc = useCallback((document: EditorContents) => {
    // TODO handle markdown and everything else
    if (document.type === 'ckEditorMarkup') {
      setLatestHtml(document.value)
    }
  }, []);

  const context = useMemo(() => ({setToc: setToc}), [setToc]);

  const displayedTitle = title || (sectionData.sections.length > 0 ? "Table of Contents" : "")

  return <div>
    <DynamicTableOfContentsContext.Provider value={context}>
      <ToCColumn
        tableOfContents={<TableOfContents 
          sectionData={sectionData}
          title={displayedTitle}
        />}
        rightColumnChildren={rightColumnChildren}
        notHideable
      >
        {children}
      </ToCColumn>
    </DynamicTableOfContentsContext.Provider>
  </div>;
}

export default registerComponent('DynamicTableOfContents', DynamicTableOfContents);



