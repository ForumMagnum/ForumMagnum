import React from 'react';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';

const styles = defineStyles('EditCommentTitle', (theme: ThemeType) => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.headerStyle,
    width: "100%",
    resize: "none",
    textAlign: "left",
    marginTop: 0,
    borderBottom: theme.palette.border.normal,
    '&:focused': {
      borderBottom: theme.palette.border.normal
    },
    "& textarea": {
      overflowY: "hidden",
    },
    fontSize: "2rem",
  },
}));

export const EditCommentTitle = ({ field, placeholder }: {
  field: TypedFieldApi<string | null>;
  placeholder: string;
}) => {
  const classes = useStyles(styles);
  
  return <Input
    className={classNames(classes.root)}
    placeholder={placeholder}
    value={field.state.value ?? undefined}
    onChange={(event) => field.handleChange(event.target.value)}
    disableUnderline={true}
    multiline
  />
};
