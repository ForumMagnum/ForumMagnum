import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { capitalize } from '../utils/helpers';

export const styles = defineStyles("MuiListSubheader", theme => ({
  /* Styles applied to the root element. */
  root: {
    boxSizing: 'border-box',
    lineHeight: '48px',
    listStyle: 'none',
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.pxToRem(14),
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    color: theme.palette.primary.main,
  },
  /* Styles applied to the root element if `color="inherit"`. */
  colorInherit: {
    color: 'inherit',
  },
  /* Styles applied to the inner `component` element if `disableGutters={false}`. */
  gutters: theme.mixins.gutters(),
  /* Styles applied to the root element if `inset={true}`. */
  inset: {
    paddingLeft: 72,
  },
  /* Styles applied to the root element if `disableSticky={false}`. */
  sticky: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: 'inherit',
  },
}), {stylePriority: -10});

function ListSubheader(props) {
  const {
    classes: classesOverrides,
    className,
    color='default',
    component: Component='li',
    disableGutters=false,
    disableSticky=false,
    inset=false,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <Component
      className={classNames(
        classes.root,
        {
          [classes[`color${capitalize(color)}`]]: color !== 'default',
          [classes.inset]: inset,
          [classes.sticky]: !disableSticky,
          [classes.gutters]: !disableGutters,
        },
        className,
      )}
      {...other}
    />
  );
}

ListSubheader.propTypes = {
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: PropTypes.oneOf(['default', 'primary', 'inherit']),
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  /**
   * If `true`, the List Subheader will not have gutters.
   */
  disableGutters: PropTypes.bool,
  /**
   * If `true`, the List Subheader will not stick to the top during scroll.
   */
  disableSticky: PropTypes.bool,
  /**
   * If `true`, the List Subheader will be indented.
   */
  inset: PropTypes.bool,
};

ListSubheader.muiName = 'ListSubheader';

export default ListSubheader;
