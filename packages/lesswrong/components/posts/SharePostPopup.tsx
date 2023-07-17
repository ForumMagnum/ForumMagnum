import { Components, registerComponent } from "../../lib/vulcan-lib";
import React, { useRef, useEffect } from "react";
import Popper from "@material-ui/core/Popper";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import { useForceRerender } from "../hooks/useFirstRender";

const styles = (theme: ThemeType): JssStyles => ({
  popper: {
    zIndex: theme.zIndexes.loginDialog,
    // TODO this may have to be "lg"
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  root: {
    padding: "20px 16px 28px 20px",
  },
  closeButton: {
    padding: 0,
  },
  closeIcon: {},
  titleRow: {
    display: "flex",
  },
  checkIcon: {
    // TODO add to theme?
    color: "#5ECE79"
  },
  title: {
    display: "flex",
  },
  titleText: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
  },
  socialPreviewTitle: {
    // TODO not all of this is
    margin: 0,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "14px",
    lineHeight: "21px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    color: theme.palette.grey[600],
    textTransform: "uppercase",
  }
});

const SharePostPopup = ({
  post,
  onClose,
  classes,
}: {
  post: PostsDetails;
  onClose: () => void;
  classes: ClassesType;
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);

  const { Typography, ForumIcon, CloudinaryImage2 } = Components;

  // Force rerender because the element we are anchoring to is created after the first render
  useForceRerender();

  useEffect(() => {
    // Create a fixed position element at the bottom right corner of the screen
    const fixedElement = document.createElement("div");
    fixedElement.style.position = "fixed";
    fixedElement.style.bottom = "80px"; // appear above intercom or cookie banner
    fixedElement.style.right = "20px";

    document.body.appendChild(fixedElement);
    anchorEl.current = fixedElement;

    // Remove on unmount
    return () => {
      document.body.removeChild(fixedElement);
    };
  }, []);

  return (
    <Popper open={true} anchorEl={anchorEl.current} placement="top-end" className={classes.popper}>
      <Paper>
        <div className={classes.root}>
          <div className={classes.titleRow}>
            <div className={classes.title}>
              <ForumIcon icon="CheckCircle" className={classes.checkIcon} />
              <Typography variant="title" className={classes.titleText}>Post published</Typography>
            </div>
            <Button className={classes.closeButton} onClick={onClose}>
              <ForumIcon icon="Close" className={classes.closeIcon} />
            </Button>
          </div>
          <div className={classes.socialPreviewTitle}>Share post</div>
          <div>
            <div>
              {/* <img src={post.social}> */}
            </div>
          </div>
          <div>{/* TODO share buttons */}</div>
        </div>
      </Paper>
    </Popper>
  );
};

export default SharePostPopup;

const SharePostPopupComponent = registerComponent("SharePostPopup", SharePostPopup, { styles });

declare global {
  interface ComponentTypes {
    SharePostPopup: typeof SharePostPopupComponent;
  }
}
