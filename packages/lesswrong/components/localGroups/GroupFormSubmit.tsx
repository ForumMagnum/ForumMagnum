import React from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    marginTop: 20
  },
  inactiveButton: {
    '&&': {
      color: theme.palette.error.main,
    }
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    },
    color: theme.palette.lwTertiary.main
  },
  submit: {
    '&&': {
      marginLeft: 'auto'
    }
  },
});

const GroupFormSubmit = ({
  submitLabel = "Submit",
  updateCurrentValues,
  document,
  formType,
  classes,
}: {
  submitLabel?: string,
  updateCurrentValues: AnyBecauseTodo,
  document: AnyBecauseTodo,
  formType: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      {formType === 'edit' &&
        <Tooltip title={document.inactive
          ? "Display the group on maps and lists again"
          : "This will hide the group from all maps and lists"}
        >
          <Button
            type="submit"
            onClick={() => updateCurrentValues({inactive: !document.inactive})}
            className={classNames(classes.formButton, classes.inactiveButton)}
          >
           {document.inactive ? "Reactivate group" : "Mark group as inactive"} 
          </Button>
        </Tooltip>
      }
      <Button
        type="submit"
        className={classNames(classes.formButton, classes.submit)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

const GroupFormSubmitComponent = registerComponent(
  "GroupFormSubmit",
  GroupFormSubmit,
  {styles},
);

declare global {
  interface ComponentTypes {
    GroupFormSubmit: typeof GroupFormSubmitComponent
  }
}
