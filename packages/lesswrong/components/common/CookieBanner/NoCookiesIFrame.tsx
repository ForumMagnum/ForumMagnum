import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib";
import { useDialog } from "../withDialog";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    border: theme.palette.border.faint,
    borderRadius: "4px",
    padding: "16px",
    position: "relative",
  },
  heading: {
    marginTop: "0px !important",
  },
  text: {
    marginBottom: 0,
  },
});

const NoCookiesIFrame = ({ classes }: { classes: ClassesType }) => {
  const { openDialog } = useDialog();

  return (
    <div className={classes.root}>
      <h3 className={classes.heading}>This element is hidden</h3>
      <p className={classes.text}>
        This element would load an external service which may set third-party cookies. If you wish to see this element,
        please{" "}
        <a onClick={() => openDialog({ componentName: "CookieDialog", componentProps: {} })}>accept all cookies</a> and
        then refresh the page.
      </p>
    </div>
  );
};

const NoCookiesIFrameComponent = registerComponent("NoCookiesIFrame", NoCookiesIFrame, { styles });

declare global {
  interface ComponentTypes {
    NoCookiesIFrame: typeof NoCookiesIFrameComponent;
  }
}
