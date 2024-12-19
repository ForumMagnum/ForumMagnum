import React, { RefObject, useCallback } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import html2canvas from "html2canvas";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: 100,
    "&:hover": {
      opacity: 0.8,
    },
  },
  icon: {
    width: 18,
  },
});

const WrappedShareButton = ({screenshotRef, classes}: {
  screenshotRef: RefObject<HTMLElement>,
  classes: ClassesType<typeof styles>,
}) => {
  const onClick = useCallback(async () => {
    const target = screenshotRef.current;
    if (target) {
      const fileName = "My2024EAForumWrapped.png";
      const canvasElement = await html2canvas(target);
      const dataUrl = canvasElement.toDataURL("image/png");
      if (!!navigator.canShare) {
        const data = await fetch(dataUrl);
        const blob = await data.blob();
        const file = new File([blob], fileName, {
          type: blob.type,
          lastModified: new Date().getTime(),
        });
        const sharingOptions = {files: [file]};
        if (navigator.canShare(sharingOptions)) {
          await navigator.share({files: [file]});
          return;
        }
      }
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    }
  }, [screenshotRef]);

  const {ForumIcon} = Components;
  return (
    <button className={classes.root} onClick={onClick}>
      <ForumIcon icon="Share" className={classes.icon} /> Share
    </button>
  );
}

const WrappedShareButtonComponent = registerComponent(
  "WrappedShareButton",
  WrappedShareButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedShareButton: typeof WrappedShareButtonComponent
  }
}
