"use client";

import React from "react";
import { useQuery } from "@/lib/crud/useQuery";
import LWDialog from "@/components/common/LWDialog";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ContentStyles from "@/components/common/ContentStyles";
import { gql } from "@/lib/generated/gql-codegen";

const styles = defineStyles("CrossSiteLinkPreviewDebug", (theme: ThemeType) => ({
  dialogPaper: {
    width: 860,
    maxWidth: "min(860px, 96vw)",
  },
  root: {
    padding: 16,
  },
  heading: {
    ...theme.typography.display1,
    marginTop: 0,
    marginBottom: 8,
  },
  metaLine: {
    ...theme.typography.body2,
    color: theme.palette.text.dim45,
    marginBottom: 12,
  },
  debugBlock: {
    marginBottom: 12,
    "& strong": {
      display: "block",
      marginBottom: 6,
    },
    "& pre": {
      margin: 0,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      maxHeight: 220,
      overflowY: "auto",
      background: theme.palette.greyAlpha(0.05),
      borderRadius: theme.borderRadius.default,
      padding: 8,
      fontSize: "0.82rem",
    },
  },
  renderedHtml: {
    marginTop: 8,
    "& p": {
      marginTop: 4,
      marginBottom: 4,
    },
  },
}));

function getDebugBlockValue(value: string | null | undefined): string {
  return value || "(not found)";
}

const CrossSiteLinkPreviewDebugQuery = gql(`
  query CrossSiteLinkPreviewDebugQuery($url: String!, $forceRefetch: Boolean) {
    crossSiteLinkPreview(url: $url, forceRefetch: $forceRefetch, includeDebug: true) {
      title
      imageUrl
      imageWidth
      imageHeight
      html
      error
      status
      fetchedAt
      nextRefreshAt
      debugTitleSource
      debugImageSource
      debugHtmlSource
    }
  }
`);

const CrossSiteLinkPreviewDebugContent = ({ url }: { url: string }) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(CrossSiteLinkPreviewDebugQuery, {
    variables: {
      url,
    },
    ssr: false,
    fetchPolicy: "cache-and-network",
  });
  const { data: fullPreviewData } = useQuery(CrossSiteLinkPreviewDebugQuery, {
    variables: {
      url,
      forceRefetch: false,
    },
    ssr: false,
    fetchPolicy: "cache-and-network",
  });

  const previewData = data?.crossSiteLinkPreview;
  const previewHtml = fullPreviewData?.crossSiteLinkPreview?.html;
  const title = previewData?.title || url;

  return (
    <div className={classes.root}>
      <h2 className={classes.heading}>Link Preview Debug</h2>
      <div className={classes.metaLine}>
        {loading ? "Loading debug data..." : `Title: ${title}`}
      </div>
      {!loading && (
        <div className={classes.metaLine}>
          Status: {previewData?.status || "unknown"}
          {previewData?.error ? ` | Error: ${previewData.error}` : ""}
        </div>
      )}
      <div className={classes.debugBlock}>
        <strong>Title Source</strong>
        <pre>{loading ? "Loading..." : getDebugBlockValue(previewData?.debugTitleSource)}</pre>
      </div>
      <div className={classes.debugBlock}>
        <strong>Image Source</strong>
        <pre>{loading ? "Loading..." : getDebugBlockValue(previewData?.debugImageSource)}</pre>
      </div>
      <div className={classes.debugBlock}>
        <strong>Description Source</strong>
        <pre>{loading ? "Loading..." : getDebugBlockValue(previewData?.debugHtmlSource)}</pre>
      </div>
      <div className={classes.debugBlock}>
        <strong>Rendered Description HTML</strong>
        <pre>{loading ? "Loading..." : getDebugBlockValue(previewHtml)}</pre>
      </div>
      {previewHtml && (
        <div className={classes.debugBlock}>
          <strong>Rendered Preview</strong>
          <ContentStyles contentType="comment" className={classes.renderedHtml}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </ContentStyles>
        </div>
      )}
    </div>
  );
};

const CrossSiteLinkPreviewDebug = ({
  url,
  open,
  onClose,
  inline = false,
}: {
  url: string;
  open?: boolean;
  onClose?: () => void;
  inline?: boolean;
}) => {
  const classes = useStyles(styles);

  if (inline) {
    return <CrossSiteLinkPreviewDebugContent url={url} />;
  }

  return (
    <LWDialog open={!!open} onClose={onClose} paperClassName={classes.dialogPaper}>
      <CrossSiteLinkPreviewDebugContent url={url} />
    </LWDialog>
  );
};

export default CrossSiteLinkPreviewDebug;

