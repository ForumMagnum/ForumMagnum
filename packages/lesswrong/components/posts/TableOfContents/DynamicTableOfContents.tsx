import React, { useCallback, useMemo, useState } from 'react';
import { EditorContents } from '../../editor/Editor';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import TableOfContents from "./TableOfContents";
import ToCColumn from "./ToCColumn";
import MultiToCLayout from "./MultiToCLayout";
import { DynamicTableOfContentsContext } from '@/components/common/sharedContexts';

export const DynamicTableOfContents = ({title, rightColumnChildren, children, useMultiToCLayout = false}: {
  title?: string,
  rightColumnChildren?: React.ReactNode,
  children: React.ReactNode,
  useMultiToCLayout?: boolean,
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
    if (document.type === 'ckEditorMarkup' || document.type === 'lexical') {
      setLatestHtml(document.value)
    }
  }, []);

  const context = useMemo(() => ({setToc: setToc}), [setToc]);

  const displayedTitle = title || (sectionData.sections.length > 0 ? "Table of Contents" : "")

  const tableOfContents = <TableOfContents
    sectionData={sectionData}
    title={displayedTitle}
    fixedPositionToc={true}
  />;

  return <div>
    <DynamicTableOfContentsContext.Provider value={context}>
      {useMultiToCLayout ? <MultiToCLayout
        segments={[{
          toc: tableOfContents,
          centralColumn: children,
          rightColumn: rightColumnChildren,
        }]}
        tocRowMap={[0]}
        tocContext="post"
      /> : <ToCColumn
        tableOfContents={tableOfContents}
        rightColumnChildren={rightColumnChildren}
        notHideable
      >
        {children}
      </ToCColumn>}
    </DynamicTableOfContentsContext.Provider>
  </div>;
}

export default DynamicTableOfContents;



