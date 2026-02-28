import React, { useCallback, ChangeEvent, RefObject } from "react";
import classNames from "classnames";
import { defineStyles } from "@/components/hooks/defineStyles";
import { useStyles } from "@/components/hooks/useStyles";

// These styles are also used by `EAOnboardingSelect`
export const rootStyles = (theme: ThemeType) => ({
  width: "100%",
  padding: "16px",
  borderRadius: theme.borderRadius.default,
  background: theme.palette.panelBackground.loginInput,
  color: `${theme.palette.grey[1000]} !important`,
  fontSize: 14,
  fontWeight: 500,
  border: "none",
  resize: "none",
  "&::placeholder": {
    color: theme.palette.grey[600],
  },
  "&:hover, &:focus": {
    background: theme.palette.panelBackground.loginInputHovered,
  },
});
