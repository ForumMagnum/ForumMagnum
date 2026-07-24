import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

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

export const EmailPreview = ({
  email,
  sentDate,
  tall,
  fullHeight,
  bodyView = "both",
}: {
  email: EmailPreview,
  sentDate?: Date,
  tall?: boolean,
  fullHeight?: boolean,
  bodyView?: EmailPreviewBodyView,
}) => {
  const classes = useStyles(styles);
  const showHtml = bodyView === "both" || bodyView === "html";
  const showText = bodyView === "both" || bodyView === "text";
  const handleFrameLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    if (!fullHeight) {
      return;
    }
    const frameDocument = event.currentTarget.contentDocument;
    if (!frameDocument) {
      return;
    }
    const contentHeight = Math.max(
      frameDocument.body.scrollHeight,
      frameDocument.documentElement.scrollHeight,
    );
    event.currentTarget.style.height = `${contentHeight + 2}px`;
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
        className={classNames(classes.emailBodyFrame, tall && classes.tallBodyFrame)}
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



