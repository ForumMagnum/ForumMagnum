import React from 'react'
import Button from '@/lib/vendor/@material-ui/core/src/Button'
import { TooltipSpan } from "@/components/common/FMTooltip";
import classNames from 'classnames'
import { defineStyles, useStyles } from '../hooks/useStyles'
import type { AnyFormApi } from '@tanstack/react-form'

const styles = defineStyles('GroupFormSubmit', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    marginTop: 20,
  },
  inactiveButton: {
    '&&': {
      color: theme.palette.error.main,
    },
  },
  formButton: {
    paddingBottom: "2px",
    fontSize: "16px",
    marginLeft: "5px",
    "&:hover": {
      background: theme.palette.panelBackground.darken05,
    },
    color: theme.palette.lwTertiary.main,
  },
  submit: {
    '&&': {
      marginLeft: 'auto',
    },
  },
}))

interface GroupFormSubmitProps {
  submitLabel?: string;
  document: { inactive?: boolean };
  formType: string;
  formApi: AnyFormApi;
  disabled?: boolean;
}

export const GroupFormSubmit = ({
  submitLabel = "Submit",
  document,
  formType,
  formApi,
  disabled,
}: GroupFormSubmitProps) => {
  const classes = useStyles(styles);

  const handleToggleInactive = () => {
    formApi.setFieldValue('inactive', !document.inactive)
  };

  return (
    <div className={classes.root}>
      {formType === 'edit' &&
        <TooltipSpan title={document.inactive
          ? "Display the group on maps and lists again"
          : "This will hide the group from all maps and lists"}
        >
          <Button
            type="submit"
            onClick={handleToggleInactive}
            className={classNames(classes.formButton, classes.inactiveButton)}
            disabled={disabled}
          >
           {document.inactive ? "Reactivate group" : "Mark group as inactive"} 
          </Button>
        </TooltipSpan>
      }
      <Button
        type="submit"
        className={classNames(classes.formButton, classes.submit)}
        disabled={disabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
