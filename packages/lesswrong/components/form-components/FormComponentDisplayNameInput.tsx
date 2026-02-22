import React, { ReactNode } from "react";
import { tenPercentPledgeDiamond, trialPledgeDiamond } from "../users/DisplayNameWithMarkers";
import { TypedFieldApi } from "@/components/tanstack-form-components/BaseAppForm";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { FormComponentTextInput } from "./FormComponentTextInput";

const styles = defineStyles('FormComponentDisplayNameInput', (theme: ThemeType) => ({
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
}));

export const FormComponentDisplayNameInput = ({
  field,
  ...props
}: {
  field: TypedFieldApi<string | null | undefined>;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  startAdornment?: ReactNode;
  smallBottomMargin?: boolean;
  className?: string;
  label?: string;
}) => {
  const classes = useStyles(styles);

  const value = field.state.value;

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
        <FormComponentTextInput value={value ?? null} updateCurrentValue={field.handleChange} {...props} className={classes.formInput} />
      </div>
      <div className={classes.blurb}>{blurbContent}</div>
    </div>
  );
};
