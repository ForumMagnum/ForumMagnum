import React, { FC, MouseEvent, ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { Link } from "../../lib/reactRouterWrapper";
import classNames from "classnames";
import { UseHoverEventHandlers } from "../common/withHover";
import CloudinaryImage2 from "../common/CloudinaryImage2";
import UsersNameDisplay from "../users/UsersNameDisplay";

const SEQUENCE_CARD_IMAGE_HEIGHT = 162;
const Z_IMAGE = 1;
const Z_OVERLAY = 2;

const buildBoxShadow = (theme: ThemeType, alpha: number, offset: number) => `
  /* The top layer shadow */
  0px ${offset}px 6px 0px ${theme.palette.boxShadowColor(alpha)},
  /* The second layer */
  -8px 8px 0 0px ${theme.palette.panelBackground.default},
  /* The second layer shadow */
  -10px 10px 10px -1px ${theme.palette.boxShadowColor(alpha)}
`;

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    marginLeft: 8, // Account for box shadow
    marginBottom: 8, // Account for box shadow
    boxShadow: buildBoxShadow(theme, 0.1, 2),
    border: "1px solid transparent",
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`
    },
  },
  sequenceCardImageWrapper: {
    position: "relative",
  },
  sequenceCardImage: {
    width: "100%",
    height: SEQUENCE_CARD_IMAGE_HEIGHT,
    objectFit: "cover",
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
    zIndex: Z_IMAGE,
  },
  sequenceReadProgress: {
    position: "absolute",
    zIndex: Z_OVERLAY,
    fontSize: 12,
    top: 8,
    left: 8,
    borderRadius: 14,
    backgroundColor: theme.palette.panelBackground.translucent3,
    padding: "6px 8px",
  },
  sequenceCardText: {
    padding: 16,
  },
  sequenceCardTitle: {
    fontSize: 18,
    lineHeight: "24px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    marginBottom: 6,
  },
  sequenceCardMeta: {
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
  },
  authorWrapper: {
    display: "inline",
  },
});

const EASequenceOrCollectionCard = ({
  title,
  author,
  TitleWrapper,
  postCount,
  readCount,
  imageId,
  href,
  eventHandlers,
  className,
  classes,
}: {
  title: string,
  author: UsersMinimumInfo | null,
  TitleWrapper: FC<{children: ReactNode}>,
  postCount: number,
  readCount: number,
  imageId: string,
  href: string,
  eventHandlers: UseHoverEventHandlers,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {onClick} = useClickableCell({href});
  const readProgress = `${readCount}/${postCount}`;
  return (
    <div
      {...eventHandlers}
      onClick={onClick}
      className={classNames(classes.root, className)}
    >
      <div className={classes.sequenceCardImageWrapper}>
        <CloudinaryImage2
          publicId={imageId}
          imgProps={{
            h: String(SEQUENCE_CARD_IMAGE_HEIGHT),
            dpr: "2",
          }}
          className={classes.sequenceCardImage}
        />
        <div className={classes.sequenceReadProgress}>{readProgress} read</div>
      </div>
      <div className={classes.sequenceCardText}>
        <TitleWrapper>
          <InteractionWrapper>
            <Link to={href} className={classes.sequenceCardTitle}>
              {title}
            </Link>
          </InteractionWrapper>
        </TitleWrapper>
        <div className={classes.sequenceCardMeta}>
          <InteractionWrapper className={classes.authorWrapper}>
            <UsersNameDisplay user={author} />
          </InteractionWrapper>
          {" · "}
          {postCount} posts
        </div>
      </div>
    </div>
  );
};

export default registerComponent(
  "EASequenceOrCollectionCard",
  EASequenceOrCollectionCard,
  {styles, stylePriority: -1},
);


