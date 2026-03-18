import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContents } from '../../editor/Editor';
import { useDynamicTableOfContents } from '../../hooks/useDynamicTableOfContents';
import TableOfContents from "./TableOfContents";
import MultiToCLayout, { HOVER_CLASSNAME } from "./MultiToCLayout";
import { DynamicTableOfContentsContext } from '@/components/common/sharedContexts';
import { isLWorAF } from '@/lib/instanceSettings';
import type { ToCData, ToCSection } from '@/lib/tableOfContents';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const EMPTY_TOC_DATA: ToCData = {
  html: null,
  sections: [],
};

const EDITOR_TOC_SCROLLER_CLASS_NAME = 'EditorToCStickyBlockScroller';

const editorStyles = defineStyles("DynamicTableOfContents", (theme: ThemeType) => ({
  editorLayout: {
    // Hover-to-reveal ToC — match published page behavior (MultiToCLayout.root)
    [`&:has(.ToCColumn-gap1:hover) .${HOVER_CLASSNAME}, &:has(.ToCColumn-toc:hover) .${HOVER_CLASSNAME}`]: {
      opacity: 1,
    },
    // Match the published post page grid (MultiToCLayout) centering,
    // using the sidenote column space for the editor settings sidebar
    '& .ToCColumn-tocActivated': {
      gridTemplateColumns: `
        0px
        minmax(200px, 270px)
        minmax(35px, 0.5fr)
        minmax(min-content, 720px)
        minmax(10px, 30px)
        minmax(280px, 320px)
        minmax(0px, 0.5fr)
        0px
      `,
      // At md breakpoint, collapse the sidebar column (same as sidenotes)
      [theme.breakpoints.down('md')]: {
        gridTemplateColumns: `
          0px
          minmax(200px, 270px)
          minmax(35px, 0.5fr)
          minmax(min-content, 720px)
          minmax(10px, 30px)
          0px
          minmax(0px, 0.5fr)
          0px
        `,
      },
      [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: `
          0px
          0px
          1fr
          minmax(0, 720px)
          minmax(5px, 1fr)
          0px
          0px
          0px
        `,
      },
    },
    '& .ToCColumn-rhs': {
      justifySelf: 'end',
      width: '100%',
      maxWidth: 320,
      [theme.breakpoints.down('md')]: {
        display: 'none',
      },
    },
    '& .ToCColumn-toc': {
      marginTop: -50,
    },
    '& #editor-settings-portal': {
      width: '100%',
      maxWidth: 320,
      minHeight: 1,
    },
    '& .ToCColumn-stickyBlockScroller': {
      top: 0,
      height: 'calc(100vh - 12px)',
      transition: 'top 0.2s ease-in-out, height 0.2s ease-in-out',
      // Account for the fixed mobile bottom bar (56px) below lg
      [theme.breakpoints.down('md')]: {
        height: 'calc(100vh - 56px - 12px)',
      },
    },
    '& .ToCColumn-stickyBlock': {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 0,
      paddingBottom: 0,
    },
    [`& .${EDITOR_TOC_SCROLLER_CLASS_NAME}`]: {
      top: 0,
      height: 'calc(100vh - 12px)',
      [theme.breakpoints.down('md')]: {
        height: 'calc(100vh - 56px - 12px)',
      },
    },
  },
  '@global': {
    [`body:has(.headroom--pinned) .${EDITOR_TOC_SCROLLER_CLASS_NAME}, body:has(.headroom--unfixed) .${EDITOR_TOC_SCROLLER_CLASS_NAME}`]: {
      top: 'var(--header-height)',
      height: 'calc(100vh - var(--header-height) - 12px)',
      [theme.breakpoints.down('md')]: {
        height: 'calc(100vh - var(--header-height) - 56px - 12px)',
      },
    },
  },
}));

/**
 * Syncs anchor IDs from extracted ToC sections onto the live editor DOM headings.
 *
 * The extractTableOfContents function generates anchor IDs from heading text but only
 * applies them to a temporary DOM used for parsing. The live editor headings need these
 * IDs for FixedPositionToC to measure their positions and render proportionally.
 *
 * Scoped to `.ck-editor__editable` to avoid picking up headings from other parts of the
 * page (e.g. moderation warnings rendered above the editor).
 */
function syncHeadingIdsToEditorDom(sections: ToCSection[]) {
  const editorContent = (
    document.querySelector('#postContent .ck-editor__editable')
    ?? document.querySelector('#postContent .LexicalContentEditable-root')
    ?? document.querySelector('#postContent [contenteditable="true"]')
  );
  if (!editorContent) return;

  const headings = Array.from(editorContent.querySelectorAll('h1, h2, h3, h4'));
  const contentSections = sections.filter(s => s.title && !s.divider && !s.answer);

  headings.forEach((heading, idx) => {
    if (idx < contentSections.length) {
      heading.id = contentSections[idx].anchor;
    }
  });
}

export const DynamicTableOfContents = ({title, rightColumnChildren, children}: {
  title?: string,
  rightColumnChildren?: React.ReactNode,
  children: React.ReactNode,
}) => {
  const classes = useStyles(editorStyles);
  const [latestHtml, setLatestHtml] = useState<string | null>(null);
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('.ToCColumn-stickyBlockScroller');
    if (!scroller) return;
    scroller.classList.add(EDITOR_TOC_SCROLLER_CLASS_NAME);
    return () => scroller.classList.remove(EDITOR_TOC_SCROLLER_CLASS_NAME);
  }, []);

  const sectionData = useDynamicTableOfContents({
    html: latestHtml,
    post: null,
    answers: [],
  });
  const resolvedSectionData = useMemo(() => sectionData ?? EMPTY_TOC_DATA, [sectionData]);

  const useFixedPositionToc = isLWorAF();

  // Sync heading IDs to the live editor DOM so FixedPositionToC can measure positions
  useEffect(() => {
    if (!useFixedPositionToc || !resolvedSectionData.sections.length) return;
    syncHeadingIdsToEditorDom(resolvedSectionData.sections);
  }, [useFixedPositionToc, resolvedSectionData]);

  const setToc = useCallback((document: EditorContents) => {
    // TODO handle markdown and everything else
    if (document.type === 'ckEditorMarkup' || document.type === 'lexical') {
      setLatestHtml(document.value)
    }
  }, []);

  const context = useMemo(() => ({setToc: setToc}), [setToc]);

  const displayedTitle = title || (resolvedSectionData.sections.length > 0 ? "Table of Contents" : "")

  const tableOfContents = <TableOfContents
    sectionData={resolvedSectionData}
    title={displayedTitle}
    fixedPositionToc={true}
  />;

  return <div className={classNames(useFixedPositionToc && classes.editorLayout)}>
    <DynamicTableOfContentsContext.Provider value={context}>
      <MultiToCLayout
        segments={[{
          toc: tableOfContents,
          centralColumn: <div id="postContent">{children}</div>,
          rightColumn: rightColumnChildren,
        }]}
        tocRowMap={[0]}
        tocContext="post"
      />
    </DynamicTableOfContentsContext.Provider>
  </div>;
}

export default DynamicTableOfContents;
