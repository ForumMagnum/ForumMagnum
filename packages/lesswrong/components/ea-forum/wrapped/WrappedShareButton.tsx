import React, { RefObject, useCallback } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useMessages } from "@/components/common/withMessages";
import { useTracking } from "@/lib/analyticsEvents";
import html2canvas from "html2canvas-pro";
import classNames from "classnames";
import { isMobile } from "@/lib/utils/isMobile";
import { captureException } from "@sentry/core";
import { useForumWrappedContext } from "./hooks";
import ForumIcon from "../../common/ForumIcon";

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

const WrappedShareButton = ({name, screenshotRef, onRendered, className, classes}: {
  name: string,
  screenshotRef: RefObject<HTMLElement|null>,
  onRendered?: (canvas: HTMLCanvasElement) => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const {flash} = useMessages();
  const {year} = useForumWrappedContext();

  const onClick = useCallback(async () => {
    try {
      const target = screenshotRef.current;
      if (!target) {
        throw new Error("Failed to create sharing image");
      }

      const fileName = `My${year}EAForumWrapped-${name}.png`;
      const canvasElement = await html2canvas(target, {
        allowTaint: true,
        useCORS: true,
      });
      onRendered?.(canvasElement);
      const dataUrl = canvasElement.toDataURL("image/png");

      if (isMobile() && !!navigator.canShare) {
        const data = await fetch(dataUrl);
        const blob = await data.blob();
        const file = new File([blob], fileName, {
          type: blob.type,
          lastModified: new Date().getTime(),
        });
        const sharingOptions = {files: [file]};
        if (navigator.canShare(sharingOptions)) {
          try {
            await navigator.share(sharingOptions);
            captureEvent("wrappedShare", {
              method: "navigator.share",
              year,
            });
            return;
          } catch (e) {
            // AbortError means the user cancelled the request - nothing went wrong
            if (e.name === "AbortError") {
              return;
            }
            captureException(e, {tags: {
              wrappedName: name,
              wrappedYear: String(year),
            }});
            // eslint-disable-next-line no-console
            console.error("Error sharing wrapped via navigator:", e);
            // Fallthrough to just download the image
          }
        }
      }

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      captureEvent("wrappedShare", {
        method: "downloadImage",
        year,
      });
    } catch (e) {
      captureException(e, {tags: {
        wrappedName: name,
        wrappedYear: String(year),
      }});
      // eslint-disable-next-line no-console
      console.error("Error sharing wrapped:", e);
      if (e instanceof Error) {
        flash(`Error: ${e.message}`);
      }
    }
  }, [captureEvent, flash, year, name, screenshotRef, onRendered]);

  return (
    <button
      onClick={onClick}
      className={classNames(classes.root, className)}
    >
      <ForumIcon icon="Share" className={classes.icon} /> Share
    </button>
  );
}

export default registerComponent(
  "WrappedShareButton",
  WrappedShareButton,
  {styles},
);
