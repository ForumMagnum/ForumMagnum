import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Typography } from "@/components/common/Typography";

export interface ListItemTextProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, ListItemTextClassKey> {
  disableTypography?: boolean;
  inset?: boolean;
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
}

export type ListItemTextClassKey =
  | 'root'
  | 'inset'
  | 'dense'
  | 'primary'
  | 'secondary'
  | 'textDense';

export const styles = defineStyles("MuiListItemText", theme => ({
  /* Styles applied to the root element. */
  root: {
    flex: '1 1 auto',
    minWidth: 0,
    padding: '0 16px',
    '&:first-child': {
      paddingLeft: 0,
    },
  },
  /* Styles applied to the root element if `inset={true}`. */
  inset: {
    '&:first-child': {
      paddingLeft: 56,
    },
  },
  /* Styles applied to the root element if `context.dense` is `true`. */
  dense: {
    fontSize: theme.typography.pxToRem(13),
  },
  /* Styles applied to the primary `Typography` component. */
  primary: {
    '&$textDense': {
      fontSize: 'inherit',
    },
  },
  /* Styles applied to the secondary `Typography` component. */
  secondary: {
    '&$textDense': {
      fontSize: 'inherit',
    },
    color: theme.palette.text.secondary,
  },
  /* Styles applied to the `Typography` components if `context.dense` is `true`. */
  textDense: {},
}), {stylePriority: -10});

function ListItemText(props: ListItemTextProps) {
  const {
    children,
    classes: classesOverride,
    className: classNameProp,
    disableTypography=false,
    inset=false,
    primary: primaryProp,
    secondary: secondaryProp,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);

  let primary = primaryProp != null ? primaryProp : children;
  if (primary != null && !disableTypography) {
    primary = (
      <Typography
        variant="subheading"
        className={classNames(classes.primary)}
        component="span"
      >
        {primary}
      </Typography>
    );
  }

  let secondary = secondaryProp;
  if (secondary != null && !disableTypography) {
    secondary = (
      <Typography
        variant="body1"
        className={classNames(classes.secondary)}
      >
        {secondary}
      </Typography>
    );
  }

  return (
    <div
      className={classNames(
        classes.root,
        {
          [classes.inset]: inset,
        },
        classNameProp,
      )}
      {...other}
    >
      {primary}
      {secondary}
    </div>
  );
}

export default ListItemText;
