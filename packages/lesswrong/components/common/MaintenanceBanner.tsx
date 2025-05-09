import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { ExpandedDate } from "../common/FormatDate";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { isMobile } from "../../lib/utils/isMobile";
import classNames from "classnames";
import startCase from "lodash/startCase";
import { SingleColumnSection } from "./SingleColumnSection";

export const maintenanceTime = new DatabasePublicSetting<string | null>("maintenanceBannerTime", null);
const explanationText = new DatabasePublicSetting<string>("maintenanceBannerExplanationText", "");

const urgentCutoff = 2 * 60 * 60 * 1000; // 2 hours

const styles = (theme: ThemeType) => ({
  root: {
    padding: 20,
    width: "100%",
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: "1.5rem",
    marginTop: "0.5em",
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    borderRadius: 2,
    borderColor: theme.palette.primary.main,
    background: theme.palette.background.pageActiveAreaBackground,
  },
  rootMobile: {
    fontSize: "1.3rem",
  },
  rootUrgent: {
    // Make border red just before the maintenance starts
    borderColor: theme.palette.error.main,
  },
  buttonRow: {
    marginLeft: "auto",
    width: "fit-content",
  },
});

const MaintenanceBannerInner = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const maintenanceTimeValue = maintenanceTime.get();
  if (!maintenanceTimeValue) return <></>;
  const isUrgent = new Date(maintenanceTimeValue).getTime() - Date.now() < urgentCutoff;
  return (
    <SingleColumnSection
      className={classNames(classes.root, { [classes.rootMobile]: isMobile(), [classes.rootUrgent]: isUrgent })}
    >
      <div>
        {startCase(siteNameWithArticleSetting.get())} will be undergoing scheduled maintenance on{" "}
        <ExpandedDate date={maintenanceTimeValue} />
        {explanationText.get() || ""}
      </div>
    </SingleColumnSection>
  );
};

export const MaintenanceBanner = registerComponent("MaintenanceBanner", MaintenanceBannerInner, { styles });


