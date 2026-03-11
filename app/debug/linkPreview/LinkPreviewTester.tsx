"use client";

import React, { useMemo, useState } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import HoverPreviewLink from "@/components/linkPreview/HoverPreviewLink";
import { routePreviewComponentMapping } from "@/lib/routeChecks/hoverPreviewRoutes";
import { pathnameMatchesRoutePath } from "@/lib/routeChecks";
import { classifyLink } from "@/lib/routeUtil";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ContentStyles from "@/components/common/ContentStyles";

const sampleOnsiteUrls: string[] = [
  "https://www.lesswrong.com/codex/eight-short-studies-on-excuses",
  "https://www.lesswrong.com/s/XsMTxdQ6fprAQMoKi/p/gFMH3Cqw4XxwL69iy",
  "https://www.lesswrong.com/posts/gFMH3Cqw4XxwL69iy",
  "https://www.lesswrong.com/posts/gFMH3Cqw4XxwL69iy/eight-short-studies-on-excuses",
  "https://www.lesswrong.com/events/Bny7ESoRkMy74BqC7",
  "https://www.lesswrong.com/posts/gFMH3Cqw4XxwL69iy/eight-short-studies-on-excuses?commentId=wwTzFmZnn9jNaopqq",
  "https://www.lesswrong.com/posts/gFMH3Cqw4XxwL69iy/eight-short-studies-on-excuses/comment/wwTzFmZnn9jNaopqq",
  "https://www.lesswrong.com/events/Bny7ESoRkMy74BqC7/lighthaven-sequences-reading-group-73-tuesday-3-10",
  "https://www.lesswrong.com/rationality",
  "https://www.lesswrong.com/rationality/the-martial-art-of-rationality",
  "https://www.lesswrong.com/inbox",
  "https://www.lesswrong.com/highlights",
  "https://www.lesswrong.com/highlights/the-lens-that-sees-its-flaws",
  "https://www.lesswrong.com/s/NBDFAKt3GbFwnwzQF",
  "https://www.lesswrong.com/sequences/NBDFAKt3GbFwnwzQF",
  "https://www.lesswrong.com/w/rationality",
  "https://www.lesswrong.com/w/rationality/discussion",
  "https://www.lesswrong.com/hpmor",
  "https://www.lesswrong.com/hpmor/chapter-1-a-day-of-very-low-probability",
  "https://www.lesswrong.com/lw/2",
  "https://www.lesswrong.com/lw/2/tell-your-rationalist-origin-story",
  "https://www.lesswrong.com/lw/2/tell-your-rationalist-origin-story/6g",
];
const sampleOffsiteUrls: string[] = [
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
  input: {
    marginLeft: 30,
    width: 500,
    padding: "8px 10px",
    borderRadius: theme.borderRadius.default,
    border: theme.palette.greyBorder("1px", 0.3),
    ...theme.typography.body1,
  },
  addButton: {
    marginLeft: 8,
    height: 32,
  },
  linkRow: {
    marginTop: 16,
    ...theme.typography.body1,
  },
  hoverLink: {
  },
  section: {
    marginTop: 40,
  },
  sidebar: {
    borderLeft: theme.palette.greyBorder("1px", 0.2),
    paddingLeft: 16,
    [theme.breakpoints.down("md")]: {
      borderLeft: "none",
      borderTop: theme.palette.greyBorder("1px", 0.2),
      paddingLeft: 0,
      paddingTop: 16,
    },
  },
  sidebarSectionTitle: {
    ...theme.typography.body2,
    fontWeight: 700,
    marginBottom: 8,
  },
  list: {
    margin: 0,
    paddingLeft: 16,
    "& li": {
      marginBottom: 4,
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
  const [inputUrl, setInputUrl] = useState("");
  const [urlList, setUrlList] = useState<string[]>([...sampleOnsiteUrls, ...sampleOffsiteUrls]);
  const onsiteUrls = useMemo(() => urlList.filter((url) => classifyLink(url) === "onsite"), [urlList]);

  const missingOnsiteSchemas = useMemo(() => {
    return onsiteSchemas.filter((schema) => {
      return !onsiteUrls.some((url) => {
        try {
          const pathname = new URL(url).pathname;
          return pathnameMatchesRoutePath(pathname, schema as any);
        } catch (error) {
          return false;
        }
      });
    });
  }, [onsiteUrls, onsiteSchemas]);

  function addLinkToList() {
    setInputUrl("");
    setUrlList([...urlList, inputUrl]);
  }

  return (
    <SingleColumnSection>
    <ContentStyles contentType="comment">
      <h1>Link Preview Tester</h1>

      <div className={classes.section}>
        <h2>Sample URLs</h2>
        <ul>
          {urlList.map((url) => (
            <li key={url}>
              <HoverPreviewLink href={url} className={classes.hoverLink}>
                {url}
              </HoverPreviewLink>
            </li>
          ))}
        </ul>
      </div>

      <div className={classes.section}>
        <h2>Add URLs</h2>
        <input
          className={classes.input}
          value={inputUrl}
          onChange={(event) => setInputUrl(event.target.value)}
          placeholder="https://example.com/article"
        />
        <button className={classes.addButton} onClick={addLinkToList}>Add to list</button>
      </div>

      <div className={classes.section}>
        {missingOnsiteSchemas.length > 0 && <>
          <h2>Routes With Link Previews Not In the Above List</h2>
          <ul>
            {missingOnsiteSchemas.map((schema) => (
              <li key={schema}>
                <code>{schema}</code>
              </li>
            ))}
          </ul>
        </>}
      </div>
    </ContentStyles>
    </SingleColumnSection>
  );
};

export default LinkPreviewTester;

