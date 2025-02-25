import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { tenPercentPledgeDiamond, trialPledgeDiamond } from "../ea-forum/users/DisplayNameWithMarkers";

const styles = (theme: ThemeType) => ({
  inputRow: {
    display: "flex",
    gap: `12px`,
    [theme.breakpoints.down("xs")]: {
      gap: `6px`,
    },
  },
  formInput: {
    flex: "1",
  },
  blurb: {
    marginTop: 8,
    fontWeight: 450,
    color: theme.palette.grey[600],
    marginRight: 28, // Make it wrap so the text flows better
    ["@media(max-width: 715px)"]: {
      marginRight: 0,
    },
  },
  link: {
    textDecoration: "underline",
    textUnderlineOffset: "4px",
    "&:hover": {
      textDecoration: "underline",
    },
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
  const { FormComponentFriendlyTextInput } = Components;

  const blurbContent = (
    <span>
      If you have taken the {tenPercentPledgeDiamond}10% Pledge or {trialPledgeDiamond}Trial Pledge, consider adding a
      diamond to your name to show others.{" "}
      <a
        className={classes.link}
        href="https://www.givingwhatwecan.org/pledge"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more.
      </a>
    </span>
  );

  return (
    <div>
      <div className={classes.inputRow}>
        <FormComponentFriendlyTextInput value={value} {...props} className={classes.formInput} />
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
