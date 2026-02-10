"use client";

import React, { useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import HoverPreviewLink from "@/components/linkPreview/HoverPreviewLink";
import CrossSiteLinkPreviewDebug from "@/components/linkPreview/CrossSiteLinkPreviewDebug";
import { routePreviewComponentMapping } from "@/components/linkPreview/parseRouteWithErrors";

const sampleOffsiteUrls = [
  "https://en.wikipedia.org/wiki/The_Example",
  "https://arxiv.org/abs/2407.21783",
  "https://thezvi.substack.com/p/zvis-2025-in-movies",
  "https://www.astralcodexten.com/p/sources-say-bay-area-house-party",
  "https://x.com/dril/status/1935204887153008928",
  "https://gwern.net/computers",
  "https://openai.com/index/introducing-gpt-5/",
  "https://benjaminrosshoffman.com/steelmanning-the-eruv/",
  "https://docs.python.org/3/library/asyncio.html",
];

const styles = defineStyles("LinkPreviewTester", (theme: ThemeType) => ({
  root: {
    display: "grid",
    gridTemplateColumns: "1fr minmax(280px, 360px)",
    gap: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 3,
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  main: {},
  heading: {
    ...theme.typography.display1,
    marginBottom: theme.spacing.unit * 2,
  },
  inputLabel: {
    ...theme.typography.body2,
    display: "block",
    marginBottom: theme.spacing.unit,
  },
  input: {
    width: "100%",
    maxWidth: 780,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 1.25}px`,
    borderRadius: theme.borderRadius.default,
    border: theme.palette.greyBorder("1px", 0.3),
    ...theme.typography.body1,
  },
  linkRow: {
    marginTop: theme.spacing.unit * 2,
    ...theme.typography.body1,
  },
  debugSection: {
    marginTop: theme.spacing.unit * 2,
    border: theme.palette.greyBorder("1px", 0.2),
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
  },
  hoverLink: {
    fontWeight: 600,
  },
  section: {
    marginTop: theme.spacing.unit * 2,
  },
  sidebar: {
    borderLeft: theme.palette.greyBorder("1px", 0.2),
    paddingLeft: theme.spacing.unit * 2,
    [theme.breakpoints.down("md")]: {
      borderLeft: "none",
      borderTop: theme.palette.greyBorder("1px", 0.2),
      paddingLeft: 0,
      paddingTop: theme.spacing.unit * 2,
    },
  },
  sidebarSectionTitle: {
    ...theme.typography.body2,
    fontWeight: 700,
    marginBottom: theme.spacing.unit,
  },
  list: {
    margin: 0,
    paddingLeft: theme.spacing.unit * 2,
    "& li": {
      marginBottom: theme.spacing.unit / 2,
      wordBreak: "break-word",
    },
  },
  sampleLink: {
    textDecoration: "none",
  },
}));

function getOnsiteSchemas(): string[] {
  return Object.keys(routePreviewComponentMapping).sort();
}

const onsiteSchemas = getOnsiteSchemas();

const LinkPreviewTester = () => {
  const classes = useStyles(styles);
  const [url, setUrl] = useState("https://en.wikipedia.org/wiki/Artificial_general_intelligence");

  const handleSampleClickCapture = (sampleUrl: string) => (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setUrl(sampleUrl);
  };

  return (
    <div className={classes.root}>
      <main className={classes.main}>
        <h1 className={classes.heading}>Link Preview Tester</h1>

        <label htmlFor="link-preview-url" className={classes.inputLabel}>
          URL
        </label>
        <input
          id="link-preview-url"
          className={classes.input}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/article"
        />

        <div className={classes.linkRow}>
          <HoverPreviewLink href={url} className={classes.hoverLink}>
            Hover to preview: {url}
          </HoverPreviewLink>
        </div>
        <section className={classes.debugSection}>
          <CrossSiteLinkPreviewDebug url={url} inline />
        </section>
      </main>

      <aside className={classes.sidebar}>
        <section className={classes.section}>
          <div className={classes.sidebarSectionTitle}>Previewable onsite URL schemas</div>
          <ul className={classes.list}>
            {onsiteSchemas.map((schema) => (
              <li key={schema}>
                <code>{schema}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className={classes.section}>
          <div className={classes.sidebarSectionTitle}>Sample offsite URL formats</div>
          <ul className={classes.list}>
            {sampleOffsiteUrls.map((sampleUrl) => (
              <li key={sampleUrl} onClickCapture={handleSampleClickCapture(sampleUrl)}>
                <HoverPreviewLink href={sampleUrl} className={classes.sampleLink}>
                  {sampleUrl}
                </HoverPreviewLink>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
};

export default LinkPreviewTester;

