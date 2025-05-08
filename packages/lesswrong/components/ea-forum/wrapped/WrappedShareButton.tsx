import React, { RefObject, useCallback } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components";
import html2canvas from "html2canvas";
import classNames from "classnames";
import { isMobile } from "@/lib/utils/isMobile";
import { captureException } from "@sentry/core";

export const WRAPPED_SHARE_BUTTON_WIDTH = 100;

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.text.alwaysBlack,
    width: WRAPPED_SHARE_BUTTON_WIDTH,
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: 100,
    zIndex: 1,
    "&:hover": {
      filter: "brightness(0.8)",
    },
  },
  icon: {
    width: 18,
  },
});

const WrappedShareButtonInner = ({name, screenshotRef, onRendered, className, classes}: {
  name: string,
  screenshotRef: RefObject<HTMLElement>,
  onRendered?: (canvas: HTMLCanvasElement) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const onClick = useCallback(async () => {
    const target = screenshotRef.current;
    if (target) {
      const fileName = `My2024EAForumWrapped-${name}.png`;
      const canvasElement = await html2canvas(target, {
        allowTaint: true,
        useCORS: true,
      });
      onRendered?.(canvasElement);
      const dataUrl = canvasElement.toDataURL("image/png");
      if (isMobile() && !!navigator.canShare) {
        try {
          const data = await fetch(dataUrl);
          const blob = await data.blob();
          const file = new File([blob], fileName, {
            type: blob.type,
            lastModified: new Date().getTime(),
          });
          const sharingOptions = {files: [file]};
          if (navigator.canShare(sharingOptions)) {
            await navigator.share(sharingOptions);
            return;
          }
        } catch (e) {
          captureException(e, {tags: {wrappedName: name}});
          // eslint-disable-next-line no-console
          console.error("Error sharing wrapped:", e);
        }
      }
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    }
  }, [name, screenshotRef, onRendered]);

  const {ForumIcon} = Components;
  return (
    <button className={classNames(classes.root, className)} onClick={onClick}>
      <ForumIcon icon="Share" className={classes.icon} /> Share
    </button>
  );
}

export const WrappedShareButton = registerComponent(
  "WrappedShareButton",
  WrappedShareButtonInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedShareButton: typeof WrappedShareButton
  }
}
