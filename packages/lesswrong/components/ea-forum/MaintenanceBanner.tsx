import React from "react";
import { createStyles } from "@material-ui/core/styles";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { ExpandedDate } from "../common/FormatDate";

export const maintenanceTime = new DatabasePublicSetting<string | null>('maintenanceBannerTime', null)
const explanationText = new DatabasePublicSetting<string>('maintenanceBannerExplanationText', '')

const styles = createStyles(
  (theme: ThemeType): JssStyles => ({
    root: {
      padding: 20,
      width: "100%",
      fontFamily: theme.typography.postStyle.fontFamily,
      fontSize: "1.5rem",
      marginTop: "0.5em",
      border: theme.palette.border.commentBorder,
      borderWidth: 2,
      borderRadius: 2,
      borderColor: theme.palette.error.main,
      background: theme.palette.background.pageActiveAreaBackground,
    },
    buttonRow: {
      marginLeft: "auto",
      width: "fit-content",
    },
  })
);

const MaintenanceBanner = ({ classes }) => {
  const maintenanceTimeValue = maintenanceTime.get()
  if (!maintenanceTimeValue) return <></>;
  const { SingleColumnSection } = Components;

  return (
    <SingleColumnSection className={classes.root}>
      <div>
        The EA Forum will be undergoing scheduled maintenance on <ExpandedDate date={maintenanceTimeValue}/>{explanationText.get()}
      </div>
    </SingleColumnSection>
  );
};

const MaintenanceBannerComponent = registerComponent("MaintenanceBanner", MaintenanceBanner, { styles });

declare global {
  interface ComponentTypes {
    MaintenanceBanner: typeof MaintenanceBannerComponent;
  }
}
