import React, { FC } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

const styles = defineStyles("GivingSeason2025Banner", (_theme: ThemeType) => ({
  root: {
  },
}))

export const GivingSeason2025Banner: FC = () => {
  const classes = useStyles(styles);
  return (
    <div>
      Giving season 2025
    </div>
  );
}

export default registerComponent("GivingSeason2025Banner", GivingSeason2025Banner);
