import React, { useCallback, useState } from 'react';
import { Card } from "@/components/widgets/Paper";
import { useHover } from '../common/withHover';
import classNames from 'classnames';
import { isMobile } from '@/lib/utils/isMobile';
import { isRegularClick } from "@/components/posts/TableOfContents/TableOfContentsList";
import ContentStyles from '../common/ContentStyles';
import FootnoteDialog from "./FootnoteDialog";
import LWPopper from "../common/LWPopper";
import { ContentItemBody } from "../contents/ContentItemBody";
import { InteractionWrapper } from '../common/useClickableCell';
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { useDialog } from '../common/withDialog';
import { useTheme } from '../themes/useTheme';
import { useStyles } from '../hooks/useStyles';
import { FootnoteAncestorsContext, footnotePreviewStyles, useFootnoteHTML } from './FootnotePreview';

/**
 * A hovernote: a stretch of highlighted text whose footnote content shows in
 * a hover card. The content also appears (numbered) in the footnotes section
 * at the bottom of the post, but unlike a regular footnote reference there is
 * no [n] marker and no sidenote in the margin — the highlighted text itself is
 * the hover target. Clicking scrolls to the footnote item on desktop and opens
 * the footnote dialog on mobile.
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
  const { footnoteHTML, newFootnoteAncestors } = useFootnoteHTML(href);

  const onClick = useCallback((ev: React.MouseEvent) => {
    if (!isRegularClick(ev)) {
      return;
    }
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
    } else {
      document.getElementById(`fn${footnoteId}`)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [footnoteId, footnoteHTML, openDialog, minScreenWidthForTooltips]);

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
