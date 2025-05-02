import React, { FC, ReactNode } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { useSingle } from "../../../lib/crud/withSingle";
import type { ForumIconName } from "../../common/ForumIcon";
import classNames from "classnames";

const ICON_WIDTH = 24;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[600],
  },
  container: {
    display: "flex",
    gap: "12px",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.text.alwaysWhite,
    borderRadius: "50%",
    minWidth: ICON_WIDTH,
    width: ICON_WIDTH,
    height: ICON_WIDTH,
    "& svg": {
      width: 14,
      height: 14,
    },
  },
  iconPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  iconGrey: {
    backgroundColor: theme.palette.icon.recentDiscussionGrey,
  },
  iconYellow: {
    color: theme.palette.icon.headerKarma,
    backgroundColor: "transparent",
    transform: "scale(1.5)",
  },
  iconClear: {
    color: theme.palette.primary.main,
    backgroundColor: "transparent",
    transform: "scale(1.5)",
  },
  "@keyframes wrapped-notification-shimmer": {
    from: {
      backgroundPosition: "right",
    },
    to: {
      backgroundPosition: "left",
    },
  },
  iconWrapped: {
    background: `linear-gradient(
      -75deg,
      ${theme.palette.wrapped.notification} 33%,
      ${theme.palette.wrapped.highlightText} 50%,
      ${theme.palette.wrapped.notification} 66%
    ) ${theme.palette.wrapped.notification}`,
    backgroundSize: "300% 100%",
    animation: "wrapped-notification-shimmer 2s infinite",
    "& svg": {
      transform: "translateY(-1px)",
    },
  },
  iconTooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
  },
  meta: {
    lineHeight: "1.5em",
    fontWeight: 500,
    maxWidth: "100%",
  },
  bottomMargin: {
    marginBottom: 12,
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  preview: {
    flexGrow: 1,
    minWidth: 0,
  },
});

export type IconVariant = "primary" | "grey" | "yellow" | "clear" | "wrapped";

export const NotificationsPageItem = ({
  Icon,
  iconVariant,
  iconTooltip,
  post,
  previewCommentId,
  noMargin,
  children,
  iconClassName,
  metaClassName,
  classes,
}: {
  Icon: ForumIconName | FC,
  iconVariant: IconVariant,
  iconTooltip?: string,
  post?: PostsMinimumInfo,
  previewCommentId?: string,
  noMargin?: boolean,
  children?: ReactNode,
  iconClassName?: string,
  metaClassName?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const showPreviewComment = !!previewCommentId;
  const {
    document: previewComment,
    loading: previewCommentLoading,
  } = useSingle({
    skip: !showPreviewComment,
    documentId: previewCommentId,
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
  });

  const {ForumIcon, LWTooltip, CommentsNode, Loading} = Components;
  return (
    <AnalyticsContext pageSubSectionContext="notificationsPageItem">
      <div className={classes.root}>
        <div className={classes.container}>
          <div className={classNames(
            classes.iconContainer,
            iconVariant === "primary" && classes.iconPrimary,
            iconVariant === "grey" && classes.iconGrey,
            iconVariant === "yellow" && classes.iconYellow,
            iconVariant === "clear" && classes.iconClear,
            iconVariant === "wrapped" && classes.iconWrapped,
            iconClassName,
          )}>
            <LWTooltip
              title={iconTooltip}
              popperClassName={classes.iconTooltip}
              placement="bottom"
            >
              {typeof Icon === "string"
                ? <ForumIcon icon={Icon} />
                : <Icon />
              }
            </LWTooltip>
          </div>
          <div className={classNames(
            classes.meta,
            !noMargin && classes.bottomMargin,
            metaClassName,
          )}>
            {children}
          </div>
        </div>
        {showPreviewComment &&
          <div className={classes.container}>
            <div className={classNames(
              classes.iconContainer,
              classes.hideOnMobile,
            )} />
            <div className={classes.preview}>
              {previewCommentLoading && <Loading />}
              {previewComment &&
                <CommentsNode
                  treeOptions={{
                    scrollOnExpand: true,
                    condensed: true,
                    post: previewComment.post ?? post,
                    tag: previewComment.tag ?? undefined,
                  }}
                  startThreadTruncated
                  expandAllThreads
                  expandNewComments={false}
                  nestingLevel={1}
                  comment={previewComment}
                />
              }
            </div>
          </div>
        }
      </div>
    </AnalyticsContext>
  );
}

const NotificationsPageItemComponent = registerComponent(
  "NotificationsPageItem",
  NotificationsPageItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageItem: typeof NotificationsPageItemComponent
  }
}
