"use client";

import React from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { CrossSiteLinkPreviewDebugQueryDocument } from "@/lib/generated/gql-codegen/graphql";
import LWDialog from "@/components/common/LWDialog";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("CrossSiteLinkPreviewDebug", (theme: ThemeType) => ({
  dialogPaper: {
    width: 860,
    maxWidth: "min(860px, 96vw)",
  },
  root: {
    padding: theme.spacing.unit * 2,
  },
  heading: {
    ...theme.typography.display1,
    marginTop: 0,
    marginBottom: theme.spacing.unit,
  },
  metaLine: {
    ...theme.typography.body2,
    color: theme.palette.text.dim45,
    marginBottom: theme.spacing.unit * 1.5,
  },
  debugBlock: {
    marginBottom: theme.spacing.unit * 1.5,
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
      padding: theme.spacing.unit,
      fontSize: "0.82rem",
    },
  },
}));

function getDebugBlockValue(value: string | null | undefined): string {
  return value || "(not found)";
}

const CrossSiteLinkPreviewDebugContent = ({ url }: { url: string }) => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(CrossSiteLinkPreviewDebugQueryDocument, {
    variables: {
      url,
      includeDebug: true,
    },
    ssr: false,
    fetchPolicy: "cache-first",
  });

  const previewData = data?.crossSiteLinkPreview;
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

