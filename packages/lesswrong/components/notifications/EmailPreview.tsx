import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

// Approximates a phone in portrait, which is narrow enough to trigger both of
// the email stylesheet's breakpoints (600px and 480px).
export const MOBILE_EMAIL_PREVIEW_WIDTH = 390;

const styles = defineStyles('EmailPreview', (theme: ThemeType) => ({
  emailPreview: {
    marginBottom: 40,
    minWidth: 0,
  },
  headerName: {},
  headerContent: {},
  emailBodyFrame: {
    display: "block",
    width: "100%",
    maxWidth: 800,
    height: 500,
    marginLeft: "auto",
    marginRight: "auto",
    border: theme.palette.border.normal,
    background: "white",
  },
  mobileBodyFrame: {
    maxWidth: MOBILE_EMAIL_PREVIEW_WIDTH,
  },
  tallBodyFrame: {
    height: "calc(100vh - 200px)",
    minHeight: 800,
  },
  emailTextVersion: {
    width: "100%",
    maxWidth: 800,
    height: 300,
    overflowY: "scroll",
    border: theme.palette.border.maxIntensity,
    padding: 10,
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  },
}));

export type EmailPreviewBodyView = "both" | "html" | "text";
export type EmailPreviewViewport = "desktop" | "mobile";

// The frame is collapsed before measuring so that it can shrink as well as
// grow, eg when switching from the mobile viewport back to the desktop one.
function fitFrameToContent(frame: HTMLIFrameElement | null) {
  const frameDocument = frame?.contentDocument;
  if (!frame || !frameDocument) {
    return;
  }
  frame.style.height = "0px";
  const contentHeight = Math.max(
    frameDocument.body.scrollHeight,
    frameDocument.documentElement.scrollHeight,
  );
  frame.style.height = `${contentHeight + 2}px`;
}

export const EmailPreview = ({
  email,
  sentDate,
  tall,
  fullHeight,
  bodyView = "both",
  viewport = "desktop",
}: {
  email: EmailPreview,
  sentDate?: Date,
  tall?: boolean,
  fullHeight?: boolean,
  bodyView?: EmailPreviewBodyView,
  viewport?: EmailPreviewViewport,
}) => {
  const classes = useStyles(styles);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const showHtml = bodyView === "both" || bodyView === "html";
  const showText = bodyView === "both" || bodyView === "text";
  // Changing the viewport reflows the email without reloading the frame, so
  // the height has to be remeasured outside of the load handler.
  useEffect(() => {
    if (fullHeight) {
      fitFrameToContent(frameRef.current);
    }
  }, [fullHeight, viewport, email.html]);

  const handleFrameLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (fullHeight) {
      fitFrameToContent(event.currentTarget);
    }
  };

  return <div className={classes.emailPreview}>
    {sentDate && <p>{String(sentDate)}</p>}
    <div>
      <span className={classes.headerName}>Subject: </span>
      <span className={classes.headerContent}>{email.subject}</span>
    </div>
    <div>
      <span className={classes.headerName}>To: </span>
      <span className={classes.headerContent}>{email.to}</span>
    </div>
    {showHtml && email.html && (
      <iframe
        ref={frameRef}
        className={classNames(
          classes.emailBodyFrame,
          tall && classes.tallBodyFrame,
          viewport === "mobile" && classes.mobileBodyFrame,
        )}
        srcDoc={email.html}
        title={`Email preview: ${email.subject ?? "untitled"}`}
        onLoad={handleFrameLoad}
      />
    )}
    {showText && (
      <div className={classes.emailTextVersion}>
        {email.text}
      </div>
    )}
  </div>;
}

export default EmailPreview;



