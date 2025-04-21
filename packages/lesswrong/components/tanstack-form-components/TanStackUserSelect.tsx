import { Components } from "@/lib/vulcan-lib/components";
import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import type { TypedFieldApi } from "./BaseAppForm";

const styles = defineStyles('TanStackUserSelect', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
}));

interface TanStackUserSelectProps {
  field: TypedFieldApi<string | null>;
  label: string;
}

export const TanStackUserSelect = ({ field, label }: TanStackUserSelectProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => field.handleChange(userId)}
          label={label}
        />
      </Components.ErrorBoundary>
      {field.state.value && (
        <div className={classes.item}>
          <Components.SingleUsersItem userId={field.state.value} removeItem={() => field.handleChange(null)} />
        </div>
      )}
    </div>
  );
};
