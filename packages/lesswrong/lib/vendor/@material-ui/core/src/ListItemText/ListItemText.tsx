import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Typography from '../Typography';
import type { StandardProps } from '..';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { TypographyProps } from '../Typography/Typography';

export interface ListItemTextProps
  extends StandardProps<React.HTMLAttributes<HTMLDivElement>, ListItemTextClassKey> {
  disableTypography?: boolean;
  inset?: boolean;
  primary?: React.ReactNode;
  primaryTypographyProps?: Partial<TypographyProps>;
  secondary?: React.ReactNode;
  secondaryTypographyProps?: Partial<TypographyProps>;
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
  },
  /* Styles applied to the `Typography` components if `context.dense` is `true`. */
  textDense: {},
}), {stylePriority: -10});

function ListItemText(props: ListItemTextProps, context) {
  const {
    children,
    classes: classesOverride,
    className: classNameProp,
    disableTypography,
    inset,
    primary: primaryProp,
    primaryTypographyProps,
    secondary: secondaryProp,
    secondaryTypographyProps,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverride);
  const { dense } = context;

  let primary = primaryProp != null ? primaryProp : children;
  if (primary != null && primary.type !== Typography && !disableTypography) {
    primary = (
      <Typography
        variant="subheading"
        className={classNames(classes.primary, { [classes.textDense]: dense })}
        component="span"
        {...primaryTypographyProps}
      >
        {primary}
      </Typography>
    );
  }

  let secondary = secondaryProp;
  if (secondary != null && secondary.type !== Typography && !disableTypography) {
    secondary = (
      <Typography
        variant="body1"
        className={classNames(classes.secondary, {
          [classes.textDense]: dense,
        })}
        color="textSecondary"
        {...secondaryTypographyProps}
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
          [classes.dense]: dense,
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

ListItemText.defaultProps = {
  disableTypography: false,
  inset: false,
};

ListItemText.contextTypes = {
  dense: PropTypes.bool,
};

export default ListItemText;
