import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ContentStyles from "../common/ContentStyles";
import LWDialog from "../common/LWDialog";
import { Paper } from '../widgets/Paper';
import { Backdrop } from '../widgets/Backdrop';
import ClickAwayListener from '@/lib/vendor/react-click-away-listener';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

/** Vertical gap between the bottom of the footnote anchor and the top of the dialog */
const ANCHORED_DIALOG_GAP = 8;
/** Duration of the backdrop fade-in and fade-out, in ms */
const BACKDROP_FADE_DURATION_MS = 200;

const styles = defineStyles("FootnoteDialog", (theme: ThemeType) => ({
  dialogPaper: {
    marginTop: 48,
    marginBottom: 100,
    marginLeft: 18,
    marginRight: 18,
  },
  // Positioned in the document (not the viewport) so that it scrolls with the
  // page. `top` is set inline from the anchor's position.
  anchoredWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: theme.zIndexes.modal,
    display: "flex",
    justifyContent: "center",
    paddingLeft: 18,
    paddingRight: 18,
    pointerEvents: "none", // to prevent interfering with clickaway
  },
  anchoredPaper: {
    width: "100%",
    maxWidth: theme.breakpoints.values.sm,
    maxHeight: "calc(100vh - 96px)",
    overflowY: "auto",
    pointerEvents: "auto",
  },
  content: {
    margin: 16,
    
    "& .footnote-content": {
      width: "auto",
    },
    "& .footnote-back-link": {
      display: "none",
    },
  },
}))

/**
 * Modal showing the contents of a footnote, used on mobile and narrow screens
 * where there's no room for a hover-preview. If `anchorEl` (the footnote
 * anchor that was tapped) is provided, the dialog is placed directly below it
 * and scrolls with the page; otherwise it is centered in the viewport.
 */
const FootnoteDialog = ({ footnoteHTML, onClose, anchorEl }: {
  footnoteHTML: string,
  onClose: () => void,
  anchorEl?: HTMLElement|null,
}) => {
  const classes = useStyles(styles);

  if (anchorEl) {
    return <AnchoredFootnoteDialog footnoteHTML={footnoteHTML} onClose={onClose} anchorEl={anchorEl}/>
  }

  return <LWDialog open onClose={onClose} paperClassName={classes.dialogPaper}>
    <FootnoteDialogContents footnoteHTML={footnoteHTML}/>
  </LWDialog>
}

const AnchoredFootnoteDialog = ({ footnoteHTML, onClose, anchorEl }: {
  footnoteHTML: string,
  onClose: () => void,
  anchorEl: HTMLElement,
}) => {
  const classes = useStyles(styles);
  const [top, setTop] = useState<number|null>(null);
  // While closing, the dialog contents are removed immediately but the
  // backdrop stays mounted (fading out) until `onClose` unmounts us.
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout|null>(null);

  useLayoutEffect(() => {
    setTop(getAnchoredDialogTop(anchorEl));
  }, [anchorEl]);

  const requestClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, BACKDROP_FADE_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useGlobalKeydown(ev => {
    if (ev.key === 'Escape') {
      requestClose();
    }
  });

  return <>
    <Backdrop visible={!closing} style="darken" fadeDurationMs={BACKDROP_FADE_DURATION_MS}/>
    {top !== null && !closing && createPortal(
      <ClickAwayListener onClickAway={requestClose}>
        <div className={classes.anchoredWrapper} style={{top}}>
          <Paper elevation={24} className={classes.anchoredPaper}>
            <FootnoteDialogContents footnoteHTML={footnoteHTML}/>
          </Paper>
        </div>
      </ClickAwayListener>,
      document.body
    )}
  </>
}

const FootnoteDialogContents = ({ footnoteHTML }: {
  footnoteHTML: string,
}) => {
  const classes = useStyles(styles);
  return <ContentStyles contentType="postHighlight" className={classes.content}>
    <div dangerouslySetInnerHTML={{__html: footnoteHTML || ""}} />
  </ContentStyles>
}

/**
 * Document-relative y coordinate for the top of the dialog: just below the
 * anchor element.
 */
function getAnchoredDialogTop(anchorEl: HTMLElement): number {
  return anchorEl.getBoundingClientRect().bottom + window.scrollY + ANCHORED_DIALOG_GAP;
}

export default FootnoteDialog;
