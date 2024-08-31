import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { EditorContents } from '../../editor/Editor';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import { fullHeightToCEnabled } from "@/lib/betas";
import { extractTableOfContents, ToCData, ToCSection } from '@/lib/tableOfContents';

export interface DynamicTableOfContentsContextType {
  tocChanged: (document: EditorContents) => void;
}

export const DynamicTableOfContentsContext = React.createContext<DynamicTableOfContentsContextType | null>(null);

export const DynamicTableOfContents = ({title, rightColumnChildren, children}: {
  title?: string,
  rightColumnChildren?: React.ReactNode,
  children: React.ReactNode
}) => {
  // FIXME: As designed, this gets periodic updates on post contents in the form
  // of HTML, but not a ref to the post contents itself as a DOM tree.
  // Ordinarily, when ToC generation runs server side, it produces annotated
  // HTML where section headings have IDs, so that we can match ToC sections to
  // their headings, but that doesn't work if we're doing it client side. The
  // practical upshot is that with this design, we can't use the fixed-position
  // ToC (which requires element refs in order to measure section sizes), we
  // can't highlight the current section based on scroll position, and we can't
  // make section headings clicable.

  const { TableOfContents, MultiToCLayout, ToCColumn } = Components

  const sections = useEditorTableOfContents({
    postBodySelector: ".input-contents"
  })

  const tocChanged = useCallback(() => {
    // TODO
  }, []);

  const context = useMemo(() => ({tocChanged: tocChanged}), [tocChanged]);
  const displayedTitle = title || (sections.length > 0 ? "Table of Contents" : "")

  return <DynamicTableOfContentsContext.Provider value={context}>
    <MultiToCLayout
      segments={[
        {
          toc: sections.length>0 ? <TableOfContents
            fixedPositionToc={fullHeightToCEnabled}
            sections={sections}
            title={displayedTitle}
          /> : <div/>,
          centralColumn: children,
          rightColumn: rightColumnChildren
        }
      ]}
    />
  </DynamicTableOfContentsContext.Provider>
}

const useEditorTableOfContents = ({ postBodySelector }: {
  postBodySelector: string
}): ToCSection[] => {
  const [sections, setSections] = useState<ToCSection[]>([]);
  
  useEffect(() => {
    // HACK: Sleep 2s because the post body starts out in a loading state, and we don't have anything to trigger a recheck after it finishes
    setTimeout(() => {
      const postBody = document.querySelector(postBodySelector);
      if (!postBody) return;
      const tocData = extractTableOfContents({
        document, window,
        rootElement: postBody as HTMLElement,
        includeElementRefs: true
      });
      setSections(tocData?.sections ?? []);
    }, 2000);
  }, [postBodySelector]);
  return sections;
}

const DynamicTableOfContentsComponent = registerComponent('DynamicTableOfContents', DynamicTableOfContents);

declare global {
  interface ComponentTypes {
    DynamicTableOfContents: typeof DynamicTableOfContentsComponent
  }
}

