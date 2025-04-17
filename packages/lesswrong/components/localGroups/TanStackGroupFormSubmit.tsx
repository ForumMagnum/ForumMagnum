import React from 'react'
import Button from '@/lib/vendor/@material-ui/core/src/Button'
import Tooltip from '@/lib/vendor/@material-ui/core/src/Tooltip'
import classNames from 'classnames'
import { defineStyles, useStyles } from '../hooks/useStyles'
import { AnyFormApi } from '@tanstack/react-form'

const styles = defineStyles('TanStackGroupFormSubmit', (theme: ThemeType) => ({
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
    paddingBottom: '2px',
    fontSize: '16px',
    marginLeft: '5px',
    '&:hover': {
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

interface TanStackGroupFormSubmitProps {
  submitLabel?: string;
  document: { inactive?: boolean };
  formType: string;
  formApi: AnyFormApi;
}


export function TanStackGroupFormSubmit({
  submitLabel = 'Submit',
  document,
  formType,
  formApi,
}: TanStackGroupFormSubmitProps) {
  const classes = useStyles(styles);

  const handleToggleInactive = () => {
    formApi.setFieldValue('inactive', !document.inactive)
  };

  return (
    <div className={classes.root}>
      {formType === 'edit' && (
        <Tooltip title={document.inactive
          ? 'Display the group on maps and lists again'
          : 'This will hide the group from all maps and lists'
        }>
          <Button
            type="button"
            onClick={handleToggleInactive}
            className={classNames(classes.formButton, classes.inactiveButton)}
          >
            {document.inactive ? 'Reactivate group' : 'Mark group as inactive'}
          </Button>
        </Tooltip>
      )}
      <Button
        type="submit"
        className={classNames(classes.formButton, classes.submit)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
