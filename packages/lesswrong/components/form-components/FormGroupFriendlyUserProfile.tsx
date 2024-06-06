import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import type { FormGroupLayoutProps } from "./FormGroupLayout";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 40,
  },
  label: {
    color: theme.palette.grey[1000],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 18,
    fontWeight: 600,
  },
});

const FormGroupFriendlyUserProfile = ({label, children, classes}: {
  classes: ClassesType<typeof styles>,
} & FormGroupLayoutProps) => {
  return (
    <div className={classes.root}>
      {label && label !== "default" &&
        <div className={classes.label}>{label}</div>
      }
      {children}
    </div>
  );
}

const FormGroupFriendlyUserProfileComponent = registerComponent(
  "FormGroupFriendlyUserProfile",
  FormGroupFriendlyUserProfile,
  {styles},
);

declare global {
  interface ComponentTypes {
    FormGroupFriendlyUserProfile: typeof FormGroupFriendlyUserProfileComponent
  }
}
