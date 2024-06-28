import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import type { FormGroupLayoutProps } from "./FormGroupLayout";

const GAP = 12;

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    gap: `${GAP}px`,
    rowGap: "0px",
    marginBottom: 32,
    "& .MuiFormControl-root": {
      width: "100%",
      "& > *": {
        width: "100%",
      },
    },
    "& > *": {
      flexBasis: "100%",
    },
    [theme.breakpoints.up("sm")]: {
      "& > .form-component-FormComponentFriendlyTextInput": {
        flexBasis: `calc(50% - ${GAP / 2}px)`,
      },
    },
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
