import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import FormatDate from '../common/FormatDate';
import TabButton from '../common/TabButton';

export const MOBILE_EMAIL_PREVIEW_WIDTH = 390;

export type EmailPreviewBodyView = "html" | "text";
export type EmailPreviewViewport = "desktop" | "mobile";
export type EmailPreviewColorMode = "light" | "dark" | "auto";

const CSS_COLOR_SCHEMES: Record<EmailPreviewColorMode, string> = {
  light: "light",
  dark: "dark",
  auto: "light dark",
};

const COLOR_MODE_OPTIONS: { colorMode: EmailPreviewColorMode; label: string }[] = [
  { colorMode: "light", label: "Light mode" },
  { colorMode: "dark", label: "Dark mode" },
  { colorMode: "auto", label: "Auto" },
];

const BODY_VIEW_TABS: { bodyView: EmailPreviewBodyView; label: string }[] = [
  { bodyView: "html", label: "HTML" },
  { bodyView: "text", label: "Text" },
];

const styles = defineStyles('EmailPreview', (theme: ThemeType) => ({
  emailPreview: {
    marginBottom: 40,
    minWidth: 0,
  },
  headers: {
    ...theme.typography.commentStyle,
    display: "grid",
    gridTemplateColumns: "max-content minmax(0, 1fr)",
    gap: "2px 12px",
    margin: "0 0 12px",
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.normal,
    overflowWrap: "anywhere",
  },
  headerName: {
    color: theme.palette.grey[600],
    fontWeight: 600,
  },
  headerContent: {
    margin: 0,
  },
  toolbar: {
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  tabs: {
    display: "flex",
    gap: 8,
  },
  colorModeSelect: {
    marginLeft: 8,
    padding: "4px 8px",
    border: theme.palette.border.faint,
    borderRadius: theme.borderRadius.default,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    fontFamily: "inherit",
    fontSize: "inherit",
  },
  resizableBody: {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "100%",
    minWidth: 280,
    height: 500,
    minHeight: 200,
    overflow: "hidden",
    resize: "both",
    border: theme.palette.border.normal,
  },
  // Not palette colors: these follow the selected color mode, not the site theme.
  emailSurface: {
    background: "light-dark(white, #1e1e1e)",
    color: "light-dark(black, white)",
  },
  light: {
    colorScheme: CSS_COLOR_SCHEMES.light,
  },
  dark: {
    colorScheme: CSS_COLOR_SCHEMES.dark,
  },
  auto: {
    colorScheme: CSS_COLOR_SCHEMES.auto,
  },
  emailBodyFrame: {
    display: "block",
    width: "100%",
    maxWidth: 800,
    height: 500,
    marginLeft: "auto",
    marginRight: "auto",
    border: theme.palette.border.normal,
  },
  mobileBodyFrame: {
    maxWidth: MOBILE_EMAIL_PREVIEW_WIDTH,
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
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 13,
  },
  htmlUnavailable: {
    ...theme.typography.commentStyle,
    whiteSpace: "normal",
    fontSize: 14,
  },
  // Must stay after emailBodyFrame and emailTextVersion, which it overrides.
  fillResizableBody: {
    maxWidth: "none",
    height: "100%",
    border: "none",
  },
}));

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

// A frame whose color-scheme differs from its document's gets an opaque canvas,
// so without this a dark frame still paints a white page behind the email. This
// doesn't reach @media (prefers-color-scheme) rules inside the email: browsers
// answer those from the OS setting, so they only respond to "auto".
function syncFrameColorScheme(frame: HTMLIFrameElement | null, colorMode: EmailPreviewColorMode) {
  const frameRoot = frame?.contentDocument?.documentElement;
  if (frameRoot) {
    frameRoot.style.colorScheme = CSS_COLOR_SCHEMES[colorMode];
  }
}

export const EmailPreviewHeaders = ({ email, sentDate, extraHeaders = [] }: {
  email: EmailPreview,
  sentDate?: Date,
  extraHeaders?: { name: string, content: React.ReactNode }[],
}) => {
  const classes = useStyles(styles);
  return <dl className={classes.headers}>
    {sentDate && <>
      <dt className={classes.headerName}>Sent</dt>
      <dd className={classes.headerContent}>
        <FormatDate date={sentDate} format="LLL z" tooltip={false}/>
      </dd>
    </>}
    <dt className={classes.headerName}>Subject</dt>
    <dd className={classes.headerContent}>{email.subject}</dd>
    <dt className={classes.headerName}>To</dt>
    <dd className={classes.headerContent}>{email.to}</dd>
    {extraHeaders.map(({ name, content }) => <React.Fragment key={name}>
      <dt className={classes.headerName}>{name}</dt>
      <dd className={classes.headerContent}>{content}</dd>
    </React.Fragment>)}
  </dl>;
}

export const EmailPreviewBody = ({
  email,
  bodyView,
  colorMode,
  viewport = "desktop",
  fullHeight,
  className,
}: {
  email: EmailPreview,
  bodyView: EmailPreviewBodyView,
  colorMode: EmailPreviewColorMode,
  viewport?: EmailPreviewViewport,
  fullHeight?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Changing the viewport reflows the email without reloading the frame, so
  // the height has to be remeasured outside of the load handler.
  useEffect(() => {
    if (fullHeight) {
      fitFrameToContent(frameRef.current);
    }
  }, [fullHeight, viewport, email.html]);

  useEffect(() => {
    syncFrameColorScheme(frameRef.current, colorMode);
  }, [colorMode]);

  const handleFrameLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    syncFrameColorScheme(event.currentTarget, colorMode);
    if (fullHeight) {
      fitFrameToContent(event.currentTarget);
    }
  };

  const surfaceClasses = classNames(classes.emailSurface, classes[colorMode], className);

  if (bodyView === "text") {
    return <div className={classNames(classes.emailTextVersion, surfaceClasses)}>
      {email.text}
    </div>;
  }
  if (!email.html) {
    return <div className={classNames(classes.emailTextVersion, classes.htmlUnavailable, surfaceClasses)}>
      The HTML version of this email isn't available. Older sent emails were
      logged without their HTML, so only the text version was kept.
    </div>;
  }
  return <iframe
    ref={frameRef}
    className={classNames(
      classes.emailBodyFrame,
      viewport === "mobile" && classes.mobileBodyFrame,
      surfaceClasses,
    )}
    srcDoc={email.html}
    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
    title={`Email preview: ${email.subject}`}
    onLoad={handleFrameLoad}
  />;
}

export const EmailPreview = ({ email, sentDate }: {
  email: EmailPreview,
  sentDate?: Date,
}) => {
  const classes = useStyles(styles);
  const [bodyView, setBodyView] = useState<EmailPreviewBodyView>(email.html ? "html" : "text");
  const [colorMode, setColorMode] = useState<EmailPreviewColorMode>("light");

  const handleColorModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = COLOR_MODE_OPTIONS.find((option) => option.colorMode === event.target.value);
    if (!selected) {
      throw new Error(`Unrecognized email preview color mode: ${event.target.value}`);
    }
    setColorMode(selected.colorMode);
  };

  return <div className={classes.emailPreview}>
    <EmailPreviewHeaders email={email} sentDate={sentDate}/>
    <div className={classes.toolbar}>
      <div className={classes.tabs}>
        {BODY_VIEW_TABS.map((tab) => <TabButton
          key={tab.bodyView}
          label={tab.label}
          isActive={bodyView === tab.bodyView}
          onClick={() => setBodyView(tab.bodyView)}
          showTooltip={false}
        />)}
      </div>
      <label>
        <span>Color mode</span>
        <select className={classes.colorModeSelect} value={colorMode} onChange={handleColorModeChange}>
          {COLOR_MODE_OPTIONS.map((option) => <option key={option.colorMode} value={option.colorMode}>
            {option.label}
          </option>)}
        </select>
      </label>
    </div>
    <div className={classes.resizableBody}>
      <EmailPreviewBody
        email={email}
        bodyView={bodyView}
        colorMode={colorMode}
        className={classes.fillResizableBody}
      />
    </div>
  </div>;
}

export default EmailPreview;
