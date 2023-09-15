import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "react-router-dom";

const SEQUENCE_CARD_IMAGE_HEIGHT = 162;
const Z_IMAGE = 1;
const Z_OVERLAY = 2;

const styles = (theme: ThemeType) => ({
  root: {
    borderRadius: theme.borderRadius.default,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    marginLeft: 8, // Account for box shadow
    boxShadow: `/* The top layer shadow */
      -1px 1px 10px ${theme.palette.greyAlpha(0.15)},
      /* The second layer */
      -8px 8px 0 0px ${theme.palette.panelBackground.default},
      /* The second layer shadow */
      -10px 10px 10px -1px ${theme.palette.greyAlpha(0.15)}`,
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
    lineHeight: "20px",
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
});

const EASequenceOrCollectionCard = ({
  title,
  author,
  postCount,
  readCount,
  imageId,
  href,
  eventHandlers,
  classes,
}: {
  title: string,
  author: UsersMinimumInfo | null,
  postCount: number,
  readCount: number,
  imageId: string,
  href: string,
  eventHandlers: {
    onMouseOver: (event: AnyBecauseTodo) => void,
    onMouseLeave: () => void,
  },
  classes: ClassesType,
}) => {
  const {CloudinaryImage2, UsersNameDisplay} = Components;
  const readProgress = `${readCount}/${postCount}`;
  return (
    <div {...eventHandlers} className={classes.root}>
      <div className={classes.sequenceCardImageWrapper}>
        <CloudinaryImage2 publicId={imageId} className={classes.sequenceCardImage} />
        <div className={classes.sequenceReadProgress}>{readProgress} read</div>
      </div>
      <div className={classes.sequenceCardText}>
        <Link to={href} className={classes.sequenceCardTitle}>
          {title}
        </Link>
        <div className={classes.sequenceCardMeta}>
          <UsersNameDisplay user={author} />
          {" · "}
          {postCount} posts
        </div>
      </div>
    </div>
  );
};

const EASequenceOrCollectionCardComponent = registerComponent(
  "EASequenceOrCollectionCard",
  EASequenceOrCollectionCard,
  {styles},
);

declare global {
  interface ComponentTypes {
    EASequenceOrCollectionCard: typeof EASequenceOrCollectionCardComponent;
  }
}
