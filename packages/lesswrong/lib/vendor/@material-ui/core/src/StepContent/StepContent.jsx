import React from 'react';
import PropTypes from 'prop-types';
import warning from 'warning';
import classNames from 'classnames';
import Collapse from '../Collapse';
import withStyles from '../styles/withStyles';

export const styles = theme => ({
  /* Styles applied to the root element. */
  root: {
    marginTop: 8,
    marginLeft: 12, // half icon
    paddingLeft: 8 + 12, // margin + half icon
    paddingRight: 8,
    borderLeft: `1px solid ${
      theme.palette.type === 'light' ? theme.palette.grey[400] : theme.palette.grey[600]
    }`,
  },
  /* Styles applied to the root element if `last={true}` (controlled by `Step`). */
  last: {
    borderLeft: 'none',
  },
  /* Styles applied to the Transition component. */
  transition: {},
});

function StepContent(props) {
  const {
    active,
    alternativeLabel,
    children,
    classes,
    className,
    completed,
    last,
    optional,
    orientation,
    TransitionComponent,
    transitionDuration: transitionDurationProp,
    TransitionProps,
    ...other
  } = props;

  warning(
    orientation === 'vertical',
    'Material-UI: <StepContent /> is only designed for use with the vertical stepper.',
  );

  let transitionDuration = transitionDurationProp;

  if (transitionDurationProp === 'auto' && !TransitionComponent.muiSupportAuto) {
    transitionDuration = undefined;
  }

  return (
    <div className={classNames(classes.root, { [classes.last]: last }, className)} {...other}>
      <TransitionComponent
        in={active}
        className={classes.transition}
        timeout={transitionDuration}
        unmountOnExit
        {...TransitionProps}
      >
        {children}
      </TransitionComponent>
    </div>
  );
}

StepContent.propTypes = {
  /**
   * @ignore
   * Expands the content.
   */
  active: PropTypes.bool,
  /**
   * @ignore
   * Set internally by Step when it's supplied with the alternativeLabel property.
   */
  alternativeLabel: PropTypes.bool,
  /**
   * Step content.
   */
  children: PropTypes.node,
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
   * @ignore
   */
  completed: PropTypes.bool,
  /**
   * @ignore
   */
  last: PropTypes.bool,
  /**
   * @ignore
   * Set internally by Step when it's supplied with the optional property.
   */
  optional: PropTypes.bool,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Collapse component.
   */
  TransitionComponent: PropTypes.func,
  /**
   * Adjust the duration of the content expand transition.
   * Passed as a property to the transition component.
   *
   * Set to 'auto' to automatically calculate transition time based on height.
   */
  transitionDuration: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ enter: PropTypes.number, exit: PropTypes.number }),
    PropTypes.oneOf(['auto']),
  ]),
  /**
   * Properties applied to the `Transition` element.
   */
  TransitionProps: PropTypes.object,
};

StepContent.defaultProps = {
  TransitionComponent: Collapse,
  transitionDuration: 'auto',
};

export default withStyles(styles, { name: 'MuiStepContent' })(StepContent);
