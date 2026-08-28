import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Card } from "@/components/widgets/Paper";
import { useHover } from '../common/withHover';
import classNames from 'classnames';
import { isMobile } from '@/lib/utils/isMobile';
import ContentStyles from '../common/ContentStyles';
import FootnoteDialog from "./FootnoteDialog";
import LWPopper from "../common/LWPopper";
import { ContentItemBody } from "../contents/ContentItemBody";
import { InteractionWrapper } from '../common/useClickableCell';
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { useDialog } from '../common/withDialog';
import { useTheme } from '../themes/useTheme';
import { useStyles } from '../hooks/useStyles';
import { FootnoteAncestorsContext, footnotePreviewStyles } from './FootnotePreview';

/**
 * A hovernote: a stretch of highlighted text whose footnote content shows in
 * a hover card. The content also appears (numbered) in the footnotes section
 * at the bottom of the post, but unlike a regular footnote reference there is
 * no [n] marker and no sidenote in the margin — the highlighted text itself is
 * the hover target.
 *
 * The extraction of the footnote's HTML from the rendered page works the same
 * way as FootnotePreview's: the footnote section is in the same document, so
 * we look up `#fn{id}` in the DOM.
 */
const HovernotePreview = ({footnoteId, id, contentStyleType="postHighlight", children}: {
  footnoteId: string,
  id?: string,
  contentStyleType?: ContentStyleType,
  children: React.ReactNode,
}) => {
  const classes = useStyles(footnotePreviewStyles);
  const { openDialog } = useDialog();
  const [disableHover, setDisableHover] = useState(false);
  const theme = useTheme();
  const minScreenWidthForTooltips = theme.breakpoints.values.sm;
  const href = `#fn${footnoteId}`;
  const { eventHandlers: anchorEventHandlers, hover: anchorHovered, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "HovernotePreview",
      href,
    },
    getIsEnabled: () => {
      return !isMobile() && window.innerWidth >= minScreenWidthForTooltips;
    },
  });
  const [footnoteHTML, setFootnoteHTML] = useState<string|null>(null);
  const memoizedEmptyArray = useMemo(() => [], []);
  const footnoteAncestors = useContext(FootnoteAncestorsContext) ?? memoizedEmptyArray;
  const newFootnoteAncestors = useMemo(() => [...footnoteAncestors, href], [footnoteAncestors, href]);

  useEffect(() => {
    if (footnoteAncestors.includes(href)) {
      return;
    }
    const footnoteContentsElement = document.getElementById(`fn${footnoteId}`);
    if (!footnoteContentsElement) {
      return;
    }
    const isNonempty = !!Array.from(footnoteContentsElement.querySelectorAll("p, li"))
      .reduce((acc, p) => acc + p.textContent, "").trim();
    if (isNonempty) {
      setFootnoteHTML((oldFootnoteHTML) => oldFootnoteHTML ?? footnoteContentsElement.innerHTML);
    }
  }, [footnoteId, href, footnoteAncestors]);

  const onClick = useCallback((ev: React.MouseEvent) => {
    const isWideEnoughForTooltips = window.innerWidth >= minScreenWidthForTooltips;
    const openModalOnClick = isMobile() || !isWideEnoughForTooltips;
    if (openModalOnClick && footnoteHTML !== null) {
      setDisableHover(true);
      openDialog({
        name: "FootnoteDialog",
        contents: ({onClose}) => <FootnoteDialog
          onClose={onClose}
          footnoteHTML={footnoteHTML}
        />
      });
      ev.preventDefault();
    }
  }, [footnoteHTML, openDialog, minScreenWidthForTooltips]);

  return (
    <span
      {...anchorEventHandlers}
      className={classNames("hovernote", anchorHovered && classes.anchorHover)}
      id={id}
      role="doc-noteref"
      onClick={onClick}
    >
      {children}
      {footnoteHTML !== null && !disableHover && <LWPopper
        open={anchorHovered}
        anchorEl={anchorEl}
        placement="bottom-start"
        allowOverflow
        flip
        clickable
      >
        <InteractionWrapper>
          <Card>
            <ContentStyles contentType={contentStyleType} className={classes.hovercard}>
              <FootnoteAncestorsContext.Provider value={newFootnoteAncestors}>
                <ContentItemBody dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
              </FootnoteAncestorsContext.Provider>
            </ContentStyles>
          </Card>
        </InteractionWrapper>
      </LWPopper>}
    </span>
  );
}

export default HovernotePreview;
