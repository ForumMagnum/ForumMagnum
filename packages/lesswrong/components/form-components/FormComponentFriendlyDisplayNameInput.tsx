import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { tenPercentPledgeDiamond, trialPledgeDiamond } from "../ea-forum/users/DisplayNameWithMarkers";

const styles = (theme: ThemeType) => ({
  inputRow: {
    display: "flex",
    gap: `12px`,
    [theme.breakpoints.down('xs')]: {
      gap: `6px`,
    }
  },
  formInput: {
    flex: "1",
  },
  rightSection: {
    display: "flex",
    paddingTop: 29, // Match "Display name" label
    alignItems: "center"
  },
  copyChips: {
    display: "flex",
    gap: "6px",
    height: "min-content",
    marginRight: 6,
    [theme.breakpoints.down('sm')]: {
      marginRight: 0,
    }
  },
  blurb: {
    marginTop: 8,
    fontWeight: 450,
    color: theme.palette.grey[600],
  },
  link: {
    textDecoration: "underline",
    textUnderlineOffset: "4px",
    '&:hover': {
      textDecoration: "underline",
    }
  },
});

export const FormComponentFriendlyDisplayNameInput = ({
  value,
  classes,
  ...props
}: {
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  startAdornment?: ReactNode;
  smallBottomMargin?: boolean;
  className?: string;
  classes: ClassesType<typeof styles>;
} & FormComponentProps<string>) => {
  const { FormComponentFriendlyTextInput, CopyChip } = Components;

  const blurbContent = (
    <span>
      If you've taken the{" "}
      <a
        className={classes.link}
        href="https://www.givingwhatwecan.org/pledge"
        target="_blank"
        rel="noopener noreferrer"
      >
        {tenPercentPledgeDiamond}10% Pledge
      </a>{" "}
      or{" "}
      <a
        className={classes.link}
        href="https://www.givingwhatwecan.org/pledge#pledge-options"
        target="_blank"
        rel="noopener noreferrer"
      >
        🔹Trial Pledge
      </a>, consider adding a diamond to your name to show others
    </span>
  );

  return (
    <div>
      <div className={classes.inputRow}>
        <FormComponentFriendlyTextInput value={value} {...props} className={classes.formInput} />
        <div className={classes.rightSection}>
          <div className={classes.copyChips}>
            <CopyChip text={tenPercentPledgeDiamond} />
            <CopyChip text={trialPledgeDiamond} />
          </div>
        </div>
      </div>
      <div className={classes.blurb}>{blurbContent}</div>
    </div>
  );
};

const FormComponentFriendlyDisplayNameInputComponent = registerComponent(
  "FormComponentFriendlyDisplayNameInput",
  FormComponentFriendlyDisplayNameInput,
  { styles }
);

declare global {
  interface ComponentTypes {
    FormComponentFriendlyDisplayNameInput: typeof FormComponentFriendlyDisplayNameInputComponent;
  }
}
