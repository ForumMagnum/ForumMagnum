import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { EditorContents } from '../../editor/Editor';
import { useQuery, gql } from '@apollo/client';
import { ToCData } from '../../../lib/tableOfContents';

export interface DynamicTableOfContentsContextType {
  setToc: (document: EditorContents) => void;
}

export const DynamicTableOfContentsContext = React.createContext<DynamicTableOfContentsContextType | null>(null);

export const DynamicTableOfContents = ({title, rightColumnChildren, children}: {
  title?: string,
  rightColumnChildren?: React.ReactNode[],
  children: React.ReactNode
}) => {
  const [latestHtml, setLatestHtml] = useState<string | null>(null);
  const { TableOfContents, ToCColumn } = Components
  const [latestToc, setLatestToc] = useState<ToCData | null>(null);

  const { data, loading, error } = useQuery(gql`
    query ExtractTableOfContentsQuery($html: String!) {
      generateTableOfContents(html: $html)
    }
  `, {
    variables: {
      html: latestHtml ?? ''
    }
  })

  const setToc = useCallback((document: EditorContents) => {
    // TODO handle markdown and everything else
    if (document.type === 'ckEditorMarkup') {
      setLatestHtml(document.value)
    }
  }, []);

  useEffect(() => {
    if (data?.generateTableOfContents && data.generateTableOfContents !== latestToc) {
      setLatestToc(data.generateTableOfContents)
    }
  }, [data, latestToc])

  const context = useMemo(() => ({setToc: setToc}), [setToc]);

  const sectionData = latestToc ?? {html:null, sections:[], headingsCount:0};
  const displayedTitle = title || (sectionData.headingsCount > 0 ? "Table of Contents" : "")

  return <div>
    <DynamicTableOfContentsContext.Provider value={context}>
      <ToCColumn 
        tableOfContents={<TableOfContents 
          sectionData={sectionData}
          title={displayedTitle}
        />}
        rightColumnChildren={rightColumnChildren}
      >
        {children}
      </ToCColumn>
    </DynamicTableOfContentsContext.Provider>
  </div>;
}

const DynamicTableOfContentsComponent = registerComponent('DynamicTableOfContents', DynamicTableOfContents);

declare global {
  interface ComponentTypes {
    DynamicTableOfContents: typeof DynamicTableOfContentsComponent
  }
}

