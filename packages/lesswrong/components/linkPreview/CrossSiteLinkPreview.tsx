"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
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
import { useDialog } from "../common/withDialog";
import { DefaultPreview } from "./PostLinkPreview";
import { Link } from "@/lib/reactRouterWrapper";

const styles = defineStyles("CrossSiteLinkPreview", (theme: ThemeType) => ({
  noImageCard: {
    width: 360,
    maxWidth: "min(360px, 90vw)",
    padding: 12,
    position: "relative",
    paddingBottom: 12,
  },
  noImageCardContent: {
    overflow: "hidden",
    maxHeight: 255,
  },
  bannerCard: {
    width: 360,
    maxWidth: "min(360, 90vw)",
    padding: 0,
    position: "relative",
  },
  bannerCardContent: {
    padding: 12,
    paddingTop: 6,
    maxHeight: 300,
  },
  sideBySideCard: {
    padding: 0,
    position: "relative",
    display: "flex",
  },
  sideBySideCardContent: {
    padding: 0,
    margin: 12,
    overflow: "hidden",
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
  bannerImage: {
    width: "100%",
    maxHeight: 215,
    objectFit: "cover",
    borderRadius: theme.borderRadius.default,
  },
  contentRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 8,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  sideImage: {
    borderRadius: theme.borderRadius.default,
    objectFit: "cover",
    flexShrink: 0,
  },
  bannerCardHtml: {
    maxHeight: 160,
    overflow: "hidden",
  },
  topRightFloatImage: {
    width: 92,
    float: "right",
    marginLeft: 10,
    marginBottom: 6,
  },
  html: {
    "& p": {
      marginTop: 4,
      marginBottom: 4,
    },
  },
  loadingOrError: {
    ...theme.typography.body2,
    color: theme.palette.text.dim45,
  },
  // The popper card content is wrapped in a `<Link>` (an `<a>` tag) so the
  // whole card is clickable. The global `a:hover` rule applies
  // `opacity: 0.5`, which makes the entire card translucent when hovered
  // (except where `a:has(img):hover` happens to exempt it). Reset opacity
  // here so the card stays fully opaque on hover.
  cardLink: {
    "&:hover, &:active": {
      opacity: 1,
    },
  },
}));

function getDisplayTitle(title: string | null | undefined, href: string): string {
  return title || href;
}

type PreviewImageLayout = "banner" | "side";
const TOP_RIGHT_FLOAT_IMAGE_DOMAINS = new Set([
  "arxiv.org",
]);

interface SidePreviewSizing {
  cardStyle: React.CSSProperties,
  imageStyle: React.CSSProperties,
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getSidePreviewSizing(imageAspectRatio: number): SidePreviewSizing {
  const cardHeight = 250;
  const horizontalPadding = 24;
  const columnGap = 12;
  const textColumnMinWidth = 240;
  const imageWidth = clampNumber(cardHeight * imageAspectRatio, 140, 240);
  const cardWidth = clampNumber(horizontalPadding + columnGap + textColumnMinWidth + imageWidth, 420, 560);

  return {
    cardStyle: {
      width: cardWidth,
      maxWidth: "min(560px, 90vw)",
      height: cardHeight,
    },
    imageStyle: {
      width: imageWidth,
      height: "100%",
    },
  };
}

function getPreviewImageLayout(imageWidth: number | null | undefined, imageHeight: number | null | undefined): PreviewImageLayout {
  if (!imageWidth || !imageHeight || imageHeight <= 0) {
    return "banner";
  }
  const aspectRatio = imageWidth / imageHeight;
  if (aspectRatio >= 1.25) {
    return "banner";
  }
  return "side";
}

function shouldUseTopRightFloatImageLayout(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase().replace(/^www\./, "");
    return TOP_RIGHT_FLOAT_IMAGE_DOMAINS.has(host);
  } catch {
    return false;
  }
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
  const [fallbackToDefaultPreview, setFallbackToDefaultPreview] = useState(false);
  const { openDialog } = useDialog();
  const menuAnchorRef = useRef<HTMLSpanElement | null>(null);
  const { eventHandlers, hover, anchorEl, forceUnHover } = useHover({
    eventProps: {
      pageElementContext: "linkPreview",
      hoverPreviewType: "CrossSiteLinkPreview",
      href,
      onsite: false,
    },
  });

  const queryResult = useQuery(CrossSiteLinkPreviewQuery, {
    variables: {
      url: href,
      forceRefetch: false,
    },
    skip: !hover,
    ssr: false,
    fetchPolicy: "cache-first",
  });
  const { data, loading, refetch } = queryResult;

  const previewData = data?.crossSiteLinkPreview;
  const imageLayout = getPreviewImageLayout(previewData?.imageWidth, previewData?.imageHeight);
  const hasImage = !!previewData?.imageUrl;
  const useTopRightFloatImageLayout = hasImage && imageLayout === "banner" && shouldUseTopRightFloatImageLayout(href);
  const hasStructuredPreviewData = !!(previewData?.title || previewData?.html || previewData?.imageUrl);
  const showInlineError = !loading && !!previewData?.error && hasStructuredPreviewData;
  const shouldSwitchToDefaultPreview = !loading && !!previewData?.error && !hasStructuredPreviewData;

  useEffect(() => {
    setFallbackToDefaultPreview(false);
  }, [href]);

  useEffect(() => {
    if (shouldSwitchToDefaultPreview) {
      setFallbackToDefaultPreview(true);
    }
  }, [shouldSwitchToDefaultPreview]);

  if (fallbackToDefaultPreview) {
    return <DefaultPreview href={href} id={id} rel={rel} className={className}>
      {children}
    </DefaultPreview>;
  }

  const onForceRefetch = async () => {
    setMenuOpen(false);
    await refetch({
      url: href,
      forceRefetch: true,
    });
  };

  const onOpenDebugModal = () => {
    forceUnHover();
    openDialog({
      name: "CrossSiteLinkPreviewDebug",
      contents: ({onClose}) => <CrossSiteLinkPreviewDebug url={href} open={true} onClose={onClose} />,
    });
    setMenuOpen(false);
  };

  const debugMenu = canDebug ? (
    <span ref={menuAnchorRef}>
      <MoreVertIcon
        className={classes.menuButton}
        onClick={(ev) => {
          setMenuOpen((open) => !open)
          ev.stopPropagation();
          ev.preventDefault();
        }}
      />
    </span>
  ) : <></>;

  return (
    <AnalyticsTracker eventType="link" eventProps={{ to: href }}>
      <span {...eventHandlers}>
        <a href={href} id={id} rel={rel} className={className}>
          {children}
        </a>

        <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start">
          <Link to={href} id={id} rel={rel} className={classNames(className, classes.cardLink)}>
            {previewData && !hasImage && <NoImageStyleCardContent href={href} previewData={previewData} debugMenu={debugMenu} />}
            {previewData && hasImage && imageLayout === "banner" && !useTopRightFloatImageLayout && (
              <BannerStyleCardContent href={href} previewData={previewData} debugMenu={debugMenu} />
            )}
            {previewData && hasImage && useTopRightFloatImageLayout && (
              <TopRightFloatImageStyleCardContent href={href} previewData={previewData} debugMenu={debugMenu} />
            )}
            {previewData && hasImage && imageLayout === "side" && <SideImageStyleCardContent href={href} previewData={previewData} debugMenu={debugMenu} />}

            {loading && <Card className={classes.noImageCard}>
              <div className={classes.loadingOrError}>
                Loading preview...
              </div>
            </Card>}
            {showInlineError && <Card className={classes.noImageCard}>
              <div className={classes.loadingOrError}>
                {previewData.error}
              </div>
            </Card>}
          </Link>
        </LWPopper>

        {canDebug && <PopperCard
          open={menuOpen}
          anchorEl={menuAnchorRef.current}
          placement="bottom-end"
        >
          <LWClickAwayListener onClickAway={() => setMenuOpen(false)}>
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
          </LWClickAwayListener>
        </PopperCard>}
      </span>
    </AnalyticsTracker>
  );
};

function NoImageStyleCardContent({previewData, href, debugMenu}: {
  previewData: CrossSiteLinkPreviewData
  href: string
  debugMenu: ReactNode
}) {
  const classes = useStyles(styles);
  return <Card className={classes.noImageCard}>
    <div className={classes.titleRow}>
      <h3 className={classes.title}>
        {getDisplayTitle(previewData?.title, href)}
      </h3>
      {debugMenu}
    </div>

    {(previewData.html) && <ContentStyles
      contentType="comment"
      className={classes.html}
    >
      <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
    </ContentStyles>}
  </Card>
}

function BannerStyleCardContent({previewData, href, debugMenu}: {
  previewData: CrossSiteLinkPreviewData
  href: string
  debugMenu: ReactNode
}) {
  const classes = useStyles(styles);
  return <Card className={classes.bannerCard}>
    <img src={previewData.imageUrl!} alt="" className={classes.bannerImage} />

    <div className={classes.bannerCardContent}>
      <div className={classes.titleRow}>
        <h3 className={classes.title}>
          {getDisplayTitle(previewData?.title, href)}
        </h3>
        {debugMenu}
      </div>

      {(previewData.html) && <ContentStyles
        contentType="comment"
        className={classes.bannerCardHtml}
      >
        <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
      </ContentStyles>}
    </div>
  </Card>
}

function SideImageStyleCardContent({previewData, href, debugMenu}: {
  previewData: CrossSiteLinkPreviewData
  href: string
  debugMenu: ReactNode
}) {
  const imageAspectRatio = previewData.imageWidth && previewData.imageHeight
    ? (previewData.imageWidth / previewData.imageHeight) : 1;
  const { cardStyle, imageStyle } = getSidePreviewSizing(imageAspectRatio);

  const classes = useStyles(styles);
  return <Card className={classes.sideBySideCard} style={cardStyle}>
    <div className={classes.sideBySideCardContent}>
      <div className={classes.titleRow}>
        <h3 className={classes.title}>
          {getDisplayTitle(previewData?.title, href)}
        </h3>
        {debugMenu}
      </div>

      <div className={classes.contentRow}>
        {previewData?.html && (
          <ContentStyles
            contentType="comment"
            className={classNames(classes.html, classes.textColumn)}
          >
            <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
          </ContentStyles>
        )}
      </div>
    </div>
    <img src={previewData.imageUrl!} alt="" className={classes.sideImage} style={imageStyle} />
  </Card>
}

function TopRightFloatImageStyleCardContent({previewData, href, debugMenu}: {
  previewData: CrossSiteLinkPreviewData
  href: string
  debugMenu: ReactNode
}) {
  const classes = useStyles(styles);
  return <Card className={classes.noImageCard}>
    <div className={classes.noImageCardContent}>
      <img src={previewData.imageUrl!} alt="" className={classes.topRightFloatImage} />

      <div className={classes.titleRow}>
        <h3 className={classes.title}>
          {getDisplayTitle(previewData?.title, href)}
        </h3>
        {debugMenu}
      </div>

      {(previewData.html) && <ContentStyles
        contentType="comment"
        className={classes.html}
      >
        <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
      </ContentStyles>}
    </div>
  </Card>;
}

export default CrossSiteLinkPreview;

