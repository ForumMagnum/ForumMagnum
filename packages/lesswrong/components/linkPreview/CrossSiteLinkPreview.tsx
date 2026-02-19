"use client";

import React, { ReactNode, useRef, useState } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { Card } from "@/components/widgets/Paper";
import { useHover } from "@/components/common/withHover";
import LWPopper from "@/components/common/LWPopper";
import AnalyticsTracker from "@/components/common/AnalyticsTracker";
import MoreVertIcon from "@/lib/vendor/@material-ui/icons/src/MoreVert";
import PopperCard from "@/components/common/PopperCard";
import LWClickAwayListener from "@/components/common/LWClickAwayListener";
import DropdownItem from "@/components/dropdowns/DropdownItem";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { useCurrentUser } from "@/components/common/withUser";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import ContentStyles from "@/components/common/ContentStyles";
import CrossSiteLinkPreviewDebug from "@/components/linkPreview/CrossSiteLinkPreviewDebug";

const styles = defineStyles("CrossSiteLinkPreview", (theme: ThemeType) => ({
  popperCard: {
    width: 520,
    maxWidth: "min(520px, 90vw)",
    padding: theme.spacing.unit * 1.5,
    position: "relative",
  },
  titleRow: {
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    ...theme.typography.body1,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.3,
  },
  menuButton: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    marginTop: -2,
  },
  image: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    borderRadius: theme.borderRadius.default,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  contentRow: {
    display: "flex",
    gap: theme.spacing.unit * 1.5,
    alignItems: "flex-start",
    marginTop: theme.spacing.unit,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  sideImage: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.default,
    objectFit: "cover",
    flexShrink: 0,
  },
  html: {
    "& p": {
      marginTop: theme.spacing.unit / 2,
      marginBottom: theme.spacing.unit / 2,
    },
  },
  loadingOrError: {
    ...theme.typography.body2,
    color: theme.palette.text.dim45,
  },
}));

function getDisplayTitle(title: string | null | undefined, href: string): string {
  return title || href;
}

type PreviewImageLayout = "banner" | "side";

function getPreviewImageLayout(imageWidth: number | null | undefined, imageHeight: number | null | undefined): PreviewImageLayout {
  if (!imageWidth || !imageHeight || imageHeight <= 0) {
    return "banner";
  }
  const aspectRatio = imageWidth / imageHeight;
  if (aspectRatio >= 1.35) {
    return "banner";
  }
  return "side";
}

const CrossSiteLinkPreviewQuery = gql(`
  query CrossSiteLinkPreviewWithImageDimensionsQuery($url: String!, $forceRefetch: Boolean) {
    crossSiteLinkPreview(url: $url, forceRefetch: $forceRefetch, includeDebug: false) {
      title
      imageUrl
      imageWidth
      imageHeight
      html
      error
      status
      fetchedAt
      nextRefreshAt
    }
  }
`);

export const CrossSiteLinkPreview = ({
  href,
  id,
  rel,
  className,
  children,
}: {
  href: string;
  id?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const canDebug = userIsAdminOrMod(currentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLSpanElement | null>(null);
  const { eventHandlers, hover, anchorEl } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "CrossSiteLinkPreview",
      href,
      onsite: false,
    },
  });

  const { data, loading, refetch } = useQuery(CrossSiteLinkPreviewQuery, {
    variables: {
      url: href,
      forceRefetch: false,
    },
    skip: !hover,
    ssr: false,
    fetchPolicy: "cache-first",
  });

  const previewData = data?.crossSiteLinkPreview;
  const imageLayout = getPreviewImageLayout(previewData?.imageWidth, previewData?.imageHeight);
  const showSideImage = !!previewData?.imageUrl && imageLayout === "side";
  const showBannerImage = !!previewData?.imageUrl && imageLayout === "banner";
  const hasStructuredPreviewData = !!(previewData?.title || previewData?.html || previewData?.imageUrl);
  const showInlineError = !loading && !!previewData?.error && hasStructuredPreviewData;

  const onForceRefetch = async () => {
    await refetch({
      url: href,
      forceRefetch: true,
    });
    setMenuOpen(false);
  };

  const onOpenDebugModal = () => {
    setDebugModalOpen(true);
    setMenuOpen(false);
  };

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a href={href} id={id} rel={rel} className={className}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <Card className={classes.popperCard}>
            <div className={classes.titleRow}>
              <h3 className={classes.title}>
                {getDisplayTitle(previewData?.title, href)}
              </h3>
              {canDebug && (
                <span ref={menuAnchorRef}>
                  <MoreVertIcon
                    className={classes.menuButton}
                    onClick={() => setMenuOpen((open) => !open)}
                  />
                </span>
              )}
            </div>

            {showBannerImage && previewData.imageUrl && (
              <img src={previewData.imageUrl} alt="" className={classes.image} />
            )}
            {(previewData?.html || showSideImage) && (
              <div className={classNames({ [classes.contentRow]: showSideImage })}>
                {previewData?.html && (
                  <ContentStyles
                    contentType="comment"
                    className={classNames(classes.html, { [classes.textColumn]: showSideImage })}
                  >
                    <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
                  </ContentStyles>
                )}
                {showSideImage && (
                  <img src={previewData.imageUrl!} alt="" className={classes.sideImage} />
                )}
              </div>
            )}

            {loading && (
              <div className={classes.loadingOrError}>
                Loading preview...
              </div>
            )}

            {showInlineError && (
              <div className={classes.loadingOrError}>
                {previewData.error}
              </div>
            )}

          </Card>
        </LWPopper>

        {canDebug && (
          <PopperCard
            open={menuOpen}
            anchorEl={menuAnchorRef.current}
            placement="bottom-end"
          >
            <LWClickAwayListener onClickAway={() => setMenuOpen(false)}>
              <>
                <DropdownItem
                  title="Force refetch"
                  icon="Autorenew"
                  onClick={onForceRefetch}
                />
                <DropdownItem
                  title="Open debug view"
                  icon="Document"
                  onClick={onOpenDebugModal}
                />
              </>
            </LWClickAwayListener>
          </PopperCard>
        )}
        {canDebug && (
          <CrossSiteLinkPreviewDebug
            url={href}
            open={debugModalOpen}
            onClose={() => setDebugModalOpen(false)}
          />
        )}
      </span>
    </AnalyticsTracker>
  );
};

export default CrossSiteLinkPreview;

