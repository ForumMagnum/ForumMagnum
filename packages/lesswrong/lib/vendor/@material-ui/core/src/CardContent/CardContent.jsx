import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';

export const styles = theme => ({
  /* Styles applied to the root element. */
  root: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    '&:last-child': {
      paddingBottom: 24,
    },
  }),
});

function CardContent(props) {
  const { classes, className, component: Component = "div", ...other } = props;

  return <Component className={classNames(classes.root, className)} {...other} />;
}

CardContent.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
};

export default withStyles(styles, { name: 'MuiCardContent' })(CardContent);
